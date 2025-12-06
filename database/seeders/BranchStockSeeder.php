<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;

class BranchStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        $products = Product::all();
        $superAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first();

        foreach ($branches as $branch) {
            foreach ($products as $product) {
                // Generate random initial stock (10-100)
                $quantity = rand(10, 100);
                $minStock = rand(5, 15);

                // Create branch stock
                $branchStock = BranchStock::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'min_stock' => $minStock,
                ]);

                // Create stock movement for initial stock
                StockMovement::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'type' => StockMovementType::IN,
                    'reference_type' => StockReferenceType::INITIAL,
                    'reference_id' => null,
                    'quantity' => $quantity,
                    'stock_before' => 0,
                    'stock_after' => $quantity,
                    'notes' => 'Stok awal produk',
                    'created_by' => $superAdmin?->id,
                ]);
            }
        }
    }
}

