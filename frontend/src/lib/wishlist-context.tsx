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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const res = await fetch(`${apiUrl}/api/user/wishlist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });


                if (res.status === 401) {
                    localStorage.removeItem('token');
                    return;
                }

                if (res.ok) {
                    const serverWishlist = await res.json();
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            fetch(`${apiUrl}/api/user/wishlist`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items })
            })
                .then(res => {
                    if (res.status === 401) {
                        localStorage.removeItem('token');
                    }
                })
                .catch(e => console.error("Failed to save wishlist", e));
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
