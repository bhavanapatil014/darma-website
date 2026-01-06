"use client"
import { useWishlist } from "@/lib/wishlist-context";
import { Product } from "@/lib/data";

export function WishlistButton({ product }: { product: Product }) {
    const { items, addToWishlist, removeFromWishlist } = useWishlist();
    const isWishlisted = items.some(item => item.id === product.id);

    const toggleWishlist = () => {
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            className={`flex items-center gap-2 transition-colors ${isWishlisted ? 'text-red-500' : 'hover:text-black'}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </button>
    );
}
