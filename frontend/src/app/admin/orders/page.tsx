"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface Order {
    _id: string
    customerName: string
    email: string
    totalAmount: number
    status: string
    createdAt: string
    trackingNumber?: string
    courierName?: string
    shippedAt?: string
    deliveredAt?: string
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState("all")

    // Form State for Status Update
    const [newStatus, setNewStatus] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [courierName, setCourierName] = useState("")

    useEffect(() => {
        loadOrders()
    }, [])

    async function loadOrders() {
        setLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/orders')
            const data = await res.json()
            setOrders(data)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const openUpdateModal = (order: Order) => {
        setSelectedOrder(order)
        setNewStatus(order.status)
        setTrackingNumber(order.trackingNumber || "")
        setCourierName(order.courierName || "")
        setIsModalOpen(true)
    }

    const closeUpdateModal = () => {
        setIsModalOpen(false)
        setSelectedOrder(null)
    }

    async function handleUpdateStatus() {
        if (!selectedOrder) return

        try {
            const body = {
                status: newStatus,
                trackingNumber: newStatus === 'shipped' ? trackingNumber : undefined,
                courierName: newStatus === 'shipped' ? courierName : undefined,
            }

            await fetch(`http://localhost:4000/api/orders/${selectedOrder._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            closeUpdateModal()
            loadOrders()
        } catch (error) {
            console.error(error)
            alert("Failed to update status")
        }
    }

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus)

    const tabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"]

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Orders...</div>

    return (
        <div className="space-y-8 min-h-screen bg-gray-50/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Management</h1>
                    <p className="text-gray-500 mt-1">Monitor and manage customer orders and deliveries.</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilterStatus(tab)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterStatus === tab
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-white text-gray-600 hover:bg-gray-100 border"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b">
                                <th className="px-6 py-4 font-semibold text-gray-700">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Delivery Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">#{order._id.slice(-6)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{order.customerName}</div>
                                        <div className="text-xs text-gray-400">{order.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">₹{order.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                            order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {order.status === 'shipped' || order.status === 'delivered' ? (
                                            <div className="space-y-1">
                                                {order.courierName && <div><span className="font-medium">Courier:</span> {order.courierName}</div>}
                                                {order.trackingNumber && <div><span className="font-medium">Track:</span> {order.trackingNumber}</div>}
                                                {!order.courierName && !order.trackingNumber && <span className="text-xs italic text-gray-400">No details</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openUpdateModal(order)}
                                        >
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No orders found in this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manage Order Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold">Manage Order #{selectedOrder._id.slice(-6)}</h2>
                            <p className="text-sm text-gray-500 mt-1">Update status and delivery details.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Order Status</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Show Delivery Fields ONLY when status is SHIPPED */}
                            {newStatus === 'shipped' && (
                                <div className="space-y-4 pt-2 border-t mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Courier Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-md"
                                            placeholder="e.g. FedEx, DHL, Local Courier"
                                            value={courierName}
                                            onChange={(e) => setCourierName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-md"
                                            placeholder="e.g. TRK-123456789"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={closeUpdateModal}>Cancel</Button>
                            <Button onClick={handleUpdateStatus}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
