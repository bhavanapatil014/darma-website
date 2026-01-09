"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

export function ProductFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // --- Valid Options ---
    const categories = [
        { name: "All Products", value: "all" },
        { name: "Skincare", value: "skincare" },
        { name: "Hair Care", value: "hair-care" },
        { name: "Baby Care", value: "baby-care" },
        { name: "Treatments", value: "treatments" },
        { name: "Bundles", value: "bundles" },
    ]

    const sortOptions = [
        { label: "Newest First", val: "newest" },
        { label: "Price: Low to High", val: "price_asc" },
        { label: "Price: High to Low", val: "price_desc" },
        { label: "Popularity", val: "rating_desc" }
    ]

    const brands = ["CeraVe", "Cetaphil", "The Ordinary", "Bioderma", "Neutrogena", "La Roche-Posay"];


    // --- URL Derived State (Source of Truth for Desktop / Initial Mobile) ---
    const urlCategory = searchParams.get("category") || "all"
    const urlSort = searchParams.get("sort") || "newest"
    const urlBrand = searchParams.get("brand") || ""
    const urlMinPrice = Number(searchParams.get("minPrice")) || 0
    const urlMaxPrice = Number(searchParams.get("maxPrice")) || 5000


    // --- Mobile Deferred State ---
    const [mobileCategory, setMobileCategory] = useState(urlCategory);
    const [mobileSort, setMobileSort] = useState(urlSort);
    const [mobileBrand, setMobileBrand] = useState(urlBrand);
    const [mobilePriceRange, setMobilePriceRange] = useState([urlMinPrice, urlMaxPrice]);


    // --- Desktop Price State (Live) ---
    const [desktopPriceRange, setDesktopPriceRange] = useState([urlMinPrice, urlMaxPrice]);


    // Sync Mobile State with URL when Modal Opens (or URL changes)
    useEffect(() => {
        setMobileCategory(urlCategory);
        setMobileSort(urlSort);
        setMobileBrand(urlBrand);
        setMobilePriceRange([urlMinPrice, urlMaxPrice]);
        setDesktopPriceRange([urlMinPrice, urlMaxPrice]);
    }, [searchParams])


    // --- Desktop Debounced Price Update ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (desktopPriceRange[0] !== urlMinPrice || desktopPriceRange[1] !== urlMaxPrice) {
                applyFilters(urlCategory, urlBrand, desktopPriceRange[0], desktopPriceRange[1], urlSort);
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [desktopPriceRange])


    // --- Master Apply Function ---
    const applyFilters = (cat: string, br: string, min: number, max: number, s: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (cat && cat !== "all") params.set("category", cat)
        else params.delete("category")

        if (br) params.set("brand", br)
        else params.delete("brand")

        if (min > 0) params.set("minPrice", min.toString())
        else params.delete("minPrice")

        if (max < 5000) params.set("maxPrice", max.toString())
        else params.delete("maxPrice")

        if (s && s !== "newest") params.set("sort", s)
        else params.delete("sort")

        router.push(`/shop?${params.toString()}`);
    }


    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'filter' | 'sort'>('filter');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- Mobile Handlers (Local State Only) ---
    const handleMobileApply = () => {
        applyFilters(mobileCategory, mobileBrand, mobilePriceRange[0], mobilePriceRange[1], mobileSort);
        setIsMobileModalOpen(false);
    }


    return (
        <>
            {/* Mobile Bottom Bar */}
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

            {/* Mobile Modal Overlay */}
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
                                {sortOptions.map((opt) => (
                                    <label key={opt.val} className="flex items-center justify-between p-4 border rounded-lg active:bg-gray-50">
                                        <span className={`text-base ${mobileSort === opt.val ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{opt.label}</span>
                                        <input
                                            type="radio"
                                            name="mobile_sort"
                                            className="w-5 h-5 accent-blue-600"
                                            checked={mobileSort === opt.val}
                                            onChange={() => setMobileSort(opt.val)} // DEFERRED: No Apply yet
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {activeTab === 'filter' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Category</h3>
                                    <div className="space-y-3">
                                        {categories.map((c) => (
                                            <label key={c.value} className="flex items-center space-x-3">
                                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-blue-600"
                                                    checked={mobileCategory === c.value}
                                                    onChange={() => setMobileCategory(mobileCategory === c.value ? 'all' : c.value)}
                                                />
                                                <span className={mobileCategory === c.value ? 'font-bold text-black' : 'text-gray-700'}>{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Price Range</h3>
                                    <input
                                        type="range" min="0" max="5000" step="100"
                                        value={mobilePriceRange[1]}
                                        onChange={(e) => setMobilePriceRange([mobilePriceRange[0], Number(e.target.value)])}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between mt-2 font-medium">
                                        <span>₹0</span>
                                        <span>₹{mobilePriceRange[1]}+</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Brands</h3>
                                    <div className="space-y-3">
                                        {brands.map((b) => (
                                            <label key={b} className="flex items-center space-x-3">
                                                <input type="checkbox" className="w-5 h-5 accent-blue-600"
                                                    checked={mobileBrand.toLowerCase() === b.toLowerCase()}
                                                    onChange={() => setMobileBrand(mobileBrand.toLowerCase() === b.toLowerCase() ? "" : b)}
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
                        <button onClick={() => {
                            setMobileCategory("all");
                            setMobileBrand("");
                            setMobilePriceRange([0, 5000]);
                            setMobileSort("newest");
                            // Don't apply yet? Can reset UI then Apply
                        }} className="flex-1 py-3 font-semibold text-gray-600">Reset</button>
                        <button
                            onClick={handleMobileApply}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="flex-1 py-3 font-bold rounded-md"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>,
                document.body
            )}


            {/* Desktop Sidebar (Live Update) */}
            <div className="hidden md:block w-full h-fit">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 className="font-bold text-base uppercase tracking-wider">Filters</h2>
                    <button
                        onClick={() => router.push('/shop')}
                        className="text-xs font-bold text-red-500 uppercase hover:text-red-600"
                    >
                        Clear All
                    </button>
                </div>

                <div className="space-y-8">
                    <div className="border-b pb-6">
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Categories</label>
                        <div className="space-y-3">
                            {categories.map((c) => (
                                <label key={c.value} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-pink-500 checked:border-pink-500 transition-all"
                                            checked={urlCategory === c.value}
                                            onChange={() => applyFilters(urlCategory === c.value ? "all" : c.value, urlBrand, desktopPriceRange[0], desktopPriceRange[1], urlSort)}
                                        />
                                        <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className={`text-sm group-hover:text-black transition-colors ${urlCategory === c.value ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {c.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-b pb-6">
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Brands</label>
                        <div className="space-y-3">
                            {brands.map((b) => (
                                <label key={b} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-pink-500 checked:border-pink-500 transition-all"
                                            checked={urlBrand.toLowerCase() === b.toLowerCase()}
                                            onChange={() => applyFilters(urlCategory, urlBrand.toLowerCase() === b.toLowerCase() ? "" : b, desktopPriceRange[0], desktopPriceRange[1], urlSort)}
                                        />
                                        <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{b}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-b pb-6">
                        <label className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 block">Price</label>
                        <input
                            type="range" min="0" max="5000" step="100"
                            value={desktopPriceRange[1]}
                            onChange={(e) => setDesktopPriceRange([desktopPriceRange[0], Number(e.target.value)])}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                            <span>Min</span>
                            <span>₹{desktopPriceRange[1]}+</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-4 block text-gray-900 uppercase tracking-wide">Sort By</label>
                        <div className="space-y-3">
                            {sortOptions.map((opt) => (
                                <label key={opt.val} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="desktop_sort"
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-pink-500 checked:border-4 transition-all"
                                            checked={urlSort === opt.val}
                                            onChange={() => applyFilters(urlCategory, urlBrand, desktopPriceRange[0], desktopPriceRange[1], opt.val)}
                                        />
                                    </div>
                                    <span className={`text-sm group-hover:text-black transition-colors ${urlSort === opt.val ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
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
