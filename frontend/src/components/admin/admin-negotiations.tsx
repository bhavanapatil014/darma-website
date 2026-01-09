"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function AdminNegotiations() {
    const { user } = useAuth()
    const [offers, setOffers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/negotiate/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setOffers(await res.json())
            }
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    const handleAction = async (id: string, action: 'accepted' | 'rejected') => {
        const resp = prompt(`Enter response for ${action} (Optional):`)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`https://darma-website.onrender.com/api/negotiate/${id}/respond`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: action, adminResponse: resp || '' })
            })
            if (res.ok) fetchOffers()
        } catch (error) { alert("Failed to update") }
    }

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'superadmin') fetchOffers()
    }, [user])

    if (loading) return <div>Loading offers...</div>

    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Price Negotiation Offers</h2>
            {offers.length === 0 ? <p className="text-gray-500">No active offers.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Product</th>
                                <th className="p-3">Current Price</th>
                                <th className="p-3">Offer Price</th>
                                <th className="p-3">Message</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {offers.map(o => (
                                <tr key={o._id}>
                                    <td className="p-3">
                                        <div className="font-medium">{o.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400">{o.user?.email}</div>
                                    </td>
                                    <td className="p-3">{o.product?.name}</td>
                                    <td className="p-3">₹{o.originalPrice}</td>
                                    <td className="p-3 font-bold text-teal-700">₹{o.offerPrice}</td>
                                    <td className="p-3 text-gray-500 italic">"{o.message || 'No message'}"</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                o.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        {o.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleAction(o._id, 'accepted')} className="text-green-600 hover:underline font-medium">Accept</button>
                                                <button onClick={() => handleAction(o._id, 'rejected')} className="text-red-600 hover:underline font-medium">Reject</button>
                                            </>
                                        )}
                                        {o.status !== 'pending' && <span className="text-gray-400 text-xs">Closed</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
