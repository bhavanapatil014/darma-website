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

    // ... Load and Save useEffects for Items (unchanged)
    React.useEffect(() => {
        if (!user) {
            setItems([]); // Clear cart to start with if guest (or reset on logout)
            return;
        }

        const key = getCartKey();
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart", e);
                setItems([]);
            }
        } else {
            setItems([]);
        }
    }, [user]);

    React.useEffect(() => {
        if (user) {
            const key = getCartKey();
            localStorage.setItem(key, JSON.stringify(items));
        }
    }, [items, user]);

    // ... addItem, removeItem, updateQuantity logic (unchanged)

    const addItem = (product: Product, quantity: number = 1) => {
        setItems((prev) => {
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

            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/coupons/verify`, {
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
                    // Add timestamp to force bypass browser cache + Next.js cache option
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products/${item.id}?t=${Date.now()}`, {
                        cache: 'no-store',
                        headers: { 'Pragma': 'no-cache' }
                    });
                    if (res.ok) {
                        const productData = await res.json();
                        // Preserve quantity, update details
                        return {
                            ...item,
                            price: productData.price,
                            mrp: productData.mrp,
                            image: productData.image, // In case image updated
                            name: productData.name,   // In case name updated
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
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
