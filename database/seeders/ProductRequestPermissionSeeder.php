<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ProductRequestPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions if they don't exist
        $permissions = [
            'view_product_requests',
            'create_product_request',
            'approve_product_request',
            'reject_product_request',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign to super_admin
        $superAdmin = Role::where('name', 'super_admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo([
                'view_product_requests',
                'approve_product_request',
                'reject_product_request',
            ]);
        }

        // Assign to admin_cabang
        $adminCabang = Role::where('name', 'admin_cabang')->first();
        if ($adminCabang) {
            $adminCabang->givePermissionTo([
                'view_product_requests',
                'create_product_request',
            ]);
        }

        echo "Product request permissions created and assigned!\n";
    }
}

