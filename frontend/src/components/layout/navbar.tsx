"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/wishlist-context';

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { setIsOpen, items } = useCart();
    const { user } = useAuth();
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

    return (
        <div className="flex flex-col w-full z-50 fixed top-0">
            {/* Top Bar - Marketing/Contact (Blue Background) */}
            <div className="bg-blue-600 text-white text-xs py-2 px-4 transition-colors">
                <div className="container mx-auto flex justify-between items-center overflow-hidden">
                    {/* Simple scrolling text effect or static repeated text */}
                    <div className="flex gap-12 animate-marquee whitespace-nowrap font-medium tracking-wide w-full justify-center">
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
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-teal-800 flex items-center gap-2 shrink-0 mr-8">
                        <span className="text-2xl font-serif text-teal-800 tracking-wide uppercase">New Balaji Gandhi</span>
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

                    {/* Search Overlay (Absolute Centered/Leftish) */}
                    <div className={`absolute left-0 right-0 mx-auto w-full max-w-2xl transition-all duration-300 ${isSearchOpen ? 'opacity-100 visible top-1/2 -translate-y-1/2 z-10' : 'opacity-0 invisible top-0 -z-10'}`}>
                        <form onSubmit={handleSearch} className="container px-4">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full py-3 px-6 text-base border-b-2 border-teal-500 bg-white focus:outline-none placeholder:text-gray-400 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                                ref={(input) => { if (input && isSearchOpen) input.focus(); }}
                            />
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
                        <Link href="/wishlist" className="relative text-gray-700 hover:text-teal-600 transition-colors" title="Wishlist">
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
                                <Link href="/cart" className="relative text-gray-700 hover:text-teal-600 transition-colors">
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
                                <Link href="/login" className="text-gray-700 hover:text-teal-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                                </Link>
                                <Link href="/cart" className="relative text-gray-700 hover:text-teal-600 transition-colors">
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

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-4">
                            <div className="font-semibold text-gray-900 border-b pb-2">Brands</div>
                            <Link href="/shop?brand=cerave" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>CeraVe</Link>
                            <Link href="/shop?brand=cetaphil" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Cetaphil</Link>
                            <Link href="/shop?brand=bioderma" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Bioderma</Link>

                            <div className="font-semibold text-gray-900 border-b pb-2 pt-2">Skincare</div>
                            <Link href="/shop?category=cleansers" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Cleansers</Link>
                            <Link href="/shop?category=moisturizers" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Moisturizers</Link>
                            <Link href="/shop?category=sunscreens" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Sunscreens</Link>

                            <div className="font-semibold text-gray-900 border-b pb-2 pt-2">Hair Care</div>
                            <Link href="/shop?category=shampoo" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Shampoos</Link>
                            <Link href="/shop?category=conditioner" className="block pl-4 text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>Conditioners</Link>

                            <div className="border-t pt-2">
                                <Link href="/shop?category=baby-care" className="block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Baby Care</Link>
                                <Link href="/shop" className="block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Shop All Products</Link>
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
