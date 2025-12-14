<?php

namespace App\Services;

use App\Enums\ProductRequestStatus;
use App\Enums\TransferStatus;
use App\Models\BranchStock;
use App\Models\ProductRequest;
use App\Models\Transfer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    /**
     * Get all notifications for the current user
     */
    public function getNotifications(): array
    {
        $user = Auth::user();
        
        if (!$user) {
            return $this->emptyNotifications();
        }

        // Cache for 2 minutes to improve performance
        $cacheKey = "notifications.user.{$user->id}";
        
        return Cache::remember($cacheKey, 120, function () use ($user) {
            $notifications = [
                'productRequests' => 0,
                'transfers' => 0,
                'lowStock' => 0,
                'total' => 0,
            ];

            // Super Admin notifications
            if ($user->hasRole('super_admin')) {
                $notifications['productRequests'] = $this->getPendingProductRequestsCount();
                $notifications['transfers'] = $this->getPendingTransfersCount();
            }

            // Admin Cabang notifications
            if ($user->hasRole('admin_cabang')) {
                $notifications['transfers'] = $this->getBranchTransfersCount($user->branch_id);
                $notifications['lowStock'] = $this->getLowStockCount($user->branch_id);
            }

            // Calculate total
            $notifications['total'] = array_sum([
                $notifications['productRequests'],
                $notifications['transfers'],
                $notifications['lowStock'],
            ]);

            return $notifications;
        });
    }

    /**
     * Get count of pending product requests
     */
    private function getPendingProductRequestsCount(): int
    {
        return ProductRequest::where('status', ProductRequestStatus::PENDING)->count();
    }

    /**
     * Get count of pending transfers (for Super Admin)
     */
    private function getPendingTransfersCount(): int
    {
        return Transfer::where('status', TransferStatus::PENDING)->count();
    }

    /**
     * Get count of transfers that need action for a branch
     * - Approved transfers from this branch (need to send)
     * - Sent transfers to this branch (need to receive)
     */
    private function getBranchTransfersCount(int $branchId): int
    {
        $approvedFromBranch = Transfer::where('from_branch_id', $branchId)
            ->where('status', TransferStatus::APPROVED)
            ->count();

        $sentToBranch = Transfer::where('to_branch_id', $branchId)
            ->where('status', TransferStatus::SENT)
            ->count();

        return $approvedFromBranch + $sentToBranch;
    }

    /**
     * Get count of products with low stock in a branch
     */
    private function getLowStockCount(int $branchId): int
    {
        return BranchStock::where('branch_id', $branchId)
            ->whereColumn('quantity', '<', 'min_stock')
            ->count();
    }

    /**
     * Clear notifications cache for a user
     */
    public function clearCache(?int $userId = null): void
    {
        $userId = $userId ?? Auth::id();
        
        if ($userId) {
            Cache::forget("notifications.user.{$userId}");
        }
    }

    /**
     * Clear all users notifications cache
     */
    public function clearAllCache(): void
    {
        // This will be called when data changes that affect notifications
        Cache::flush();
    }

    /**
     * Empty notifications array
     */
    private function emptyNotifications(): array
    {
        return [
            'productRequests' => 0,
            'transfers' => 0,
            'lowStock' => 0,
            'total' => 0,
        ];
    }
}

