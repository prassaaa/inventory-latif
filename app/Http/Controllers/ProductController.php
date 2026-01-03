<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {
        $this->middleware('permission:view_products')->only(['index', 'show']);
        $this->middleware('permission:create_product')->only(['create', 'store']);
        $this->middleware('permission:edit_product')->only(['edit', 'update', 'deleteImage', 'setPrimaryImage']);
        $this->middleware('permission:delete_product')->only('destroy');
    }

    public function index(Request $request): Response
    {
        $products = Product::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($request->category_id, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->with(['category:id,name', 'creator:id,name', 'images'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $categories = Category::active()->get(['id', 'name']);

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function create(): Response
    {
        $categories = Category::active()->get(['id', 'name']);

        return Inertia::render('products/create', [
            'categories' => $categories,
            'maxImages' => $this->productService->getMaxImages(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->productService->createProduct(
            $request->validated(),
            $request->file('images'),
            Auth::id()
        );

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil ditambahkan.');
    }

    public function show(Product $product): Response
    {
        $product->load(['category', 'branchStocks.branch', 'creator:id,name', 'updater:id,name', 'images']);

        return Inertia::render('products/show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load('images');
        $categories = Category::active()->get(['id', 'name']);

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => $categories,
            'maxImages' => $this->productService->getMaxImages(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->productService->updateProduct(
            $product,
            $request->validated(),
            $request->file('images'),
            Auth::id()
        );

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->productService->deleteProduct($product);

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dihapus.');
    }

    /**
     * Delete a product image
     */
    public function deleteImage(Product $product, ProductImage $image): RedirectResponse
    {
        // Verify image belongs to product
        if ($image->product_id !== $product->id) {
            return back()->with('error', 'Gambar tidak ditemukan.');
        }

        $this->productService->deleteProductImage($image->id);

        return back()->with('success', 'Gambar berhasil dihapus.');
    }

    /**
     * Set an image as primary
     */
    public function setPrimaryImage(Product $product, ProductImage $image): RedirectResponse
    {
        // Verify image belongs to product
        if ($image->product_id !== $product->id) {
            return back()->with('error', 'Gambar tidak ditemukan.');
        }

        $this->productService->setPrimaryImage($image->id);

        return back()->with('success', 'Gambar utama berhasil diubah.');
    }
}

