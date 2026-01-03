<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions
        $permissions = [
            // Branch permissions
            'view_branches',
            'create_branch',
            'edit_branch',
            'delete_branch',

            // Category permissions
            'view_categories',
            'create_category',
            'edit_category',
            'delete_category',

            // Product permissions
            'view_products',
            'create_product',
            'edit_product',
            'delete_product',

            // User permissions
            'view_users',
            'create_user',
            'edit_user',
            'delete_user',

            // Stock permissions
            'view_all_stocks',
            'view_branch_stocks',
            'adjust_stock',

            // Transfer permissions
            'view_all_transfers',
            'view_branch_transfers',
            'create_transfer',
            'approve_transfer',
            'reject_transfer',
            'send_transfer',
            'receive_transfer',

            // Sale permissions
            'view_all_sales',
            'view_branch_sales',
            'create_sale',

            // Report permissions
            'view_all_reports',
            'view_branch_reports',
            'export_reports',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        $superAdmin = Role::create(['name' => 'super_admin']);
        $superAdmin->givePermissionTo(Permission::all());

        $adminCabang = Role::create(['name' => 'admin_cabang']);
        $adminCabang->givePermissionTo([
            'view_categories',
            'view_products',
            'create_product',
            'edit_product',
            'view_users',
            'view_branch_stocks',
            'view_branch_transfers',
            'create_transfer',
            'send_transfer',
            'receive_transfer',
            'view_branch_sales',
            'create_sale',
            'view_branch_reports',
            'export_reports',
        ]);
    }
}
