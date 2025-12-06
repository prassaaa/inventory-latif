<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Adjust stock for a product in a branch
     */
    public function adjustStock(
        int $branchId,
        int $productId,
        int $quantity,
        StockMovementType $type,
        StockReferenceType $referenceType,
        ?int $referenceId = null,
        ?string $notes = null
    ): BranchStock {
        return DB::transaction(function () use ($branchId, $productId, $quantity, $type, $referenceType, $referenceId, $notes) {
            $stock = BranchStock::firstOrCreate(
                ['branch_id' => $branchId, 'product_id' => $productId],
                ['quantity' => 0, 'min_stock' => 5]
            );

            $stockBefore = $stock->quantity;

            if ($type === StockMovementType::IN) {
                $stock->increment('quantity', $quantity);
            } else {
                $stock->decrement('quantity', $quantity);
            }

            StockMovement::create([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'type' => $type,
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stock->fresh()->quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'created_by' => Auth::id(),
            ]);

            return $stock->fresh();
        });
    }

    /**
     * Add stock (shortcut for adjustStock with TYPE_IN)
     */
    public function addStock(
        int $branchId,
        int $productId,
        int $quantity,
        StockReferenceType $referenceType = StockReferenceType::ADJUSTMENT,
        ?int $referenceId = null,
        ?string $notes = null
    ): BranchStock {
        return $this->adjustStock($branchId, $productId, $quantity, StockMovementType::IN, $referenceType, $referenceId, $notes);
    }

    /**
     * Reduce stock (shortcut for adjustStock with TYPE_OUT)
     */
    public function reduceStock(
        int $branchId,
        int $productId,
        int $quantity,
        StockReferenceType $referenceType = StockReferenceType::ADJUSTMENT,
        ?int $referenceId = null,
        ?string $notes = null
    ): BranchStock {
        return $this->adjustStock($branchId, $productId, $quantity, StockMovementType::OUT, $referenceType, $referenceId, $notes);
    }

    /**
     * Check if stock is available
     */
    public function isStockAvailable(int $branchId, int $productId, int $quantity): bool
    {
        $stock = BranchStock::where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->first();

        return $stock && $stock->quantity >= $quantity;
    }

    /**
     * Get current stock quantity
     */
    public function getStockQuantity(int $branchId, int $productId): int
    {
        return BranchStock::where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->value('quantity') ?? 0;
    }

    /**
     * Get low stock products for a branch
     */
    public function getLowStockProducts(?int $branchId = null)
    {
        return BranchStock::with(['product', 'branch'])
            ->lowStock()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();
    }

    /**
     * Initialize stock for a new product in all branches
     */
    public function initializeProductStock(int $productId, int $initialQuantity = 0, int $minStock = 5): void
    {
        $branches = \App\Models\Branch::active()->get();

        foreach ($branches as $branch) {
            BranchStock::firstOrCreate(
                ['branch_id' => $branch->id, 'product_id' => $productId],
                ['quantity' => $initialQuantity, 'min_stock' => $minStock]
            );
        }
    }
}

