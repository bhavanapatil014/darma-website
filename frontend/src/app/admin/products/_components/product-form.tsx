"use client"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Product } from "@/lib/data"
import { useRouter } from "next/navigation"

interface ProductFormProps {
    initialData?: Product | null
    categories: any[]
    brands: any[]
    // Callback to refresh data or redirect after save
    onSuccess?: () => void
}

export default function ProductForm({ initialData, categories: initialCategories, brands: initialBrands, onSuccess }: ProductFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>(initialCategories)
    const [brands, setBrands] = useState<any[]>(initialBrands)
    const [loading, setLoading] = useState(false)
    const [imageFiles, setImageFiles] = useState<File[]>([])

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "", category: "skincare", price: 0, description: "", image: "", images: [], stockQuantity: 0, isNewArrival: false, variants: []
    })
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [variantInput, setVariantInput] = useState({ size: '', price: '', mrp: '', discount: '', stock: '' });
    const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

    // Inline Creation State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // Initialize form with data if provided
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                mrp: initialData.mrp,
                netContent: initialData.netContent,
                brand: (initialData as any).brand,
                variants: (initialData as any).variants ? [...(initialData as any).variants] : []
            })

            // Calculate existing discount % if applicable
            if (initialData.mrp && initialData.mrp > initialData.price) {
                setDiscountPercent(Math.round(((initialData.mrp - initialData.price) / initialData.mrp) * 100));
            } else {
                setDiscountPercent(0);
            }
        }
    }, [initialData])

    // Update local categories/brands if props change (unlikely but good practice)
    useEffect(() => { setCategories(initialCategories) }, [initialCategories])
    useEffect(() => { setBrands(initialBrands) }, [initialBrands])


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            let uploadedImageUrls: string[] = formData.images || []

            // Handle New Uploads
            if (imageFiles.length > 0) {
                const uploadData = new FormData()
                imageFiles.forEach(file => {
                    uploadData.append('images', file)
                })

                const res = await fetch(`${BASE_URL}/products/upload-multiple`, {
                    method: 'POST',
                    body: uploadData
                })

                if (!res.ok) throw new Error("Image upload failed");

                const { imageUrls } = await res.json()
                uploadedImageUrls = [...uploadedImageUrls, ...imageUrls]
            }

            // Primary image logic
            const primaryImage = (uploadedImageUrls.length > 0) ? uploadedImageUrls[0] : (formData.image || "")

            // Unsaved variant check
            if (variantInput.size && variantInput.price) {
                if (!confirm(`You have unsaved details in the "Add New Variant" box (${variantInput.size}). \n\nDo you want to discard them and save the product anyway?`)) {
                    setLoading(false)
                    return;
                }
            }

            const payload = {
                ...formData,
                image: primaryImage,
                images: uploadedImageUrls,
                brand: formData.brand || "Generic", // Default brand
                // Ensure numeric values
                price: Number(formData.price),
                stockQuantity: Number(formData.stockQuantity),
                mrp: formData.mrp ? Number(formData.mrp) : undefined,
                variants: formData.variants?.map(v => ({
                    ...v,
                    price: Number(v.price),
                    stock: Number(v.stock),
                    mrp: v.mrp ? Number(v.mrp) : undefined
                }))
            }

            const method = initialData ? 'PUT' : 'POST'
            const url = initialData ? `${BASE_URL}/products/${initialData.id}` : `${BASE_URL}/products`

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert(initialData ? "Product updated successfully!" : "Product created successfully!")
                if (onSuccess) onSuccess();
            } else {
                const err = await res.json()
                alert(`Error: ${err.message || 'Failed to save product'}`)
            }

        } catch (error) {
            console.error(error)
            alert("An error occurred while saving.")
        } finally {
            setLoading(false)
        }
    }

    async function saveNewCategory() {
        if (!newCategoryName) return;
        const slug = newCategoryName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

        try {
            const res = await fetch(`${BASE_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName, slug })
            });
            if (res.ok) {
                const newCat = await res.json();
                setCategories([...categories, newCat]);
                setFormData({ ...formData, category: newCat.slug });
                setIsAddingCategory(false);
                setNewCategoryName("");
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function saveNewBrand() {
        if (!newBrandName) return;
        try {
            const res = await fetch(`${BASE_URL}/brands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBrandName })
            });
            if (res.ok) {
                const newBrand = await res.json();
                setBrands([...brands, newBrand]);
                setFormData({ ...formData, brand: newBrand.name });
                setIsAddingBrand(false);
                setNewBrandName("");
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(Array.from(e.target.files))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Product' : 'Create New Product'}</h1>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Product Name</label>
                    <input className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Snail Mucin Essence"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">MRP (Original)</label>
                        <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg"
                            placeholder="1200"
                            value={formData.mrp || ''}
                            onChange={e => {
                                const newMrp = Number(e.target.value);
                                const currentDiscount = discountPercent;
                                let newPrice = formData.price;

                                if (currentDiscount > 0 && newMrp > 0) {
                                    newPrice = Math.round(newMrp - (newMrp * currentDiscount / 100));
                                }
                                setFormData(prev => ({ ...prev, mrp: newMrp, price: newPrice }));
                            }} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">Discount %</label>
                        <div className="relative">
                            <input type="number" className="w-full p-2.5 border border-blue-200 bg-blue-50/50 rounded-lg text-blue-700 font-medium"
                                placeholder="0"
                                value={discountPercent || ''}
                                onChange={e => {
                                    const newDist = Number(e.target.value);
                                    setDiscountPercent(newDist);
                                    if (formData.mrp) {
                                        const newPrice = Math.round(formData.mrp - (formData.mrp * newDist / 100));
                                        setFormData(prev => ({ ...prev, price: newPrice }));
                                    }
                                }} />
                            <span className="absolute right-3 top-2.5 text-blue-400 text-sm">%</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Selling Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-green-600 font-bold">₹</span>
                        <input type="number" className="w-full pl-8 p-2.5 border border-green-200 bg-green-50/30 rounded-lg font-bold text-green-800"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Stock Quantity (Base)</label>
                    <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg"
                        required
                        value={formData.stockQuantity}
                        onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    />
                </div>
            </div>

            {/* Variants Section - Improved UI */}
            <div className="border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm overflow-hidden mt-6">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Size Variants</h3>
                        <p className="text-xs text-gray-500">add multiple sizes with different prices</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                        {formData.variants?.length || 0} Added
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    {/* Variants List */}
                    <div className="grid gap-3">
                        {formData.variants?.map((v, idx) => (
                            <div
                                key={idx}
                                className={`
                                    relative flex flex-wrap sm:flex-nowrap items-center gap-6 p-4 rounded-xl border transition-all
                                    ${editingVariantIndex === idx
                                        ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400 shadow-md transform scale-[1.01]'
                                        : 'bg-white border-gray-200 hover:border-sky-200 hover:shadow-md'
                                    }
                                `}
                            >
                                {/* Size */}
                                <div className="w-24 shrink-0">
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Size</div>
                                    <div className="font-bold text-gray-800 text-base">{v.size}</div>
                                </div>

                                {/* Price info */}
                                <div className="w-32 shrink-0">
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Price</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-green-700 text-lg">₹{v.price}</span>
                                        {v.mrp && <span className="text-gray-400 line-through text-xs">₹{v.mrp}</span>}
                                    </div>
                                </div>

                                {/* Stock */}
                                <div className="w-20 shrink-0">
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Stock</div>
                                    <div className={`font-bold text-sm bg-gray-100 px-2 py-0.5 rounded inline-block ${v.stock ? 'text-gray-700' : 'text-red-500'}`}>
                                        {v.stock || 0}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 ml-auto border-l pl-6 border-gray-100">
                                    {editingVariantIndex === idx ? (
                                        <span className="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1.5 rounded-full animate-pulse">
                                            Editing Now
                                        </span>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 font-medium"
                                            onClick={() => {
                                                setVariantInput({
                                                    size: v.size,
                                                    price: v.price.toString(),
                                                    mrp: v.mrp ? v.mrp.toString() : '',
                                                    discount: (v.mrp && v.price) ? Math.round(((v.mrp - v.price) / v.mrp) * 100).toString() : '',
                                                    stock: v.stock ? v.stock.toString() : ''
                                                });
                                                setEditingVariantIndex(idx);
                                                // Scroll form into view
                                                const formEl = document.getElementById('variant-form');
                                                if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    )}

                                    <button
                                        type="button"
                                        className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        onClick={() => {
                                            if (confirm('Remove this variant?')) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.filter((_, i) => i !== idx)
                                                }));
                                                if (editingVariantIndex === idx) {
                                                    setEditingVariantIndex(null);
                                                    setVariantInput({ size: '', price: '', mrp: '', discount: '', stock: '' });
                                                }
                                            }
                                        }}
                                        title="Remove Variant"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}

                        {(!formData.variants || formData.variants.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-white text-center">
                                <div className="text-gray-300 mb-3 text-4xl">📦</div>
                                <p className="text-gray-500 font-medium">No size variants added yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Add sizes like 50ml, 100ml below.</p>
                            </div>
                        )}
                    </div>

                    {/* Editor Form */}
                    <div id="variant-form" className={`
                        mt-8 rounded-xl border transition-all duration-300 overflow-hidden
                        ${editingVariantIndex !== null
                            ? 'bg-sky-50/40 border-sky-200 ring-1 ring-sky-100 shadow-lg'
                            : 'bg-white border-gray-200 shadow-sm'
                        }
                    `}>
                        <div className={`px-6 py-4 border-b flex justify-between items-center ${editingVariantIndex !== null ? 'bg-sky-100/50 border-sky-200' : 'bg-gray-50 border-gray-100'}`}>
                            <h4 className={`font-bold flex items-center gap-2 ${editingVariantIndex !== null ? 'text-sky-800' : 'text-gray-700'}`}>
                                {editingVariantIndex !== null ? (
                                    <>✏️ Edit Variant #{editingVariantIndex + 1}</>
                                ) : (
                                    <>＋ Add New Variant</>
                                )}
                            </h4>

                            {editingVariantIndex !== null && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-gray-500 hover:text-gray-800 bg-white/50 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm"
                                    onClick={() => {
                                        setEditingVariantIndex(null);
                                        setVariantInput({ size: '', price: '', mrp: '', discount: '', stock: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>

                        <div className="p-6 grid grid-cols-12 gap-x-6 gap-y-6">
                            {/* Row 1: Size & Stock */}
                            <div className="col-span-12 md:col-span-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Size Name *</label>
                                <input
                                    placeholder="e.g. 250ml"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-width shadow-sm"
                                    value={variantInput.size}
                                    onChange={e => setVariantInput({ ...variantInput, size: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                />
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Stock</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-width shadow-sm"
                                    value={variantInput.stock}
                                    onChange={e => setVariantInput({ ...variantInput, stock: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                />
                            </div>

                            <div className="col-span-12"><hr className="border-gray-100" /></div>

                            {/* Row 2/3: Pricing Logic */}
                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">MRP <span className="text-[10px] font-normal text-gray-400 normal-case">(Optional)</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-width shadow-sm"
                                        value={variantInput.mrp}
                                        onChange={e => {
                                            const newMrp = Number(e.target.value);
                                            const discount = Number(variantInput.discount);
                                            let newPrice = Number(variantInput.price);

                                            if (discount > 0 && newMrp > 0) {
                                                newPrice = Math.round(newMrp - (newMrp * discount / 100));
                                            } else if (!variantInput.price && newMrp > 0) {
                                                newPrice = newMrp;
                                            }

                                            setVariantInput({
                                                ...variantInput,
                                                mrp: e.target.value,
                                                price: newPrice ? newPrice.toString() : variantInput.price
                                            });
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                    />
                                </div>
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Discount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 text-sm border border-blue-200 bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-width text-blue-700 font-bold shadow-sm"
                                        value={variantInput.discount}
                                        onChange={e => {
                                            const newDiscount = Number(e.target.value);
                                            const mrp = Number(variantInput.mrp);
                                            let newPrice = Number(variantInput.price);

                                            if (mrp > 0) {
                                                newPrice = Math.round(mrp - (mrp * newDiscount / 100));
                                            }

                                            setVariantInput({
                                                ...variantInput,
                                                discount: e.target.value,
                                                price: newPrice ? newPrice.toString() : variantInput.price
                                            });
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                    />
                                    <span className="absolute right-3 top-2.5 text-blue-400 text-xs font-bold">% OFF</span>
                                </div>
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Final Price *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-green-600 font-bold text-sm">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full pl-7 pr-3 py-2.5 text-lg border border-green-300 bg-green-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-width font-bold text-green-800 shadow-sm"
                                        value={variantInput.price}
                                        onChange={e => setVariantInput({ ...variantInput, price: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="col-span-12 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    size="lg"
                                    className={`min-w-[160px] shadow-lg transition-all ${editingVariantIndex !== null ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-900 hover:bg-black'}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!variantInput.size) return alert("Please enter a Size (e.g. 100ml)");
                                        if (!variantInput.price) return alert("Please enter a Price");

                                        const newVariant = {
                                            size: variantInput.size,
                                            price: Number(variantInput.price),
                                            mrp: variantInput.mrp ? Number(variantInput.mrp) : undefined,
                                            stock: variantInput.stock ? Number(variantInput.stock) : 0
                                        };

                                        setFormData(prev => {
                                            const currentVariants = prev.variants ? [...prev.variants] : [];
                                            if (editingVariantIndex !== null) {
                                                currentVariants[editingVariantIndex] = newVariant;
                                            } else {
                                                currentVariants.push(newVariant);
                                            }
                                            return { ...prev, variants: currentVariants };
                                        });

                                        // Prepare for next entry
                                        setVariantInput({ size: '', price: '', mrp: '', discount: '', stock: '' });
                                        setEditingVariantIndex(null);
                                    }}
                                >
                                    {editingVariantIndex !== null ? '✓ Update Variant' : '＋ Add Variant'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Category</label>
                    <div className="flex gap-2">
                        {isAddingCategory ? (
                            <div className="flex gap-2 w-full animate-in fade-in slide-in-from-left-2">
                                <input
                                    className="w-full p-2.5 border border-sky-300 rounded-lg outline-none ring-2 ring-sky-100"
                                    placeholder="New Category Name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    autoFocus
                                />
                                <Button type="button" onClick={saveNewCategory} className="px-4 bg-sky-600 hover:bg-sky-700">✓</Button>
                                <Button type="button" variant="outline" onClick={() => setIsAddingCategory(false)} className="px-4">✕</Button>
                            </div>
                        ) : (
                            <>
                                <select
                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
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
                                            <option key={cat._id || cat.slug} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <Button type="button" variant="secondary" onClick={() => setIsAddingCategory(true)} className="px-3 text-lg" title="Add New Category">
                                    +
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Brand</label>
                    <div className="flex gap-2">
                        {isAddingBrand ? (
                            <div className="flex gap-2 w-full animate-in fade-in slide-in-from-left-2">
                                <input
                                    className="w-full p-2.5 border border-sky-300 rounded-lg outline-none ring-2 ring-sky-100"
                                    placeholder="New Brand Name"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                    autoFocus
                                />
                                <Button type="button" onClick={saveNewBrand} className="px-4 bg-sky-600 hover:bg-sky-700">✓</Button>
                                <Button type="button" variant="outline" onClick={() => setIsAddingBrand(false)} className="px-4">✕</Button>
                            </div>
                        ) : (
                            <>
                                <input
                                    list="brand-suggestions"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                    placeholder="Select or Type Brand"
                                    value={formData.brand || ''}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                />
                                <Button type="button" variant="secondary" onClick={() => setIsAddingBrand(true)} className="px-3 text-lg" title="Add New Brand">
                                    +
                                </Button>
                            </>
                        )}
                    </div>
                    <datalist id="brand-suggestions">
                        {brands.map((b: any) => (
                            <option key={b._id} value={b.name} />
                        ))}
                        {["CeraVe", "Cetaphil", "Bioderma", "Neutrogena", "La Roche-Posay", "The Ordinary", "Aveeno", "Minimalist", "Sebamed"]
                            .filter(n => !brands.find((b: any) => b.name === n))
                            .map(n => <option key={n} value={n} />)
                        }
                    </datalist>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Product Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="image-upload"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="text-gray-500 mb-2 text-3xl">📷</div>
                        <span className="text-sky-600 font-semibold hover:underline">Click to upload images</span>
                        <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </label>
                    {imageFiles.length > 0 && (
                        <div className="mt-4 text-sm bg-blue-50 text-blue-700 py-1 px-3 rounded-full inline-block">
                            {imageFiles.length} new files selected
                        </div>
                    )}
                </div>

                {/* Show Existing Images */}
                {formData.images && formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-4">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group shadow-sm bg-white">
                                <img src={img} className="w-full h-full object-cover" alt="preview" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => {
                                            const newImages = prev.images?.filter((_, i) => i !== idx);
                                            return { ...prev, images: newImages };
                                        });
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-md"
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
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Description</label>
                <textarea className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-shadow"
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" className="flex-1 py-6 text-gray-600 border-gray-300" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading} className="flex-[2] py-6 text-lg bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200">
                    {loading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
                </Button>
            </div>
        </form>
    )
}
