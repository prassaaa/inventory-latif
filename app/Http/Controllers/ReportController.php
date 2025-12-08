<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Transfer;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function sales(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();
        $branchId = $isSuperAdmin
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        $summary = $this->reportService->getSalesSummary(
            $branchId,
            $request->start_date,
            $request->end_date
        );

        $dailySales = $this->reportService->getDailySales(
            $branchId,
            $request->start_date,
            $request->end_date
        );

        $salesByBranch = $isSuperAdmin
            ? $this->reportService->getSalesByBranch($request->start_date, $request->end_date)
            : [];

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('reports/sales', [
            'summary' => $summary,
            'dailySales' => $dailySales,
            'salesByBranch' => $salesByBranch,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'start_date', 'end_date']),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function stock(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();
        $branchId = $isSuperAdmin
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        $query = BranchStock::query()
            ->with(['branch:id,name,code', 'product:id,name,sku,price,category_id', 'product.category:id,name'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $stocks = $query->get();

        $summary = $this->reportService->getStockSummary($branchId);
        $stockByCategory = $this->reportService->getStockByCategory($branchId);

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('reports/stock', [
            'stocks' => $stocks,
            'summary' => $summary,
            'stockByCategory' => $stockByCategory,
            'branches' => $branches,
            'filters' => $request->only(['branch_id']),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function transfers(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();
        $branchId = $isSuperAdmin
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        $query = Transfer::query()
            ->with(['fromBranch:id,name,code', 'toBranch:id,name,code']);

        if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('from_branch_id', $branchId)
                    ->orWhere('to_branch_id', $branchId);
            });
        } elseif (!$isSuperAdmin) {
            $query->where(function ($q) use ($user) {
                $q->where('from_branch_id', $user->branch_id)
                    ->orWhere('to_branch_id', $user->branch_id);
            });
        }

        $query->when($request->status && $request->status !== 'all', fn($q) => $q->where('status', $request->status))
            ->when($request->start_date, fn($q) => $q->whereDate('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('created_at', '<=', $request->end_date));

        $summaryByStatus = $this->reportService->getTransferSummaryByStatus(
            $branchId,
            $request->status,
            $request->start_date,
            $request->end_date
        );

        $transfers = $query->latest()->paginate(15)->withQueryString();
        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('reports/transfers', [
            'transfers' => $transfers,
            'summaryByStatus' => $summaryByStatus,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'status', 'start_date', 'end_date']),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function topProducts(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();
        $branchId = $isSuperAdmin
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        $topProducts = $this->reportService->getTopSellingProducts(
            $branchId,
            $request->start_date,
            $request->end_date
        );

        $branches = $isSuperAdmin ? Branch::active()->get(['id', 'name', 'code']) : [];

        return Inertia::render('reports/top-products', [
            'topProducts' => $topProducts,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'start_date', 'end_date']),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function exportSales(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isSuperAdmin()
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        return new \App\Exports\SalesExport(
            $branchId,
            $request->start_date,
            $request->end_date
        );
    }

    public function exportStock(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isSuperAdmin()
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        return new \App\Exports\StocksExport($branchId);
    }

    public function exportTransfers(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isSuperAdmin()
            ? ($request->branch_id && $request->branch_id !== 'all' ? (int) $request->branch_id : null)
            : $user->branch_id;

        return new \App\Exports\TransfersExport(
            $branchId,
            $request->status,
            $request->start_date,
            $request->end_date
        );
    }
}
