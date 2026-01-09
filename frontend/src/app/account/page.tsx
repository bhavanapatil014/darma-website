"use client"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function AccountPage() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    useEffect(() => {
        if (!user) {
            // router.push("/login") 
        }
    }, [user, router])

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <p className="mb-4">Please log in to view your account.</p>
                <Button onClick={() => router.push('/login')}>Log In</Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Account?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete your account? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        await fetch('https://darma-website.onrender.com/api/auth/delete-me', {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        logout();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">My Account</h1>
                        <p className="text-muted-foreground mt-1">Welcome back, {user.name}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Profile Card */}
                    <div className="md:col-span-1 h-fit sticky top-24">
                        <div className="bg-white p-6 rounded-xl border shadow-sm mb-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-semibold">{user.name}</h2>
                                    <p className="text-xs text-muted-foreground">{user.role}</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" onClick={logout} className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Sign Out
                        </Button>

                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="w-full text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* Orders Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white z-10 pb-4 mb-2 sticky top-0">
                            <h2 className="text-xl font-bold">Order History</h2>
                        </div>
                        <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            <OrderList />
                        </div>
                        <div className="bg-white z-10 pb-4 mb-2 mt-8 sticky top-0">
                            <h2 className="text-xl font-bold">My Negotiations</h2>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            <NegotiationList />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OrderList() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        fetch('https://darma-website.onrender.com/api/orders/my-orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setOrders(data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>
    if (orders.length === 0) return <div className="text-center py-12 bg-gray-50 rounded-lg border text-gray-500">No orders found. Start shopping!</div>

    return (
        <div className="space-y-6">
            {orders.map((order) => (
                <div key={order._id} className="group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50/50 p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs uppercase tracking-wider">Order Placed</span>
                                <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase tracking-wider">Total</span>
                                <span className="font-medium text-gray-900">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-sm font-mono text-gray-500">ID: #{order._id.slice(-6).toUpperCase()}</div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="mb-6">
                            <OrderStepper status={order.status} />
                        </div>

                        {/* Delivery Info Block */}
                        {(order.status === 'shipped' || order.status === 'delivered') && (
                            <div className="bg-blue-50/50 rounded-lg p-4 mb-6 border border-blue-100 flex flex-col sm:flex-row gap-6">
                                {order.trackingNumber && (
                                    <div>
                                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Tracking Number</span>
                                        <p className="font-mono text-gray-900 mt-1">{order.trackingNumber}</p>
                                    </div>
                                )}
                                {order.courierName && (
                                    <div>
                                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Courier</span>
                                        <p className="font-medium text-gray-900 mt-1">{order.courierName}</p>
                                    </div>
                                )}
                                {order.shippedAt && (
                                    <div>
                                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Shipped Date</span>
                                        <p className="text-gray-900 mt-1">{new Date(order.shippedAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {order.products.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">Img</div>
                                        )}
                                        <div>
                                            <span className="font-medium text-gray-900 block">{item.name || `Product #${item.product.slice(-4)}`}</span>
                                            <span className="text-gray-500 text-xs">Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <span className="font-medium">₹{item.priceAtPurchase}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-3 flex justify-between items-center text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'delivered' ? 'bg-green-500' :
                                order.status === 'cancelled' ? 'bg-red-500' :
                                    order.status === 'shipped' ? 'bg-blue-500' :
                                        'bg-yellow-500'
                                }`}></span>
                            {order.status}
                        </span>

                        {order.status === 'pending' && (
                            <button className="text-red-600 hover:text-red-700 font-medium hover:underline text-xs">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function OrderStepper({ status }: { status: string }) {
    const steps = ['pending', 'processing', 'shipped', 'delivered']
    const currentStepIndex = steps.indexOf(status)

    if (status === 'cancelled') return <div className="w-full h-2 bg-red-100 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-full" /></div>

    return (
        <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full -z-10" />
            <div
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />

            <div className="flex justify-between w-full">
                {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex
                    const isCurrent = idx === currentStepIndex

                    return (
                        <div key={step} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-white border-gray-300 text-gray-300'
                                }`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    <span className="text-xs">{idx + 1}</span>
                                )}
                            </div>
                            <span className={`text-xs capitalize font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function NegotiationList() {
    const [offers, setOffers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        fetch('https://darma-website.onrender.com/api/negotiate/my-offers', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setOffers(data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="text-gray-400 text-sm">Loading offers...</div>
    if (offers.length === 0) return <div className="text-center py-6 bg-gray-50 rounded-lg border text-gray-500 text-sm">No negotiations yet.</div>

    return (
        <div className="space-y-4">
            {offers.map((offer) => {
                const lastMsg = offer.messages && offer.messages.length > 0 ? offer.messages[offer.messages.length - 1] : null
                return (
                    <Link href={`/product/${offer.product?._id || offer.product?.id}`} key={offer._id} className="block group">
                        <div className="bg-white rounded-lg border p-4 shadow-sm flex justify-between items-center group-hover:border-teal-500 transition-colors">
                            <div>
                                <div className="font-semibold text-sm">{offer.product?.name || 'Unknown Product'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {lastMsg ? (
                                        <span className={lastMsg.sender === 'admin' ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                                            {lastMsg.sender === 'admin' ? 'Dealer: ' : 'You: '} {lastMsg.text || 'Sent an attachment'}
                                        </span>
                                    ) : 'No messages'}
                                </div>
                                {offer.couponCode && (
                                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
                                        Coupon Received: {offer.couponCode}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${offer.status === 'deal_reached' ? 'bg-green-100 text-green-700' :
                                        offer.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {offer.status?.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
