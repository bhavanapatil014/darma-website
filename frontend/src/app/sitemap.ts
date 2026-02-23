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
    const baseUrl = 'https://venkata-derma.vercel.app'; // Reverted to Vercel App URL

    // 1. Static Routes
    const routes = [
        '',
        '/shop',
        '/login',
        '/register',
        '/cart',
        '/about',
        '/contact',
        '/faq',
        '/terms',
        '/privacy-policy',
        '/refund-policy',
        '/shipping-policy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
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
