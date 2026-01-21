"use client"
import * as React from "react"
import { Product } from "./data"
import { useAuth } from "@/lib/auth-context"

export interface CartItem extends Product {
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (product: Product, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    subtotal: number
    total: number
    coupon: { code: string, discountAmount: number, type: 'percentage' | 'fixed', value: number, eligibleItemIds: string[] } | null
    applyCoupon: (couponData: { code: string, discountAmount: number, type: 'percentage' | 'fixed', value: number, eligibleItemIds: string[] }) => void
    removeCoupon: () => void
    refreshCart: () => Promise<void>
}

const CartContext = React.createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    // ... items and open state
    const [items, setItems] = React.useState<CartItem[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const { user } = useAuth(); // Assuming useAuth is exported from auth-context
    const getCartKey = () => user ? `darma-cart-${user.email}` : 'darma-cart-guest';

    // Flag to prevent saving empty/stale state to server before initial fetch
    const [isInitialized, setIsInitialized] = React.useState(false);

    // ... Load and Save useEffects for Items (unchanged)
    // Load Cart (Server Sync)
    React.useEffect(() => {
        if (!user) {
            // Guest: Load from local storage specific to guest
            const saved = localStorage.getItem('darma-cart-guest');
            if (saved) {
                try { setItems(JSON.parse(saved)); } catch (e) { setItems([]); }
            } else { items.length > 0 && setItems([]); } // Clear if switching from user to guest
            setIsInitialized(true); // Treat guest as initialized immediately
            return;
        }

        // When user logs in, mark as not initialized until we fetch
        setIsInitialized(false);

        const syncServerCart = async () => {
            try {
                const token = localStorage.getItem('token');
                // 1. Fetch Server Cart
                const res = await fetch('https://darma-website.onrender.com/api/user/cart', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const serverCart = await res.json();

                    // 2. Check for Guest Items to Merge (from immediate context or local)
                    // Because this effect runs when 'user' changes (e.g. login), 'items' might still hold guest items
                    // BUT 'items' usually gets cleared or reset. 
                    // Best strategy: check the 'guest' local storage directly.
                    const guestStr = localStorage.getItem('darma-cart-guest');
                    let guestItems: CartItem[] = [];
                    if (guestStr) {
                        try { guestItems = JSON.parse(guestStr); } catch (e) { }
                    }

                    if (guestItems.length > 0) {
                        // Merge Logic
                        const merged = [...serverCart];
                        guestItems.forEach(gItem => {
                            const existing = merged.find(sItem => sItem.id === gItem.id);
                            if (existing) {
                                // Update quantity (limit to stock if needed, but simple add for now)
                                existing.quantity += gItem.quantity;
                            } else {
                                merged.push(gItem);
                            }
                        });

                        setItems(merged);

                        // Clear guest cart
                        localStorage.removeItem('darma-cart-guest');

                        // Push merged to server immediately
                        await fetch('https://darma-website.onrender.com/api/user/cart', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ items: merged })
                        });
                    } else {
                        setItems(serverCart);
                    }
                }
            } catch (err) {
                console.error("Cart sync error", err);
            } finally {
                setIsInitialized(true);
            }
        };

        syncServerCart();

    }, [user]);

    // Save Cart (Local + Server)
    React.useEffect(() => {
        // 1. Save Local
        const key = user ? `darma-cart-${user.email}` : 'darma-cart-guest';
        localStorage.setItem(key, JSON.stringify(items));

        // 2. Save Server (Debounce could be good, but direct for now)
        if (user && isInitialized) {
            const token = localStorage.getItem('token');
            // We ignore errors here to prevent blocking UI, maybe retry?
            // Use simple fire-and-forget for UX speed, but ideally use queue.
            fetch('https://darma-website.onrender.com/api/user/cart', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items })
            }).catch(e => console.error("Failed to save cart to server", e));
        }
    }, [items, user, isInitialized]);

    // ... addItem, removeItem, updateQuantity logic (unchanged)

    const addItem = (product: Product, quantity: number = 1) => {
        setItems((prev) => {
            // Check if exact item (same ID, implying same variant) exists
            const existing = prev.find((item) => item.id === product.id)
            const stockLimit = product.stockQuantity || 999;

            if (existing) {
                return prev.map((item) => {
                    if (item.id === product.id) {
                        const newQuantity = Math.min(stockLimit, item.quantity + quantity);
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
            }
            // If not found (different ID = different variant or product), add as new
            return [...prev, { ...product, quantity: Math.min(stockLimit, quantity) }]
        })
        // setIsOpen(true)
    }

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId)
            return
        }
        setItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => setItems([])


    // Coupon State
    const [coupon, setCoupon] = React.useState<{ code: string, discountAmount: number, type: 'percentage' | 'fixed', value: number, eligibleItemIds: string[] } | null>(null);

    // Reset Coupon
    // Reset or Revalidate Coupon when items change
    React.useEffect(() => {
        if (items.length === 0) {
            if (coupon) setCoupon(null);
            return;
        }

        // Debounce to prevent too many calls if user is clicking +/- fast
        // For simplicity in this context, we can just do it. But ideally a small timeout.
        // Let's do a direct re-verification if coupon exists.

        if (coupon) {
            const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            fetch(`https://darma-website.onrender.com/api/coupons/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: coupon.code, cartTotal: currentSubtotal, cartItems: items })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Update discount amount in case it changed (e.g. percentage of new total)
                        setCoupon(prev => prev ? { ...prev, discountAmount: data.discountAmount, eligibleItemIds: data.eligibleItemIds } : null);
                    } else {
                        // Coupon no longer valid (min order not met, or eligible items removed)
                        setCoupon(null);
                        // Optional: alert user or show toast?
                        console.log("Coupon removed due to cart changes:", data.message);
                    }
                })
                .catch(err => {
                    console.error("Re-validation failed", err);
                    // On server error, maybe keep it or safe remove? Safer to remove if we aren't sure.
                    // setCoupon(null); 
                });
        }
    }, [items]);

    // ... (previous coupon check useEffect)

    // New Function: Refresh Cart Data from Server
    const refreshCart = async () => {
        if (items.length === 0) return;

        try {
            const updatedItems = await Promise.all(items.map(async (item) => {
                try {
                    // Handle Variant IDs (format: productId-size)
                    const isVariant = item.id.includes('-');
                    const realProductId = isVariant ? item.id.split('-')[0] : item.id;
                    const variantSize = isVariant ? item.id.split('-').slice(1).join('-') : null;

                    // Add timestamp to force bypass browser cache + Next.js cache option
                    const res = await fetch(`https://darma-website.onrender.com/api/products/${realProductId}?t=${Date.now()}`, {
                        cache: 'no-store',
                        headers: { 'Pragma': 'no-cache' }
                    });

                    if (res.ok) {
                        const productData = await res.json();

                        // If it's a variant, find the updated variant data
                        if (isVariant && variantSize && productData.variants) {
                            const variant = productData.variants.find((v: any) => v.size === variantSize);
                            if (variant) {
                                return {
                                    ...item,
                                    price: variant.price,
                                    mrp: variant.mrp,
                                    // image: productData.image, // Usually images are same, or could look up variant image if supported
                                    // name: `${productData.name} (${variant.size})`, // Ensure name is consistent
                                    stockQuantity: variant.stock // Update variant specific stock if available
                                };
                            }
                        }

                        // Default / Non-variant update
                        return {
                            ...item,
                            price: productData.price,
                            mrp: productData.mrp,
                            image: productData.image,
                            name: productData.name,
                            stockQuantity: productData.stockQuantity
                        };
                    }
                    return item; // Keep old if fetch fails (fallback)
                } catch (e) {
                    return item;
                }
            }));

            // Check if anything actually changed to avoid loop/render thrashing
            const hasChanges = JSON.stringify(updatedItems) !== JSON.stringify(items);
            if (hasChanges) {
                setItems(updatedItems);
                console.log("Cart refreshed with latest server data");
            }
        } catch (err) {
            console.error("Failed to refresh cart:", err);
        }
    };

    const applyCoupon = (couponData: { code: string, discountAmount: number, type: 'percentage' | 'fixed', value: number, eligibleItemIds: string[] }) => {
        setCoupon(couponData);
    }

    const removeCoupon = () => {
        setCoupon(null);
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Recalculate total with discount
    // Ensure discount doesn't make total negative

    // NOTE: discountAmount comes from backend now, which is safer.
    const total = Math.max(0, subtotal - (coupon?.discountAmount || 0));

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                isOpen,
                setIsOpen,
                subtotal,
                total,
                coupon,
                applyCoupon,
                removeCoupon,
                refreshCart
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = React.useContext(CartContext)
    if (context === undefined) {
        // console.error("useCart error: Context undefined. Make sure CartProvider is in the tree.");
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
