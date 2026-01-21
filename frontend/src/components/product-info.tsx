"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { Product } from "@/lib/data"
import { ShoppingCart, Check } from "lucide-react"

export function ProductDetails({ product }: { product: Product }) {
    const { addItem } = useCart()
    const router = useRouter()
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // unifiedVariants: Combine explicit variants with the base product (if it has a size)
    // This ensures "30ml" (Base) shows up alongside "100ml" (Variant)
    const allVariants = (product.variants && product.variants.length > 0)
        ? [
            ...(product.netContent && !product.variants.some(v => v.size === product.netContent)
                ? [{
                    size: product.netContent,
                    price: product.price,
                    mrp: product.mrp,
                    stock: product.stockQuantity
                }]
                : []),
            ...product.variants
        ]
        : [];

    // Initialize with first available variant from our unified list
    const [selectedVariant, setSelectedVariant] = useState(
        (allVariants.length > 0)
            ? (allVariants.find(v => (v.stock || 0) > 0) || allVariants[0])
            : null
    )

    // Sync state with prop changes
    useEffect(() => {
        const variants = (product.variants && product.variants.length > 0)
            ? [
                ...(product.netContent && !product.variants.some(v => v.size === product.netContent)
                    ? [{
                        size: product.netContent,
                        price: product.price,
                        mrp: product.mrp,
                        stock: product.stockQuantity
                    }]
                    : []),
                ...product.variants
            ]
            : [];

        if (variants.length > 0) {
            setSelectedVariant(variants.find(v => (v.stock || 0) > 0) || variants[0]);
        } else {
            setSelectedVariant(null);
        }
    }, [product]);

    const [quantity, setQuantity] = useState(1);

    // Current Price Logic
    // If we have a selected variant object (which might be the base 'virtual' variant), use it.
    // Otherwise fallback to base product.
    const currentPrice = selectedVariant ? selectedVariant.price : product.price
    const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp
    const currentSize = selectedVariant ? selectedVariant.size : product.netContent
    const currentStock = selectedVariant ? selectedVariant.stock : product.stockQuantity

    return (
        <div className="space-y-8">
            {/* Header / Price Block */}
            <div className="space-y-4 border-b border-gray-100 pb-8">
                <div className="flex gap-2 text-sm font-medium text-gray-500 uppercase tracking-widest">
                    <span>{product.category || 'Uncategorized'}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                    {product.name}
                </h1>

                <div className="space-y-2">
                    {(currentMrp && currentMrp > currentPrice) ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#2A9D8F] uppercase tracking-wide">Special Price</span>
                        </div>
                    ) : null}
                    <div className="flex items-end gap-3">
                        {currentMrp && currentMrp > currentPrice && (
                            <p className="text-lg text-gray-500 line-through mb-1">₹{currentMrp.toFixed(2)}</p>
                        )}
                        <p className="text-3xl font-bold text-gray-900">₹{currentPrice.toFixed(2)}</p>
                        {currentMrp && currentMrp > currentPrice && (
                            <p className="text-lg font-bold text-red-500 mb-1">
                                {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% off
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>

                    {(currentSize) && (
                        <p className="text-sm font-medium text-gray-700 mt-2">
                            Net content: <span className="font-bold">{currentSize}</span>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="flex text-yellow-500 text-sm">
                            {"★".repeat(Math.round(product.rating))}
                            <span className="text-gray-200">{"★".repeat(5 - Math.round(product.rating))}</span>
                        </div>
                        <a href="#reviews" className="text-sm text-gray-500 underline hover:text-black offset-4">
                            Read {product.reviews} reviews
                        </a>
                    </div>
                </div>
            </div>

            {/* Variant Selector (if variants exist) */}
            {allVariants.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Pack Size</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {allVariants.map((v, idx) => {
                            const isSelected = selectedVariant && selectedVariant.size === v.size;
                            const isOutOfStock = (v.stock || 0) <= 0;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (!isOutOfStock) {
                                            setSelectedVariant(v);
                                            setQuantity(1);
                                        }
                                    }}
                                    disabled={isOutOfStock}
                                    className={`
                                        group relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 h-full
                                        ${isSelected
                                            ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                                        }
                                        ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                                    `}
                                >
                                    {/* Size Header */}
                                    <span className={`text-sm font-bold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {v.size}
                                    </span>
                                    {/* Show count only if actual explicit variants exist, otherwise it's just '1' size */}
                                    <span className="text-xs text-gray-500 mb-2">(Pack of 1)</span>

                                    {/* Price Section */}
                                    <div className="mt-auto flex flex-col items-start w-full">
                                        <div className="flex flex-wrap items-baseline gap-x-1.5 w-full">
                                            {v.mrp && v.mrp > v.price && (
                                                <span className="text-xs text-gray-400 line-through">₹{v.mrp}</span>
                                            )}
                                            <span className="font-bold text-gray-900">₹{v.price}</span>
                                        </div>
                                        {/* Unit Price Simulation */}
                                        {v.size && v.size.toLowerCase().includes('ml') && (
                                            <span className="text-[10px] text-gray-500 mt-0.5 w-full break-words leading-tight">
                                                (₹{(v.price / parseInt(v.size)).toFixed(2)}/ml)
                                            </span>
                                        )}
                                    </div>

                                    {/* Selection Checkmark */}
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 p-1.5">
                                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {isOutOfStock && (
                                        <span className="absolute -top-2 -right-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 shadow-sm">
                                            Sold Out
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}


            {/* Description */}
            <div className="prose prose-sm text-gray-600 leading-relaxed">
                <p>{product.description}</p>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-6">
                {/* Quantity & Stock Row */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center border border-gray-300 rounded-lg h-11 bg-white">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className="w-12 h-full flex items-center justify-center text-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                        >
                            -
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">{quantity}</span>
                        <button
                            onClick={() => {
                                setQuantity(Math.min((currentStock || 0), quantity + 1));
                            }}
                            disabled={quantity >= (currentStock || 0)}
                            className="w-12 h-full flex items-center justify-center text-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                        >
                            +
                        </button>
                    </div>

                    {/* Stock Status */}
                    {(currentStock || 0) > 0 ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                            In Stock
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            Out of Stock
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                        size="lg"
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="w-full h-12 text-base font-semibold rounded-full shadow-sm hover:shadow transition-all"
                        disabled={(currentStock || 0) <= 0}
                        onClick={() => {
                            addItem({
                                ...product,
                                price: currentPrice,
                                name: selectedVariant ? `${product.name} (${selectedVariant.size})` : product.name,
                                id: selectedVariant ? `${product.id}-${selectedVariant.size}` : product.id
                            }, quantity)
                            setShowSuccessModal(true);
                        }}
                    >
                        Add to Cart
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-12 text-base font-semibold border-gray-300 text-gray-900 hover:bg-gray-50 hover:text-black rounded-full"
                        disabled={(currentStock || 0) <= 0}
                        onClick={() => {
                            // Direct Buy Now Flow (Avoids mixing with Cart)
                            const baseId = product.id;
                            const size = selectedVariant ? selectedVariant.size : null;
                            const qty = quantity;

                            let url = `/checkout?buyNow=true&productId=${baseId}&quantity=${qty}`;
                            if (size) {
                                url += `&variantSize=${encodeURIComponent(size)}`;
                            }
                            router.push(url);
                        }}
                    >
                        Buy It Now
                    </Button>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Added to Cart!</h3>
                                <p className="text-gray-500 mt-1 text-sm">
                                    <span className="font-semibold text-gray-800">{quantity}x</span> {product.name} {selectedVariant ? `(${selectedVariant.size})` : ''}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mt-6">
                                <Button
                                    onClick={() => router.push('/cart')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                                >
                                    View Cart & Checkout
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full border-gray-200 hover:bg-gray-50 h-11"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
