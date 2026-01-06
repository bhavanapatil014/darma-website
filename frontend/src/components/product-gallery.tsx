"use client"
import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ product }: { product: any }) {
    // Collect all valid images: prioritize images array, then fallback to single image
    const allImages = (product.images && product.images.length > 0)
        ? product.images
        : (product.image ? [product.image] : []);

    const [activeImage, setActiveImage] = useState(allImages[0] || "");

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="w-full max-w-md mx-auto aspect-square bg-gray-50 rounded-lg overflow-hidden relative border border-gray-100 group">
                {activeImage ? (
                    <img
                        src={activeImage}
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                )}

                {product.isNewArrival && (
                    <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-widest z-10">
                        New Arrival
                    </span>
                )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {allImages.map((img: string, i: number) => (
                        <button
                            key={i}
                            onClick={() => setActiveImage(img)}
                            className={`aspect-square bg-gray-50 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${activeImage === img ? 'border-black opacity-100' : 'border-transparent hover:border-gray-200 opacity-70 hover:opacity-100'}`}
                        >
                            <img src={img} className="w-full h-full object-cover mix-blend-multiply" alt={`View ${i + 1}`} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
