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
}

const API_URL = 'https://darma-website.onrender.com/api';

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
        params.append('_t', Date.now().toString()); // Cache buster

        const url = `${API_URL}/products?${params.toString()}`;

        // In server components, fetch caches by default. 
        // For this dynamic backend demo, we might want no-store if data changes often.
        const res = await fetch(url, { cache: 'no-store' });
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
        return res.json();
    } catch (error) {
        return undefined;
    }
}
