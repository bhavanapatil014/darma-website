import { fetchProductById } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/ui/add-to-cart-button";
import { ProductReviews } from "@/components/product-reviews";
import { ShareButton } from "@/components/share-button";
import { WishlistButton } from "@/components/wishlist-button";
import { RecentlyViewed } from "@/components/recently-viewed";
import { UseViewTracker } from "@/components/view-tracker";
import { ProductGallery } from "@/components/product-gallery";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import NegotiationChat from "@/components/negotiation-chat";

type Params = Promise<{ id: string }>

export default async function ProductPage(props: {
    params: Params
}) {
    const params = await props.params
    const product = await fetchProductById(params.id);

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            <UseViewTracker productId={product.id} />

            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 py-6">
                <Breadcrumb items={[
                    { label: "Shop", href: "/shop" },
                    ...(product.category ? [{ label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/shop?category=${product.category}` }] : []),
                    { label: product.name }
                ]} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    {/* Left Column - Gallery */}
                    <div className="lg:col-span-7">
                        <ProductGallery product={product} />
                    </div>

                    {/* Right Column - Info */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-24 space-y-8">
                            {/* Header */}
                            <div className="space-y-4 border-b border-gray-100 pb-8">
                                <Link
                                    href={`/shop?category=${product.category?.toLowerCase()}`}
                                    className="text-sm font-medium text-gray-500 uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    {product.category || 'Uncategorized'}
                                </Link>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                                    {product.name}
                                </h1>

                                <div className="space-y-2"> {/* Price Block */}
                                    {(product.mrp && product.mrp > product.price) ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[#2A9D8F] uppercase tracking-wide">Special Price</span>
                                        </div>
                                    ) : null}
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</p>
                                        {product.mrp && product.mrp > product.price && (
                                            <>
                                                <p className="text-lg text-gray-500 line-through mb-1">₹{product.mrp.toFixed(2)}</p>
                                                <p className="text-lg font-bold text-red-500 mb-1">
                                                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>

                                    {product.netContent && (
                                        <p className="text-sm font-medium text-gray-700 mt-2">
                                            Net content: <span className="font-bold">{product.netContent}</span>
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

                            {/* Description */}
                            <div className="prose prose-sm text-gray-600 leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-6 pt-4">
                                <AddToCartButton product={product} />
                                <NegotiationChat product={product} />

                                <div className="flex items-center justify-center gap-8 text-sm text-gray-500 pt-4">
                                    <WishlistButton product={product} />
                                    <ShareButton title={product.name} text={product.description} />
                                </div>
                            </div>

                            {/* Features Accordion Style */}
                            <div className="border-t border-gray-100 pt-8 space-y-4">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900">Free Shipping & Returns</span>
                                        <span className="text-xs">On all orders over ₹999</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900">100% Authentic</span>
                                        <span className="text-xs">Guaranteed original products</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div id="reviews" className="mt-24 max-w-5xl mx-auto">
                    <ProductReviews productId={product.id} />
                </div>

                <div className="mt-24 mb-12">
                    <RecentlyViewed currentProductId={product.id} />
                </div>
            </div>
        </div>
    );
}
