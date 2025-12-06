<?php

namespace App\Services;

use App\Enums\StockReferenceType;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SaleService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new sale
     */
    public function createSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $subtotal = 0;
            $branch = Branch::find($data['branch_id']);

            // Calculate subtotal
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $discount = $data['discount'] ?? 0;
            $grandTotal = $subtotal - $discount;

            $sale = Sale::create([
                'invoice_number' => Sale::generateInvoiceNumber($branch->code),
                'branch_id' => $data['branch_id'],
                'user_id' => Auth::id(),
                'sale_date' => now(),
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);

                // Reduce stock
                $this->stockService->reduceStock(
                    $data['branch_id'],
                    $item['product_id'],
                    $item['quantity'],
                    StockReferenceType::SALE,
                    $sale->id,
                    "Penjualan #{$sale->invoice_number}"
                );
            }

            return $sale->load('items.product');
        });
    }

    /**
     * Validate stock availability for all items
     */
    public function validateStockAvailability(int $branchId, array $items): array
    {
        $errors = [];

        foreach ($items as $index => $item) {
            if (!$this->stockService->isStockAvailable($branchId, $item['product_id'], $item['quantity'])) {
                $currentStock = $this->stockService->getStockQuantity($branchId, $item['product_id']);
                $errors["items.{$index}.quantity"] = "Stok tidak mencukupi. Stok tersedia: {$currentStock}";
            }
        }

        return $errors;
    }

    /**
     * Cancel a sale (restore stock)
     */
    public function cancelSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                // Restore stock
                $this->stockService->addStock(
                    $sale->branch_id,
                    $item->product_id,
                    $item->quantity,
                    StockReferenceType::ADJUSTMENT,
                    null,
                    "Pembatalan penjualan #{$sale->invoice_number}"
                );
            }

            $sale->delete();
        });
    }

    /**
     * Get sales summary for a branch
     */
    public function getSalesSummary(int $branchId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Sale::where('branch_id', $branchId);

        if ($startDate) {
            $query->whereDate('sale_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('sale_date', '<=', $endDate);
        }

        return [
            'total_sales' => $query->count(),
            'total_revenue' => $query->sum('grand_total'),
            'total_discount' => $query->sum('discount'),
            'average_sale' => $query->avg('grand_total') ?? 0,
        ];
    }
}

