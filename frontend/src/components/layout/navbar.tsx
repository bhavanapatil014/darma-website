"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/wishlist-context';

import { usePathname } from "next/navigation";

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { setIsOpen, items } = useCart();
    const { user } = useAuth();
    const pathname = usePathname();
    const { wishlistCount } = useWishlist();
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const [settings, setSettings] = React.useState({ siteName: 'VENKATA', logoUrl: '/images/venkata-logo.png' });

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch Settings
        fetch(`https://darma-website.onrender.com/api/settings`)
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.warn("Settings fetch failed (Backend might be offline):", err));

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchOpen(false);
            router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    // Hide navbar on admin routes
    if (pathname?.startsWith('/admin')) return null;

    return (
        <div className="flex flex-col w-full z-50 fixed top-0">
            {/* Top Bar - Marketing/Contact (Blue Background) */}
            <div className="bg-blue-600 text-white text-[10px] sm:text-xs py-2 px-4 transition-colors">
                <div className="container mx-auto flex justify-center items-center overflow-hidden">
                    {/* Mobile: Static condensed text to prevent truncation on 320px screens */}
                    <div className="md:hidden flex items-center gap-3 whitespace-nowrap font-medium">
                        <span>Free Delivery &gt; ₹599</span>
                        <span className="opacity-60">|</span>
                        <span>COD Available</span>
                    </div>

                    {/* Desktop: Scrolling text effect */}
                    <div className="hidden md:flex gap-12 animate-marquee whitespace-nowrap font-medium tracking-wide w-full justify-center">
                        <span>Free Delivery on Orders Above ₹599</span>
                        <span>COD Available</span>
                        <span>Free Delivery on Orders Above ₹599</span>
                        <span>COD Available</span>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <header className={cn(
                "w-full transition-all duration-300 border-b bg-white shadow-sm relative",
                isScrolled ? "py-2" : "py-4"
            )}>
                <div className="container mx-auto px-4 flex items-center justify-between">

                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0 mr-8">
                        <img
                            src="/images/venkata-logo.png"
                            alt="Venkata Derma"
                            className="h-16 w-auto object-contain"
                        />
                    </Link>

                    {/* Center: Navigation Links (Inline) - Hidden when search is open on mobile? */}
                    <nav className={`hidden md:flex items-center gap-6 text-sm font-medium text-gray-700 transition-opacity duration-200 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <DropdownMenu title="Brands">
                            <Link href="/shop?brand=cerave" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">CeraVe</Link>
                            <Link href="/shop?brand=cetaphil" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Cetaphil</Link>
                            <Link href="/shop?brand=bioderma" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Bioderma</Link>
                        </DropdownMenu>

                        <DropdownMenu title="Skin Care">
                            <Link href="/shop?category=cleansers" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Cleansers</Link>
                            <Link href="/shop?category=moisturizers" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Moisturizers</Link>
                            <Link href="/shop?category=sunscreens" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Sunscreens</Link>
                        </DropdownMenu>

                        <DropdownMenu title="Hair Care">
                            <Link href="/shop?category=shampoo" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Shampoos</Link>
                            <Link href="/shop?category=conditioner" className="block px-4 py-2 hover:bg-teal-50 hover:text-teal-700">Conditioners</Link>
                        </DropdownMenu>

                        <Link href="/shop?category=baby-care" className="hover:text-teal-600 transition-colors">Baby Care</Link>
                        <Link href="/shop" className="hover:text-teal-600 transition-colors">Shop All</Link>
                    </nav>

                    {/* Search Overlay - Full Cover on Mobile */}
                    <div
                        suppressHydrationWarning={true}
                        className={`absolute inset-0 bg-white z-[60] flex items-center px-4 transition-all duration-300 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                    >
                        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-3xl mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="flex-1 py-2 text-base bg-transparent focus:outline-none placeholder:text-gray-400 min-w-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                id="navbar-search-input"
                            />

                            {/* Voice Search */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                                        alert("Voice search is not supported on this browser/device. On iPhone, please use Chrome or Enable Dictation.");
                                        return;
                                    }

                                    try {
                                        // @ts-ignore
                                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                                        if (!SpeechRecognition) {
                                            alert("Voice search API not available.");
                                            return;
                                        }
                                        const recognition = new SpeechRecognition();
                                        recognition.lang = 'en-US';

                                        recognition.onstart = () => setSearchQuery("Listening...");

                                        recognition.onspeechend = () => {
                                            recognition.stop();
                                        };

                                        recognition.onresult = (event: any) => {
                                            const transcript = event.results[0][0].transcript;

                                            setSearchQuery(transcript);
                                            setIsSearchOpen(false);
                                            window.location.href = `/shop?search=${encodeURIComponent(transcript)}`;
                                        };

                                        recognition.onerror = (event: any) => {
                                            if (event.error === 'no-speech') {
                                                setSearchQuery("");
                                                return;
                                            }
                                            console.error("Voice Error:", event.error);
                                            if (event.error === 'not-allowed') {
                                                alert("Microphone access denied. Please verify browser permissions.");
                                            } else {
                                                alert("Voice search failed (" + event.error + "). Try typing instead.");
                                                setSearchQuery("");
                                            }
                                        };

                                        recognition.start();
                                    } catch (e) {
                                        console.error("Voice start error:", e);
                                        alert("Failed to start voice search service. Please reload the page.");
                                    }
                                }}
                                className="p-2 text-gray-500 hover:text-teal-600 transition-colors"
                                title="Voice Search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                            </button>

                            {/* Image Search (Label Trigger for Mobile Reliability) */}
                            <label
                                htmlFor="navbar-image-upload"
                                className="p-2 text-gray-500 hover:text-teal-600 transition-colors cursor-pointer"
                                title="Search by Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            </label>
                            <input
                                id="navbar-image-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            setSearchQuery("Analyzing image...");

                                            // 1. Attempt Client-Side OCR (Backend crashes on free tier)
                                            let text = "";
                                            try {
                                                const Tesseract = await import('tesseract.js');
                                                const result = await Tesseract.default.recognize(file, 'eng', {
                                                    logger: m => console.log(m)
                                                });
                                                text = result.data.text;
                                                console.log("OCR Result:", text);
                                            } catch (ocrErr) {
                                                console.error("Client OCR Failed:", ocrErr);
                                                // Continue to filename fallback
                                            }

                                            // 2. Process Results
                                            const cleanText = (text || "").replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
                                            const words = cleanText.split(" ").filter(w => w.length > 2);

                                            const knownBrands = ['cerave', 'cetaphil', 'bioderma', 'neutrogena', 'minimalist', 'the derma co'];
                                            const foundBrand = knownBrands.find(brand => words.some(w => w.toLowerCase().includes(brand)));

                                            let targetUrl = "";
                                            let resultingQuery = "";

                                            if (foundBrand) {
                                                // High-confidence Brand detected -> Use Brand Filter
                                                targetUrl = `/shop?brand=${encodeURIComponent(foundBrand)}`;
                                                resultingQuery = foundBrand;

                                                // Try to refine with known product types (Whitelist approach to avoid junk)
                                                const productTypes = ['cleanser', 'moisturizer', 'cream', 'lotion', 'sunscreen', 'serum', 'wash', 'gel', 'shampoo', 'conditioner', 'soap', 'oil', 'mist'];
                                                const foundType = words.find(w => productTypes.includes(w.toLowerCase()));

                                                if (foundType) {
                                                    targetUrl += `&search=${encodeURIComponent(foundType)}`;
                                                    resultingQuery += " " + foundType;
                                                }
                                            } else {
                                                // No brand? Fallback to filename or general search
                                                let query = "";
                                                if (words.length < 2) {
                                                    // Weak OCR -> Use filename
                                                    let filename = file.name.replace(/\.[^/.]+$/, "");
                                                    filename = filename.replace(/IMG|DSC|Screenshot|PXL|WA/gi, "").replace(/[-_@.]/g, " ").replace(/\b\d+\b/g, "").trim();
                                                    if (filename.length > 2) query = filename;
                                                } else {
                                                    // Use top 2 words from text
                                                    query = words.slice(0, 2).join(" ");
                                                }

                                                if (query && query.length > 1) {
                                                    targetUrl = `/shop?search=${encodeURIComponent(query)}`;
                                                    resultingQuery = query;
                                                }
                                            }

                                            if (resultingQuery) {
                                                setSearchQuery(resultingQuery); // Show text in bar
                                                setIsSearchOpen(false);
                                                window.location.href = targetUrl; // Navigate
                                            } else {
                                                alert("Could not identify product. Please ensure the image has readable text or a descriptive filename.");
                                                setSearchQuery("");
                                            }
                                        } catch (err) {
                                            console.error("Image Analysis Error:", err);
                                            alert("Image analysis failed. Please try again.");
                                            setSearchQuery('');
                                        }
                                    }
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 text-gray-500 hover:text-black shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </form>
                    </div>


                    {/* Right: Actions (Search Icon, Account, Cart) */}
                    <div className="flex items-center gap-6 shrink-0 relative z-20">
                        {/* Search Trigger */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="text-gray-700 hover:text-teal-600 transition-colors"
                        >
                            {isSearchOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            )}
                        </button>

                        {/* Admin Dashboard Link */}
                        {user && (user.role === 'admin' || user.role === 'superadmin') && (
                            <Link href="/admin" className="text-gray-700 hover:text-teal-600 transition-colors" title="Admin Dashboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><path d="m9 16 2 2 4-4" /></svg>
                            </Link>
                        )}

                        {/* Wishlist Link */}
                        <Link href="/wishlist" className="relative text-black hover:text-teal-600 transition-colors" title="Wishlist">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            {wishlistCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white font-bold">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link href="/account" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-teal-600 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <span className="hidden lg:inline text-sm">Account</span>
                                </Link>
                                <Link href="/cart" className="relative text-black hover:text-teal-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-black hover:text-teal-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                                </Link>
                                <Link href="/cart" className="relative text-black hover:text-teal-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button - Visible < md */}
                        <button
                            className="md:hidden text-gray-700 ml-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                            )}
                        </button>
                    </div>
                </div>



                {/* Mobile Menu Overlay (Standard Dropdown) */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-top-2 z-50">
                        <div className="flex flex-col p-4 space-y-6 pb-20">
                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="bg-teal-50 text-teal-700 text-center py-3 rounded-lg font-semibold text-sm hover:bg-teal-100 transition-colors border border-teal-100">
                                    Shop All
                                </Link>
                                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-50 text-gray-700 text-center py-3 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors border border-gray-200">
                                    My Account
                                </Link>
                            </div>

                            {/* Categories Breakdown */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 text-base uppercase tracking-wider text-xs border-b pb-2">
                                    Shop Categories
                                </h3>
                                <div className="space-y-1">
                                    <Link href="/shop?category=skincare" className="block py-2.5 px-2 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors font-medium flex items-center justify-between group" onClick={() => setIsMobileMenuOpen(false)}>
                                        Skin Care
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-teal-500"><path d="m9 18 6-6-6-6" /></svg>
                                    </Link>
                                    <Link href="/shop?category=haircare" className="block py-2.5 px-2 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors font-medium flex items-center justify-between group" onClick={() => setIsMobileMenuOpen(false)}>
                                        Hair Care
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-teal-500"><path d="m9 18 6-6-6-6" /></svg>
                                    </Link>
                                    <Link href="/shop?category=baby-care" className="block py-2.5 px-2 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors font-medium flex items-center justify-between group" onClick={() => setIsMobileMenuOpen(false)}>
                                        Baby Care
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-teal-500"><path d="m9 18 6-6-6-6" /></svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Brands Grid */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 text-base uppercase tracking-wider text-xs border-b pb-2">
                                    Popular Brands
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/shop?brand=cerave" className="py-2.5 px-3 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-100 rounded text-sm text-center text-gray-700 font-medium transition-all" onClick={() => setIsMobileMenuOpen(false)}>CeraVe</Link>
                                    <Link href="/shop?brand=cetaphil" className="py-2.5 px-3 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-100 rounded text-sm text-center text-gray-700 font-medium transition-all" onClick={() => setIsMobileMenuOpen(false)}>Cetaphil</Link>
                                    <Link href="/shop?brand=bioderma" className="py-2.5 px-3 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-100 rounded text-sm text-center text-gray-700 font-medium transition-all" onClick={() => setIsMobileMenuOpen(false)}>Bioderma</Link>
                                    <Link href="/shop?brand=the%20derma%20co" className="py-2.5 px-3 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-100 rounded text-sm text-center text-gray-700 font-medium transition-all" onClick={() => setIsMobileMenuOpen(false)}>Derma Co</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        </div>
    );
}

function DropdownMenu({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="flex items-center gap-1 py-3 hover:text-teal-600 transition-colors outline-none cursor-pointer">
                {title}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div className={`absolute top-full left-0 min-w-[200px] bg-white border border-gray-100 shadow-lg rounded-b-lg py-2 z-50 transition-all duration-200 origin-top transform ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 invisible'}`}>
                {children}
            </div>
        </div>
    )
}


