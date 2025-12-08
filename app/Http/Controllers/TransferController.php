<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Enums\TransferStatus;
use App\Http\Requests\StoreTransferRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transfer;
use App\Models\TransferItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = Transfer::query()
            ->with([
                'fromBranch:id,name,code',
                'toBranch:id,name,code',
                'requestedBy:id,name',
                'approvedBy:id,name',
            ]);

        if ($isSuperAdmin) {
            $query->when($request->branch_id, function ($q, $branchId) {
                $q->where('from_branch_id', $branchId)
                    ->orWhere('to_branch_id', $branchId);
            });
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('from_branch_id', $user->branch_id)
                    ->orWhere('to_branch_id', $user->branch_id);
            });
        }

        $query->when($request->status, function ($q, $status) {
            $q->where('status', $status);
        });

        $transfers = $query->latest()->paginate(15)->withQueryString();

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('transfers/index', [
            'transfers' => $transfers,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'status']),
            'isSuperAdmin' => $isSuperAdmin,
            'statuses' => TransferStatus::options(),
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();
        $userBranch = $user->branch;
        
        // All other active branches (can be source or destination)
        $branches = Branch::active()->where('id', '!=', $user->branch_id)->get(['id', 'name', 'code']);
        $products = Product::active()->get(['id', 'name', 'sku']);

        // Get stocks for all branches (for dynamic loading)
        $allBranchStocks = BranchStock::with('product:id,name,sku')
            ->whereIn('branch_id', $branches->pluck('id'))
            ->get()
            ->groupBy('branch_id');

        return Inertia::render('transfers/create', [
            'branches' => $branches,
            'products' => $products,
            'allBranchStocks' => $allBranchStocks,
            'userBranch' => $userBranch,
        ]);
    }

    public function store(StoreTransferRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();
        
        // Determine from_branch and to_branch
        $fromBranchId = $validated['from_branch_id'];
        $toBranchId = $validated['to_branch_id'] ?? $user->branch_id;
        
        $fromBranch = Branch::find($fromBranchId);

        DB::transaction(function () use ($validated, $user, $fromBranch, $fromBranchId, $toBranchId) {
            $transfer = Transfer::create([
                'transfer_number' => Transfer::generateTransferNumber($fromBranch->code),
                'from_branch_id' => $fromBranchId,
                'to_branch_id' => $toBranchId,
                'status' => TransferStatus::PENDING,
                'requested_by' => $user->id,
                'requested_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                TransferItem::create([
                    'transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                ]);
            }
        });

        return redirect()->route('transfers.index')
            ->with('success', 'Transfer request berhasil dibuat.');
    }

    public function show(Transfer $transfer): Response
    {
        $transfer->load([
            'fromBranch',
            'toBranch',
            'requestedBy',
            'approvedBy',
            'items.product',
        ]);

        return Inertia::render('transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    public function approve(Transfer $transfer): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('approve_transfer')) {
            abort(403);
        }

        if (!$transfer->canBeApproved()) {
            return back()->with('error', 'Transfer tidak dapat di-approve.');
        }

        $transfer->update([
            'status' => TransferStatus::APPROVED,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Transfer berhasil di-approve.');
    }

    public function reject(Request $request, Transfer $transfer): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('reject_transfer')) {
            abort(403);
        }

        if (!$transfer->canBeApproved()) {
            return back()->with('error', 'Transfer tidak dapat di-reject.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $transfer->update([
            'status' => TransferStatus::REJECTED,
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Transfer berhasil di-reject.');
    }

    public function send(Request $request, Transfer $transfer): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('send_transfer')) {
            abort(403);
        }

        if (!$transfer->canBeSent()) {
            return back()->with('error', 'Transfer tidak dapat dikirim.');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:transfer_items,id',
            'items.*.quantity_sent' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($transfer, $validated, $user) {
            // Update transfer items with sent quantities
            foreach ($validated['items'] as $item) {
                TransferItem::where('id', $item['id'])->update([
                    'quantity_sent' => $item['quantity_sent'],
                ]);
            }

            // Deduct stock from source branch
            foreach ($transfer->items as $item) {
                $branchStock = BranchStock::where('branch_id', $transfer->from_branch_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($branchStock) {
                    $stockBefore = $branchStock->quantity;
                    $branchStock->decrement('quantity', $item->quantity_sent);

                    StockMovement::create([
                        'branch_id' => $transfer->from_branch_id,
                        'product_id' => $item->product_id,
                        'type' => StockMovementType::OUT,
                        'reference_type' => StockReferenceType::TRANSFER_OUT,
                        'reference_id' => $transfer->id,
                        'quantity' => $item->quantity_sent,
                        'stock_before' => $stockBefore,
                        'stock_after' => $branchStock->quantity,
                        'notes' => "Transfer ke {$transfer->toBranch->name}",
                        'created_by' => $user->id,
                    ]);
                }
            }

            $transfer->update([
                'status' => TransferStatus::SENT,
                'sent_at' => now(),
                'delivery_note_number' => Transfer::generateDeliveryNoteNumber($transfer->fromBranch->code),
            ]);
        });

        return back()->with('success', 'Transfer berhasil dikirim.');
    }

    public function receive(Request $request, Transfer $transfer): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('receive_transfer')) {
            abort(403);
        }

        if (!$transfer->canBeReceived()) {
            return back()->with('error', 'Transfer tidak dapat diterima.');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:transfer_items,id',
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($transfer, $validated, $user) {
            // Update transfer items with received quantities
            foreach ($validated['items'] as $item) {
                TransferItem::where('id', $item['id'])->update([
                    'quantity_received' => $item['quantity_received'],
                ]);
            }

            // Add stock to destination branch
            foreach ($transfer->fresh()->items as $item) {
                $branchStock = BranchStock::firstOrCreate(
                    [
                        'branch_id' => $transfer->to_branch_id,
                        'product_id' => $item->product_id,
                    ],
                    ['quantity' => 0, 'min_stock' => 5]
                );

                $stockBefore = $branchStock->quantity;
                $branchStock->increment('quantity', $item->quantity_received);

                StockMovement::create([
                    'branch_id' => $transfer->to_branch_id,
                    'product_id' => $item->product_id,
                    'type' => StockMovementType::IN,
                    'reference_type' => StockReferenceType::TRANSFER_IN,
                    'reference_id' => $transfer->id,
                    'quantity' => $item->quantity_received,
                    'stock_before' => $stockBefore,
                    'stock_after' => $branchStock->quantity,
                    'notes' => "Transfer dari {$transfer->fromBranch->name}",
                    'created_by' => $user->id,
                ]);
            }

            $transfer->update([
                'status' => TransferStatus::RECEIVED,
                'received_at' => now(),
            ]);
        });

        return back()->with('success', 'Transfer berhasil diterima.');
    }

    public function deliveryNote(Transfer $transfer)
    {
        if (!$transfer->delivery_note_number) {
            abort(404, 'Surat jalan belum tersedia.');
        }

        $transfer->load(['fromBranch', 'toBranch', 'items.product']);

        $pdf = app('dompdf.wrapper');
        $pdf->loadView('pdf.delivery-note', compact('transfer'));

        $filename = str_replace(['/', '\\'], '-', $transfer->delivery_note_number);
        return $pdf->stream("surat-jalan-{$filename}.pdf");
    }

    public function destroy(Transfer $transfer): RedirectResponse
    {
        if (!$transfer->canBeDeleted()) {
            return back()->with('error', 'Transfer tidak dapat dihapus.');
        }

        $transfer->items()->delete();
        $transfer->delete();

        return redirect()->route('transfers.index')
            ->with('success', 'Transfer berhasil dihapus.');
    }
}
