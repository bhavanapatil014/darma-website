"use client"
import { useWishlist } from "@/lib/wishlist-context"
import { ProductCard } from "@/components/ui/product-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WishlistPage() {
    const { items, clearWishlist } = useWishlist()

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Wishlist ({items.length})</h1>
                {items.length > 0 && (
                    <Button variant="outline" onClick={clearWishlist} className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200">
                        Clear Wishlist
                    </Button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4 text-lg">Your wishlist is empty.</p>
                    <Button asChild>
                        <Link href="/shop">Explore Products</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map(product => (
                        <ProductCard key={product.id} product={product} isWishlist={true} />
                    ))}
                </div>
            )}
        </div>
    )
}
