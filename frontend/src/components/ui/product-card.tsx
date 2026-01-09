"use client"
import Link from "next/link"
import NegotiationBtn from "./negotiation-btn";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Product } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

interface ProductCardProps {
    product: Product;
    isWishlist?: boolean;
}

export function ProductCard({ product, isWishlist = false }: ProductCardProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    return (
        <div className="group relative bg-white transition-all duration-300 flex flex-col h-full hover:shadow-lg rounded-lg overflow-hidden border border-transparent hover:border-gray-100">
            <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] bg-gray-100 overflow-hidden">
                {/* Product Image */}
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                    {product.image || (product.images && product.images.length > 0) ? (
                        <img
                            src={product.image || product.images![0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="text-gray-400 font-medium">No Image</div>
                    )}
                </div>

                {/* Badges */}
                {product.isNewArrival && (
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-sm z-10">
                        New
                    </span>
                )}

                {/* Rating Pill - Bottom Left of Image */}
                {product.rating > 0 && (
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-sm text-[10px] font-semibold flex items-center gap-1 shadow-sm z-10">
                        <span>{product.rating.toFixed(1)}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-teal-500">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{product.reviews || 0}</span>
                    </div>
                )}

                {/* No Hover Overlay for Add to Cart anymore */}

                {/* Wishlist Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isWishlist || isInWishlist(product.id)) {
                            removeFromWishlist(product.id);
                        } else {
                            addToWishlist(product);
                        }
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-20 ${(isWishlist || isInWishlist(product.id))
                        ? "text-red-500 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    {isWishlist || isInWishlist(product.id) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    )}
                </button>
            </Link>

            <div className="p-3 pt-4 flex flex-col flex-1">
                <Link href={`/product/${product.id}`} className="block">
                    {/* Brand/Title */}
                    <h3 className="font-bold text-gray-900 text-[15px] mb-0.5 truncate leading-tight">
                        {product.name}
                    </h3>
                    {/* Description - Lighter/Smaller */}
                    <p className="text-xs text-gray-500 truncate mb-2">
                        {product.description}
                    </p>
                    {/* Price Row */}
                    {/* Price Row - One Line Standard Format */}
                    <div className="flex items-baseline gap-1.5 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="font-bold text-sm text-gray-900">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                            <>
                                <span className="text-xs text-gray-400 line-through decoration-gray-400">₹{product.mrp}</span>
                                <span className="text-[10px] font-bold text-orange-500 truncate">
                                    ({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)
                                </span>
                            </>
                        )}
                    </div>
                </Link>

                {/* Add to Cart - Always Visible */}
                <div className="mt-auto flex gap-2">
                    <NegotiationBtn product={product} />
                    <button
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="flex-1 shadow-sm font-bold uppercase tracking-wide text-xs h-9 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!product.stockQuantity || product.stockQuantity <= 0}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (product.stockQuantity && product.stockQuantity > 0) {
                                addItem(product);
                                if (isWishlist) {
                                    removeFromWishlist(product.id);
                                }
                                router.push('/cart');
                            }
                        }}
                    >
                        {(!product.stockQuantity || product.stockQuantity <= 0) ? "Out of Stock" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}
