"use client"

import { useState, useEffect } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function AdminSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [settings, setSettings] = useState({ siteName: 'DARMA', logoUrl: '' })

    useEffect(() => {
        fetch('https://darma-website.onrender.com/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error("Failed to load settings", err))
    }, [])

    const links = [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/orders", label: "Orders" },
        { href: "/admin/coupons", label: "Coupons" },
        { href: "/admin/settings", label: "Settings" },
    ]

    if (user?.role === "superadmin") {
        links.push({ href: "/admin/users", label: "Users" })
    }

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
            <div className="mb-8 flex items-center gap-3">
                {settings.logoUrl && !settings.logoUrl.includes('placeholder') ? (
                    <img
                        src={settings.logoUrl.startsWith('http') ? settings.logoUrl : settings.logoUrl}
                        alt="Logo"
                        className="h-8 w-8 object-contain rounded-sm bg-white/10 p-1"
                    />
                ) : null}
                <div>
                    <Link href="/" className="text-xl font-bold tracking-tighter block leading-none hover:text-primary transition-colors">
                        {settings.siteName || 'DARMA'}.
                    </Link>
                    <div className="text-xs text-gray-400 mt-1">Admin Panel</div>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 rounded-md transition-colors ${pathname === link.href
                            ? "bg-white text-gray-900 font-medium"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="pt-4 border-t border-gray-800">
                <div className="text-sm font-medium mb-1 truncate">{user?.name}</div>
                <div className="text-xs text-gray-400 mb-4 truncate" title={user?.email}>{user?.email}</div>
                <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 rounded-md text-red-400 hover:bg-red-900/20 transition-colors text-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    Sign Out
                </button>
            </div>
        </div>
    )
}
