<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = Sale::query()
            ->with(['branch:id,name,code', 'user:id,name']);

        if ($isSuperAdmin) {
            $query->when($request->branch_id, function ($q, $branchId) {
                $q->where('branch_id', $branchId);
            });
        } else {
            $query->where('branch_id', $user->branch_id);
        }

        $query->when($request->search, function ($q, $search) {
            $q->where('invoice_number', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%");
        });

        $query->when($request->start_date, function ($q, $startDate) {
            $q->whereDate('sale_date', '>=', $startDate);
        });

        $query->when($request->end_date, function ($q, $endDate) {
            $q->whereDate('sale_date', '<=', $endDate);
        });

        $sales = $query->latest()->paginate(15)->withQueryString();

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'branches' => $branches,
            'filters' => $request->only(['search', 'branch_id', 'start_date', 'end_date']),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();

        // Get products with stock in user's branch
        $branchStocks = BranchStock::where('branch_id', $user->branch_id)
            ->where('quantity', '>', 0)
            ->with('product:id,name,sku,price')
            ->get();

        return Inertia::render('sales/create', [
            'branchStocks' => $branchStocks,
            'branch' => $user->branch,
            'paymentMethods' => PaymentMethod::options(),
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();
        $branch = $user->branch;

        DB::transaction(function () use ($validated, $user, $branch) {
            // Calculate totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }
            $discount = $validated['discount'] ?? 0;
            $grandTotal = $subtotal - $discount;

            // Create sale
            $sale = Sale::create([
                'invoice_number' => Sale::generateInvoiceNumber($branch->code),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'sale_date' => now(),
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create sale items and update stock
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);

                // Deduct stock
                $branchStock = BranchStock::where('branch_id', $branch->id)
                    ->where('product_id', $item['product_id'])
                    ->first();

                if ($branchStock) {
                    $stockBefore = $branchStock->quantity;
                    $branchStock->decrement('quantity', $item['quantity']);

                    StockMovement::create([
                        'branch_id' => $branch->id,
                        'product_id' => $item['product_id'],
                        'type' => StockMovementType::OUT,
                        'reference_type' => StockReferenceType::SALE,
                        'reference_id' => $sale->id,
                        'quantity' => $item['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $branchStock->quantity,
                        'notes' => "Penjualan #{$sale->invoice_number}",
                        'created_by' => $user->id,
                    ]);
                }
            }
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil disimpan.');
    }

    public function show(Sale $sale): Response
    {
        $sale->load(['branch', 'user', 'items.product']);

        return Inertia::render('sales/show', [
            'sale' => $sale,
        ]);
    }

    public function invoice(Sale $sale)
    {
        $sale->load(['branch', 'user', 'items.product']);

        $pdf = app('dompdf.wrapper');
        $pdf->loadView('pdf.invoice', compact('sale'));

        return $pdf->stream("invoice-{$sale->invoice_number}.pdf");
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        // Only allow delete if sale is from today
        if (!$sale->sale_date->isToday()) {
            return back()->with('error', 'Hanya penjualan hari ini yang dapat dihapus.');
        }

        DB::transaction(function () use ($sale) {
            // Restore stock
            foreach ($sale->items as $item) {
                $branchStock = BranchStock::where('branch_id', $sale->branch_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($branchStock) {
                    $branchStock->increment('quantity', $item->quantity);
                }
            }

            // Delete stock movements
            StockMovement::where('reference_type', StockReferenceType::SALE)
                ->where('reference_id', $sale->id)
                ->delete();

            $sale->items()->delete();
            $sale->delete();
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil dihapus.');
    }
}
