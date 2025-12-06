<?php

namespace App\Services;

use App\Enums\TransferStatus;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Sale;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get dashboard statistics for Super Admin
     */
    public function getSuperAdminStats(): array
    {
        return [
            'totalStock' => $this->getTotalStock(),
            'totalStockValue' => $this->getTotalStockValue(),
            'salesToday' => $this->getSalesToday(),
            'salesCountToday' => $this->getSalesCountToday(),
            'salesThisMonth' => $this->getSalesThisMonth(),
            'salesCountThisMonth' => $this->getSalesCountThisMonth(),
            'pendingTransfers' => $this->getPendingTransfersCount(),
        ];
    }

    /**
     * Get dashboard statistics for Admin Cabang
     */
    public function getAdminCabangStats(int $branchId): array
    {
        return [
            'totalStock' => $this->getTotalStock($branchId),
            'totalStockValue' => $this->getTotalStockValue($branchId),
            'salesToday' => $this->getSalesToday($branchId),
            'salesCountToday' => $this->getSalesCountToday($branchId),
            'salesThisMonth' => $this->getSalesThisMonth($branchId),
            'salesCountThisMonth' => $this->getSalesCountThisMonth($branchId),
            'outgoingTransfers' => $this->getOutgoingTransfersCount($branchId),
            'incomingTransfers' => $this->getIncomingTransfersCount($branchId),
        ];
    }

    /**
     * Get total stock quantity
     */
    public function getTotalStock(?int $branchId = null): int
    {
        return BranchStock::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('quantity');
    }

    /**
     * Get total stock value (qty × price)
     */
    public function getTotalStockValue(?int $branchId = null): float
    {
        return BranchStock::query()
            ->join('products', 'branch_stocks.product_id', '=', 'products.id')
            ->when($branchId, fn($q) => $q->where('branch_stocks.branch_id', $branchId))
            ->sum(DB::raw('branch_stocks.quantity * products.price'));
    }

    /**
     * Get today's sales total
     */
    public function getSalesToday(?int $branchId = null): float
    {
        return Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->today()
            ->sum('grand_total');
    }

    /**
     * Get today's sales count
     */
    public function getSalesCountToday(?int $branchId = null): int
    {
        return Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->today()
            ->count();
    }

    /**
     * Get this month's sales total
     */
    public function getSalesThisMonth(?int $branchId = null): float
    {
        return Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->thisMonth()
            ->sum('grand_total');
    }

    /**
     * Get this month's sales count
     */
    public function getSalesCountThisMonth(?int $branchId = null): int
    {
        return Sale::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->thisMonth()
            ->count();
    }

    /**
     * Get sales grouped by branch (this month)
     */
    public function getSalesByBranch(?string $startDate = null, ?string $endDate = null): \Illuminate\Support\Collection
    {
        return Sale::query()
            ->when($startDate, fn($q) => $q->whereDate('sale_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('sale_date', '<=', $endDate))
            ->when(!$startDate && !$endDate, fn($q) => $q->thisMonth())
            ->select('branch_id', DB::raw('SUM(grand_total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('branch_id')
            ->with('branch:id,name,code')
            ->get();
    }

    /**
     * Get pending transfers count
     */
    public function getPendingTransfersCount(): int
    {
        return Transfer::where('status', TransferStatus::PENDING)->count();
    }

    /**
     * Get outgoing transfers count for a branch
     */
    public function getOutgoingTransfersCount(int $branchId): int
    {
        return Transfer::where('from_branch_id', $branchId)
            ->whereIn('status', [
                TransferStatus::PENDING,
                TransferStatus::APPROVED,
                TransferStatus::SENT,
            ])
            ->count();
    }

    /**
     * Get incoming transfers count for a branch
     */
    public function getIncomingTransfersCount(int $branchId): int
    {
        return Transfer::where('to_branch_id', $branchId)
            ->where('status', TransferStatus::SENT)
            ->count();
    }
}

