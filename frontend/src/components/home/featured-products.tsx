"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { fetchProducts } from "@/lib/data";

export function FeaturedProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch products on client side to avoid Vercel Server Timeout (Cold Start)
        fetchProducts()
            .then(data => {
                setProducts(data.products.slice(0, 4));
            })
            .catch(err => {
                console.error("Failed to load featured products", err);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-teal-600 font-bold tracking-wider text-xs uppercase">Highly Recommended</span>
                    <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">Best Selling Products</h2>
                </div>
                <Button variant="outline" className="hidden md:flex" asChild>
                    <Link href="/shop">View All</Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {!loading ? (
                    products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-400">
                            No products found.
                        </div>
                    )
                ) : (
                    // Skeleton Loading State
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-80 rounded-xl"></div>
                    ))
                )}
            </div>
            <div className="mt-8 text-center md:hidden">
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/shop">View All Products</Link>
                </Button>
            </div>
        </section>
    );
}
