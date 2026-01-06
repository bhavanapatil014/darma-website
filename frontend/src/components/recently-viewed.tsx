"use client"
import * as React from "react";
import { useEffect, useState } from "react";
import { Product } from "@/lib/data";
import { ProductCard } from "@/components/ui/product-card";

export function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Get IDs from LocalStorage
        const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

        // 2. Filter out current product and take up to 10 items
        const uniqueIds = viewedIds.filter((id: string) => id !== currentProductId).slice(0, 10);

        if (uniqueIds.length === 0) return;

        // 3. Fetch Details for these IDs
        Promise.all(uniqueIds.map((id: string) =>
            fetch(`http://localhost:4000/api/products/${id}`).then(res => res.ok ? res.json() : null)
        )).then(results => {
            setRecentProducts(results.filter(p => p !== null));
        });

    }, [currentProductId]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (recentProducts.length === 0) return null;

    return (
        <div className="mt-16 border-t pt-12 relative group">
            <h2 className="text-2xl font-bold mb-8 text-center">Recently Viewed</h2>

            <div className="relative">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 shadow-md rounded-full flex items-center justify-center text-gray-800 -ml-5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    aria-label="Scroll left"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x px-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {recentProducts.map(product => (
                        <div key={product.id} className="min-w-[260px] md:min-w-[280px] snap-start">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 shadow-md rounded-full flex items-center justify-center text-gray-800 -mr-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Scroll right"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
            </div>
        </div>
    );
}
