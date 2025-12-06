<?php

namespace App\Services;

use App\Enums\StockReferenceType;
use App\Enums\TransferStatus;
use App\Models\Transfer;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TransferService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new transfer request
     */
    public function createTransfer(array $data): Transfer
    {
        return DB::transaction(function () use ($data) {
            $fromBranch = \App\Models\Branch::find($data['from_branch_id']);

            $transfer = Transfer::create([
                'transfer_number' => Transfer::generateTransferNumber($fromBranch->code),
                'from_branch_id' => $data['from_branch_id'],
                'to_branch_id' => $data['to_branch_id'],
                'requested_by' => Auth::id(),
                'requested_at' => now(),
                'status' => TransferStatus::PENDING,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $transfer->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                ]);
            }

            return $transfer->load('items.product');
        });
    }

    /**
     * Approve a transfer request
     */
    public function approveTransfer(Transfer $transfer): Transfer
    {
        $transfer->update([
            'status' => TransferStatus::APPROVED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return $transfer->fresh();
    }

    /**
     * Reject a transfer request
     */
    public function rejectTransfer(Transfer $transfer, ?string $reason = null): Transfer
    {
        $transfer->update([
            'status' => TransferStatus::REJECTED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $transfer->fresh();
    }

    /**
     * Send transfer (reduce stock from source branch)
     */
    public function sendTransfer(Transfer $transfer, array $sentQuantities): Transfer
    {
        return DB::transaction(function () use ($transfer, $sentQuantities) {
            foreach ($transfer->items as $item) {
                $quantitySent = $sentQuantities[$item->id] ?? $item->quantity_requested;

                $item->update(['quantity_sent' => $quantitySent]);

                // Reduce stock from source branch
                $this->stockService->reduceStock(
                    $transfer->from_branch_id,
                    $item->product_id,
                    $quantitySent,
                    StockReferenceType::TRANSFER_OUT,
                    $transfer->id,
                    "Transfer keluar ke {$transfer->toBranch->name}"
                );
            }

            $transfer->update([
                'status' => TransferStatus::SENT,
                'sent_at' => now(),
                'delivery_note_number' => Transfer::generateDeliveryNoteNumber($transfer->fromBranch->code),
            ]);

            return $transfer->fresh();
        });
    }

    /**
     * Receive transfer (add stock to destination branch)
     */
    public function receiveTransfer(Transfer $transfer, array $receivedQuantities): Transfer
    {
        return DB::transaction(function () use ($transfer, $receivedQuantities) {
            foreach ($transfer->items as $item) {
                $quantityReceived = $receivedQuantities[$item->id] ?? $item->quantity_sent;

                $item->update(['quantity_received' => $quantityReceived]);

                // Add stock to destination branch
                $this->stockService->addStock(
                    $transfer->to_branch_id,
                    $item->product_id,
                    $quantityReceived,
                    StockReferenceType::TRANSFER_IN,
                    $transfer->id,
                    "Transfer masuk dari {$transfer->fromBranch->name}"
                );
            }

            $transfer->update([
                'status' => TransferStatus::RECEIVED,
                'received_at' => now(),
            ]);

            return $transfer->fresh();
        });
    }
}

