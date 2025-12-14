<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create_product_request');
    }

    public function rules(): array
    {
        return [
            'sku' => 'required|string|max:50|unique:products,sku|unique:product_requests,sku',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'color' => 'nullable|string|max:50',
            'size' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'request_notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'SKU sudah digunakan di produk atau request lain.',
            'category_id.exists' => 'Kategori tidak valid.',
            'image.image' => 'File harus berupa gambar.',
            'image.max' => 'Ukuran gambar maksimal 2MB.',
        ];
    }
}

