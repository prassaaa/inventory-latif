<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveProductRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('approve_product_request');
    }

    public function rules(): array
    {
        return [
            // No additional fields needed for approval
        ];
    }
}

