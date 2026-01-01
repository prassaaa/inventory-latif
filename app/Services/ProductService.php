<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;

class ProductService
{
    private const IMAGE_FOLDER = 'products';
    private const IMAGE_PREFIX = 'product_';

    public function __construct(
        private ImageService $imageService
    ) {}

    /**
     * Upload product image and create thumbnail
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
     * Delete product image and thumbnail
     */
    public function deleteImage(?string $filename): void
    {
        $this->imageService->deleteWithThumbnail(self::IMAGE_FOLDER, $filename);
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

