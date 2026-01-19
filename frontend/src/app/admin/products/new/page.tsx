import ProductForm from "../_components/product-form"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    const [categories, brands] = await Promise.all([
        fetch(`${BASE_URL}/categories`, { cache: 'no-store' }).then(res => res.json()).catch(() => []),
        fetch(`${BASE_URL}/brands`, { cache: 'no-store' }).then(res => res.json()).catch(() => [])
    ])

    async function handleSuccess() {
        "use server"
        redirect('/admin/products')
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <ProductForm
                categories={categories}
                brands={brands}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
