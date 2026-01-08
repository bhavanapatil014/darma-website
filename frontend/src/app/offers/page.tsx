"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface Coupon {
    _id: string
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minPurchaseAmount?: number
    description?: string
    expiryDate?: string
}

export default function OffersPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch coupons from backend (assuming a public endpoint or admin one we can try)
        // If protected, we might need a workaround or specific public endpoint.
        // For now, trying standard endpoint.
        fetch('https://darma-website.onrender.com/api/coupons')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch');
            })
            .then(data => {
                // Filter for active ones if needed, or backend does it
                setCoupons(data);
            })
            .catch(err => {
                console.error(err);
                // Fallback / Mock for Demo if API fails (which it might if protected)
                setCoupons([
                    { _id: '1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minPurchaseAmount: 0, description: 'Get 10% Off your first order!', expiryDate: '2025-12-31' },
                    { _id: '2', code: 'SUMMER50', discountType: 'fixed', discountValue: 50, minPurchaseAmount: 999, description: 'Flat ₹50 Off on orders above ₹999', expiryDate: '2025-06-30' }
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Coupon ${code} copied!`);
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-center">Exclusive Offers & Coupons</h1>

            {loading ? (
                <div className="text-center py-12">Loading offers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.length > 0 ? coupons.map(coupon => (
                        <div key={coupon._id} className="border border-dashed border-gray-300 rounded-lg p-6 bg-yellow-50/50 hover:bg-yellow-50 transition-colors relative">
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
                                LIMITED TIME
                            </div>

                            <h3 className="font-bold text-xl mb-2 text-gray-900">
                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">{coupon.description || "Great savings on your favorite products."}</p>

                            <div className="flex items-center justify-between bg-white border rounded p-2 mb-4">
                                <code className="font-bold text-lg text-blue-600 tracking-wider">{coupon.code}</code>
                                <button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Copy Code"
                                >
                                    <Copy className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                {coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0 && (
                                    <p>• Min. purchase: ₹{coupon.minPurchaseAmount}</p>
                                )}
                                {coupon.expiryDate && (
                                    <p>• Valid until: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No active offers at the moment. Check back soon!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
