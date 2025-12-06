<?php

namespace App\Exports;

use App\Models\Transfer;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransfersExport implements FromQuery, WithHeadings, WithMapping, Responsable
{
    use Exportable;

    private ?int $branchId;
    private ?string $status;
    private ?string $startDate;
    private ?string $endDate;
    private string $fileName = 'laporan-transfer.xlsx';

    public function __construct(?int $branchId = null, ?string $status = null, ?string $startDate = null, ?string $endDate = null)
    {
        $this->branchId = $branchId;
        $this->status = $status;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function query(): Builder
    {
        return Transfer::query()
            ->with(['fromBranch', 'toBranch', 'requestedBy', 'approvedBy'])
            ->when($this->branchId, fn($q) => $q->where('from_branch_id', $this->branchId)->orWhere('to_branch_id', $this->branchId))
            ->when($this->status, fn($q) => $q->where('status', $this->status))
            ->when($this->startDate, fn($q) => $q->whereDate('created_at', '>=', $this->startDate))
            ->when($this->endDate, fn($q) => $q->whereDate('created_at', '<=', $this->endDate))
            ->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'No. Transfer',
            'Tanggal Request',
            'Cabang Asal',
            'Cabang Tujuan',
            'Status',
            'Diminta Oleh',
            'Disetujui Oleh',
            'Tanggal Kirim',
            'Tanggal Terima',
            'No. Surat Jalan',
        ];
    }

    public function map($transfer): array
    {
        return [
            $transfer->transfer_number,
            $transfer->requested_at?->format('d/m/Y H:i'),
            $transfer->fromBranch->name,
            $transfer->toBranch->name,
            $transfer->status->label(),
            $transfer->requestedBy?->name ?? '-',
            $transfer->approvedBy?->name ?? '-',
            $transfer->sent_at?->format('d/m/Y H:i') ?? '-',
            $transfer->received_at?->format('d/m/Y H:i') ?? '-',
            $transfer->delivery_note_number ?? '-',
        ];
    }
}
