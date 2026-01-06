<?php

namespace App\Models;

use App\Enums\TransferStatus;
use App\Enums\TransferType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transfer extends Model
{
    protected $fillable = [
        'transfer_number',
        'type',
        'from_branch_id',
        'to_branch_id',
        'requested_by',
        'approved_by',
        'requested_at',
        'status',
        'delivery_note_number',
        'notes',
        'rejection_reason',
        'approved_at',
        'sent_at',
        'received_at',
        'receiving_notes',
        'receiving_photo',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransferType::class,
            'status' => TransferStatus::class,
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'sent_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }

    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransferItem::class);
    }

    public function getTotalItems(): int
    {
        return $this->items->sum('quantity_requested');
    }

    public function scopeStatus($query, TransferStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', TransferStatus::PENDING);
    }

    public function isPending(): bool
    {
        return $this->status === TransferStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === TransferStatus::APPROVED;
    }

    public function isSent(): bool
    {
        return $this->status === TransferStatus::SENT;
    }

    public function canBeApproved(): bool
    {
        return $this->status === TransferStatus::PENDING;
    }

    public function canBeSent(): bool
    {
        return $this->status === TransferStatus::APPROVED;
    }

    public function canBeReceived(): bool
    {
        return $this->status === TransferStatus::SENT;
    }

    public function canBeDeleted(): bool
    {
        return in_array($this->status, [TransferStatus::DRAFT, TransferStatus::PENDING]);
    }

    public static function generateTransferNumber(string $branchCode): string
    {
        $year = date('Y');
        $month = date('m');
        $prefix = "TRF/{$branchCode}/{$year}/{$month}/";

        $lastTransfer = static::where('transfer_number', 'like', $prefix . '%')
            ->orderBy('transfer_number', 'desc')
            ->first();

        if ($lastTransfer) {
            $lastNumber = (int) substr($lastTransfer->transfer_number, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return $prefix . $newNumber;
    }

    public static function generateDeliveryNoteNumber(string $branchCode): string
    {
        $year = date('Y');
        $month = date('m');
        $prefix = "SJ/{$branchCode}/{$year}/{$month}/";

        $lastNote = static::where('delivery_note_number', 'like', $prefix . '%')
            ->orderBy('delivery_note_number', 'desc')
            ->first();

        if ($lastNote) {
            $lastNumber = (int) substr($lastNote->delivery_note_number, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return $prefix . $newNumber;
    }
}
