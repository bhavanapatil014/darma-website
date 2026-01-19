import { MetadataRoute } from 'next'

// Fetch all products to generate dynamic routes
async function getProducts() {
    try {
        // In production, use the real URL. During build, this might fail if the backend isn't up, 
        // so we handle errors gracefully.
        const res = await fetch('https://darma-website.onrender.com/api/products?limit=1000', {
            next: { revalidate: 3600 } // Revalidate every hour
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.products || []);
    } catch (error) {
        console.error("Sitemap generation error:", error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://venkataderma.com'; // Replace with actual domain when available or use Render URL

    // 1. Static Routes
    const routes = [
        '',
        '/shop',
        '/login',
        '/register',
        '/cart',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }))

    // 2. Dynamic Product Routes
    const products = await getProducts();
    const productRoutes = products.map((product: any) => ({
        url: `${baseUrl}/shop/${product.id}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...productRoutes]
}
