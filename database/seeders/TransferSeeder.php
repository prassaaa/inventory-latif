<?php

namespace Database\Seeders;

use App\Enums\TransferStatus;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Transfer;
use App\Models\TransferItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        $products = Product::all();
        $superAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first();

        if ($branches->count() < 2) {
            return;
        }

        $statuses = [
            TransferStatus::PENDING,
            TransferStatus::APPROVED,
            TransferStatus::REJECTED,
            TransferStatus::SENT,
            TransferStatus::RECEIVED,
        ];

        $transferCount = 1;

        foreach ($branches as $fromBranch) {
            foreach ($branches as $toBranch) {
                if ($fromBranch->id === $toBranch->id) {
                    continue;
                }

                // Create 2-3 transfers per branch pair
                $numTransfers = rand(2, 3);

                for ($t = 0; $t < $numTransfers; $t++) {
                    $status = $statuses[array_rand($statuses)];
                    $requestedAt = now()->subDays(rand(1, 30));

                    $transfer = Transfer::create([
                        'transfer_number' => sprintf('TRF/%s/%s/%02d/%03d', $fromBranch->code, date('Y'), date('m'), $transferCount++),
                        'from_branch_id' => $fromBranch->id,
                        'to_branch_id' => $toBranch->id,
                        'requested_by' => $superAdmin?->id,
                        'approved_by' => in_array($status, [TransferStatus::APPROVED, TransferStatus::SENT, TransferStatus::RECEIVED]) ? $superAdmin?->id : null,
                        'requested_at' => $requestedAt,
                        'status' => $status,
                        'delivery_note_number' => in_array($status, [TransferStatus::SENT, TransferStatus::RECEIVED]) ? sprintf('SJ/%s/%s/%02d/%03d', $fromBranch->code, date('Y'), date('m'), $transferCount) : null,
                        'notes' => 'Transfer stok dari ' . $fromBranch->name . ' ke ' . $toBranch->name,
                        'rejection_reason' => $status === TransferStatus::REJECTED ? 'Stok tidak mencukupi' : null,
                        'approved_at' => in_array($status, [TransferStatus::APPROVED, TransferStatus::SENT, TransferStatus::RECEIVED]) ? $requestedAt->addHours(rand(1, 24)) : null,
                        'sent_at' => in_array($status, [TransferStatus::SENT, TransferStatus::RECEIVED]) ? $requestedAt->addDays(rand(1, 3)) : null,
                        'received_at' => $status === TransferStatus::RECEIVED ? $requestedAt->addDays(rand(3, 5)) : null,
                    ]);

                    // Add 2-5 items per transfer
                    $transferProducts = $products->random(rand(2, 5));

                    foreach ($transferProducts as $product) {
                        $qtyRequested = rand(3, 15);
                        $qtySent = in_array($status, [TransferStatus::SENT, TransferStatus::RECEIVED]) ? $qtyRequested : null;
                        $qtyReceived = $status === TransferStatus::RECEIVED ? $qtyRequested : null;

                        TransferItem::create([
                            'transfer_id' => $transfer->id,
                            'product_id' => $product->id,
                            'quantity_requested' => $qtyRequested,
                            'quantity_sent' => $qtySent,
                            'quantity_received' => $qtyReceived,
                            'notes' => null,
                        ]);
                    }
                }
            }
        }
    }
}

