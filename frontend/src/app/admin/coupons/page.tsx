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
    usageLimit?: number;
    usedCount?: number;
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

    const [showForm, setShowForm] = useState(false);
    const [productSearch, setProductSearch] = useState("")
    const [brandSearch, setBrandSearch] = useState("")
    const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'negotiation'>('active')
    const [negotiations, setNegotiations] = useState<any[]>([])

    // Filter coupons
    // Negotiation coupons start with 'DEAL-'
    const negotiationCoupons = coupons.filter(c => c.code.startsWith('DEAL-'));

    // Active coupons are NOT negotiation coupons and are valid
    const activeCoupons = coupons.filter(c => !c.code.startsWith('DEAL-') && (!c.expirationDate || new Date() <= new Date(c.expirationDate)));

    // Expired coupons are NOT negotiation coupons and are expired
    const expiredCoupons = coupons.filter(c => !c.code.startsWith('DEAL-') && (c.expirationDate && new Date() > new Date(c.expirationDate)));

    const displayedCoupons = activeTab === 'active' ? activeCoupons : activeTab === 'expired' ? expiredCoupons : negotiationCoupons;

    function handleAddNew() {
        resetForm();
        setShowForm(true);
        setIsEditing(false);
    }

    function handleCancel() {
        setShowForm(false);
        resetForm();
    }

    useEffect(() => {
        loadData()
        loadProducts()
        loadCategories()
        loadNegotiations()
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
            const res = await fetch('https://darma-website.onrender.com/api/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    async function loadNegotiations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('https://darma-website.onrender.com/api/negotiate/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json();
                setNegotiations(data);
            }
        } catch (err) {
            console.error("Failed to load negotiations", err)
        }
    }

    async function loadProducts() {
        try {
            const res = await fetch('https://darma-website.onrender.com/api/products?limit=1000')
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
            const res = await fetch('https://darma-website.onrender.com/api/categories')
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
            const res = await fetch(`https://darma-website.onrender.com/api/coupons/${editId}`, {
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
            const res = await fetch('https://darma-website.onrender.com/api/coupons', {
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
            expirationDate: "", isActive: true, applicableProducts: [], applicableCategories: [], applicableBrands: []
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
            expirationDate: coupon.expirationDate,
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
            await fetch(`https://darma-website.onrender.com/api/coupons/${id}`, { method: 'DELETE' })
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
        <div className="space-y-8 max-w-[1400px] mx-auto p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Coupons</h1>
                    <p className="text-gray-500 mt-1">Manage discounts and promotional offers.</p>
                </div>
                {!showForm && (
                    <Button onClick={handleAddNew} className="bg-sky-600 hover:bg-sky-700 shadow-md">
                        + Create New Coupon
                    </Button>
                )}
            </div>

            {/* Form Section (Collapsible) */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                            <span className="sr-only">Close</span>
                            ✕
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ... (Keep existing form fields exactly as they are) ... */}
                        {/* Grid 1: Code & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Code</label>
                                <input
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none uppercase font-mono tracking-wider placeholder:normal-case"
                                    required
                                    placeholder="e.g. SUMMER50"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                                <select
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid 2: Value & Limits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {formData.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    required
                                    value={formData.value || ''}
                                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    max={formData.type === 'percentage' ? 100 : undefined}
                                />
                            </div>
                            {formData.type === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Discount Limit (Optional)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                        placeholder="Max ₹ limit"
                                        value={formData.maxDiscountAmount || ''}
                                        onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Grid 3: Order Min & Expiry */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Order Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={formData.minOrderAmount || ''}
                                    onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={formData.expirationDate ? new Date(new Date(formData.expirationDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                                    onChange={e => {
                                        if (e.target.value) {
                                            setFormData({ ...formData, expirationDate: new Date(e.target.value).toISOString() })
                                        } else {
                                            setFormData({ ...formData, expirationDate: undefined })
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Applicability Selectors */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Applicability Rules (Optional)</label>
                            <p className="text-xs text-gray-500 mb-3">Leave all empty for <strong>Storewide</strong>. Select specific rules to restrict usage.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Product Selector */}
                                <div className="border border-gray-200 rounded-lg flex flex-col bg-gray-50/50">
                                    <div className="p-3 border-b text-xs font-bold uppercase text-gray-500 bg-gray-100/50 rounded-t-lg">Specific Products</div>
                                    <div className="px-2 pt-2 pb-1 border-b border-gray-100">
                                        <input
                                            placeholder="Search products..."
                                            className="w-full text-xs p-1.5 border rounded outline-none focus:border-sky-500"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                        {products
                                            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                            .map(product => (
                                                <label key={product.id} className="flex items-center gap-3 cursor-pointer hover:bg-sky-50 p-2 rounded transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.applicableProducts || []).includes(product.id)}
                                                        onChange={() => toggleProductSelection(product.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{product.name}</span>
                                                </label>
                                            ))}
                                    </div>
                                </div>

                                {/* Category Selector */}
                                <div className="border border-gray-200 rounded-lg flex flex-col bg-gray-50/50">
                                    <div className="p-3 border-b text-xs font-bold uppercase text-gray-500 bg-gray-100/50 rounded-t-lg">Specific Categories</div>
                                    <div className="h-[285px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                        {categories.map(cat => (
                                            <label key={cat._id} className="flex items-center gap-3 cursor-pointer hover:bg-sky-50 p-2 rounded transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.applicableCategories || []).includes(cat.name)}
                                                    onChange={() => toggleCategorySelection(cat.name)}
                                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Brand Selector */}
                                <div className="border border-gray-200 rounded-lg flex flex-col bg-gray-50/50">
                                    <div className="p-3 border-b text-xs font-bold uppercase text-gray-500 bg-gray-100/50 rounded-t-lg">Specific Brands</div>
                                    <div className="px-2 pt-2 pb-1 border-b border-gray-100">
                                        <input
                                            placeholder="Search brands..."
                                            className="w-full text-xs p-1.5 border rounded outline-none focus:border-sky-500"
                                            value={brandSearch}
                                            onChange={(e) => setBrandSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                        {availableBrands
                                            .filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
                                            .map(brand => {
                                                const isChecked = (formData.applicableBrands || []).some(b => b.trim().toLowerCase() === brand.trim().toLowerCase());
                                                return (
                                                    <label key={brand} className="flex items-center gap-3 cursor-pointer hover:bg-sky-50 p-2 rounded transition-colors group">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleBrandSelection(brand)}
                                                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                        />
                                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{brand}</span>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 min-w-[150px]">
                                {isEditing ? 'Update Coupon' : 'Create Coupon'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs & List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'active' ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        Active Coupons ({activeCoupons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('negotiation')}
                        className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'negotiation' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        Negotiation Deal ({negotiationCoupons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('expired')}
                        className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'expired' ? 'bg-white text-red-600 border-b-2 border-red-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        Expired Coupons ({expiredCoupons.length})
                    </button>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden">
                    {displayedCoupons.map(coupon => {
                        const isExpired = coupon.expirationDate && new Date() > new Date(coupon.expirationDate);
                        const isUsed = activeTab === 'negotiation' && coupon.usedCount && coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                        const negotiationDetails = activeTab === 'negotiation'
                            ? negotiations.find(n => n.couponCode === coupon.code)
                            : null;

                        return (
                            <div key={coupon._id} className={`p-4 border-b border-gray-100 flex flex-col gap-3 ${isExpired ? 'bg-gray-50 opacity-70' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-mono font-bold text-lg text-gray-900">{coupon.code}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {coupon.expirationDate ? `Expires: ${new Date(coupon.expirationDate).toLocaleDateString()}` : 'No Expiry'}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${activeTab === 'expired' || isUsed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                    </span>
                                </div>

                                {/* Negotiation Details / Applicability */}
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    {activeTab === 'negotiation' ? (
                                        <div className="space-y-1">
                                            {negotiationDetails ? (
                                                <>
                                                    <div className="font-semibold">{negotiationDetails.user?.name}</div>
                                                    <div className="text-xs text-gray-500 mb-1">{negotiationDetails.user?.email}</div>
                                                    {negotiationDetails.product && (
                                                        <div className="text-xs text-indigo-600 font-medium">
                                                            Product: {negotiationDetails.product.name}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="italic text-gray-400">User details not found</span>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {(!coupon.applicableProducts?.length && !coupon.applicableCategories?.length && !coupon.applicableBrands?.length) ? (
                                                <span className="text-gray-500 italic">Valid Storewide</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {(coupon.applicableBrands?.length || 0) > 0 && <div><span className="font-semibold text-xs uppercase">Brands:</span> {coupon.applicableBrands.join(', ')}</div>}
                                                    {(coupon.applicableCategories?.length || 0) > 0 && <div><span className="font-semibold text-xs uppercase">Categories:</span> {coupon.applicableCategories.join(', ')}</div>}
                                                    {(coupon.applicableProducts?.length || 0) > 0 && <div><span className="font-semibold text-xs uppercase">Products:</span> {coupon.applicableProducts.length} items</div>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-sky-600 border-sky-200"
                                        onClick={() => {
                                            handleEdit(coupon);
                                            setShowForm(true);
                                        }}>
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(coupon._id)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                    {displayedCoupons.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                            No coupons found
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <th className="py-4 px-6 w-[20%]">Code</th>
                                <th className="py-4 px-6 w-[15%]">Discount</th>
                                <th className="py-4 px-6 w-[25%]">{activeTab === 'negotiation' ? 'Created For' : 'Applicability'}</th>
                                <th className="py-4 px-6 w-[15%]">Min Order</th>
                                <th className="py-4 px-6 w-[15%]">Expiry</th>
                                <th className="py-4 px-6 w-[10%] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedCoupons.map(coupon => {
                                const isExpired = coupon.expirationDate && new Date() > new Date(coupon.expirationDate);
                                const isUsed = activeTab === 'negotiation' && coupon.usedCount && coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                                const negotiationDetails = activeTab === 'negotiation'
                                    ? negotiations.find(n => n.couponCode === coupon.code)
                                    : null;

                                return (
                                    <tr key={coupon._id} className={`group hover:bg-gray-50/50 transition-colors ${isExpired ? 'bg-gray-50 opacity-50 blur-[0.5px]' : (isUsed ? 'bg-gray-50/40' : '')}`}>
                                        <td className="py-4 px-6">
                                            <div className="font-mono font-bold text-gray-800 text-base">{coupon.code}</div>
                                            {isExpired && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded mr-1">Expired</span>}
                                            {isUsed && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">Used</span>}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${activeTab === 'expired' || isUsed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {activeTab === 'negotiation' ? (
                                                <div className="space-y-1">
                                                    {negotiationDetails ? (
                                                        <>
                                                            <div className="font-semibold text-gray-800">{negotiationDetails.user?.name || "Unknown User"}</div>
                                                            <div className="text-xs text-gray-500">{negotiationDetails.user?.email}</div>
                                                            {negotiationDetails.product && (
                                                                <div className="text-xs text-indigo-600 mt-1 truncate max-w-[200px]" title={negotiationDetails.product.name}>
                                                                    Product: {negotiationDetails.product.name}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="italic text-gray-400">User details not found</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {(!coupon.applicableProducts?.length && !coupon.applicableCategories?.length && !coupon.applicableBrands?.length) ? (
                                                        <span className="font-medium text-gray-400 italic">Entire Store</span>
                                                    ) : (
                                                        <>
                                                            {(coupon.applicableBrands?.length || 0) > 0 && (
                                                                <div className="flex gap-1 items-center"><span className="text-gray-400 text-xs w-16">Brands:</span> <span className="font-medium truncate max-w-[200px]">{coupon.applicableBrands.join(', ')}</span></div>
                                                            )}
                                                            {(coupon.applicableCategories?.length || 0) > 0 && (
                                                                <div className="flex gap-1 items-center"><span className="text-gray-400 text-xs w-16">Categories:</span> <span className="font-medium truncate max-w-[200px]">{coupon.applicableCategories.join(', ')}</span></div>
                                                            )}
                                                            {(coupon.applicableProducts?.length || 0) > 0 && (
                                                                <div className="flex gap-1 items-center"><span className="text-gray-400 text-xs w-16">Products:</span> <span className="font-medium">{coupon.applicableProducts.length} items selected</span></div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-700">
                                            {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500">
                                            {coupon.expirationDate ? new Date(coupon.expirationDate).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" className="h-8 text-sky-600 border-sky-200 hover:bg-sky-50"
                                                    onClick={() => {
                                                        handleEdit(coupon);
                                                        setShowForm(true); // Open Form
                                                    }}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(coupon._id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayedCoupons.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                                            <p className="text-lg font-medium text-gray-500">No {activeTab} coupons found</p>
                                        </div>
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
