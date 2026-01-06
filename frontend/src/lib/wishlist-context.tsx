"use client"
import * as React from "react"
import { Product } from "./data"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface WishlistContextType {
    items: Product[]
    addToWishlist: (product: Product) => void
    removeFromWishlist: (productId: string) => void
    isInWishlist: (productId: string) => boolean
    clearWishlist: () => void
    wishlistCount: number
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<Product[]>([])
    const { user } = useAuth()
    const router = useRouter()

    // Helper to get storage key
    const getWishlistKey = () => user ? `darma-wishlist-${user.email}` : null;

    // Load Wishlist on User Change
    React.useEffect(() => {
        if (!user) {
            setItems([]);
            return;
        }
        const key = getWishlistKey();
        if (key) {
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch (e) {
                    setItems([]);
                }
            } else {
                setItems([]);
            }
        }
    }, [user]);

    // Save Wishlist on Change
    React.useEffect(() => {
        const key = getWishlistKey();
        if (user && key) {
            localStorage.setItem(key, JSON.stringify(items));
        }
    }, [items, user]);

    const addToWishlist = (product: Product) => {
        if (!user) {
            router.push('/login');
            return;
        }
        setItems((prev) => {
            if (prev.find(item => item.id === product.id)) return prev;
            return [...prev, product];
        });
    }

    const removeFromWishlist = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId))
    }

    const isInWishlist = (productId: string) => {
        return items.some(item => item.id === productId);
    }

    const clearWishlist = () => {
        setItems([]);
    }

    return (
        <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, wishlistCount: items.length }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = React.useContext(WishlistContext)
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider")
    }
    return context
}
