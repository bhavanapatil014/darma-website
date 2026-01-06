"use client"
import * as React from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function CartSidebar() {
    const { isOpen, setIsOpen, items, removeItem, updateQuantity, total, subtotal, coupon, applyCoupon, removeCoupon } = useCart()

    async function handleApplyCoupon(code: string) {
        if (!code) return;
        try {
            const res = await fetch('http://localhost:4000/api/coupons/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, cartTotal: subtotal, cartItems: items })
            })
            // Safe Parsing
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse coupon response:", text);
                alert("Server returned an invalid response. Please check console.");
                return;
            }

            if (res.ok) {
                applyCoupon({
                    code: data.code,
                    discountAmount: data.discountAmount,
                    type: data.type,
                    value: data.value,
                    eligibleItemIds: data.eligibleItemIds || []
                })
            } else {
                alert(data.message || 'Failed to apply coupon')
            }
        } catch (error) {
            console.error("Error applying coupon:", error)
            alert("Failed to apply coupon. Please try again.")
        }
    }

    return (
        <>
            <div className={cn(
                "fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-lg transform transition-transform ease-in-out duration-300 z-50 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Your Cart</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                            <p>Your cart is empty.</p>
                            <Button variant="link" onClick={() => setIsOpen(false)}>
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => {
                            // Check if item is eligible for current coupon discount
                            const couponIds = (coupon?.eligibleItemIds || []).map(id => String(id).trim());
                            const itemId = String(item.id || "").trim();
                            const itemMongoId = String((item as any)._id || "").trim();

                            // Strict check: Item MUST be in the eligible list
                            const isEligible = coupon && couponIds.length > 0 && (
                                couponIds.includes(itemId) ||
                                couponIds.includes(itemMongoId)
                            );

                            // Calculate display price
                            let displayPrice = item.price;
                            let originalPrice = null;

                            if (isEligible) {
                                if (coupon.type === 'percentage') {
                                    originalPrice = item.price;
                                    displayPrice = item.price * (100 - coupon.value) / 100;
                                } else if (coupon.type === 'fixed') {
                                    // Distribute fixed discount proportionally
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
                                <div key={item.id} className="flex gap-4">
                                    <Link href={`/product/${item.id}`} onClick={() => setIsOpen(false)} className="h-24 w-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No Img</span>
                                        )}
                                    </Link>
                                    <div className="flex-1">
                                        <Link href={`/product/${item.id}`} onClick={() => setIsOpen(false)}>
                                            <h3 className="font-medium text-sm hover:underline hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
                                        </Link>
                                        <p className="text-sm text-muted-foreground mb-1">{item.category}</p>
                                        {isEligible && (
                                            <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium mb-2">
                                                Coupon Applied
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center border rounded-md">
                                                <button
                                                    className="px-2 py-1 text-sm hover:bg-gray-100"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >-</button>
                                                <span className="px-2 text-sm">{item.quantity}</span>
                                                <button
                                                    className="px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => {
                                                        const limit = item.stockQuantity || 999;
                                                        if (item.quantity < limit) {
                                                            updateQuantity(item.id, item.quantity + 1);
                                                        }
                                                    }}
                                                    disabled={item.quantity >= (item.stockQuantity || 999)}
                                                >+</button>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="font-bold text-base">₹{(displayPrice * item.quantity).toFixed(2)}</span>
                                                {originalPrice && (
                                                    <>
                                                        <span className="text-[10px] text-green-600 font-medium">
                                                            Coupon Discount: -₹{((item.price - displayPrice) * item.quantity).toFixed(0)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            MRP: ₹{(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 h-fit"
                                    >
                                        <span className="sr-only">Remove</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t p-4 space-y-4">
                        <div className="space-y-4">
                            {/* Coupon Section */}
                            {!coupon ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm uppercase"
                                        onKeyDown={(e) => {
                                            // @ts-ignore
                                            if (e.key === 'Enter') handleApplyCoupon(e.target.value)
                                        }}
                                        id="coupon-input"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            // @ts-ignore
                                            const val = document.getElementById('coupon-input')?.value;
                                            if (val) handleApplyCoupon(val);
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-green-50 text-green-700 p-2 rounded text-sm flex justify-between items-center border border-green-200">
                                    <span>
                                        Applied: <strong>{coupon.code}</strong>
                                    </span>
                                    <button onClick={removeCoupon} className="text-xs hover:underline text-red-500">Remove</button>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {coupon && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>-₹{coupon.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full text-lg h-12" asChild onClick={() => setIsOpen(false)}>
                            <Link href="/checkout">Checkout</Link>
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}
