import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { Branch, BranchStock, Category, PaginatedData, Product } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Loader2, Package, Search, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductWithCategory extends Omit<Product, 'category' | 'branch_stocks'> {
    category: Category | null;
    branch_stocks?: (BranchStock & { branch: Branch })[];
}

interface Props {
    products: PaginatedData<ProductWithCategory>;
    categories: Category[];
}

export default function Welcome({ products, categories }: Props) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadedProducts, setLoadedProducts] = useState<ProductWithCategory[]>(products?.data || []);
    const [lastPage, setLastPage] = useState(products?.current_page || 1);

    // Update loaded products when new page is loaded
    useEffect(() => {
        if (products?.current_page && products.current_page !== lastPage) {
            if (products.current_page === 1) {
                setLoadedProducts(products.data || []);
            } else {
                setLoadedProducts((prev) => [...prev, ...(products.data || [])]);
            }
            setLastPage(products.current_page);
            setIsLoadingMore(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products?.current_page, products?.data]);

    const filteredProducts = (loadedProducts || []).filter((product) => {
        const matchSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                          product.sku.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !selectedCategory || product.category_id === Number(selectedCategory);
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
        <>
            <Head title="Katalog Produk" />

            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                {/* Header/Navbar */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                <Store className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Inventory System</h1>
                                <p className="text-xs text-muted-foreground">Katalog Produk</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild>
                                <Link href="/login">Masuk</Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                    <div className="space-y-8">
                        {/* Page Title & Stats */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">Katalog Produk</h2>
                                <p className="text-muted-foreground mt-1">
                                    Menampilkan {filteredProducts.length} dari {products?.total || 0} produk
                                </p>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                    {/* Search */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari produk atau SKU..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10 h-11"
                                        />
                                    </div>

                                    {/* Category Filter */}
                                    <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                                        <Button
                                            variant={selectedCategory === '' ? 'default' : 'outline'}
                                            size="default"
                                            onClick={() => setSelectedCategory('')}
                                            className="whitespace-nowrap"
                                        >
                                            Semua Kategori
                                        </Button>
                                        {categories.map((category) => (
                                            <Button
                                                key={category.id}
                                                variant={selectedCategory === String(category.id) ? 'default' : 'outline'}
                                                size="default"
                                                onClick={() => setSelectedCategory(String(category.id))}
                                                className="whitespace-nowrap"
                                            >
                                                {category.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Products Grid */}
                        {filteredProducts.length > 0 ? (
                            <>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {!search && !selectedCategory && products?.next_page_url && (
                                    <div className="flex justify-center pt-4">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                            className="min-w-[200px]"
                                        >
                                            {isLoadingMore ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Memuat...
                                                </>
                                            ) : (
                                                <>
                                                    Muat Lebih Banyak
                                                    {products?.total && loadedProducts.length < products.total && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({products.total - loadedProducts.length} lagi)
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-muted p-6">
                                        <Package className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold">Tidak ada produk ditemukan</h3>
                                    <p className="text-muted-foreground mt-2 text-center max-w-sm">
                                        Coba ubah filter kategori atau kata kunci pencarian Anda
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6"
                                        onClick={() => {
                                            setSearch('');
                                            setSelectedCategory('');
                                        }}
                                    >
                                        Reset Filter
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t bg-muted/50 mt-12">
                    <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground max-w-7xl">
                        <p>&copy; {new Date().getFullYear()} Inventory System. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}

// Product Card Component
function ProductCard({ product }: { product: ProductWithCategory }) {
    // Calculate total stock across all branches
    const totalStock = product.branch_stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;

    return (
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
            <CardContent className="p-0">
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <Package className="h-20 w-20 text-muted-foreground/40" />
                        </div>
                    )}

                    {/* Category Badge */}
                    {product.category && (
                        <Badge className="absolute top-3 right-3 bg-background/95 text-foreground border shadow-lg backdrop-blur-sm">
                            {product.category.name}
                        </Badge>
                    )}

                    {/* Stock Badge */}
                    <div className="absolute top-3 left-3">
                        <Badge
                            variant="default"
                            className={totalStock > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                        >
                            {totalStock > 0 ? `Stock: ${totalStock}` : 'Habis'}
                        </Badge>
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-3">
                    {/* Title & SKU */}
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                            {product.sku}
                        </p>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {product.description}
                        </p>
                    )}

                    {/* Attributes (Color & Size) */}
                    {(product.color || product.size) && (
                        <div className="flex gap-2 flex-wrap">
                            {product.color && (
                                <Badge variant="outline" className="text-xs">
                                    <div className="w-2 h-2 rounded-full bg-current mr-1.5" />
                                    {product.color}
                                </Badge>
                            )}
                            {product.size && (
                                <Badge variant="outline" className="text-xs">
                                    📏 {product.size}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Stock per Branch */}
                    <div className="pt-3 border-t space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Ketersediaan Stock
                        </p>
                        <div className="space-y-1.5">
                            {product.branch_stocks && product.branch_stocks.length > 0 ? (
                                product.branch_stocks.map((stock) => (
                                    <div
                                        key={stock.id}
                                        className="flex items-center justify-between text-sm bg-muted/30 px-3 py-1.5 rounded"
                                    >
                                        <span className="font-medium text-foreground">
                                            {stock.branch.name}
                                        </span>
                                        <span className={`font-bold ${stock.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {stock.quantity} pcs
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">
                                    Belum ada data stock
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="pt-3 border-t">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-muted-foreground">Harga</span>
                            <span className="text-2xl font-bold text-primary">
                                {formatCurrency(product.price)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
