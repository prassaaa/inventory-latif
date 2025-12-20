<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Services\DashboardService;
use App\Services\ReportService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService,
        private ReportService $reportService
    ) {}

    public function index(): Response
    {
        $user = Auth::user();

        if ($user->isSuperAdmin()) {
            return $this->superAdminDashboard();
        }

        // If user doesn't have a branch, treat as super admin
        if (!$user->branch_id) {
            return $this->superAdminDashboard();
        }

        return $this->adminCabangDashboard($user);
    }

    private function superAdminDashboard(): Response
    {
        $stats = $this->dashboardService->getSuperAdminStats();
        $salesByBranch = $this->dashboardService->getSalesByBranch();
        $lowStockItems = $this->reportService->getLowStockProducts();
        $branches = Branch::active()->get(['id', 'name', 'code']);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'salesByBranch' => $salesByBranch,
            'lowStockItems' => $lowStockItems,
            'branches' => $branches,
            'isSuperAdmin' => true,
        ]);
    }

    private function adminCabangDashboard($user): Response
    {
        $branchId = $user->branch_id;

        $stats = $this->dashboardService->getAdminCabangStats($branchId);
        $lowStockItems = BranchStock::where('branch_id', $branchId)
            ->lowStock()
            ->with(['product:id,name,sku'])
            ->limit(10)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'lowStockItems' => $lowStockItems,
            'isSuperAdmin' => false,
            'branch' => $user->branch,
        ]);
    }
}
