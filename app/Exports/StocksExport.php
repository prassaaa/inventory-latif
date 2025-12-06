<?php

namespace App\Exports;

use App\Models\BranchStock;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StocksExport implements FromQuery, WithHeadings, WithMapping, Responsable
{
    use Exportable;

    private ?int $branchId;
    private string $fileName = 'laporan-stok.xlsx';

    public function __construct(?int $branchId = null)
    {
        $this->branchId = $branchId;
    }

    public function query(): Builder
    {
        return BranchStock::query()
            ->with(['branch', 'product.category'])
            ->when($this->branchId, fn($q) => $q->where('branch_id', $this->branchId))
            ->orderBy('branch_id')
            ->orderBy('product_id');
    }

    public function headings(): array
    {
        return [
            'Cabang',
            'SKU',
            'Nama Produk',
            'Kategori',
            'Stok',
            'Min. Stok',
            'Status',
            'Harga',
            'Nilai Stok',
        ];
    }

    public function map($stock): array
    {
        return [
            $stock->branch->name,
            $stock->product->sku,
            $stock->product->name,
            $stock->product->category->name ?? '-',
            $stock->quantity,
            $stock->min_stock,
            $stock->isLowStock() ? 'Stok Menipis' : 'Normal',
            $stock->product->price,
            $stock->quantity * $stock->product->price,
        ];
    }
}
