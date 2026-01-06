<?php

namespace App\Enums;

enum TransferType: string
{
    case REQUEST = 'request';
    case SEND = 'send';

    public function label(): string
    {
        return match($this) {
            self::REQUEST => 'Minta Stock',
            self::SEND => 'Kirim Stock',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->toArray();
    }
}
