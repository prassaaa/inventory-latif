<?php

namespace App\Enums;

enum StockReferenceType: string
{
    case SALE = 'sale';
    case TRANSFER_IN = 'transfer_in';
    case TRANSFER_OUT = 'transfer_out';
    case ADJUSTMENT = 'adjustment';
    case INITIAL = 'initial';

    public function label(): string
    {
        return match($this) {
            self::SALE => 'Penjualan',
            self::TRANSFER_IN => 'Transfer Masuk',
            self::TRANSFER_OUT => 'Transfer Keluar',
            self::ADJUSTMENT => 'Penyesuaian',
            self::INITIAL => 'Stok Awal',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->toArray();
    }
}

