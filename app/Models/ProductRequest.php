<?php

namespace App\Models;

use App\Enums\ProductRequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductRequest extends Model
{
    protected $fillable = [
        'branch_id',
        'requested_by',
        'sku',
        'name',
        'category_id',
        'color',
        'size',
        'price',
        'image',
        'description',
        'status',
        'request_notes',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'product_id',
    ];

    protected $appends = ['image_url', 'thumbnail_url'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'status' => ProductRequestStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }
        return Storage::disk('public')->url('product-requests/' . $this->image);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }
        return Storage::disk('public')->url('product-requests/thumbnails/' . $this->image);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', ProductRequestStatus::PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ProductRequestStatus::APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', ProductRequestStatus::REJECTED);
    }

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function isPending(): bool
    {
        return $this->status === ProductRequestStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === ProductRequestStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === ProductRequestStatus::REJECTED;
    }
}

