<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'code' => 'JKT',
                'name' => 'Cabang Jakarta',
                'address' => 'Jl. Sudirman No. 123, Jakarta Pusat',
                'phone' => '021-12345678',
                'pic_name' => 'Budi Santoso',
            ],
            [
                'code' => 'SBY',
                'name' => 'Cabang Surabaya',
                'address' => 'Jl. Basuki Rahmat No. 456, Surabaya',
                'phone' => '031-87654321',
                'pic_name' => 'Dewi Lestari',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
