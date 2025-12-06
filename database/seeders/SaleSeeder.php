<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        $products = Product::all();
        $paymentMethods = PaymentMethod::cases();

        $customerNames = [
            'Ahmad Wijaya', 'Siti Rahayu', 'Budi Santoso', 'Dewi Lestari',
            'Eko Prasetyo', 'Fitri Handayani', 'Gunawan Hadi', 'Hana Puspita',
            'Irwan Setiawan', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
            'Maya Anggraini', 'Nur Hidayat', 'Oki Permana', 'Putri Ayu',
        ];

        foreach ($branches as $branch) {
            $branchUser = User::where('branch_id', $branch->id)->first();
            if (!$branchUser) {
                continue;
            }

            // Create 15-25 sales per branch
            $numSales = rand(15, 25);
            $invoiceCount = 1;

            for ($s = 0; $s < $numSales; $s++) {
                $saleDate = now()->subDays(rand(0, 60));
                $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
                $customerName = rand(0, 1) ? $customerNames[array_rand($customerNames)] : null;

                // Select 1-4 products for this sale
                $saleProducts = $products->random(rand(1, 4));
                $subtotal = 0;
                $saleItems = [];

                foreach ($saleProducts as $product) {
                    $quantity = rand(1, 3);
                    $unitPrice = $product->price;
                    $itemSubtotal = $quantity * $unitPrice;
                    $subtotal += $itemSubtotal;

                    $saleItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                $discount = rand(0, 1) ? rand(1, 5) * 10000 : 0;
                $grandTotal = max(0, $subtotal - $discount);

                $sale = Sale::create([
                    'invoice_number' => sprintf('INV/%s/%s/%02d/%03d', $branch->code, $saleDate->format('Y'), $saleDate->format('m'), $invoiceCount++),
                    'branch_id' => $branch->id,
                    'user_id' => $branchUser->id,
                    'sale_date' => $saleDate,
                    'customer_name' => $customerName,
                    'customer_phone' => $customerName ? '08' . rand(100000000, 999999999) : null,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'grand_total' => $grandTotal,
                    'payment_method' => $paymentMethod,
                    'notes' => rand(0, 1) ? 'Terima kasih atas pembeliannya' : null,
                ]);

                foreach ($saleItems as $item) {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $item['product']->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal' => $item['subtotal'],
                    ]);

                    // Update stock and create movement
                    $branchStock = BranchStock::where('branch_id', $branch->id)
                        ->where('product_id', $item['product']->id)
                        ->first();

                    if ($branchStock) {
                        $stockBefore = $branchStock->quantity;
                        $branchStock->decrement('quantity', $item['quantity']);

                        StockMovement::create([
                            'branch_id' => $branch->id,
                            'product_id' => $item['product']->id,
                            'type' => StockMovementType::OUT,
                            'reference_type' => StockReferenceType::SALE,
                            'reference_id' => $sale->id,
                            'quantity' => $item['quantity'],
                            'stock_before' => $stockBefore,
                            'stock_after' => $branchStock->quantity,
                            'notes' => 'Penjualan ' . $sale->invoice_number,
                            'created_by' => $branchUser->id,
                            'created_at' => $saleDate,
                            'updated_at' => $saleDate,
                        ]);
                    }
                }
            }
        }
    }
}

