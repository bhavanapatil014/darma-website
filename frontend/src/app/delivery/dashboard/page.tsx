"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Order {
    _id: string;
    customerName: string;
    address: string;
    products: { name: string, quantity: number }[];
    totalAmount: number;
    status: string;
    phoneNumber?: string; // If we add phone to user
    paymentMethod: string;
    paymentStatus: string;
    deliveryAttempts?: { timestamp: string, reason: string }[];
    codCollected?: boolean;
}

export default function DeliveryDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
    const [failModalOpen, setFailModalOpen] = useState<string | null>(null);
    const [failReason, setFailReason] = useState<string>('');

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.role !== 'delivery_partner' && user.role !== 'admin')) {
                toast.error("Access Denied: Delivery Partners Only");
                router.push("/login");
                return;
            }
            fetchDashboardData();
        }
    }, [user, authLoading]);

    const handleFailDelivery = async (orderId: string) => {
        if (!failReason) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/delivery/${orderId}/fail`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: failReason })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Delivery Failure Recorded");
                setFailModalOpen(null);
                setFailReason('');
                fetchDashboardData();
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/delivery/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActiveOrders(data.active);
                setCompletedOrders(data.completed);
            }
        } catch (error) {
            console.error("Failed to load dashboard", error);
        }
    };

    const handleStartDelivery = async (orderId: string) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/delivery/${orderId}/start`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Delivery Started! OTP sent to customer.");

                // SIMULATION ONLY: Show OTP to driver for testing
                if (data.simulationOtp) {
                    alert(`[SIMULATION MODE]\n\nThe OTP is: ${data.simulationOtp}\n\n(In production, this is sent via SMS)`);
                }

                fetchDashboardData();
            } else {
                toast.error(data.message || "Failed to start delivery");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const handleCompleteDelivery = async (orderId: string) => {
        const otp = otpInputs[orderId];
        if (!otp || otp.length < 4) {
            toast.error("Please enter valid OTP");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/delivery/${orderId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Delivery Completed!");
                fetchDashboardData();
            } else {
                toast.error(data.message || "Failed to verified OTP");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const openMap = (address: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    if (authLoading) return <div className="p-8 text-center text-4xl">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-md">
            <h1 className="text-2xl font-bold mb-6">Delivery Dashboard 🚚</h1>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Active Deliveries ({activeOrders.length})</h2>
                    {activeOrders.length === 0 ? (
                        <div className="text-gray-500 italic space-y-2">
                            <p>No active deliveries assigned.</p>
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                <p className="text-xs text-blue-500 bg-blue-50 p-2 rounded">
                                    💡 <strong>Admin Tip:</strong> Only orders assigned to YOU appear here.
                                    Go to <a href="/admin/orders" className="underline">Admin Orders</a>, click Manage, assign yourself as Partner, and set status to 'Shipped'.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeOrders.map(order => (
                                <div key={order._id} className="border rounded-lg p-4 shadow-sm bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-lg">#{order._id.slice(-6)}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {order.status === 'out_for_delivery' ? 'IN TRANSIT' : 'ASSIGNED'}
                                        </span>
                                    </div>
                                    <h3 className="font-medium">{order.customerName}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{order.address}</p>

                                    <div className="flex gap-2 mb-4">
                                        <Button variant="outline" size="sm" onClick={() => openMap(order.address)} className="flex-1">
                                            📍 Map
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = `tel:${"9999999999"}`}>
                                            📞 Call
                                        </Button>
                                    </div>

                                    {order.status === 'shipped' && (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStartDelivery(order._id)}>
                                            Start Delivery
                                        </Button>
                                    )}

                                    {/* Attempt Counter */}
                                    {/* @ts-ignore */}
                                    {order.deliveryAttempts && order.deliveryAttempts.length > 0 && (
                                        <div className="mb-2 text-xs font-semibold text-orange-600 bg-orange-50 p-1 rounded inline-block">
                                            Attempt {order.deliveryAttempts.length + 1}/3
                                        </div>
                                    )}

                                    {order.status === 'out_for_delivery' && (
                                        <div className="bg-gray-50 p-3 rounded mt-2 space-y-3">
                                            {/* SIMULATION HELPER: SHOW OTP */}
                                            {/* @ts-ignore */}
                                            {order.deliveryOtp && (
                                                <div className="p-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-center rounded font-mono font-bold text-sm">
                                                    KEY: {order.deliveryOtp}
                                                </div>
                                            )}

                                            {/* COD Cash Collection - Highlighted */}
                                            {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                                                <div className="bg-red-50 border-l-4 border-red-500 p-3 shadow-sm rounded-r">
                                                    <div className="text-xs font-bold text-red-500 uppercase">Cash to Collect</div>
                                                    <div className="text-2xl font-black text-red-700">₹{order.totalAmount.toLocaleString()}</div>
                                                    <div className="text-[10px] text-red-400 mt-1">Do not deliver without cash.</div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">CUSTOMER OTP Verification</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="XXXX"
                                                        className="border rounded p-2 w-full text-center text-lg tracking-widest font-mono"
                                                        onChange={(e) => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                                    />
                                                    <Button onClick={() => handleCompleteDelivery(order._id)} className="bg-green-600 hover:bg-green-700 min-w-[80px]">
                                                        Verify
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Fail / Report Issue Section */}
                                            <div className="pt-2 border-t mt-2">
                                                {failModalOpen === order._id ? (
                                                    <div className="space-y-2 bg-white p-2 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                                                        <label className="text-xs font-bold text-red-600 block">Why did delivery fail?</label>
                                                        <select
                                                            className="w-full text-sm border rounded p-1.5 bg-white"
                                                            onChange={(e) => setFailReason(e.target.value)}
                                                            value={failReason}
                                                        >
                                                            <option value="">Select Reason</option>
                                                            <option value="Customer Unavailable">Customer Unavailable</option>
                                                            <option value="Wrong Address">Wrong Address/Location</option>
                                                            <option value="Customer Refused">Customer Refused Order</option>
                                                            <option value="Payment Issue">Payment Issue (No Cash)</option>
                                                            <option value="Shop Closed">Shop/Office Closed</option>
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="flex-1"
                                                                onClick={() => handleFailDelivery(order._id)}
                                                                disabled={!failReason}
                                                            >
                                                                Confirm Failure
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => { setFailModalOpen(null); setFailReason(''); }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setFailModalOpen(order._id)}
                                                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium w-full text-center py-1"
                                                    >
                                                        Report Delivery Issue / Fail
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-600">History</h2>
                    {completedOrders.length === 0 ? (
                        <p className="text-gray-400">No completed deliveries yet.</p>
                    ) : (
                        <div className="space-y-2 opacity-75">
                            {completedOrders.map(order => (
                                <div key={order._id} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-sm">#{order._id.slice(-6)}</div>
                                        <div className="text-xs text-gray-500">{order.customerName}</div>
                                    </div>
                                    <div className="text-green-600 text-sm font-bold">✔ DELIVERED</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
