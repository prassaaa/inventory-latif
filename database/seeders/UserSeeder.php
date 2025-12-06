<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin (no branch)
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@inventory.test',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $superAdmin->assignRole('super_admin');

        // Create Admin Cabang for each branch
        $branches = Branch::all();

        foreach ($branches as $branch) {
            $adminCabang = User::create([
                'name' => 'Admin ' . $branch->name,
                'email' => 'admin.' . strtolower($branch->code) . '@inventory.test',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'branch_id' => $branch->id,
                'is_active' => true,
            ]);
            $adminCabang->assignRole('admin_cabang');
        }
    }
}
