<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Jalan {{ $transfer->delivery_note_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .info-table td { border: none; padding: 3px 10px; }
        .footer { margin-top: 30px; }
        .signature-table { border: none; width: 100%; margin-top: 50px; }
        .signature-table td { border: none; text-align: center; width: 33%; vertical-align: top; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; display: inline-block; width: 150px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SURAT JALAN</h1>
        <p>Transfer Barang Antar Cabang</p>
    </div>

    <table class="info-table" style="margin-bottom: 20px;">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <strong>No. Surat Jalan:</strong> {{ $transfer->delivery_note_number }}<br>
                <strong>No. Transfer:</strong> {{ $transfer->transfer_number }}<br>
                <strong>Tanggal Kirim:</strong> {{ $transfer->sent_at ? $transfer->sent_at->format('d/m/Y H:i') : '-' }}
            </td>
            <td style="width: 50%; vertical-align: top;">
                <strong>Status:</strong> {{ strtoupper($transfer->status) }}
            </td>
        </tr>
    </table>

    <table class="info-table" style="margin-bottom: 20px;">
        <tr>
            <td style="width: 50%; vertical-align: top; border: 1px solid #ddd; padding: 10px;">
                <strong>CABANG PENGIRIM:</strong><br>
                {{ $transfer->fromBranch->name }} ({{ $transfer->fromBranch->code }})<br>
                {{ $transfer->fromBranch->address }}<br>
                Telp: {{ $transfer->fromBranch->phone }}<br>
                PIC: {{ $transfer->fromBranch->pic_name }}
            </td>
            <td style="width: 50%; vertical-align: top; border: 1px solid #ddd; padding: 10px;">
                <strong>CABANG PENERIMA:</strong><br>
                {{ $transfer->toBranch->name }} ({{ $transfer->toBranch->code }})<br>
                {{ $transfer->toBranch->address }}<br>
                Telp: {{ $transfer->toBranch->phone }}<br>
                PIC: {{ $transfer->toBranch->pic_name }}
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 40px;">No</th>
                <th>Produk</th>
                <th>SKU</th>
                <th class="text-center" style="width: 100px;">Qty Diminta</th>
                <th class="text-center" style="width: 100px;">Qty Dikirim</th>
                <th class="text-center" style="width: 100px;">Qty Diterima</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transfer->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $item->product->name }}</td>
                <td>{{ $item->product->sku }}</td>
                <td class="text-center">{{ $item->quantity_requested }}</td>
                <td class="text-center">{{ $item->quantity_sent ?? '-' }}</td>
                <td class="text-center">{{ $item->quantity_received ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="3" class="text-right">Total:</th>
                <th class="text-center">{{ $transfer->items->sum('quantity_requested') }}</th>
                <th class="text-center">{{ $transfer->items->sum('quantity_sent') ?? '-' }}</th>
                <th class="text-center">{{ $transfer->items->sum('quantity_received') ?? '-' }}</th>
            </tr>
        </tfoot>
    </table>

    @if($transfer->notes)
    <p><strong>Catatan:</strong> {{ $transfer->notes }}</p>
    @endif

    <table class="signature-table">
        <tr>
            <td>
                <p><strong>Pengirim</strong></p>
                <p>{{ $transfer->fromBranch->name }}</p>
                <div class="signature-line"></div>
                <p>Nama & Tanda Tangan</p>
            </td>
            <td>
                <p><strong>Kurir/Driver</strong></p>
                <p>&nbsp;</p>
                <div class="signature-line"></div>
                <p>Nama & Tanda Tangan</p>
            </td>
            <td>
                <p><strong>Penerima</strong></p>
                <p>{{ $transfer->toBranch->name }}</p>
                <div class="signature-line"></div>
                <p>Nama & Tanda Tangan</p>
            </td>
        </tr>
    </table>

    <div class="footer" style="text-align: center; font-size: 10px; color: #666; margin-top: 30px;">
        <p>Dokumen ini dicetak pada {{ now()->format('d/m/Y H:i:s') }}</p>
    </div>
</body>
</html>

