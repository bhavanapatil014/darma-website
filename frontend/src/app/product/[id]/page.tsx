import { fetchProductById } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/ui/add-to-cart-button";
import { ProductDetails } from "@/components/product-info";
import { ProductReviews } from "@/components/product-reviews";
import { ShareButton } from "@/components/share-button";
import { WishlistButton } from "@/components/wishlist-button";
import { RecentlyViewed } from "@/components/recently-viewed";
import { UseViewTracker } from "@/components/view-tracker";
import { ProductGallery } from "@/components/product-gallery";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TrustBadges } from "@/components/ui/trust-badges";
import NegotiationChat from "@/components/negotiation-chat";

export const dynamic = 'force-dynamic';

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

            <div className="container mx-auto px-4 py-6">
                <div> {/* Wrapper to isolate breadcrumb nav */}
                    <Breadcrumb items={[
                        { label: "Shop", href: "/shop" },
                        ...(product.category ? [{ label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/shop?category=${product.category}` }] : []),
                        { label: product.name }
                    ]} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    {/* Left Column - Gallery */}
                    <div className="lg:col-span-7">
                        <ProductGallery product={product} />
                    </div>

                    {/* Right Column - Info */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-24 space-y-8">
                            {/* Header */}
                            <ProductDetails product={product} />
                            <div className="space-y-6 pt-4">
                                <NegotiationChat product={product} />

                                <div className="flex items-center justify-center gap-8 text-sm text-gray-500 pt-4">
                                    {/* <WishlistButton product={product} /> Moved to ProductDetails for variant handling */}
                                    <ShareButton title={product.name} text={product.description} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Trust Badges Banner */}
                <div className="mt-12 mb-12">
                    <TrustBadges />
                </div>

                {/* Sections */}
                <div id="reviews" className="mt-12 max-w-5xl mx-auto">
                    <ProductReviews productId={product.id} />
                </div>

                <div className="mt-24 mb-12">
                    <RecentlyViewed currentProductId={product.id} />
                </div>
            </div>
        </div>
    );
}
