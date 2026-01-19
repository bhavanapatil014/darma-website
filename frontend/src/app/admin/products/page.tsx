"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchProducts, Product } from "@/lib/data"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [brands, setBrands] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>("");
    const [filterBrand, setFilterBrand] = useState<string>("");
    const [filterSearch, setFilterSearch] = useState<string>("");

    const [selectedProducts, setSelectedProducts] = useState<string[]>([])

    let BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://darma-website.onrender.com/api';
    BASE_URL = BASE_URL.replace(/\/$/, "");
    if (!BASE_URL.endsWith('/api')) BASE_URL += '/api';

    useEffect(() => {
        loadData()
    }, [filterCategory, filterBrand])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData()
        }, 500)
        return () => clearTimeout(timer)
    }, [filterSearch])

    async function loadData() {
        setLoading(true)
        try {
            const [productsData, categoriesData, brandsData] = await Promise.all([
                fetchProducts(
                    filterCategory || undefined,
                    filterBrand || undefined,
                    filterSearch || undefined,
                    undefined,
                    undefined,
                    undefined,
                    1,
                    1000
                ),
                fetch(`${BASE_URL}/categories`).then(res => res.json()).catch(() => []),
                fetch(`${BASE_URL}/brands`).then(res => res.json()).catch(() => [])
            ])
            setProducts(productsData.products)
            setCategories(categoriesData)
            setBrands(brandsData)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this product?")) return
        try {
            await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' })
            setProducts(products.filter(p => p.id !== id))
        } catch (error) {
            console.error(error)
            alert("Failed to delete")
        }
    }

    async function handleBulkDelete() {
        if (!confirm(`Delete ${selectedProducts.length} products?`)) return
        try {
            await Promise.all(selectedProducts.map(id => fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' })))
            setSelectedProducts([])
            loadData()
        } catch (error) {
            console.error(error)
            alert("Bulk delete failed")
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your inventory, prices, and variants.</p>
                </div>
                <div className="flex gap-2">
                    {selectedProducts.length > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete}>
                            Delete Selected ({selectedProducts.length})
                        </Button>
                    )}
                    <Link href="/admin/products/new">
                        <Button className="bg-sky-600 hover:bg-sky-700 shadow-md">
                            + Add New Product
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="col-span-2 lg:col-span-2">
                    <input
                        className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                        placeholder="Search products..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                    />
                </div>
                <select
                    className="p-2.5 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat: any) => (
                        <option key={cat._id || cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>
                <select
                    className="p-2.5 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                >
                    <option value="">All Brands</option>
                    {brands.map((b: any) => (
                        <option key={b._id || b.name} value={b.name}>{b.name}</option>
                    ))}
                </select>
                <Button variant="outline" className="lg:hidden" onClick={loadData}>Refresh</Button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-4 px-4 w-10"></th>
                                <th className="py-4 px-4 font-semibold text-gray-600 text-sm">Product</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 text-sm">Variants & Price</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 text-sm">Stock</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 text-sm">Category</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-gray-400">Loading products...</td>
                                </tr>
                            ) : products.map(product => (
                                <tr key={product.id} className="group hover:bg-sky-50/30 transition-colors">
                                    <td className="py-4 px-4 align-top">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                        />
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <div className="flex gap-4">
                                            <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                                                )}
                                                {product.images && product.images.length > 1 && (
                                                    <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-tl-md">
                                                        +{product.images.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800 line-clamp-1">{product.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description?.substring(0, 50)}...</div>
                                                {product.brand && (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 mt-1">
                                                        {product.brand}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        {product.variants && product.variants.length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {product.variants.slice(0, 3).map((v, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium text-gray-900 bg-gray-100 px-1.5 rounded text-xs min-w-[3rem] text-center">{v.size}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="font-semibold text-green-700">₹{v.price}</span>
                                                    </div>
                                                ))}
                                                {product.variants.length > 3 && (
                                                    <span className="text-xs text-gray-400 pl-1">+{product.variants.length - 3} more...</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="font-bold text-green-700 text-lg">₹{product.price}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        {/* Stock Column: Show Variant Stock if available */}
                                        {product.variants && product.variants.length > 0 ? (
                                            <div className="space-y-1">
                                                {product.variants.slice(0, 3).map((v, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-500 w-10">{v.size}:</span>
                                                        <span className={`font-bold ${(v.stock || 0) > 0 ? 'text-gray-700' : 'text-red-500'}`}>
                                                            {v.stock || 0}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${(product.stockQuantity || 0) > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.stockQuantity || 0} in stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 align-top capitalize">
                                        <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded text-xs border border-gray-100">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 align-top text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/products/${product.id}`);
                                                }}
                                                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(product.id);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-20">
                                        <div className="text-gray-400 mb-2 text-4xl">🔍</div>
                                        <p className="text-gray-500 font-medium">No products found</p>
                                        <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
