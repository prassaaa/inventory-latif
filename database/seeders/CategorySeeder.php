<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Kursi', 'slug' => 'kursi', 'description' => 'Berbagai jenis kursi'],
            ['name' => 'Meja', 'slug' => 'meja', 'description' => 'Berbagai jenis meja'],
            ['name' => 'Lemari', 'slug' => 'lemari', 'description' => 'Berbagai jenis lemari'],
            ['name' => 'Sofa', 'slug' => 'sofa', 'description' => 'Berbagai jenis sofa'],
            ['name' => 'Tempat Tidur', 'slug' => 'tempat-tidur', 'description' => 'Berbagai jenis tempat tidur'],
            ['name' => 'Rak', 'slug' => 'rak', 'description' => 'Berbagai jenis rak'],
            ['name' => 'Lain-lain', 'slug' => 'lain-lain', 'description' => 'Produk furnitur lainnya'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
