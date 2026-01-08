"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

export function ProductFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Derived State from URL (Truth)
    const category = searchParams.get("category") || "all"
    const sort = searchParams.get("sort") || "newest"

    // Price State needs local state for slider interaction
    const initialMinPrice = Number(searchParams.get("minPrice")) || 0
    const initialMaxPrice = Number(searchParams.get("maxPrice")) || 5000
    const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice])

    // Debounce Price Update
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update if different from URL to avoid loop
            if (priceRange[0] !== initialMinPrice || priceRange[1] !== initialMaxPrice) {
                updateFilters(category, priceRange[0], priceRange[1], sort)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [priceRange])

    const updateFilters = (cat: string, min: number, max: number, s: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (cat && cat !== "all") params.set("category", cat)
        else params.delete("category")

        if (min > 0) params.set("minPrice", min.toString())
        else params.delete("minPrice")

        if (max < 5000) params.set("maxPrice", max.toString())
        else params.delete("maxPrice")

        if (s && s !== "newest") params.set("sort", s)
        else params.delete("sort")

        // Force a push to ensure history state update and server fetch
        router.push(`/shop?${params.toString()}`);
    }

    const handleCategoryChange = (c: string) => {
        // Toggle logic if needed, or simple switch
        const newCat = category === c ? "all" : c;
        updateFilters(newCat, priceRange[0], priceRange[1], sort)
    }

    const handleSortChange = (s: string) => {
        updateFilters(category, priceRange[0], priceRange[1], s)
    }

    const categories = [
        { name: "All Products", value: "all" },
        { name: "Skincare", value: "skincare" },
        { name: "Hair Care", value: "hair-care" },
        { name: "Baby Care", value: "baby-care" },
        { name: "Treatments", value: "treatments" },
        { name: "Bundles", value: "bundles" },
    ]

    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'filter' | 'sort'>('filter');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Desktop View
    return (
        <>
            {/* Mobile Fixed Bottom Bar (Myntra Style) - Portal to Body to ensure Fixed Stacking */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex safe-area-bottom">
                    <button
                        onClick={() => { setActiveTab('sort'); setIsMobileModalOpen(true); }}
                        className="flex-1 py-4 flex items-center justify-center gap-2 border-r border-gray-100 font-bold uppercase text-sm tracking-wide bg-white text-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                        Sort
                    </button>
                    <button
                        onClick={() => { setActiveTab('filter'); setIsMobileModalOpen(true); }}
                        className="flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wide bg-white text-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        Filter
                    </button>
                </div>,
                document.body
            )}

            {/* Mobile Modal Overlay - Portal to Body */}
            {mounted && isMobileModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="md:hidden fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-200">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-bold uppercase tracking-wide">{activeTab === 'sort' ? 'Sort By' : 'Filters'}</h2>
                        <button onClick={() => setIsMobileModalOpen(false)} className="p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 pb-24">
                        {activeTab === 'sort' && (
                            <div className="space-y-4">
                                {[
                                    { label: "Newest First", val: "newest" },
                                    { label: "Price: Low to High", val: "price_asc" },
                                    { label: "Price: High to Low", val: "price_desc" },
                                    { label: "Popularity", val: "rating_desc" }
                                ].map((opt) => (
                                    <label key={opt.val} className="flex items-center justify-between p-4 border rounded-lg active:bg-gray-50">
                                        <span className={`text-base ${sort === opt.val ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{opt.label}</span>
                                        <input
                                            type="radio"
                                            name="mobile_sort"
                                            className="w-5 h-5 accent-blue-600"
                                            checked={sort === opt.val}
                                            onChange={() => { handleSortChange(opt.val); setIsMobileModalOpen(false); }}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {activeTab === 'filter' && (
                            <div className="space-y-8">
                                {/* Categories */}
                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Category</h3>
                                    <div className="space-y-3">
                                        {categories.map((c) => (
                                            <label key={c.value} className="flex items-center space-x-3">
                                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-blue-600" checked={category === c.value} onChange={() => handleCategoryChange(c.value)} />
                                                <span className={category === c.value ? 'font-bold text-black' : 'text-gray-700'}>{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Price Range</h3>
                                    <input
                                        type="range" min="0" max="5000" step="100"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between mt-2 font-medium">
                                        <span>₹0</span>
                                        <span>₹{priceRange[1]}+</span>
                                    </div>
                                </div>

                                {/* Brands */}
                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Brands</h3>
                                    <div className="space-y-3">
                                        {["CeraVe", "Cetaphil", "The Ordinary", "Bioderma", "Neutrogena", "La Roche-Posay"].map((b) => (
                                            <label key={b} className="flex items-center space-x-3">
                                                <input type="checkbox" className="w-5 h-5 accent-blue-600"
                                                    checked={searchParams.get('brand')?.toLowerCase() === b.toLowerCase()}
                                                    onChange={() => {
                                                        const current = searchParams.get('brand');
                                                        const params = new URLSearchParams(searchParams.toString());
                                                        if (current?.toLowerCase() === b.toLowerCase()) params.delete('brand');
                                                        else params.set('brand', b);
                                                        router.push(`/shop?${params.toString()}`);
                                                    }}
                                                />
                                                <span className="text-gray-700">{b}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex gap-4">
                        <button onClick={() => { setPriceRange([0, 5000]); router.push('/shop'); setIsMobileModalOpen(false); }} className="flex-1 py-3 font-semibold text-gray-600">Clear All</button>
                        <button
                            onClick={() => setIsMobileModalOpen(false)}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="flex-1 py-3 font-bold rounded-md"
                        >
                            Apply
                        </button>
                    </div>
                </div>,
                document.body
            )}


            {/* Desktop Sidebar (Unchanged layout, just hidden on mobile via CSS) */}
            <div className="hidden md:block w-full h-fit">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 className="font-bold text-base uppercase tracking-wider">Filters</h2>
                    {(category !== 'all' || priceRange[1] < 5000) && (
                        <button
                            onClick={() => {
                                setPriceRange([0, 5000]);
                                router.push('/shop');
                            }}
                            className="text-xs font-bold text-red-500 uppercase hover:text-red-600"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div className="space-y-8">
                    {/* Desktop Categories */}
                    <div className="border-b pb-6">
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Categories</label>
                        <div className="space-y-3">
                            {categories.map((c) => (
                                <label key={c.value} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-pink-500 checked:border-pink-500 transition-all"
                                            checked={category === c.value}
                                            onChange={() => handleCategoryChange(c.value)}
                                        />
                                        <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className={`text-sm group-hover:text-black transition-colors ${category === c.value ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {c.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Brand Filter */}
                    <div className="border-b pb-6">
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Brands</label>
                        <div className="space-y-3">
                            {["CeraVe", "Cetaphil", "The Ordinary", "Bioderma", "Neutrogena", "La Roche-Posay"].map((b) => (
                                <label key={b} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-pink-500 checked:border-pink-500 transition-all"
                                            checked={searchParams.get('brand')?.toLowerCase() === b.toLowerCase()}
                                            onChange={() => {
                                                const current = searchParams.get('brand');
                                                const params = new URLSearchParams(searchParams.toString());
                                                if (current?.toLowerCase() === b.toLowerCase()) params.delete('brand');
                                                else params.set('brand', b);
                                                router.push(`/shop?${params.toString()}`);
                                            }}
                                        />
                                        <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className={`text-sm group-hover:text-black transition-colors ${searchParams.get('brand')?.toLowerCase() === b.toLowerCase() ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {b}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Price Range */}
                    <div className="border-b pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Price</label>
                        </div>
                        <input
                            type="range" min="0" max="5000" step="100"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                            <span>Min</span>
                            <span>₹{priceRange[1]}+</span>
                        </div>
                    </div>

                    {/* Desktop Sort */}
                    <div>
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Sort By</label>
                        <div className="space-y-3">
                            {[
                                { label: "Newest First", val: "newest" },
                                { label: "Price: Low to High", val: "price_asc" },
                                { label: "Price: High to Low", val: "price_desc" },
                                { label: "Popularity", val: "rating_desc" }
                            ].map((opt) => (
                                <label key={opt.val} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="desktop_sort"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-pink-500 checked:border-4 transition-all"
                                            checked={sort === opt.val}
                                            onChange={() => handleSortChange(opt.val)}
                                        />
                                    </div>
                                    <span className={`text-sm group-hover:text-black transition-colors ${sort === opt.val ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {opt.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
