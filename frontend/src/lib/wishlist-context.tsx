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

    // Load Wishlist (Server Sync)
    React.useEffect(() => {
        if (!user) {
            setItems([]);
            return;
        }

        const syncServerWishlist = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://darma-website.onrender.com/api/user/wishlist', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const serverWishlist = await res.json();

                    // Check local guest wishlist (if you want to support guest wishlist persisting)
                    // Currently getWishlistKey returned null for guest, meaning guest wishlist wasn't strictly supported in previous code
                    // (previous code: if(!user) setItems([]); return;)
                    // So we can assume no guest merging needed for wishlist based on previous logic.
                    // Just set server wishlist.
                    setItems(serverWishlist);
                }
            } catch (e) {
                console.error("Wishlist sync error", e);
            }
        };
        syncServerWishlist();
    }, [user]);

    // Save Wishlist
    React.useEffect(() => {
        if (user) {
            const key = getWishlistKey(); // returns darma-wishlist-email
            if (key) localStorage.setItem(key, JSON.stringify(items));

            const token = localStorage.getItem('token');
            fetch('https://darma-website.onrender.com/api/user/wishlist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items })
            }).catch(e => console.error("Failed to save wishlist", e));
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
