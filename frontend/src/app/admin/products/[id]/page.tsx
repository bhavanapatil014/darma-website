import ProductForm from "../_components/product-form"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    const [product, categories, brands] = await Promise.all([
        fetch(`${BASE_URL}/products/${id}`, { cache: 'no-store' }).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${BASE_URL}/categories`, { cache: 'no-store' }).then(res => res.json()).catch(() => []),
        fetch(`${BASE_URL}/brands`, { cache: 'no-store' }).then(res => res.json()).catch(() => [])
    ])

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                <p className="text-gray-500">The product you are trying to edit does not exist.</p>
                <a href="/admin/products" className="mt-4 text-blue-600 hover:underline">Go back to products</a>
            </div>
        )
    }

    async function handleSuccess() {
        "use server"
        redirect('/admin/products')
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <ProductForm
                initialData={product}
                categories={categories}
                brands={brands}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
