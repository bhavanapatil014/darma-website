
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://venkata-derma.vercel.app'; // Reverted to Vercel App URL
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
