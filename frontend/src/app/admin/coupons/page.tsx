"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Coupon {
    _id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    expirationDate: string;
    isActive: boolean;
    applicableProducts: string[];
    applicableCategories: string[];
    applicableBrands: string[];
}

interface Product {
    id: string;
    name: string;
    brand?: string; // Added brand
}

interface Category {
    _id: string;
    name: string;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: "", type: "percentage", value: 0, minOrderAmount: 0, maxDiscountAmount: 0, isActive: true,
        applicableProducts: [], applicableCategories: [], applicableBrands: []
    })

    useEffect(() => {
        loadData()
        loadProducts()
        loadCategories()
    }, [])

    // Helper to get unique brands from products
    const productBrands = products.map(p => (p as any).brand).filter(Boolean) as string[];
    const fallbackBrands = ["CeraVe", "Cetaphil", "The Ordinary", "Bioderma", "Neutrogena", "La Roche-Posay"];
    // Combine both sets to ensure standard brands are always available + any custom ones found
    const availableBrands = Array.from(new Set([...fallbackBrands, ...productBrands])).sort();

    // ... load functions ...
    async function loadData() {
        setLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    async function loadProducts() {
        try {
            const res = await fetch('http://localhost:4000/api/products?limit=1000')
            if (res.ok) {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    setProducts(data.products || [])
                } catch (e) {
                    console.error("Failed to parse products JSON:", text.substring(0, 100));
                }
            }
        } catch (err) {
            console.error("Failed to load products", err)
        }
    }

    async function loadCategories() {
        try {
            const res = await fetch('http://localhost:4000/api/categories')
            if (res.ok) {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    setCategories(data)
                } catch (e) {
                    console.error("Failed to parse categories JSON:", text.substring(0, 100));
                }
            }
        } catch (err) {
            console.error("Failed to load categories", err)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEditing && editId) {
            // Update
            console.log("Updating Coupon Payload:", formData);
            const res = await fetch(`http://localhost:4000/api/coupons/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                alert("Coupon Updated");
                loadData();
                resetForm();
            } else {
                alert("Failed to update");
            }
        } else {
            // Create
            console.log("Creating Coupon Payload:", formData);
            const res = await fetch('http://localhost:4000/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                alert("Coupon Created");
                loadData();
                resetForm();
            } else {
                alert("Failed to create");
            }
        }
    }

    function resetForm() {
        setFormData({
            code: "", type: "percentage", value: 0, minOrderAmount: 0, maxDiscountAmount: 0,
            isActive: true, applicableProducts: [], applicableCategories: [], applicableBrands: []
        });
        setIsEditing(false);
        setEditId(null);
    }

    function handleEdit(coupon: Coupon) {
        console.log("Handle Edit Triggered for:", coupon);
        console.log("Coupon Brands from DB:", coupon.applicableBrands);

        setIsEditing(true);
        setEditId(coupon._id);

        // Ensure arrays are initialized even if DB returns null/undefined
        const safeBrands = Array.isArray(coupon.applicableBrands) ? coupon.applicableBrands : [];
        const safeProducts = Array.isArray(coupon.applicableProducts) ? coupon.applicableProducts : [];
        const safeCategories = Array.isArray(coupon.applicableCategories) ? coupon.applicableCategories : [];

        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscountAmount: coupon.maxDiscountAmount,
            isActive: coupon.isActive,
            applicableProducts: safeProducts,
            applicableCategories: safeCategories,
            applicableBrands: safeBrands
        });

        console.log("FormData set with brands:", safeBrands);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // ... toggleProduct ... toggleCategory ...

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            await fetch(`http://localhost:4000/api/coupons/${id}`, { method: 'DELETE' })
            loadData()
        } catch (err) {
            console.error(err)
        }
    }

    const toggleProductSelection = (productId: string) => {
        const current = formData.applicableProducts || [];
        if (current.includes(productId)) {
            setFormData({ ...formData, applicableProducts: current.filter(id => id !== productId) });
        } else {
            setFormData({ ...formData, applicableProducts: [...current, productId] });
        }
    };

    const toggleCategorySelection = (catName: string) => {
        const current = formData.applicableCategories || [];
        if (current.includes(catName)) {
            setFormData({ ...formData, applicableCategories: current.filter(c => c !== catName) });
        } else {
            setFormData({ ...formData, applicableCategories: [...current, catName] });
        }
    };

    const toggleBrandSelection = (brandName: string) => {
        setFormData(prev => {
            const current = prev.applicableBrands || [];
            const target = brandName.trim();
            // Case-Insensitive Check
            const isSelected = current.some(b => b.trim().toLowerCase() === target.toLowerCase());

            let newBrands;
            if (isSelected) {
                // Remove (Case-Insensitive)
                newBrands = current.filter(b => b.trim().toLowerCase() !== target.toLowerCase());
            } else {
                // Add (Preserve Case from selection)
                newBrands = [...current, target];
            }

            console.log(`Toggling Brand: ${target} | Result:`, newBrands);
            return { ...prev, applicableBrands: newBrands };
        });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Manage Coupons</h1>
            {/* ... Form ... */}
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">Create New Coupon</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Coupon Code</label>
                            <input
                                className="w-full p-2 border rounded uppercase" required
                                placeholder="SUMMER50"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {formData.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                            </label>
                            <input
                                type="number" className="w-full p-2 border rounded" required
                                value={formData.value || ''}
                                onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                max={formData.type === 'percentage' ? 100 : undefined}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                            <input
                                type="number" className="w-full p-2 border rounded"
                                value={formData.minOrderAmount || ''}
                                onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {formData.type === 'percentage' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Discount Limit (Optional)</label>
                            <input
                                type="number" className="w-full p-2 border rounded"
                                placeholder="e.g. Max ₹500 off"
                                value={formData.maxDiscountAmount || ''}
                                onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                            />
                        </div>
                    )}

                    {/* Applicability Selectors */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Product Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Specific Products</label>
                            <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                                {products.map(product => (
                                    <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={(formData.applicableProducts || []).includes(product.id)}
                                            onChange={() => toggleProductSelection(product.id)}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm truncate">{product.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Specific Categories</label>
                            <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                                {categories.map(cat => (
                                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={(formData.applicableCategories || []).includes(cat.name)}
                                            onChange={() => toggleCategorySelection(cat.name)}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm truncate">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Brand Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Specific Brands</label>
                            <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                                {availableBrands.map(brand => {
                                    const isChecked = (formData.applicableBrands || []).some(b => b.trim().toLowerCase() === brand.trim().toLowerCase());
                                    return (
                                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    // e.stopPropagation(); // Optional, usually not needed for label wrap
                                                    toggleBrandSelection(brand);
                                                }}
                                                className="h-4 w-4"
                                            />
                                            <span className="text-sm truncate">{brand}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Leave all empty for Storewide. If selected, coupon applies to items matching ANY condition.
                    </p>

                    <div className="flex gap-2">
                        <Button type="submit">{isEditing ? 'Update Coupon' : 'Create Coupon'}</Button>
                        {isEditing && (
                            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Active Coupons</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b text-sm font-medium text-gray-500">
                            <th className="pb-2">Code</th>
                            <th className="pb-2">Discount</th>
                            <th className="pb-2">Applicability</th>
                            <th className="pb-2">Min Order</th>
                            <th className="pb-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon._id} className="border-b last:border-0">
                                <td className="py-3 font-bold">{coupon.code}</td>
                                <td className="py-3">
                                    {coupon.type === 'percentage' ? `${coupon.value}% Off` : `₹${coupon.value} Off`}
                                </td>
                                <td className="py-3 text-sm text-gray-600">
                                    {(coupon.applicableProducts?.length || 0) > 0 && <div>{coupon.applicableProducts.length} Products</div>}
                                    {(coupon.applicableCategories?.length || 0) > 0 && <div>{coupon.applicableCategories.join(', ')}</div>}
                                    {(coupon.applicableBrands?.length || 0) > 0 && <div>{coupon.applicableBrands.join(', ')}</div>}
                                    {(!coupon.applicableProducts?.length && !coupon.applicableCategories?.length && !coupon.applicableBrands?.length) && 'Storewide'}
                                </td>
                                <td className="py-3">₹{coupon.minOrderAmount}</td>
                                <td className="py-3 flex gap-2">
                                    { /* @ts-ignore */}
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(coupon._id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && (
                            <tr><td colSpan={4} className="py-4 text-center text-gray-500">No coupons found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
