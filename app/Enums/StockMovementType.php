<?php

namespace App\Enums;

enum StockMovementType: string
{
    case IN = 'in';
    case OUT = 'out';

    public function label(): string
    {
        return match($this) {
            self::IN => 'Masuk',
            self::OUT => 'Keluar',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::IN => 'green',
            self::OUT => 'red',
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

