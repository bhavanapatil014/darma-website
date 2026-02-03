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
    products: Array<{
        product: string
        name: string
        quantity: number
        priceAtPurchase: number
    }>
    deliveryAgentId?: string
    deliveryOtp?: string
    deliveryAttempts?: { timestamp: string, reason: string, status: string }[]

}

interface User {
    _id: string
    name: string
    email: string
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState("all")

    // Search & Pagination State
    const [searchQuery, setSearchQuery] = useState("")
    const [searchDate, setSearchDate] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Form State for Status Update
    const [newStatus, setNewStatus] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [courierName, setCourierName] = useState("")

    const [deliveryPartners, setDeliveryPartners] = useState<User[]>([])
    const [selectedPartner, setSelectedPartner] = useState("")

    useEffect(() => {
        loadOrders()
        loadPartners()
    }, [])

    async function loadPartners() {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/user/delivery-partners', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDeliveryPartners(data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function loadOrders() {
        setLoading(true)
        try {
            const res = await fetch('https://darma-website.onrender.com/api/orders')
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
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
        setSelectedPartner(order.deliveryAgentId || "")
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
                deliveryAgentId: selectedPartner || undefined
            }

            await fetch(`https://darma-website.onrender.com/api/orders/${selectedOrder._id}`, {
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

    // --- Search & Filter Logic ---
    const filteredOrders = orders.filter(order => {
        // 1. Status Filter
        if (filterStatus !== 'all' && order.status !== filterStatus) return false

        // 2. Date Filter
        if (searchDate) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
            if (orderDate !== searchDate) return false
        }

        // 3. Text Search (ID, Customer Name, Product Name/ID)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()

            // Safe accessors with fallbacks to empty string to prevent crashes
            const orderId = order._id ? order._id.toString().toLowerCase() : ''
            const customerName = order.customerName ? order.customerName.toString().toLowerCase() : ''
            const customerEmail = order.email ? order.email.toString().toLowerCase() : ''

            const matchesId = orderId.includes(query)
            const matchesCustomer = customerName.includes(query) || customerEmail.includes(query)

            // Safe product check
            const matchesProduct = Array.isArray(order.products) && order.products.some(p => {
                const pName = p.name ? p.name.toString().toLowerCase() : ''
                const pId = p.product ? p.product.toString().toLowerCase() : ''
                return pName.includes(query) || pId.includes(query)
            })

            return matchesId || matchesCustomer || matchesProduct
        }


        return true
    })

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

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

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input
                            type="text"
                            placeholder="Search Order ID, Customer, or Product..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Date Picker with Icon */}
                    <div className="relative w-full md:w-auto">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        <input
                            type="date"
                            className="pl-10 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto min-w-[150px] bg-white text-gray-700"
                            value={searchDate}
                            onChange={(e) => { setSearchDate(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {(searchQuery || searchDate) && (
                        <Button variant="ghost" onClick={() => { setSearchQuery(""); setSearchDate(""); setCurrentPage(1); }} className="text-xs text-red-500 md:w-auto w-full">
                            Clear
                        </Button>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setFilterStatus(tab); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${filterStatus === tab
                                ? "bg-gray-900 text-white shadow-md"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile View: Clean List */}
            <div className="md:hidden flex flex-col gap-3">
                {currentOrders.map((order) => (
                    <div key={order._id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform">
                        {/* Top: ID and Status */}
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-sm font-bold text-gray-900">#{order._id.slice(-6)}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${order.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                {order.status}
                            </span>
                        </div>

                        {/* Middle: Details */}
                        <div className="flex justify-between items-end border-b border-dashed border-gray-100 pb-3">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                                <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">{order.products?.length || 0} items</div>
                            </div>
                        </div>

                        {/* Bottom: Action */}
                        <button
                            onClick={() => openUpdateModal(order)}
                            className="w-full py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            View & Manage
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b">
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[15%]">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[20%]">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[25%]">Products</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[10%]">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[10%]">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[10%]">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {currentOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">
                                        <span title={order._id}>#{order._id.slice(-6)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{order.customerName}</div>
                                        <div className="text-xs text-gray-400">{order.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {order.products?.slice(0, 2).map((p, i) => (
                                                <div key={i} className="text-xs text-gray-600 truncate max-w-[200px]" title={p.name}>
                                                    {p.quantity}x {p.name}
                                                </div>
                                            ))}
                                            {order.products?.length > 2 && (
                                                <div className="text-[10px] text-gray-400 italic">
                                                    +{order.products.length - 2} more items
                                                </div>
                                            )}
                                        </div>
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
                            {currentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No orders found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl border border-gray-200">
                    <div className="text-sm text-gray-500 hidden sm:block">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length}
                    </div>
                    {/* Mobile Page Indicator */}
                    <div className="text-sm font-medium text-gray-700 sm:hidden">
                        Page {currentPage} of {totalPages}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        {/* Desktop: Show all pages */}
                        <div className="hidden sm:flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === i + 1
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white border text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

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

                            {/* Assign Delivery Partner (Always Visible) */}
                            <div className="space-y-2 pt-2 border-t mt-4">
                                <label className="text-sm font-medium text-gray-700">Assign Delivery Partner</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={selectedPartner}
                                    onChange={(e) => setSelectedPartner(e.target.value)}
                                >
                                    <option value="">-- Select Partner --</option>
                                    {deliveryPartners.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Show Delivery Fields ONLY when status is SHIPPED */}
                            {newStatus === 'shipped' && (
                                <div className="space-y-4 pt-2 border-t mt-2">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">External Courier Details (Optional)</p>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Courier Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-md"
                                            placeholder="e.g. FedEx, DHL"
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

                            {/* Delivery Timeline & OTP */}
                            <div className="pt-4 border-t mt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Details</h3>

                                {selectedOrder.status === 'out_for_delivery' && selectedOrder.deliveryOtp && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3 flex justify-between items-center">
                                        <span className="text-sm text-yellow-800 font-medium">Current OTP</span>
                                        <span className="text-xl font-bold text-yellow-900 tracking-widest">{selectedOrder.deliveryOtp}</span>
                                    </div>
                                )}

                                {selectedOrder.deliveryAttempts && selectedOrder.deliveryAttempts.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedOrder.deliveryAttempts.map((attempt, index) => (
                                            <div key={index} className="flex gap-3 text-sm border-l-2 border-red-200 pl-3">
                                                <div className="flex-1">
                                                    <div className="font-medium text-red-600 capitalize">{attempt.status} Attempt</div>
                                                    <div className="text-gray-600">{attempt.reason || 'No reason provided'}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{new Date(attempt.timestamp).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No delivery attempts recorded yet.</p>
                                )}
                            </div>

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
