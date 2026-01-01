<?php

namespace App\Http\Controllers;

use App\Enums\ProductRequestStatus;
use App\Http\Requests\ApproveProductRequestRequest;
use App\Http\Requests\RejectProductRequestRequest;
use App\Http\Requests\StoreProductRequestRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductRequest;
use App\Services\ImageService;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductRequestController extends Controller
{
    private const IMAGE_FOLDER = 'product-requests';
    private const IMAGE_PREFIX = 'request_';

    public function __construct(
        private ProductService $productService,
        private ImageService $imageService
    ) {
        $this->middleware('permission:view_product_requests')->only(['index', 'show']);
        $this->middleware('permission:create_product_request')->only(['create', 'store']);
        $this->middleware('permission:approve_product_request')->only('approve');
        $this->middleware('permission:reject_product_request')->only('reject');
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = ProductRequest::query()
            ->with(['branch:id,name,code', 'requestedBy:id,name', 'category:id,name', 'approvedBy:id,name']);

        // Filter by branch for admin cabang
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Search filter
        $query->when($request->search, function ($q, $search) {
            $q->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        });

        // Status filter
        $query->when($request->status, function ($q, $status) {
            $q->where('status', $status);
        });

        // Branch filter (for super admin)
        $query->when($request->branch_id, function ($q, $branchId) {
            $q->where('branch_id', $branchId);
        });

        $productRequests = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('product-requests/index', [
            'productRequests' => $productRequests,
            'filters' => $request->only(['search', 'status', 'branch_id']),
            'isSuperAdmin' => $isSuperAdmin,
            'statuses' => ProductRequestStatus::options(),
        ]);
    }

    public function create(): Response
    {
        $categories = Category::active()->get(['id', 'name']);

        return Inertia::render('product-requests/create', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreProductRequestRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();

        $validated['branch_id'] = $user->branch_id;
        $validated['requested_by'] = $user->id;
        $validated['status'] = ProductRequestStatus::PENDING;

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadRequestImage($request->file('image'));
        }

        ProductRequest::create($validated);

        return redirect()->route('product-requests.index')
            ->with('success', 'Request produk berhasil dibuat. Menunggu approval dari Super Admin.');
    }

    public function show(ProductRequest $productRequest): Response
    {
        $productRequest->load(['branch', 'requestedBy', 'category', 'approvedBy', 'product']);

        return Inertia::render('product-requests/show', [
            'productRequest' => $productRequest,
        ]);
    }

    public function approve(ApproveProductRequestRequest $request, ProductRequest $productRequest): RedirectResponse
    {
        if (!$productRequest->isPending()) {
            return back()->with('error', 'Request ini sudah diproses sebelumnya.');
        }

        DB::transaction(function () use ($productRequest, $request) {
            // Create product from request
            $product = Product::create([
                'sku' => $productRequest->sku,
                'name' => $productRequest->name,
                'category_id' => $productRequest->category_id,
                'color' => $productRequest->color,
                'size' => $productRequest->size,
                'price' => $productRequest->price,
                'description' => $productRequest->description,
                'is_active' => true,
            ]);

            // Copy image from request to product
            if ($productRequest->image) {
                $product->image = $this->copyRequestImageToProduct($productRequest->image);
                $product->save();
            }

            // Update request status
            $productRequest->update([
                'status' => ProductRequestStatus::APPROVED,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'product_id' => $product->id,
            ]);
        });

        return redirect()->route('product-requests.index')
            ->with('success', 'Request produk berhasil disetujui dan produk telah ditambahkan.');
    }

    public function reject(RejectProductRequestRequest $request, ProductRequest $productRequest): RedirectResponse
    {
        if (!$productRequest->isPending()) {
            return back()->with('error', 'Request ini sudah diproses sebelumnya.');
        }

        $productRequest->update([
            'status' => ProductRequestStatus::REJECTED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        return redirect()->route('product-requests.index')
            ->with('success', 'Request produk berhasil ditolak.');
    }

    /**
     * Upload product request image
     */
    private function uploadRequestImage($file): string
    {
        return $this->imageService->uploadWithThumbnail(
            $file,
            self::IMAGE_FOLDER,
            self::IMAGE_PREFIX
        );
    }

    /**
     * Copy image from product request to product folder
     */
    private function copyRequestImageToProduct(string $requestImage): string
    {
        return $this->imageService->copyWithThumbnail(
            self::IMAGE_FOLDER,
            'products',
            $requestImage,
            'product_'
        );
    }
}
