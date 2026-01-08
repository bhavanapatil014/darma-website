"use client"

import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Heart } from "lucide-react"

import { useAuth } from "@/lib/auth-context"

// Metadata cannot be exported from a "use client" component.
// Removed metadata export to fix build error.

export default function CartPage() {
    const { items, removeItem, updateQuantity, subtotal, total, coupon, applyCoupon, removeCoupon, refreshCart } = useCart()
    const { addToWishlist } = useWishlist()
    const { user } = useAuth()
    const [couponCode, setCouponCode] = useState("")
    const [couponError, setCouponError] = useState("")
    const [isApplying, setIsApplying] = useState(false)
    const router = useRouter()

    useEffect(() => {
        refreshCart();

        const onFocus = () => {
            console.log("Window focused, refreshing cart...");
            refreshCart();
        }
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError("");
        setIsApplying(true);

        try {
            const res = await fetch('https://darma-website.onrender.com/api/coupons/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, cartTotal: subtotal, cartItems: items })
            });

            const data = await res.text();
            try {
                const json = JSON.parse(data);
                if (res.ok && json.success) {
                    applyCoupon({
                        code: json.code,
                        discountAmount: json.discountAmount,
                        type: json.type,
                        value: json.value,
                        eligibleItemIds: json.eligibleItemIds
                    });
                    setCouponCode("");
                    // No success message needed, the UI update shows it
                } else {
                    setCouponError(json.message || "Invalid coupon");
                }
            } catch (e) {
                setCouponError("Server error. Please try again.");
            }
        } catch (err) {
            setCouponError("Network error. Please try again.");
        } finally {
            setIsApplying(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Your cart is empty</h1>
                    <p className="text-muted-foreground text-lg">Looks like you haven't added anything to your cart yet.</p>
                    <Link href="/shop">
                        <Button size="lg" className="w-full sm:w-auto mt-4">Start Shopping</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                {/* Cart Items List */}
                <div className="lg:col-span-8 space-y-6">
                    {items.map((item) => {
                        // Check eligibility exactly like Sidebar logic
                        const couponIds = (coupon?.eligibleItemIds || []).map(id => String(id).trim());
                        const itemId = String(item.id || "").trim();
                        const itemMongoId = String((item as any)._id || "").trim();
                        const isEligible = coupon && couponIds.length > 0 && (couponIds.includes(itemId) || couponIds.includes(itemMongoId));

                        // Calculate display prices
                        // Calculate display price
                        let displayPrice = item.price;
                        let originalPrice = null;

                        if (isEligible) {
                            if (coupon.type === 'percentage') {
                                originalPrice = item.price;
                                displayPrice = item.price - (item.price * (coupon.value / 100));
                            } else if (coupon.type === 'fixed') {
                                // Distributed fixed logic
                                const eligibleTotal = items.reduce((sum, i) => {
                                    const iId = String(i.id).trim();
                                    const iMongo = String((i as any)._id).trim();
                                    // Strict check here too
                                    const iEligible = couponIds.length > 0 && (couponIds.includes(iId) || couponIds.includes(iMongo));
                                    return iEligible ? sum + (i.price * i.quantity) : sum;
                                }, 0);

                                if (eligibleTotal > 0) {
                                    const proportion = (item.price * item.quantity) / eligibleTotal;
                                    const itemDiscountShare = coupon.value * proportion;
                                    const unitDiscount = itemDiscountShare / item.quantity;
                                    originalPrice = item.price;
                                    displayPrice = Math.max(0, item.price - unitDiscount);
                                }
                            }
                        }

                        return (
                            <div key={item.id} className="flex gap-6 p-6 bg-white rounded-lg border shadow-sm">
                                <div className="h-24 w-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg hover:underline">
                                                <Link href={`/product/${item.id}`}>{item.name}</Link>
                                            </h3>
                                            <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                            {isEligible && (
                                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                    Coupon Applied
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {/* Reference Price (MRP or Pre-Coupon) */}
                                            {((item.mrp || originalPrice || 0)) > displayPrice && (
                                                <div className="text-sm text-gray-400 line-through">
                                                    ₹{((item.mrp || originalPrice || 0) * item.quantity).toFixed(2)}
                                                </div>
                                            )}

                                            {/* Final Price */}
                                            <div className="font-bold text-lg">₹{(displayPrice * item.quantity).toFixed(2)}</div>

                                            {/* Unit Price */}
                                            {item.quantity > 1 && (
                                                <div className="text-xs text-gray-500">
                                                    (₹{displayPrice.toFixed(2)} each)
                                                </div>
                                            )}

                                            {/* Total Savings */}
                                            {((item.mrp || originalPrice || 0) > displayPrice) && (
                                                <div className="text-xs text-green-600 font-medium">
                                                    Total Savings: ₹{(((item.mrp || originalPrice || item.price) - displayPrice) * item.quantity).toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center border rounded-md">
                                        <button
                                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-1 w-8 text-center text-sm">{item.quantity}</span>
                                        <button
                                            className="px-3 py-1 hover:bg-gray-100"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                            title="Remove Item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden sm:inline">Remove</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                addToWishlist(item);
                                                removeItem(item.id);
                                            }}
                                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                            title="Move to Wishlist"
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span className="hidden sm:inline">Save for Later</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </div>
                )
                    })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
                <div className="bg-gray-50 p-6 rounded-lg border sticky top-24">
                    <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>

                        {coupon && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount ({coupon.code})</span>
                                <span>-₹{coupon.discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="border-t pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="mb-6 space-y-2">
                        {coupon ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded flex justify-between items-center">
                                <span className="text-green-700 font-medium text-sm">Applied: {coupon.code}</span>
                                <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Coupon code"
                                    className="flex-1 p-2 border rounded uppercase text-sm"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={isApplying}>
                                    {isApplying ? '...' : 'Apply'}
                                </Button>
                            </div>
                        )}
                        {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                    </div>

                    <button
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                        className="w-full py-4 text-lg font-bold rounded-md hover:opacity-90 transition-opacity"
                        onClick={() => {
                            router.push('/checkout');
                        }}>
                        Proceed to Checkout
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        Shipping and taxes calculated at checkout.
                    </p>
                </div>
            </div>
        </div>
        </div >
    )
}
