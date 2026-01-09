"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function NegotiationBtn({ product }: { product: any }) {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [offer, setOffer] = useState('')
    const [msg, setMsg] = useState('')
    const [loading, setLoading] = useState(false)

    if (!user) return null // Only logged in users

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/negotiate/offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: product._id, offerPrice: offer, message: msg })
            })
            if (res.ok) {
                alert("Offer sent to dealer!")
                setIsOpen(false)
            } else {
                alert("Failed to send offer")
            }
        } catch (err) { alert("Error sending offer") }
        setLoading(false)
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="border-teal-600 text-teal-700 hover:bg-teal-50">
                Negotiate Price
            </Button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Make an Offer</h3>
                        <p className="text-sm text-gray-500 mb-4">Original Price: ₹{product.price}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Your Price (₹)</label>
                                <input type="number" required className="w-full border p-2 rounded"
                                    value={offer} onChange={e => setOffer(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Message (Optional)</label>
                                <textarea className="w-full border p-2 rounded" rows={3}
                                    value={msg} onChange={e => setMsg(e.target.value)} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="bg-teal-600 text-white">
                                    {loading ? 'Sending...' : 'Send Offer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
