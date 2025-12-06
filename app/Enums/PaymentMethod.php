<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case TRANSFER = 'transfer';
    case DEBIT = 'debit';

    public function label(): string
    {
        return match($this) {
            self::CASH => 'Cash',
            self::TRANSFER => 'Transfer Bank',
            self::DEBIT => 'Kartu Debit',
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

