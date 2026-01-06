"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchProducts, Product } from "@/lib/data"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    // Removed single imageFile, added imageFiles (FileList usually, but we'll use Array<File>)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "", category: "skincare", price: 0, description: "", image: "", images: [], stockQuantity: 0, isNewArrival: false
    })
    const [discountPercent, setDiscountPercent] = useState<number>(0); // Local state for calculator
    const [isEditing, setIsEditing] = useState<string | null>(null)

    const [filterCategory, setFilterCategory] = useState<string>("");
    const [filterBrand, setFilterBrand] = useState<string>("");
    const [filterSearch, setFilterSearch] = useState<string>("");

    useEffect(() => {
        loadData()
    }, [filterCategory, filterBrand]) // Reload when dropdowns change

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            loadData()
        }, 500)
        return () => clearTimeout(timer)
    }, [filterSearch])

    async function loadData() {
        setLoading(true)
        const [productsData, categoriesData] = await Promise.all([
            // Pass filters: category, brand, search, min, max, sort, page, limit
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
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/categories`).then(res => res.json()).catch(() => [])
        ])
        setProducts(productsData.products)
        setCategories(categoriesData)
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            let uploadedImageUrls: string[] = formData.images || []

            // Handle New Uploads
            if (imageFiles.length > 0) {
                const uploadData = new FormData()
                imageFiles.forEach(file => {
                    uploadData.append('images', file)
                })

                console.log("Uploading multiple to /api/products/upload-multiple...");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products/upload-multiple`, {
                    method: 'POST',
                    body: uploadData
                })

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`Image upload failed: ${res.status} ${errText}`);
                }

                const { imageUrls } = await res.json()
                // Append new images to existing ones (if any)
                uploadedImageUrls = [...uploadedImageUrls, ...imageUrls]
            }

            // Primary image logic: if explicitly set use it, otherwise use first from array
            const primaryImage = (uploadedImageUrls.length > 0) ? uploadedImageUrls[0] : (formData.image || "")

            const productData = {
                ...formData,
                image: primaryImage,
                images: uploadedImageUrls
            }
            console.log("Submitting Product Data:", productData);

            const url = isEditing
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products/${isEditing}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products`

            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            })

            if (res.ok) {
                alert(isEditing ? "Product updated!" : "Product created!")
                resetForm()
                loadData()
            }
        } catch (error) {
            console.error(error)
            alert("Failed to save product")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products/${id}`, { method: 'DELETE' })
            loadData()
        } catch (error) {
            console.error(error)
        }
    }

    function handleEdit(product: Product) {
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description,
            image: product.image,
            images: product.images || (product.image ? [product.image] : []),
            stockQuantity: product.stockQuantity || 0,
            isNewArrival: product.isNewArrival,
            mrp: product.mrp,
            netContent: product.netContent,
            brand: (product as any).brand
        })

        // Calculate existing discount % if applicable
        if (product.mrp && product.mrp > product.price) {
            setDiscountPercent(Math.round(((product.mrp - product.price) / product.mrp) * 100));
        } else {
            setDiscountPercent(0);
        }

        setImageFiles([]) // Clear file input
        setIsEditing(product.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function resetForm() {
        setFormData({
            name: "", category: "skincare", price: 0, description: "",
            image: "", images: [], stockQuantity: 0, isNewArrival: false,
            mrp: undefined, netContent: "", brand: ""
        })
        setDiscountPercent(0);
        setImageFiles([])
        setIsEditing(null)
    }

    const [selectedProducts, setSelectedProducts] = useState<string[]>([])

    // Bulk Actions
    async function handleBulkDelete() {
        if (!confirm(`Delete ${selectedProducts.length} products?`)) return
        try {
            await Promise.all(selectedProducts.map(id => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/products/${id}`, { method: 'DELETE' })))
            setSelectedProducts([])
            loadData()
        } catch (error) {
            console.error(error)
            alert("Bulk delete failed")
        }
    }

    function toggleSelect(id: string) {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
    }

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Convert FileList to Array
            setImageFiles(Array.from(e.target.files))
        }
    }

    if (loading) return <div className="p-8">Loading Products...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Product Management</h1>
                    {selectedProducts.length > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete}>
                            Delete Selected ({selectedProducts.length})
                        </Button>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full p-2 border rounded"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="p-2 border rounded w-[150px]"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <optgroup label="Standard">
                                <option value="skincare">Skincare</option>
                                <option value="hair-care">Hair Care</option>
                                <option value="baby-care">Baby Care</option>
                                <option value="treatments">Treatments</option>
                                <option value="bundles">Bundles</option>
                            </optgroup>
                            <optgroup label="Custom">
                                {categories.map((cat: any) => (
                                    <option key={cat._id || cat.slug} value={cat.slug}>{cat.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <input
                            list="filter-brands"
                            placeholder="Filter Brand"
                            className="p-2 border rounded w-[150px]"
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                        />
                        <datalist id="filter-brands">
                            {["CeraVe", "Cetaphil", "The Ordinary", "Bioderma", "Neutrogena", "La Roche-Posay"].map((b) => (
                                <option key={b} value={b} />
                            ))}
                        </datalist>
                    </div>
                    <Button variant="outline" onClick={() => {
                        setFilterCategory("");
                        setFilterBrand("");
                        setFilterSearch("");
                    }}>Clear</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input className="w-full p-2 border rounded" required
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Price</label>
                                <input type="number" className="w-full p-2 border rounded" required
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Stock</label>
                                <input type="number" className="w-full p-2 border rounded"
                                    value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">MRP <span className="text-xs text-gray-500">(Original)</span></label>
                                <input type="number" className="w-full p-2 border rounded"
                                    placeholder="749"
                                    value={formData.mrp || ''}
                                    onChange={e => {
                                        const newMrp = Number(e.target.value);
                                        // Auto-update price if discount is set
                                        if (discountPercent > 0) {
                                            const newPrice = Math.round(newMrp - (newMrp * discountPercent / 100));
                                            setFormData({ ...formData, mrp: newMrp, price: newPrice });
                                        } else {
                                            setFormData({ ...formData, mrp: newMrp });
                                        }
                                    }} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Discount %</label>
                                <input type="number" className="w-full p-2 border rounded border-blue-200 bg-blue-50"
                                    placeholder="e.g. 20"
                                    value={discountPercent || ''}
                                    onChange={e => {
                                        const newDist = Number(e.target.value);
                                        setDiscountPercent(newDist);
                                        if (formData.mrp) {
                                            const newPrice = Math.round(formData.mrp - (formData.mrp * newDist / 100));
                                            setFormData(prev => ({ ...prev, price: newPrice }));
                                        }
                                    }} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Net Content</label>
                                <input type="text" className="w-full p-2 border rounded"
                                    placeholder="80ml"
                                    value={formData.netContent || ''} onChange={e => setFormData({ ...formData, netContent: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isNewArrival" className="h-4 w-4"
                                checked={formData.isNewArrival || false}
                                onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })} />
                            <label htmlFor="isNewArrival" className="text-sm font-medium">Mark as New Arrival</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select className="w-full p-2 border rounded" required
                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select Category</option>
                                <optgroup label="Standard">
                                    <option value="skincare">Skincare</option>
                                    <option value="hair-care">Hair Care</option>
                                    <option value="baby-care">Baby Care</option>
                                    <option value="treatments">Treatments</option>
                                    <option value="bundles">Bundles</option>
                                </optgroup>
                                <optgroup label="Custom">
                                    {categories.map((cat: any) => (
                                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Brand</label>
                            <input
                                list="brand-suggestions"
                                className="w-full p-2 border rounded"
                                placeholder="Select or Type Brand"
                                value={formData.brand || ''}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            />
                            <datalist id="brand-suggestions">
                                <option value="CeraVe" />
                                <option value="Cetaphil" />
                                <option value="Bioderma" />
                                <option value="Neutrogena" />
                                <option value="La Roche-Posay" />
                                <option value="The Ordinary" />
                                <option value="Aveeno" />
                                <option value="Minimalist" />
                                <option value="Sebamed" />
                            </datalist>
                        </div>

                        {/* Multiple Image Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Images (Select Multiple)</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="w-full p-2 border rounded"
                                onChange={handleFileChange}
                            />

                            {/* Preview Selected Files */}
                            {imageFiles.length > 0 && (
                                <div className="mt-2 text-xs text-blue-600">
                                    {imageFiles.length} files selected to upload.
                                </div>
                            )}

                            {/* Show Existing Images if Editing */}
                            {formData.images && formData.images.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square border rounded overflow-hidden group">
                                            <img src={img} className="w-full h-full object-cover" alt="preview" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = formData.images?.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, images: newImages });
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea className="w-full p-2 border rounded" required
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">{isEditing ? 'Update' : 'Create'}</Button>
                            {isEditing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <h2 className="text-xl font-semibold mb-4">Inventory ({products.length})</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-2 w-10"></th>
                                <th className="pb-2">Image</th>
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Price</th>
                                <th className="pb-2">Stock</th>
                                <th className="pb-2">Category</th>
                                <th className="pb-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 px-2">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                        />
                                    </td>
                                    <td className="py-3">
                                        {/* Show First Image or Default */}
                                        {product.image ? (
                                            <div className="relative h-10 w-10">
                                                <img
                                                    src={product.image.startsWith('http') ? product.image : product.image}
                                                    alt={product.name}
                                                    className="h-10 w-10 object-cover rounded bg-gray-100"
                                                />
                                                {product.images && product.images.length > 1 && (
                                                    <span className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] px-1 rounded-full">
                                                        +{product.images.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No</div>
                                        )}
                                    </td>
                                    <td className="py-3 font-medium">{product.name}</td>
                                    <td className="py-3">₹{product.price}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${(product.stockQuantity || 0) > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.stockQuantity || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 capitalize">{product.category}</td>
                                    <td className="py-3 flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
