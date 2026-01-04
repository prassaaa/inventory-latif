<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Enums\StockReferenceType;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\StockMovement;
use Illuminate\Http\UploadedFile;

class ProductService
{
    private const IMAGE_FOLDER = 'products';
    private const IMAGE_PREFIX = 'product_';
    private const MAX_IMAGES = 5;

    public function __construct(
        private ImageService $imageService
    ) {}

    /**
     * Upload single product image and create thumbnail
     */
    public function uploadImage(UploadedFile $file): string
    {
        return $this->imageService->uploadWithThumbnail(
            $file,
            self::IMAGE_FOLDER,
            self::IMAGE_PREFIX
        );
    }

    /**
     * Upload multiple images for a product
     * @param Product $product
     * @param array<UploadedFile> $files
     * @param int $startOrder
     */
    public function uploadImages(Product $product, array $files, int $startOrder = 0): void
    {
        foreach ($files as $index => $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $filename = $this->uploadImage($file);

            ProductImage::create([
                'product_id' => $product->id,
                'image' => $filename,
                'sort_order' => $startOrder + $index,
                'is_primary' => $startOrder === 0 && $index === 0 && $product->images()->count() === 0,
            ]);
        }
    }

    /**
     * Delete product image and thumbnail
     */
    public function deleteImage(?string $filename): void
    {
        $this->imageService->deleteWithThumbnail(self::IMAGE_FOLDER, $filename);
    }

    /**
     * Delete a product image by ID
     */
    public function deleteProductImage(int $imageId): bool
    {
        $image = ProductImage::find($imageId);

        if (!$image) {
            return false;
        }

        $this->deleteImage($image->image);
        $wasPrimary = $image->is_primary;
        $productId = $image->product_id;
        $image->delete();

        // If deleted image was primary, set first remaining image as primary
        if ($wasPrimary) {
            $newPrimary = ProductImage::where('product_id', $productId)
                ->orderBy('sort_order')
                ->first();

            if ($newPrimary) {
                $newPrimary->update(['is_primary' => true]);
            }
        }

        return true;
    }

    /**
     * Set an image as primary
     */
    public function setPrimaryImage(int $imageId): bool
    {
        $image = ProductImage::find($imageId);

        if (!$image) {
            return false;
        }

        // Remove primary from all images of this product
        ProductImage::where('product_id', $image->product_id)
            ->update(['is_primary' => false]);

        // Set this image as primary
        $image->update(['is_primary' => true]);

        return true;
    }

    /**
     * Get image URL
     */
    public function getImageUrl(?string $filename): ?string
    {
        return $this->imageService->getUrl(self::IMAGE_FOLDER, $filename);
    }

    /**
     * Get thumbnail URL
     */
    public function getThumbnailUrl(?string $filename): ?string
    {
        return $this->imageService->getThumbnailUrl(self::IMAGE_FOLDER, $filename);
    }

    /**
     * Generate unique SKU
     * Format: PRD-YYYYMM-XXXX
     */
    public function generateSku(): string
    {
        $prefix = 'PRD';
        $yearMonth = date('Ym');
        $basePrefix = "{$prefix}-{$yearMonth}-";

        $lastProduct = Product::where('sku', 'like', $basePrefix . '%')
            ->orderBy('sku', 'desc')
            ->first();

        if ($lastProduct) {
            $lastNumber = (int) substr($lastProduct->sku, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $basePrefix . $newNumber;
    }

    /**
     * Create product with images
     * @param array $data
     * @param array<UploadedFile>|null $images
     * @param int|null $userId
     */
    public function createProduct(array $data, ?array $images = null, ?int $userId = null): Product
    {
        // Extract stock data before creating product
        $branchId = $data['branch_id'] ?? null;
        $initialStock = $data['initial_stock'] ?? null;
        $minStock = $data['min_stock'] ?? 5;

        // Remove stock fields from product data
        unset($data['branch_id'], $data['initial_stock'], $data['min_stock']);

        // Auto-generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku();
        }

        // Set created_by
        if ($userId) {
            $data['created_by'] = $userId;
        }

        // Remove old single image field if present
        unset($data['image']);

        $product = Product::create($data);

        // Upload images
        if ($images && count($images) > 0) {
            $this->uploadImages($product, array_slice($images, 0, self::MAX_IMAGES));
        }

        // Create initial stock if provided
        if ($branchId && $initialStock !== null && $initialStock > 0) {
            $this->createInitialStock($product, $branchId, $initialStock, $minStock, $userId);
        }

        return $product->fresh(['images']);
    }

    /**
     * Create initial stock for a product
     */
    public function createInitialStock(Product $product, int $branchId, int $quantity, int $minStock = 5, ?int $userId = null): BranchStock
    {
        $branchStock = BranchStock::create([
            'branch_id' => $branchId,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'min_stock' => $minStock,
        ]);

        // Log stock movement
        StockMovement::create([
            'branch_id' => $branchId,
            'product_id' => $product->id,
            'type' => StockMovementType::IN,
            'reference_type' => StockReferenceType::ADJUSTMENT,
            'reference_id' => null,
            'quantity' => $quantity,
            'stock_before' => 0,
            'stock_after' => $quantity,
            'notes' => 'Stok awal produk',
            'created_by' => $userId,
        ]);

        return $branchStock;
    }

    /**
     * Update product with images
     * @param Product $product
     * @param array $data
     * @param array<UploadedFile>|null $newImages
     * @param int|null $userId
     */
    public function updateProduct(Product $product, array $data, ?array $newImages = null, ?int $userId = null): Product
    {
        // Set updated_by
        if ($userId) {
            $data['updated_by'] = $userId;
        }

        // Remove old single image field if present
        unset($data['image']);

        $product->update($data);

        // Upload new images if provided
        if ($newImages && count($newImages) > 0) {
            $currentCount = $product->images()->count();
            $availableSlots = self::MAX_IMAGES - $currentCount;

            if ($availableSlots > 0) {
                $imagesToUpload = array_slice($newImages, 0, $availableSlots);
                $maxOrder = $product->images()->max('sort_order') ?? -1;
                $this->uploadImages($product, $imagesToUpload, $maxOrder + 1);
            }
        }

        return $product->fresh(['images']);
    }

    /**
     * Delete product and all its images
     */
    public function deleteProduct(Product $product): bool
    {
        // Delete all images
        foreach ($product->images as $image) {
            $this->deleteImage($image->image);
        }

        // Delete old single image if exists
        if ($product->image) {
            $this->deleteImage($product->image);
        }

        return $product->delete();
    }

    /**
     * Duplicate product
     */
    public function duplicateProduct(Product $product, ?string $newSku = null): Product
    {
        $newProduct = $product->replicate();
        $newProduct->sku = $newSku ?? $product->sku . '-COPY';
        $newProduct->name = $product->name . ' (Copy)';
        $newProduct->image = null;
        $newProduct->save();

        return $newProduct;
    }

    /**
     * Get max images allowed
     */
    public function getMaxImages(): int
    {
        return self::MAX_IMAGES;
    }
}


