<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ProductService
{
    private const IMAGE_PATH = 'products';
    private const IMAGE_MAX_WIDTH = 800;
    private const IMAGE_MAX_HEIGHT = 800;
    private const THUMBNAIL_WIDTH = 200;
    private const THUMBNAIL_HEIGHT = 200;

    /**
     * Upload product image and create thumbnail
     */
    public function uploadImage(UploadedFile $file): string
    {
        $filename = $this->generateFilename($file);

        // Resize and store main image
        $image = Image::read($file);
        $image->scaleDown(self::IMAGE_MAX_WIDTH, self::IMAGE_MAX_HEIGHT);

        Storage::disk('public')->put(
            self::IMAGE_PATH . '/' . $filename,
            $image->toJpeg(85)
        );

        // Create thumbnail
        $thumbnail = Image::read($file);
        $thumbnail->cover(self::THUMBNAIL_WIDTH, self::THUMBNAIL_HEIGHT);

        Storage::disk('public')->put(
            self::IMAGE_PATH . '/thumbnails/' . $filename,
            $thumbnail->toJpeg(80)
        );

        return $filename;
    }

    /**
     * Delete product image and thumbnail
     */
    public function deleteImage(?string $filename): void
    {
        if (!$filename) {
            return;
        }

        Storage::disk('public')->delete(self::IMAGE_PATH . '/' . $filename);
        Storage::disk('public')->delete(self::IMAGE_PATH . '/thumbnails/' . $filename);
    }

    /**
     * Update product image
     */
    public function updateImage(Product $product, ?UploadedFile $newImage): ?string
    {
        if (!$newImage) {
            return $product->image;
        }

        // Delete old image
        $this->deleteImage($product->image);

        // Upload new image
        return $this->uploadImage($newImage);
    }

    /**
     * Generate unique filename
     */
    private function generateFilename(UploadedFile $file): string
    {
        return uniqid('product_') . '_' . time() . '.jpg';
    }

    /**
     * Get image URL
     */
    public function getImageUrl(?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }

        return Storage::disk('public')->url(self::IMAGE_PATH . '/' . $filename);
    }

    /**
     * Get thumbnail URL
     */
    public function getThumbnailUrl(?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }

        return Storage::disk('public')->url(self::IMAGE_PATH . '/thumbnails/' . $filename);
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
     * Create product with image
     */
    public function createProduct(array $data, ?UploadedFile $image = null): Product
    {
        // Auto-generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku();
        }

        if ($image) {
            $data['image'] = $this->uploadImage($image);
        }

        return Product::create($data);
    }

    /**
     * Update product with image
     */
    public function updateProduct(Product $product, array $data, ?UploadedFile $image = null): Product
    {
        if ($image) {
            $data['image'] = $this->updateImage($product, $image);
        }

        $product->update($data);

        return $product->fresh();
    }

    /**
     * Delete product and its image
     */
    public function deleteProduct(Product $product): bool
    {
        $this->deleteImage($product->image);

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
        $newProduct->image = null; // Don't copy image
        $newProduct->save();

        return $newProduct;
    }
}

