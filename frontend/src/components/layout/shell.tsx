"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { CartSidebar } from "@/components/ui/cart-sidebar"
import { ChatWidget } from "@/components/chat-widget"
import { MobileAppNav } from "@/components/layout/mobile-app-nav"

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Check if we are in admin section
    const isAdmin = pathname?.startsWith('/admin')

    // If admin, render just the children (which will have their own AdminLayout)
    // We strip the global Navbar, Footer, and the top padding.
    if (isAdmin) {
        return <>{children}</>
    }

    // Default Shop Layout
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <CartSidebar />
            <main className="flex-1 pt-32 pb-24 md:pb-0 transition-all">
                {children}
            </main>
            <Footer />
            <ChatWidget />
            <MobileAppNav />
        </div>
    )
}
