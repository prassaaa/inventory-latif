<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $products = \App\Models\Product::query()
        ->active()
        ->with([
            'category:id,name',
            'branchStocks.branch:id,name,code',
            'images'
        ])
        ->latest()
        ->paginate(12);

    $categories = \App\Models\Category::active()->get(['id', 'name']);

    return Inertia::render('welcome', [
        'products' => $products,
        'categories' => $categories,
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Master Data
    Route::resource('branches', BranchController::class);
    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::delete('products/{product}/images/{image}', [ProductController::class, 'deleteImage'])->name('products.images.delete');
    Route::post('products/{product}/images/{image}/primary', [ProductController::class, 'setPrimaryImage'])->name('products.images.primary');
    Route::resource('users', UserController::class);

    // Stock Management
    Route::get('stocks', [StockController::class, 'index'])->name('stocks.index');
    Route::get('stocks/movements', [StockController::class, 'movements'])->name('stocks.movements');
    Route::get('stocks/adjust', [StockController::class, 'adjustForm'])->name('stocks.adjust.form');
    Route::post('stocks/adjust', [StockController::class, 'adjust'])->name('stocks.adjust');

    // Transfers
    Route::resource('transfers', TransferController::class)->except(['edit', 'update']);
    Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve'])->name('transfers.approve');
    Route::post('transfers/{transfer}/reject', [TransferController::class, 'reject'])->name('transfers.reject');
    Route::post('transfers/{transfer}/send', [TransferController::class, 'send'])->name('transfers.send');
    Route::post('transfers/{transfer}/receive', [TransferController::class, 'receive'])->name('transfers.receive');
    Route::get('transfers/{transfer}/delivery-note', [TransferController::class, 'deliveryNote'])->name('transfers.delivery-note');

    // Sales
    Route::resource('sales', SaleController::class)->except(['edit', 'update']);
    Route::get('sales/{sale}/invoice', [SaleController::class, 'invoice'])->name('sales.invoice');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('stock', [ReportController::class, 'stock'])->name('stock');
        Route::get('transfers', [ReportController::class, 'transfers'])->name('transfers');
        Route::get('top-products', [ReportController::class, 'topProducts'])->name('top-products');

        // Export routes
        Route::get('export/sales', [ReportController::class, 'exportSales'])->name('export.sales');
        Route::get('export/stock', [ReportController::class, 'exportStock'])->name('export.stock');
        Route::get('export/transfers', [ReportController::class, 'exportTransfers'])->name('export.transfers');
    });
});

require __DIR__.'/settings.php';
