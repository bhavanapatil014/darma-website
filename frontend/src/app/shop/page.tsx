import { fetchProducts } from "@/lib/data";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProductFilters } from "@/components/ui/product-filters";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ShopPage(props: {
    searchParams: SearchParams
}) {
    const searchParams = await props.searchParams
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const brand = typeof searchParams.brand === 'string' ? searchParams.brand : undefined;
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
    const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
    const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;

    // fetchProducts now needs to accept brand. I assume I will update lib/data.ts next.
    // The previous signature was: (category, search, min, max, sort, page)
    // I will insert brand after category to keep it logical: (category, brand, search, min, max, sort, page)
    const { products: filteredProducts, pagination } = await fetchProducts(category, brand, search, minPrice, maxPrice, sort, page);

    const breadcrumbItems = [
        { label: "Shop", href: category || brand ? "/shop" : undefined },
        ...(category ? [{ label: category.charAt(0).toUpperCase() + category.slice(1) }] : []),
        ...(brand ? [{ label: brand }] : [])
    ];

    return (
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-6 py-8">
            <Breadcrumb items={breadcrumbItems} />

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Sidebar */}
                <aside className="w-full lg:w-[280px] flex-shrink-0 sticky top-24 self-start">
                    <ProductFilters />
                </aside>

                {/* Main Content */}
                <div className="flex-1 w-full min-w-0">
                    {filteredProducts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-12 flex justify-center items-center gap-4">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.currentPage === 1}
                                        asChild={pagination.currentPage > 1}
                                    >
                                        {pagination.currentPage > 1 ? (
                                            <Link href={{
                                                query: { ...searchParams, page: pagination.currentPage - 1 }
                                            }}>Previous</Link>
                                        ) : (
                                            <span>Previous</span>
                                        )}
                                    </Button>

                                    <span className="text-sm font-medium">
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </span>

                                    <Button
                                        variant="outline"
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        asChild={pagination.currentPage < pagination.totalPages}
                                    >
                                        {pagination.currentPage < pagination.totalPages ? (
                                            <Link href={{
                                                query: { ...searchParams, page: pagination.currentPage + 1 }
                                            }}>Next</Link>
                                        ) : (
                                            <span>Next</span>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-2xl w-full">
                            <h3 className="text-xl font-semibold mb-2">No products found</h3>
                            <p className="text-muted-foreground mb-6">Try adjusting your filters.</p>
                            <Button asChild>
                                <Link href="/shop">Clear Filters</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
