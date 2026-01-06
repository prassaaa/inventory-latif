<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create_transfer');
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:request,send',
            'from_branch_id' => 'nullable|exists:branches,id',
            'to_branch_id' => 'nullable|exists:branches,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity_requested' => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'from_branch_id.required' => 'Cabang asal wajib dipilih.',
            'from_branch_id.exists' => 'Cabang asal tidak valid.',
            'to_branch_id.exists' => 'Cabang tujuan tidak valid.',
            'to_branch_id.different' => 'Cabang tujuan harus berbeda dengan cabang asal.',
            'items.required' => 'Minimal harus ada 1 item.',
            'items.min' => 'Minimal harus ada 1 item.',
            'items.*.product_id.required' => 'Produk wajib dipilih.',
            'items.*.product_id.exists' => 'Produk tidak valid.',
            'items.*.quantity_requested.required' => 'Jumlah wajib diisi.',
            'items.*.quantity_requested.min' => 'Jumlah minimal 1.',
        ];
    }
}
