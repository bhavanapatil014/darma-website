"use client"
import { useEffect, useState } from "react"
import { Users, ShoppingBag, Truck, CheckCircle, AlertCircle, DollarSign } from "lucide-react"

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        products: 0,
        totalOrders: 0,
        placedOrders: 0,
        deliveredOrders: 0,
        revenue: 0,
        lowStock: 0
    })

    const [lowStockItems, setLowStockItems] = useState<any[]>([])

    useEffect(() => {
        async function loadStats() {
            try {
                // Fetch all products (limit 2000) for accurate stats
                const [prodRes, ordRes] = await Promise.all([
                    fetch('http://localhost:4000/api/products?limit=2000'),
                    fetch('http://localhost:4000/api/orders')
                ])
                const productData = await prodRes.json()
                const products = productData.products || [] // Handle paginated response
                const orders = await ordRes.json()

                const revenue = orders.reduce((acc: number, curr: any) => acc + (parseFloat(curr.totalAmount) || 0), 0)
                const lowStockList = products.filter((p: any) => (p.stockQuantity || 0) < 5)

                // Count specific statuses
                const placedOrders = orders.filter((o: any) => o.status === 'pending').length
                const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length

                setStats({
                    products: productData.pagination?.totalProducts || products.length,
                    totalOrders: orders.length,
                    placedOrders,
                    deliveredOrders,
                    revenue,
                    lowStock: lowStockList.length
                })
                setLowStockItems(lowStockList)
            } catch (e) {
                console.error("Failed to load stats", e)
            }
        }
        loadStats()
    }, [])

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Revenue */}
                <Card
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />

                {/* Total Orders */}
                <Card
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                />

                {/* Placed (Pending) Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 bg-orange-50/30">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-orange-800">Placed Orders (Pending)</div>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-900">{stats.placedOrders}</div>
                    <p className="text-xs text-orange-600 mt-1">Requires processing</p>
                </div>

                {/* Delivered Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200 bg-green-50/30">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-green-800">Delivered Orders</div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">{stats.deliveredOrders}</div>
                    <p className="text-xs text-green-600 mt-1">Successfully completed</p>
                </div>

                {/* Active Products */}
                <Card
                    title="Active Products"
                    value={stats.products}
                    icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                />

                {/* Low Stock */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Low Stock Items</div>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
                </div>
            </div>

            {/* Low Stock Details Table */}
            {lowStockItems.length > 0 && (
                <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="p-6 border-b bg-red-50/50">
                        <h3 className="font-semibold text-red-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Low Stock Alerts
                        </h3>
                    </div>
                    <div className="divide-y">
                        {lowStockItems.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                        )}
                                    </div>
                                    <span className="font-medium text-sm text-gray-900">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                    {item.stockQuantity} left
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-gray-200 text-center py-20">
                <p className="text-gray-500">More detailed analytics coming soon...</p>
            </div>
        </div>
    )
}

function Card({ title, value, icon }: { title: string, value: string | number, icon: any }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-muted-foreground">{title}</div>
                {icon}
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}
