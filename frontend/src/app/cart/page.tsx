"use client"

import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Heart, ChevronRight } from "lucide-react"

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
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false) // Myntra-Modal state
    const router = useRouter()

    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

    useEffect(() => {
        refreshCart();

        // Fetch coupons
        fetch('https://darma-website.onrender.com/api/coupons')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableCoupons(data);
            })
            .catch(err => console.error("Failed to fetch coupons", err));

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
                    <Link href="/shop" className="w-full sm:w-auto mt-4 inline-block">
                        <button
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="w-full sm:w-auto px-8 py-3 rounded-md font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                        >
                            Start Shopping
                        </button>
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
                            <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border shadow-sm relative">
                                {/* Delete Button (Absolute for Mobile) */}
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 sm:hidden"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                <div className="flex gap-4">
                                    <div className="h-24 w-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                                        )}
                                    </div>

                                    <div className="flex-1 sm:hidden">
                                        {/* Mobile Title View */}
                                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                            <Link href={`/product/${item.id}`}>{item.name}</Link>
                                        </h3>
                                        <p className="text-xs text-gray-500 capitalize mb-2">{item.category}</p>
                                        <div className="font-bold text-lg">₹{((displayPrice || 0) * (item.quantity || 1)).toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between sm:ml-0">
                                    <div className="hidden sm:flex justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg hover:underline line-clamp-2">
                                                <Link href={`/product/${item.id}`}>{item.name}</Link>
                                            </h3>
                                            <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                            {isEligible && (
                                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                    Coupon Applied
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            {/* Reference Price */}
                                            {((item.mrp || originalPrice || 0)) > (displayPrice || 0) && (
                                                <div className="text-sm text-gray-400 line-through">
                                                    ₹{((item.mrp || originalPrice || 0) * (item.quantity || 1)).toFixed(2)}
                                                </div>
                                            )}

                                            {/* Final Price */}
                                            <div className="font-bold text-lg">₹{((displayPrice || 0) * (item.quantity || 1)).toFixed(2)}</div>

                                            {/* Unit */}
                                            <div className="text-xs text-gray-500">
                                                (₹{(displayPrice || 0).toFixed(2)} /unit)
                                            </div>

                                            {/* Savings */}
                                            {((item.mrp || originalPrice || 0) > (displayPrice || 0)) && (
                                                <div className="text-xs text-green-600 font-bold mt-1">
                                                    Save ₹{(((item.mrp || originalPrice || item.price || 0) - (displayPrice || 0)) * (item.quantity || 1)).toFixed(2)}
                                                    <span className="block text-[10px] font-normal">(MRP+Coupon)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Coupon Badge */}
                                    <div className="sm:hidden mb-2">
                                        {isEligible && (
                                            <span className="inline-block text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                Coupon Applied
                                            </span>
                                        )}
                                        {/* Mobile Savings */}
                                        {((item.mrp || originalPrice || 0) > (displayPrice || 0)) && (
                                            <div className="text-xs text-green-600 font-bold mt-1">
                                                Save ₹{(((item.mrp || originalPrice || item.price || 0) - (displayPrice || 0)) * (item.quantity || 1)).toFixed(2)} (Total)
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-2 sm:mt-4">
                                        <div className="flex flex-col items-start gap-1">
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
                                                    className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => {
                                                        const max = item.stockQuantity ? Math.min(item.stockQuantity, 10) : 10;
                                                        if (item.quantity < max) {
                                                            updateQuantity(item.id, item.quantity + 1);
                                                        }
                                                    }}
                                                    disabled={item.quantity >= (item.stockQuantity ? Math.min(item.stockQuantity, 10) : 10)}
                                                    title={item.quantity >= (item.stockQuantity ? Math.min(item.stockQuantity, 10) : 10) ? `Max quantity reached` : "Add"}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {item.quantity >= (item.stockQuantity ? Math.min(item.stockQuantity, 10) : 10) && (
                                                <span className="text-[10px] text-red-500 font-medium">
                                                    Max {Math.min(item.stockQuantity || 10, 10)} allowed
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
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
                                <span className="font-medium">₹{(subtotal || 0).toFixed(2)}</span>
                            </div>

                            {coupon && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({coupon.code})</span>
                                    <span>-₹{(coupon?.discountAmount || 0).toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{(total || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Coupon Trigger Row (Myntra Style) */}
                        <div className="mb-6">
                            {coupon ? (
                                <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex justify-between items-center group cursor-pointer hover:shadow-sm" onClick={() => setIsCouponModalOpen(true)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10v10H7zM7 3L3 7v10a4 4 0 004 4h10a4 4 0 004-4V7l-4-4H7z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">'{coupon.code}' applied</p>
                                            <p className="text-xs text-green-600">-₹{(coupon?.discountAmount || 0).toFixed(2)} savings</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCoupon(); }}
                                            className="text-xs font-bold text-red-500 uppercase hover:underline p-2"
                                        >
                                            Remove
                                        </button>
                                        <ChevronRight className="w-4 h-4 text-green-700 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCouponModalOpen(true)}
                                    className="w-full bg-white border border-dashed border-gray-300 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 hover:border-gray-400 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-gray-800">Apply Coupon</p>
                                            <p className="text-xs text-green-600 font-medium">{availableCoupons.length > 0 ? `${availableCoupons.length} offers available` : 'Check offers'}</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            )}
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

            {/* Myntra-Style Coupon Modal */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-end sm:justify-center sm:items-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCouponModalOpen(false)}></div>

                    {/* Content */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full h-[80vh] sm:h-auto sm:max-h-[85vh] sm:w-[450px] bg-white sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-gray-900">Apply Coupon</h3>
                            <button onClick={() => setIsCouponModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-gray-50 border-b">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Coupon Code"
                                    className="flex-1 px-3 py-2 border rounded-md uppercase text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-md disabled:opacity-50 hover:bg-black"
                                    disabled={!couponCode || isApplying}
                                    onClick={() => {
                                        handleApplyCoupon();
                                        // Close modal on success logic handled in separate effect or here if filtered
                                        setIsCouponModalOpen(false);
                                    }}
                                >
                                    CHECK
                                </button>
                            </div>
                            {couponError && <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>}
                        </div>

                        {/* Coupon List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Offers</p>

                            {availableCoupons.filter(c => !c.expirationDate || new Date(c.expirationDate) > new Date()).length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-sm">No coupons available right now.</p>
                                </div>
                            ) : (
                                availableCoupons
                                    .filter(c => !c.expirationDate || new Date(c.expirationDate) > new Date())
                                    .map(c => {
                                        // 1. Check Min Order
                                        const minAmount = c.minOrderAmount || c.minPurchaseAmount || 0;
                                        const currentSubtotal = subtotal || 0;
                                        const meetsMinOrder = currentSubtotal >= minAmount;
                                        const amountNeeded = Math.max(0, minAmount - currentSubtotal);

                                        // 2. Check Product/Category Constraints
                                        const appProds = (c.applicableProducts || []).map((id: any) => String(id).trim());
                                        const appCats = (c.applicableCategories || []).map((cat: any) => String(cat).trim().toLowerCase());
                                        const hasConstraints = appProds.length > 0 || appCats.length > 0;

                                        let meetsConstraints = true;
                                        if (hasConstraints) {
                                            meetsConstraints = items.some(item => {
                                                const iId = String(item.id).trim();
                                                const iMongo = String((item as any)._id || "").trim();
                                                const iCat = String(item.category || "").trim().toLowerCase();
                                                return appProds.includes(iId) || appProds.includes(iMongo) || appCats.includes(iCat);
                                            });
                                        }

                                        const isEligible = meetsMinOrder && meetsConstraints;

                                        const savings = c.discountType === 'percentage'
                                            ? (currentSubtotal * (c.value || 0) / 100)
                                            : (c.value || 0);

                                        return (
                                            <div key={c._id} className={`bg-white border rounded-lg p-4 shadow-sm relative overflow-hidden ${isEligible ? 'border-gray-200' : 'border-gray-100'}`}>
                                                {/* Left color bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400"></div>

                                                <div className={`flex justify-between items-start pl-3 ${!isEligible ? 'opacity-60 blur-[0.5px] select-none' : ''}`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-gray-800 border border-gray-300 border-dashed px-2 py-0.5 rounded bg-gray-50 text-sm tracking-wide">{c.code}</span>
                                                        </div>
                                                        <p className="font-bold text-green-600 text-sm">Save ₹{(savings || 0).toFixed(0)}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description || (hasConstraints ? "Specific items only" : "Applicable on all items.")}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2">
                                                            Min. purchase: ₹{c.minPurchaseAmount} • {c.expirationDate ? `Expires: ${new Date(c.expirationDate).toLocaleDateString()}` : 'No expiry'}
                                                        </p>
                                                    </div>

                                                    {isEligible && (
                                                        <button
                                                            onClick={() => {
                                                                setCouponCode(c.code);
                                                                // We must call the async apply logic
                                                                // Since handleApplyCoupon relies on state 'couponCode', we set state then call.
                                                                // But setState is async. 
                                                                // Correct pattern: Refactor handleApplyCoupon to accept code arg.
                                                                // For now, hack: setTimeout or better, just reuse the logic.
                                                                const performApply = async () => {
                                                                    setIsApplying(true);
                                                                    try {
                                                                        // Copied logic from handleApplyCoupon but with Explicit Code
                                                                        const res = await fetch('https://darma-website.onrender.com/api/coupons/verify', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ code: c.code, cartTotal: subtotal, cartItems: items })
                                                                        });
                                                                        const text = await res.text();
                                                                        const json = JSON.parse(text);
                                                                        if (res.ok && json.success) {
                                                                            removeCoupon(); // Remove previous
                                                                            applyCoupon({ ...json, code: c.code });
                                                                            setCouponCode("");
                                                                            setIsCouponModalOpen(false);
                                                                            import("sonner").then(mod => mod.toast.success(`Coupon ${c.code} Applied!`));
                                                                        } else {
                                                                            setCouponError(json.message);
                                                                        }
                                                                    } catch (err) { console.error(err) }
                                                                    setIsApplying(false);
                                                                };
                                                                performApply();
                                                            }}
                                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 uppercase px-2 py-1"
                                                        >
                                                            APPLY
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Ineligible Overlay */}
                                                {!isEligible && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                                        <div className="bg-white px-4 py-2 rounded-full shadow-md border border-orange-100 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                            <span className="text-xs font-bold text-gray-700">
                                                                {!meetsMinOrder
                                                                    ? `Add items worth ₹${amountNeeded.toFixed(0)} more`
                                                                    : `Not applicable to items in cart`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
