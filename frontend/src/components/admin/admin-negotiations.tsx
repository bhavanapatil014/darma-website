"use client"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send } from "lucide-react"

export default function AdminNegotiations() {
    const { user } = useAuth()
    const [offers, setOffers] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [chatData, setChatData] = useState<any>(null)
    const [reply, setReply] = useState('')
    const [couponAmount, setCouponAmount] = useState('')
    const [showCouponInput, setShowCouponInput] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/negotiate/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) setOffers(await res.json())
        } catch (error) { console.error(error) }
    }

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'superadmin') fetchOffers()
    }, [user])

    useEffect(() => {
        if (selectedId) {
            // Poll chat refresh
            const interval = setInterval(() => {
                const updated = offers.find(o => o._id === selectedId)
                if (updated) setChatData(updated)
                // In production, we should re-fetch specific ID to get new msgs
                fetchOffers()
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [selectedId])

    useEffect(() => {
        // Find selected chat data from offers list
        if (selectedId) {
            const found = offers.find(o => o._id === selectedId)
            if (found) setChatData(found)
        }
    }, [offers, selectedId])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [chatData])


    const handleSend = async () => {
        if (!reply.trim() && !showCouponInput) return

        try {
            const token = localStorage.getItem('token')
            const body: any = { text: reply }

            if (showCouponInput && couponAmount) {
                // Request Server to Create Logic
                body.createCoupon = true
                body.discountAmount = couponAmount
            }

            const res = await fetch(`https://darma-website.onrender.com/api/negotiate/${selectedId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setReply('')
                setShowCouponInput(false)
                setCouponAmount('')
                fetchOffers()
            }
        } catch (e) { alert("Failed to send") }
    }

    if (!selectedId) {
        // List View
        return (
            <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-xl font-bold mb-4">Price Negotiation Chats</h2>
                {offers.length === 0 ? <p className="text-gray-500">No active negotiations.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">User</th>
                                    <th className="p-3">Product</th>
                                    <th className="p-3">Last Message</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {offers.map(o => {
                                    const lastMsg = o.messages[o.messages.length - 1]
                                    return (
                                        <tr key={o._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(o._id)}>
                                            <td className="p-3 font-medium">{o.user?.name || 'Unknown'}</td>
                                            <td className="p-3">{o.product?.name}</td>
                                            <td className="p-3 text-gray-500 max-w-xs truncate">
                                                {lastMsg ? `${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text || '[Image]'}` : 'No messages'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${o.status === 'deal_reached' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {o.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button size="sm" variant="outline">Open Chat</Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    // Chat View
    return (
        <div className="bg-white rounded-lg shadow border flex flex-col h-[600px]">
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <div>
                    <h3 className="font-bold">{chatData?.product?.name}</h3>
                    <span className="text-xs text-gray-500">with {chatData?.user?.name} (₹{chatData?.product?.price})</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Back to List</Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatData?.messages.map((m: any, i: number) => (
                    <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'
                            }`}>
                            {m.image && <img src={m.image} alt="attachment" className="w-full rounded mb-2 max-h-40 object-cover" />}
                            {m.text && <p>{m.text}</p>}
                            <div className={`text-[10px] opacity-70 text-right mt-1 ${m.sender === 'admin' ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-white space-y-3">
                {showCouponInput ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-green-800 text-xs uppercase">Issue Discount Coupon</div>
                            <button onClick={() => setShowCouponInput(false)} className="text-gray-400 hover:text-gray-600"><span className="sr-only">Close</span>✕</button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Discount Amount (₹)"
                                className="flex-1 border p-2 rounded text-sm"
                                value={couponAmount}
                                onChange={e => setCouponAmount(e.target.value)}
                            />
                            <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white">Send Coupon</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => setShowCouponInput(true)}
                        >
                            Give Coupon
                        </Button>
                        <div className="flex-1 relative">
                            <input
                                className="w-full border rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type a reply..."
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} className="absolute right-2 top-1.5 text-blue-600">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
