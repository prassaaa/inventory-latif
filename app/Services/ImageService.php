<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ImageService
{
    // Quality settings for compression
    private const MAIN_IMAGE_QUALITY = 85;
    private const THUMBNAIL_QUALITY = 80;

    // Default dimensions
    private const DEFAULT_MAX_WIDTH = 800;
    private const DEFAULT_MAX_HEIGHT = 800;
    private const DEFAULT_THUMB_WIDTH = 200;
    private const DEFAULT_THUMB_HEIGHT = 200;

    /**
     * Upload and compress an image with thumbnail
     *
     * @param UploadedFile $file The uploaded file
     * @param string $folder The storage folder (e.g., 'products', 'product-requests')
     * @param string $prefix Filename prefix (e.g., 'product_', 'request_')
     * @param int $maxWidth Maximum width for main image
     * @param int $maxHeight Maximum height for main image
     * @param int $thumbWidth Thumbnail width
     * @param int $thumbHeight Thumbnail height
     * @return string The generated filename
     */
    public function uploadWithThumbnail(
        UploadedFile $file,
        string $folder,
        string $prefix = 'img_',
        int $maxWidth = self::DEFAULT_MAX_WIDTH,
        int $maxHeight = self::DEFAULT_MAX_HEIGHT,
        int $thumbWidth = self::DEFAULT_THUMB_WIDTH,
        int $thumbHeight = self::DEFAULT_THUMB_HEIGHT
    ): string {
        $filename = $this->generateFilename($prefix);

        // Resize and compress main image
        $image = Image::read($file);
        $image->scaleDown($maxWidth, $maxHeight);

        Storage::disk('public')->put(
            $folder . '/' . $filename,
            $image->toJpeg(self::MAIN_IMAGE_QUALITY)
        );

        // Create and compress thumbnail
        $thumbnail = Image::read($file);
        $thumbnail->cover($thumbWidth, $thumbHeight);

        Storage::disk('public')->put(
            $folder . '/thumbnails/' . $filename,
            $thumbnail->toJpeg(self::THUMBNAIL_QUALITY)
        );

        return $filename;
    }

    /**
     * Upload and compress a single image (no thumbnail)
     */
    public function uploadSingle(
        UploadedFile $file,
        string $folder,
        string $prefix = 'img_',
        int $maxWidth = self::DEFAULT_MAX_WIDTH,
        int $maxHeight = self::DEFAULT_MAX_HEIGHT,
        int $quality = self::MAIN_IMAGE_QUALITY
    ): string {
        $filename = $this->generateFilename($prefix);

        $image = Image::read($file);
        $image->scaleDown($maxWidth, $maxHeight);

        Storage::disk('public')->put(
            $folder . '/' . $filename,
            $image->toJpeg($quality)
        );

        return $filename;
    }

    /**
     * Delete an image and its thumbnail
     */
    public function deleteWithThumbnail(string $folder, ?string $filename): void
    {
        if (!$filename) {
            return;
        }

        Storage::disk('public')->delete($folder . '/' . $filename);
        Storage::disk('public')->delete($folder . '/thumbnails/' . $filename);
    }

    /**
     * Delete a single image (no thumbnail)
     */
    public function deleteSingle(string $folder, ?string $filename): void
    {
        if (!$filename) {
            return;
        }

        Storage::disk('public')->delete($folder . '/' . $filename);
    }

    /**
     * Copy image with thumbnail from one folder to another
     */
    public function copyWithThumbnail(
        string $sourceFolder,
        string $destFolder,
        string $sourceFilename,
        string $destPrefix = 'img_'
    ): string {
        $newFilename = $this->generateFilename($destPrefix);

        // Copy main image
        $sourcePath = $sourceFolder . '/' . $sourceFilename;
        $destPath = $destFolder . '/' . $newFilename;

        if (Storage::disk('public')->exists($sourcePath)) {
            Storage::disk('public')->copy($sourcePath, $destPath);
        }

        // Copy thumbnail
        $sourceThumbPath = $sourceFolder . '/thumbnails/' . $sourceFilename;
        $destThumbPath = $destFolder . '/thumbnails/' . $newFilename;

        if (Storage::disk('public')->exists($sourceThumbPath)) {
            Storage::disk('public')->copy($sourceThumbPath, $destThumbPath);
        }

        return $newFilename;
    }

    /**
     * Get the full URL for an image
     */
    public function getUrl(string $folder, ?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }

        return Storage::disk('public')->url($folder . '/' . $filename);
    }

    /**
     * Get the full URL for a thumbnail
     */
    public function getThumbnailUrl(string $folder, ?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }

        return Storage::disk('public')->url($folder . '/thumbnails/' . $filename);
    }

    /**
     * Check if image exists
     */
    public function exists(string $folder, string $filename): bool
    {
        return Storage::disk('public')->exists($folder . '/' . $filename);
    }

    /**
     * Generate unique filename
     */
    private function generateFilename(string $prefix): string
    {
        return $prefix . uniqid() . '_' . time() . '.jpg';
    }
}
