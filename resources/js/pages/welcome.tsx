import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import type {
    Branch,
    BranchStock,
    Category,
    PaginatedData,
    Product,
    ProductImage,
} from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Box,
    Loader2,
    MapPin,
    Search,
    ShoppingBag,
    Store,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Simplified Interface for cleaner code
interface ProductWithCategory
    extends Omit<Product, 'category' | 'branch_stocks' | 'images'> {
    category: Category | null;
    branch_stocks?: (BranchStock & { branch: Branch })[];
    images?: ProductImage[];
}

interface Props {
    products: PaginatedData<ProductWithCategory>;
    categories: Category[];
}

export default function Welcome({ products, categories }: Props) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadedProducts, setLoadedProducts] = useState<ProductWithCategory[]>(
        products?.data || [],
    );
    const [lastPage, setLastPage] = useState(products?.current_page || 1);

    // Update loaded products when new page is loaded
    useEffect(() => {
        if (products?.current_page && products.current_page !== lastPage) {
            if (products.current_page === 1) {
                setLoadedProducts(products.data || []);
            } else {
                setLoadedProducts((prev) => [
                    ...prev,
                    ...(products.data || []),
                ]);
            }
            setLastPage(products.current_page);
            setIsLoadingMore(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products?.current_page, products?.data]);

    const filteredProducts = (loadedProducts || []).filter((product) => {
        const matchSearch =
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku.toLowerCase().includes(search.toLowerCase());
        const matchCategory =
            !selectedCategory ||
            product.category_id === Number(selectedCategory);
        return matchSearch && matchCategory;
    });

    const handleLoadMore = () => {
        if (products?.next_page_url && !isLoadingMore) {
            setIsLoadingMore(true);
            router.visit(products.next_page_url, {
                preserveState: true,
                preserveScroll: true,
                only: ['products'],
                onFinish: () => setIsLoadingMore(false),
            });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-black transition-colors duration-300 dark:bg-black dark:text-white">
            <Head title="Katalog Produk" />

            {/* High Contrast Header */}
            <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-white px-4 py-4 transition-colors duration-300 dark:border-white dark:bg-black">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-black bg-black text-white transition-colors duration-300 dark:border-white dark:bg-white dark:text-black">
                            <Store className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-black uppercase transition-colors duration-300 dark:text-white">
                                INVENTORY LATIF
                            </h1>
                        </div>
                    </div>
                    <div>
                        <Button
                            asChild
                            size="lg"
                            className="rounded-md border-2 border-black bg-white text-base font-bold text-black transition-all duration-300 hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white hover:dark:bg-white hover:dark:text-black"
                        >
                            <Link href="/login">Login</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Simple Hero / Search Section */}
            <section className="border-b-2 border-black bg-gray-50 py-12 transition-colors duration-300 dark:border-white dark:bg-zinc-900">
                <div className="container mx-auto max-w-5xl px-4 text-center">
                    <h2 className="mb-6 text-3xl font-extrabold tracking-wide text-black uppercase transition-colors duration-300 dark:text-white">
                        Cari Stok Barang
                    </h2>

                    {/* Large Search Input */}
                    <div className="relative mx-auto mb-8 max-w-2xl">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 h-6 w-6 text-black transition-colors duration-300 dark:text-white" />
                            <input
                                type="text"
                                placeholder="KETIK NAMA BARANG ATAU KODE..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-md border-2 border-black bg-white py-4 pr-4 pl-12 text-xl font-bold text-black transition-all duration-300 outline-none placeholder:text-gray-500 focus:ring-4 focus:ring-black/20 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-white/20"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 rounded p-1 text-black transition-colors duration-300 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button
                            variant={
                                selectedCategory === '' ? 'default' : 'outline'
                            }
                            onClick={() => setSelectedCategory('')}
                            className={`rounded-md border-2 border-black px-6 py-6 text-lg font-bold transition-all duration-300 dark:border-white ${selectedCategory === '' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900'}`}
                        >
                            SEMUA
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={
                                    selectedCategory === String(category.id)
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() =>
                                    setSelectedCategory(String(category.id))
                                }
                                className={`rounded-md border-2 border-black px-6 py-6 text-lg font-bold transition-all duration-300 dark:border-white ${selectedCategory === String(category.id) ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900'}`}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto max-w-7xl px-4 py-12 transition-colors duration-300">
                {/* Results Count */}
                <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4 transition-colors duration-300 dark:border-white">
                    <h3 className="flex items-center gap-2 text-2xl font-bold text-black uppercase transition-colors duration-300 dark:text-white">
                        <ShoppingBag className="h-6 w-6" />
                        Daftar Barang
                    </h3>
                    <span className="rounded border border-black bg-gray-200 px-4 py-2 text-lg font-bold text-black transition-colors duration-300 dark:border-white dark:bg-zinc-800 dark:text-white">
                        Total: {filteredProducts.length} Items
                    </span>
                </div>

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                    <>
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>

                        {/* Load More */}
                        {!search &&
                            !selectedCategory &&
                            products?.next_page_url && (
                                <div className="mt-16 flex justify-center">
                                    <Button
                                        size="lg"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="h-14 min-w-[250px] rounded-md border-2 border-black bg-white text-lg font-bold text-black transition-all duration-300 hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white hover:dark:bg-white hover:dark:text-black"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                MEMUAT DATA...
                                            </>
                                        ) : (
                                            <>
                                                TAMPILKAN LEBIH BANYAK
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black bg-gray-50 py-20 text-center transition-colors duration-300 dark:border-white dark:bg-zinc-900">
                        <div className="mb-4 rounded-full border-2 border-black bg-white p-4 transition-colors duration-300 dark:border-white dark:bg-black">
                            <Box className="h-10 w-10 text-black dark:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-black transition-colors duration-300 dark:text-white">
                            BARANG TIDAK DITEMUKAN
                        </h3>
                        <p className="mt-2 text-lg text-black transition-colors duration-300 dark:text-white">
                            Mohon periksa ejaan atau ganti filter kategori.
                        </p>
                        <Button
                            size="lg"
                            className="mt-6 border-2 border-black bg-black font-bold text-white transition-all duration-300 hover:bg-gray-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                            onClick={() => {
                                setSearch('');
                                setSelectedCategory('');
                            }}
                        >
                            RESET PENCARIAN
                        </Button>
                    </div>
                )}
            </main>

            <footer className="border-t-2 border-black bg-gray-100 py-8 transition-colors duration-300 dark:border-white dark:bg-zinc-900">
                <div className="container mx-auto px-4 text-center">
                    <p className="font-bold text-black transition-colors duration-300 dark:text-white">
                        &copy; {new Date().getFullYear()} INVENTORY LATIF
                        SYSTEM.
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Accessible Product Card Component
function ProductCard({ product }: { product: ProductWithCategory }) {
    const totalStock =
        product.branch_stocks?.reduce(
            (sum, stock) => sum + stock.quantity,
            0,
        ) || 0;
    const hasBranchStock =
        product.branch_stocks && product.branch_stocks.length > 0;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            {/* Image & Main Info */}
            <div className="flex h-full flex-col">
                {/* Image Section */}
                <div className="relative flex h-64 w-full items-center justify-center border-b-2 border-black bg-white p-4 transition-colors duration-300 dark:border-white dark:bg-black">
                    {(() => {
                        const primaryImage =
                            product.images?.find((img) => img.is_primary) ||
                            product.images?.[0];
                        const imageUrl =
                            primaryImage?.image_url || product.image_url;
                        return imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Box className="h-16 w-16 text-gray-300 dark:text-zinc-700" />
                        );
                    })()}

                    {/* Image Count Badge */}
                    {product.images && product.images.length > 1 && (
                        <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            {product.images.length} Foto
                        </div>
                    )}

                    {/* Category Label Overlay */}
                    {product.category && (
                        <div className="absolute top-0 left-0 bg-black px-2 py-1 text-xs font-bold text-white uppercase transition-colors duration-300 dark:bg-white dark:text-black">
                            {product.category.name}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-between p-4 dark:bg-black">
                    <div>
                        <h3 className="mb-1 text-xl leading-tight font-bold text-black transition-colors duration-300 dark:text-white">
                            {product.name}
                        </h3>
                        <p className="mb-3 inline-block border border-gray-300 bg-gray-100 px-1 font-mono text-sm text-gray-600 transition-colors duration-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400">
                            KODE: {product.sku}
                        </p>

                        {/* Attributes */}
                        {(product.color || product.size) && (
                            <div className="mb-3 flex gap-2">
                                {product.color && (
                                    <span className="rounded border border-black bg-white px-2 py-0.5 text-sm font-medium text-black transition-colors duration-300 dark:border-white dark:bg-black dark:text-white">
                                        Warna: {product.color}
                                    </span>
                                )}
                                {product.size && (
                                    <span className="rounded border border-black bg-white px-2 py-0.5 text-sm font-medium text-black transition-colors duration-300 dark:border-white dark:bg-black dark:text-white">
                                        Ukuran: {product.size}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {product.description}
                            </p>
                        )}

                        {/* Location Description */}
                        {product.location_description && (
                            <div className="mb-2 flex items-start gap-1 text-sm">
                                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                                <span className="line-clamp-2 text-gray-600 dark:text-gray-400">
                                    {product.location_description}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <Separator className="my-2 bg-black transition-colors duration-300 dark:bg-white" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase transition-colors duration-300 dark:text-gray-400">
                                    HARGA SATUAN
                                </p>
                                <p className="text-2xl font-extrabold text-black transition-colors duration-300 dark:text-white">
                                    {formatCurrency(product.price)}
                                </p>
                            </div>
                        </div>

                        {/* Stock Status Box - Always Light/Green for visibility */}
                        <div
                            className={`mt-3 rounded border-2 p-2 transition-colors duration-300 ${totalStock > 0 ? 'border-black bg-green-50' : 'border-red-600 bg-red-50'}`}
                        >
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-bold text-black uppercase">
                                    Total Stok:
                                </span>
                                <span
                                    className={`text-lg font-black ${totalStock > 0 ? 'text-black' : 'text-red-600'}`}
                                >
                                    {totalStock > 0
                                        ? `${totalStock} Unit`
                                        : 'HABIS'}
                                </span>
                            </div>

                            {/* Branch Details */}
                            {hasBranchStock && (
                                <div className="mt-2 space-y-1 border-t border-black/20 pt-2">
                                    {product.branch_stocks?.map(
                                        (stock) =>
                                            stock.quantity > 0 && (
                                                <div
                                                    key={stock.id}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="flex items-center gap-1 font-medium text-black">
                                                        <MapPin className="h-3 w-3" />
                                                        {stock.branch.name}
                                                    </span>
                                                    <span className="rounded-sm border border-black bg-white px-1.5 font-bold text-black">
                                                        {stock.quantity}
                                                    </span>
                                                </div>
                                            ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
