export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    images?: string[];
    rating: number;
    reviews: number;
    isNewArrival?: boolean;
    stockQuantity?: number;
    inStock?: boolean;
    mrp?: number;
    netContent?: string;
    brand?: string;
    variants?: {
        size: string;
        price: number;
        mrp?: number;
        stock?: number; // Optional, can default to global stock or be 0
    }[];
}

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
API_URL = API_URL.replace(/\/$/, ""); // Remove trailing slash
if (!API_URL.endsWith('/api')) {
    API_URL += '/api';
}

// Fallback data for build time or error cases (optional, but good for stability)
export const products: Product[] = [];

export async function fetchProducts(
    category?: string,
    brand?: string,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    sort?: string,
    page: number = 1,
    limit: number = 12
): Promise<{ products: Product[], pagination: any }> {
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (brand) params.append('brand', brand);
        if (search) params.append('search', search);
        if (minPrice) params.append('minPrice', minPrice.toString());
        if (maxPrice) params.append('maxPrice', maxPrice.toString());
        if (sort) params.append('sort', sort);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        // Removed the aggressive _t cache buster so that Next.js can cache similar queries
        const url = `${API_URL}/products?${params.toString()}`;

        // Enable Incremental Static Regeneration (ISR): Cache results for 60 seconds
        // This stops the frontend from waiting on the Render backend for every single user request.
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed to fetch products');

        const data = await res.json();

        // Handle backward compatibility if API returns just array (unlikely but safe)
        if (Array.isArray(data)) {
            return { products: data, pagination: { totalPages: 1, currentPage: 1 } };
        }

        return data; // { products, pagination }
    } catch (error) {
        console.error("API Error:", error);
        return { products: [], pagination: { totalPages: 1, currentPage: 1 } };
    }
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
    try {
        const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
        if (!res.ok) return undefined;
        const data = await res.json();
        return data;
    } catch (error) {
        return undefined;
    }
}
