<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectProductRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('reject_product_request');
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => 'required|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Alasan penolakan harus diisi.',
        ];
    }
}

