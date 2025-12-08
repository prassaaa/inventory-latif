<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('edit_product');
    }

    public function rules(): array
    {
        return [
            'sku' => 'required|string|max:50|unique:products,sku,' . $this->route('product')->id,
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'color' => 'nullable|string|max:50',
            'size' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'sku.required' => 'SKU wajib diisi.',
            'sku.unique' => 'SKU sudah digunakan.',
            'name.required' => 'Nama produk wajib diisi.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak valid.',
            'price.required' => 'Harga wajib diisi.',
            'price.min' => 'Harga tidak boleh negatif.',
            'image.image' => 'File harus berupa gambar.',
            'image.max' => 'Ukuran gambar maksimal 2MB.',
        ];
    }
}
