<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Http\Requests\AdjustStockRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = BranchStock::query()
            ->with(['branch:id,name,code', 'product:id,name,sku,price,category_id', 'product.category:id,name']);

        // Filter by branch
        if ($isSuperAdmin) {
            $query->when($request->branch_id, function ($q, $branchId) {
                $q->where('branch_id', $branchId);
            });
        } else {
            $query->where('branch_id', $user->branch_id);
        }

        // Search by product name/sku
        $query->when($request->search, function ($q, $search) {
            $q->whereHas('product', function ($pq) use ($search) {
                $pq->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        });

        // Filter low stock
        $query->when($request->low_stock, function ($q) {
            $q->lowStock();
        });

        $stocks = $query->paginate(15)->withQueryString();

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('stocks/index', [
            'stocks' => $stocks,
            'branches' => $branches,
            'filters' => $request->only(['search', 'branch_id', 'low_stock']),
            'isSuperAdmin' => $isSuperAdmin,
            'movementTypes' => StockMovementType::options(),
            'referenceTypes' => StockReferenceType::options(),
        ]);
    }

    public function movements(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = StockMovement::query()
            ->with(['branch:id,name,code', 'product:id,name,sku', 'createdBy:id,name']);

        // Filter by branch
        if ($isSuperAdmin) {
            $query->when($request->branch_id, function ($q, $branchId) {
                $q->where('branch_id', $branchId);
            });
        } else {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by type
        $query->when($request->type, function ($q, $type) {
            $q->where('type', $type);
        });

        // Filter by reference type
        $query->when($request->reference_type, function ($q, $refType) {
            $q->where('reference_type', $refType);
        });

        // Filter by date range
        $query->when($request->start_date, function ($q, $startDate) {
            $q->whereDate('created_at', '>=', $startDate);
        });
        $query->when($request->end_date, function ($q, $endDate) {
            $q->whereDate('created_at', '<=', $endDate);
        });

        $movements = $query->latest()->paginate(20)->withQueryString();

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('stocks/movements', [
            'movements' => $movements,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'type', 'reference_type', 'start_date', 'end_date']),
            'isSuperAdmin' => $isSuperAdmin,
            'movementTypes' => StockMovementType::options(),
            'referenceTypes' => StockReferenceType::options(),
        ]);
    }

    public function adjust(AdjustStockRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $user) {
            $branchStock = BranchStock::firstOrCreate(
                [
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $validated['product_id'],
                ],
                ['quantity' => 0, 'min_stock' => 5]
            );

            $stockBefore = $branchStock->quantity;
            $newQuantity = $stockBefore + $validated['quantity'];

            $branchStock->update(['quantity' => $newQuantity]);

            StockMovement::create([
                'branch_id' => $validated['branch_id'],
                'product_id' => $validated['product_id'],
                'type' => $validated['quantity'] > 0 ? StockMovementType::IN : StockMovementType::OUT,
                'reference_type' => StockReferenceType::ADJUSTMENT,
                'reference_id' => null,
                'quantity' => abs($validated['quantity']),
                'stock_before' => $stockBefore,
                'stock_after' => $newQuantity,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]);
        });

        return redirect()->route('stocks.index')->with('success', 'Stok berhasil disesuaikan.');
    }

    public function adjustForm(): Response
    {
        $user = Auth::user();

        if (!$user->can('adjust_stock')) {
            abort(403);
        }

        $branches = $user->isSuperAdmin()
            ? Branch::active()->get(['id', 'name', 'code'])
            : collect([$user->branch]);

        $products = Product::active()->get(['id', 'name', 'sku']);

        return Inertia::render('stocks/adjust', [
            'branches' => $branches,
            'products' => $products,
        ]);
    }
}
