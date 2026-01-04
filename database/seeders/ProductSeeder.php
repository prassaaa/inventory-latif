<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all()->keyBy('slug');
        $superAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first();

        $products = [
            // Kursi
            ['sku' => 'KRS-001', 'name' => 'Kursi Kantor Ergonomis', 'category' => 'kursi', 'color' => 'Hitam', 'price' => 1500000, 'location' => 'Rak A-1, Gudang Utama'],
            ['sku' => 'KRS-002', 'name' => 'Kursi Makan Kayu Jati', 'category' => 'kursi', 'color' => 'Coklat Natural', 'price' => 850000, 'location' => 'Rak A-2, Gudang Utama'],
            ['sku' => 'KRS-003', 'name' => 'Kursi Lipat Plastik', 'category' => 'kursi', 'color' => 'Putih', 'price' => 150000, 'location' => 'Rak B-1, Gudang Belakang'],
            ['sku' => 'KRS-004', 'name' => 'Kursi Gaming RGB', 'category' => 'kursi', 'color' => 'Hitam Merah', 'price' => 3500000, 'location' => 'Display Area 1'],
            ['sku' => 'KRS-005', 'name' => 'Kursi Tamu Minimalis', 'category' => 'kursi', 'color' => 'Abu-abu', 'price' => 2200000, 'location' => 'Display Area 2'],

            // Meja
            ['sku' => 'MJA-001', 'name' => 'Meja Kerja Minimalis 120cm', 'category' => 'meja', 'color' => 'Putih Oak', 'price' => 1200000, 'location' => 'Rak C-1, Gudang Utama'],
            ['sku' => 'MJA-002', 'name' => 'Meja Makan 6 Orang', 'category' => 'meja', 'color' => 'Coklat Walnut', 'price' => 4500000, 'location' => 'Display Area 3'],
            ['sku' => 'MJA-003', 'name' => 'Meja Belajar Anak', 'category' => 'meja', 'color' => 'Pink', 'price' => 750000, 'location' => 'Rak C-2, Gudang Utama'],
            ['sku' => 'MJA-004', 'name' => 'Meja Kopi Bulat', 'category' => 'meja', 'color' => 'Hitam Marmer', 'price' => 1800000, 'location' => 'Display Area 2'],
            ['sku' => 'MJA-005', 'name' => 'Meja TV Stand 150cm', 'category' => 'meja', 'color' => 'Putih Glossy', 'price' => 2100000, 'location' => 'Display Area 1'],

            // Lemari
            ['sku' => 'LMR-001', 'name' => 'Lemari Pakaian 3 Pintu', 'category' => 'lemari', 'color' => 'Putih', 'price' => 3200000, 'location' => 'Gudang Besar, Sektor L'],
            ['sku' => 'LMR-002', 'name' => 'Lemari Sliding 2 Pintu', 'category' => 'lemari', 'color' => 'Coklat Tua', 'price' => 4800000, 'location' => 'Gudang Besar, Sektor L'],
            ['sku' => 'LMR-003', 'name' => 'Lemari Buku 5 Tingkat', 'category' => 'lemari', 'color' => 'Oak Natural', 'price' => 1500000, 'location' => 'Rak D-1, Gudang Utama'],
            ['sku' => 'LMR-004', 'name' => 'Lemari Arsip Kantor', 'category' => 'lemari', 'color' => 'Abu-abu', 'price' => 2800000, 'location' => 'Rak D-2, Gudang Utama'],

            // Sofa
            ['sku' => 'SFA-001', 'name' => 'Sofa L Minimalis', 'category' => 'sofa', 'color' => 'Abu-abu', 'price' => 8500000, 'location' => 'Display Area Utama'],
            ['sku' => 'SFA-002', 'name' => 'Sofa 2 Seater', 'category' => 'sofa', 'color' => 'Biru Navy', 'price' => 4200000, 'location' => 'Display Area 2'],
            ['sku' => 'SFA-003', 'name' => 'Sofa Bed Lipat', 'category' => 'sofa', 'color' => 'Krem', 'price' => 5500000, 'location' => 'Display Area 3'],
            ['sku' => 'SFA-004', 'name' => 'Sofa Santai Recliner', 'category' => 'sofa', 'color' => 'Coklat Kulit', 'price' => 7800000, 'location' => 'Display Area Utama'],

            // Tempat Tidur
            ['sku' => 'TDR-001', 'name' => 'Tempat Tidur King Size', 'category' => 'tempat-tidur', 'color' => 'Putih', 'price' => 6500000, 'location' => 'Gudang Besar, Sektor T'],
            ['sku' => 'TDR-002', 'name' => 'Tempat Tidur Anak Tingkat', 'category' => 'tempat-tidur', 'color' => 'Biru', 'price' => 4500000, 'location' => 'Gudang Besar, Sektor T'],
            ['sku' => 'TDR-003', 'name' => 'Tempat Tidur Queen Size', 'category' => 'tempat-tidur', 'color' => 'Coklat Walnut', 'price' => 5200000, 'location' => 'Gudang Besar, Sektor T'],
            ['sku' => 'TDR-004', 'name' => 'Divan Spring Bed 160x200', 'category' => 'tempat-tidur', 'color' => 'Putih', 'price' => 3800000, 'location' => 'Gudang Besar, Sektor T'],

            // Rak
            ['sku' => 'RAK-001', 'name' => 'Rak Sepatu 5 Tingkat', 'category' => 'rak', 'color' => 'Coklat', 'price' => 450000, 'location' => 'Rak E-1, Gudang Kecil'],
            ['sku' => 'RAK-002', 'name' => 'Rak Dinding Floating', 'category' => 'rak', 'color' => 'Putih', 'price' => 250000, 'location' => 'Rak E-2, Gudang Kecil'],
            ['sku' => 'RAK-003', 'name' => 'Rak Dapur Stainless', 'category' => 'rak', 'color' => 'Silver', 'price' => 850000, 'location' => 'Rak E-3, Gudang Kecil'],
            ['sku' => 'RAK-004', 'name' => 'Rak Display Kaca', 'category' => 'rak', 'color' => 'Hitam', 'price' => 1200000, 'location' => 'Display Area 4'],

            // Lain-lain
            ['sku' => 'LLN-001', 'name' => 'Nakas 2 Laci', 'category' => 'lain-lain', 'color' => 'Putih Oak', 'price' => 650000, 'location' => 'Rak F-1, Gudang Kecil'],
            ['sku' => 'LLN-002', 'name' => 'Cermin Berdiri Full Body', 'category' => 'lain-lain', 'color' => 'Gold Frame', 'price' => 1100000, 'location' => 'Display Area 4'],
            ['sku' => 'LLN-003', 'name' => 'Meja Rias dengan Cermin', 'category' => 'lain-lain', 'color' => 'Putih', 'price' => 2400000, 'location' => 'Display Area 3'],
            ['sku' => 'LLN-004', 'name' => 'Partisi Ruangan Lipat', 'category' => 'lain-lain', 'color' => 'Kayu Natural', 'price' => 1800000, 'location' => 'Gudang Belakang'],
        ];

        foreach ($products as $product) {
            Product::create([
                'sku' => $product['sku'],
                'name' => $product['name'],
                'category_id' => $categories[$product['category']]->id,
                'color' => $product['color'],
                'price' => $product['price'],
                'description' => 'Produk furnitur berkualitas tinggi - ' . $product['name'],
                'location_description' => $product['location'],
                'created_by' => $superAdmin?->id,
                'is_active' => true,
            ]);
        }
    }
}
