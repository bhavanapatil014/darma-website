"use client"
import { Button } from "./button";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/lib/data";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({ product }: { product: Product }) {
    const { addItem, clearCart } = useCart();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);

    // Safety check for stock
    const isOutOfStock = !product.stockQuantity || product.stockQuantity <= 0;

    const decrease = () => setQuantity(q => Math.max(1, q - 1));
    const increase = () => setQuantity(q => {
        const limit = product.stockQuantity || 999;
        return Math.min(limit, q + 1);
    });

    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        addItem(product, quantity);
        router.push('/cart');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-full">
                    <button
                        onClick={decrease}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
                    >
                        -
                    </button>
                    <span className="w-10 text-center font-medium">{quantity}</span>
                    <button
                        onClick={increase}
                        disabled={isOutOfStock || (product.stockQuantity ? quantity >= product.stockQuantity : false)}
                        className="w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
                    >
                        +
                    </button>
                </div>
                <div className="text-sm text-gray-500">
                    {isOutOfStock ? (
                        <span className="text-red-500 font-medium">Out of Stock</span>
                    ) : (
                        <span className="text-green-600 font-medium">In Stock</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    size="lg"
                    className={`w-full text-base h-12 rounded-full transition-all ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                >
                    {isOutOfStock ? "Out of Stock" : (isAdded ? "Added! ✓" : `Add to Cart`)}
                </Button>

                <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-base h-12 rounded-full border-black text-black hover:bg-black hover:text-white transition-colors"
                    onClick={() => {
                        // Pass as Query Params to NOT clear the main cart
                        const params = new URLSearchParams({
                            buyNow: "true",
                            productId: product.id,
                            quantity: quantity.toString()
                        });
                        router.push(`/checkout?${params.toString()}`);
                    }}
                    disabled={isOutOfStock}
                >
                    Buy It Now
                </Button>
            </div>
        </div>
    )
}
