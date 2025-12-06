<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $sale->invoice_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-box { width: 48%; }
        .info-box h3 { margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-box p { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { width: 300px; margin-left: auto; }
        .totals td { border: none; padding: 5px 10px; }
        .totals .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        .signature { margin-top: 50px; }
        .signature-box { display: inline-block; width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <p>{{ $sale->branch->name }}</p>
        <p>{{ $sale->branch->address }}</p>
        <p>Telp: {{ $sale->branch->phone }}</p>
    </div>

    <table style="border: none; margin-bottom: 20px;">
        <tr>
            <td style="border: none; width: 50%; vertical-align: top;">
                <strong>No. Invoice:</strong> {{ $sale->invoice_number }}<br>
                <strong>Tanggal:</strong> {{ $sale->sale_date->format('d/m/Y') }}<br>
                <strong>Kasir:</strong> {{ $sale->user->name }}
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
                <strong>Pelanggan:</strong> {{ $sale->customer_name ?? '-' }}<br>
                <strong>Telepon:</strong> {{ $sale->customer_phone ?? '-' }}<br>
                <strong>Pembayaran:</strong> {{ ucfirst($sale->payment_method) }}
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 40px;">No</th>
                <th>Produk</th>
                <th>SKU</th>
                <th class="text-center" style="width: 60px;">Qty</th>
                <th class="text-right" style="width: 120px;">Harga</th>
                <th class="text-right" style="width: 120px;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sale->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $item->product->name }}</td>
                <td>{{ $item->product->sku }}</td>
                <td class="text-center">{{ $item->quantity }}</td>
                <td class="text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Subtotal:</td>
            <td class="text-right">Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Diskon:</td>
            <td class="text-right">Rp {{ number_format($sale->discount, 0, ',', '.') }}</td>
        </tr>
        <tr class="grand-total">
            <td>Grand Total:</td>
            <td class="text-right">Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if($sale->notes)
    <p><strong>Catatan:</strong> {{ $sale->notes }}</p>
    @endif

    <div class="signature">
        <table style="border: none; width: 100%;">
            <tr>
                <td style="border: none; text-align: center; width: 50%;">
                    <p>Kasir</p>
                    <div class="signature-line">{{ $sale->user->name }}</div>
                </td>
                <td style="border: none; text-align: center; width: 50%;">
                    <p>Pelanggan</p>
                    <div class="signature-line">{{ $sale->customer_name ?? '________________' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
    </div>
</body>
</html>

