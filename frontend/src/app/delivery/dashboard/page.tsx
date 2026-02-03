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
}

export default function DeliveryDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

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
                        <p className="text-gray-500 italic">No active deliveries assigned.</p>
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

                                    {order.status === 'out_for_delivery' && (
                                        <div className="bg-gray-50 p-3 rounded mt-2">
                                            <label className="text-xs font-bold text-gray-500 block mb-1">ENTER CUSTOMER OTP</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="XXXX"
                                                    className="border rounded p-2 w-full text-center text-lg tracking-widest"
                                                    onChange={(e) => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                                />
                                                <Button onClick={() => handleCompleteDelivery(order._id)} className="bg-green-600">
                                                    Verify
                                                </Button>
                                            </div>
                                            {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                                                <div className="mt-2 text-red-600 font-bold text-center border border-red-200 bg-red-50 p-1 rounded">
                                                    Collect Cash: ₹{order.totalAmount}
                                                </div>
                                            )}
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
