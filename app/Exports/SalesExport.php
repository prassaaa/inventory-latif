<?php

namespace App\Exports;

use App\Models\Sale;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesExport implements FromQuery, WithHeadings, WithMapping, Responsable
{
    use Exportable;

    private ?int $branchId;
    private ?string $startDate;
    private ?string $endDate;
    private string $fileName = 'laporan-penjualan.xlsx';

    public function __construct(?int $branchId = null, ?string $startDate = null, ?string $endDate = null)
    {
        $this->branchId = $branchId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function query(): Builder
    {
        return Sale::query()
            ->with(['branch', 'user'])
            ->when($this->branchId, fn($q) => $q->where('branch_id', $this->branchId))
            ->when($this->startDate, fn($q) => $q->whereDate('sale_date', '>=', $this->startDate))
            ->when($this->endDate, fn($q) => $q->whereDate('sale_date', '<=', $this->endDate))
            ->orderBy('sale_date', 'desc');
    }

    public function headings(): array
    {
        return [
            'No. Invoice',
            'Tanggal',
            'Cabang',
            'Kasir',
            'Pelanggan',
            'Subtotal',
            'Diskon',
            'Grand Total',
            'Metode Pembayaran',
        ];
    }

    public function map($sale): array
    {
        return [
            $sale->invoice_number,
            $sale->sale_date->format('d/m/Y'),
            $sale->branch->name,
            $sale->user->name,
            $sale->customer_name ?? '-',
            $sale->subtotal,
            $sale->discount,
            $sale->grand_total,
            $sale->payment_method->label(),
        ];
    }
}
