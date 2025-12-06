<?php

namespace App\Models;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = [
        'branch_id',
        'product_id',
        'type',
        'reference_type',
        'reference_id',
        'quantity',
        'stock_before',
        'stock_after',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'reference_type' => StockReferenceType::class,
            'quantity' => 'integer',
            'stock_before' => 'integer',
            'stock_after' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeByType($query, StockMovementType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByReferenceType($query, StockReferenceType $referenceType)
    {
        return $query->where('reference_type', $referenceType);
    }

    public function isIncoming(): bool
    {
        return $this->type === StockMovementType::IN;
    }

    public function isOutgoing(): bool
    {
        return $this->type === StockMovementType::OUT;
    }
}
