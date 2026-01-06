"use client"
import { useEffect } from "react";

export function UseViewTracker({ productId }: { productId: string }) {
    useEffect(() => {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        // Add to front, remove duplicates, keep max 10
        const newViewed = [productId, ...viewed.filter((id: string) => id !== productId)].slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(newViewed));
    }, [productId]);

    return null; // Logic only component
}
