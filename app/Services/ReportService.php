<?php

namespace App\Services;

use App\Models\BranchStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transfer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get sales report summary
     */
    public function getSalesSummary(?int $branchId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('sale_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('sale_date', '<=', $endDate));

        return [
            'total_sales' => (clone $query)->sum('grand_total'),
            'total_transactions' => (clone $query)->count(),
            'total_discount' => (clone $query)->sum('discount'),
            'average_transaction' => (clone $query)->avg('grand_total') ?? 0,
        ];
    }

    /**
     * Get daily sales for chart
     */
    public function getDailySales(?int $branchId = null, ?string $startDate = null, ?string $endDate = null): Collection
    {
        return Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('sale_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('sale_date', '<=', $endDate))
            ->select(
                DB::raw('DATE(sale_date) as date'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get sales by branch
     */
    public function getSalesByBranch(?string $startDate = null, ?string $endDate = null): Collection
    {
        return Sale::query()
            ->when($startDate, fn($q) => $q->whereDate('sale_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('sale_date', '<=', $endDate))
            ->select(
                'branch_id',
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('branch_id')
            ->with('branch:id,name,code')
            ->get();
    }

    /**
     * Get stock report summary
     */
    public function getStockSummary(?int $branchId = null): array
    {
        $stocks = BranchStock::query()
            ->with(['product:id,name,sku,price'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        return [
            'total_items' => $stocks->sum('quantity'),
            'total_value' => $stocks->sum(fn($stock) => $stock->quantity * $stock->product->price),
            'low_stock_count' => $stocks->filter(fn($stock) => $stock->isLowStock())->count(),
            'total_products' => $stocks->count(),
        ];
    }

    /**
     * Get stock by category
     */
    public function getStockByCategory(?int $branchId = null): Collection
    {
        return BranchStock::query()
            ->with(['product.category:id,name', 'product:id,name,price,category_id'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get()
            ->groupBy('product.category.name')
            ->map(function ($items, $category) {
                return [
                    'category' => $category ?: 'Tanpa Kategori',
                    'quantity' => $items->sum('quantity'),
                    'value' => $items->sum(fn($item) => $item->quantity * $item->product->price),
                    'products_count' => $items->count(),
                ];
            })
            ->values();
    }

    /**
     * Get low stock products
     */
    public function getLowStockProducts(?int $branchId = null, int $limit = 10): Collection
    {
        return BranchStock::query()
            ->lowStock()
            ->with(['branch:id,name,code', 'product:id,name,sku'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->limit($limit)
            ->get();
    }

    /**
     * Get transfer summary by status
     */
    public function getTransferSummaryByStatus(?int $branchId = null): Collection
    {
        return Transfer::query()
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($sq) use ($branchId) {
                    $sq->where('from_branch_id', $branchId)
                        ->orWhere('to_branch_id', $branchId);
                });
            })
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn($item) => ['status' => $item->status->value, 'count' => $item->count]);
    }

    /**
     * Get top selling products
     */
    public function getTopSellingProducts(
        ?int $branchId = null,
        ?string $startDate = null,
        ?string $endDate = null,
        int $limit = 20
    ): Collection {
        return SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                'categories.name as category_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('sales.sale_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('sales.sale_date', '<=', $endDate))
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();
    }
}

