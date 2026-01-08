"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

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

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full h-fit">
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

            <button
                className="w-full md:hidden flex justify-between items-center mb-4 p-4 rounded-lg transition-colors"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-bold text-lg">Filters & Sort</span>
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded">
                    {isOpen ? 'Hide' : 'Show'}
                </span>
            </button>

            <div className={`space-y-8 ${isOpen ? 'block px-4 pb-4 md:p-0' : 'hidden md:block'}`}>

                {/* Categories */}
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
                                    <svg
                                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className={`text-sm group-hover:text-black transition-colors ${category === c.value ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                    {c.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Brand Filter */}
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
                                            if (current?.toLowerCase() === b.toLowerCase()) {
                                                params.delete('brand');
                                            } else {
                                                params.set('brand', b);
                                            }
                                            router.push(`/shop?${params.toString()}`);
                                        }}
                                    />
                                    <svg
                                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className={`text-sm group-hover:text-black transition-colors ${searchParams.get('brand')?.toLowerCase() === b.toLowerCase() ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                    {b}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="border-b pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Price</label>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="5000"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span>Min</span>
                        <span>₹{priceRange[1]}+</span>
                    </div>
                </div>

                {/* Sort */}
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
                                        name="sort_by"
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
    )
}
