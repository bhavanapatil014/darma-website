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

    useEffect(() => {
        loadOrders()
    }, [])

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
            const query = searchQuery.toLowerCase()
            const matchesId = order._id.toLowerCase().includes(query)
            const matchesCustomer = order.customerName.toLowerCase().includes(query) || order.email.toLowerCase().includes(query)
            const matchesProduct = order.products?.some(p =>
                p.name.toLowerCase().includes(query) || p.product.toLowerCase().includes(query)
            )

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
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input
                            type="text"
                            placeholder="Search Order ID, Customer, or Product..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Date Picker */}
                    <input
                        type="date"
                        className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchDate}
                        onChange={(e) => { setSearchDate(e.target.value); setCurrentPage(1); }}
                    />

                    {(searchQuery || searchDate) && (
                        <Button variant="ghost" onClick={() => { setSearchQuery(""); setSearchDate(""); setCurrentPage(1); }} className="text-xs text-red-500">
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

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length}
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
