"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Heart, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'

export function MobileAppNav() {
    const pathname = usePathname()
    const { items } = useCart()
    const { wishlistCount } = useWishlist()
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

    const navItems = [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'Shop', icon: ShoppingBag, href: '/shop' },
        { label: 'Wishlist', icon: Heart, href: '/wishlist', count: wishlistCount },
        { label: 'Cart', icon: ShoppingCart, href: '/cart', count: cartCount },
        { label: 'Account', icon: User, href: '/account' },
    ]

    // Hide on admin routes
    if (pathname?.startsWith('/admin')) return null

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-lg border-t border-gray-100 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <nav className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                    const Icon = item.icon
                    
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-colors",
                                isActive ? "bg-blue-50" : "bg-transparent"
                            )}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter mt-0.5">
                                {item.label}
                            </span>
                            
                            {item.count !== undefined && item.count > 0 && (
                                <span className="absolute top-1 right-1/2 translate-x-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold border-2 border-white shadow-sm animate-in zoom-in">
                                    {item.count > 9 ? '9+' : item.count}
                                </span>
                            )}

                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
