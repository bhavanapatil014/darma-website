"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
    const { user } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'admins' | 'customers' | 'delivery'>('admins')
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' })
    const [loading, setLoading] = useState(true)

    // Fetch Users
    useEffect(() => {
        if (user?.role === 'superadmin') {
            fetchUsers()
        }
    }, [user])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/auth/users?_t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (user?.role !== 'superadmin') {
        return <div className="p-8">Access Denied. Super Admin only.</div>
    }

    async function createUser(e: React.FormEvent) {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            // 1. Create User via Register (Generic)
            const res = await fetch(`${apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData })
            });

            if (res.ok) {
                const data = await res.json();

                // 2. If role is not user, promote them immediately
                if (formData.role !== 'user') {
                    await fetch(`${apiUrl}/api/auth/users/${data.user.id}/role`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ role: formData.role })
                    });
                }

                alert(`User created successfully as ${formData.role}!`)
                setFormData({ name: '', email: '', password: '', role: 'user' })
                fetchUsers()
            } else {
                const err = await res.json()
                alert(err.message)
            }
        } catch (error) {
            alert("Failed to create user")
        }
    }

    async function deleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user? This will soft-delete their account.")) return;
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                fetchUsers()
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.message || "Failed to delete user")
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting user")
        }
    }


    async function updateUserRole(userId: string, newRole: string) {
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/auth/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            })
            if (res.ok) {
                fetchUsers()
            } else {
                alert("Failed to update role")
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleSettleCash(userId: string, currentBalance: number) {
        if (!confirm(`Confirm receiving ₹${currentBalance} from this agent? This will reset their wallet to 0.`)) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            // Note: Route is in 'user.js' mounted at /api/user
            const res = await fetch(`${apiUrl}/api/user/delivery-partners/${userId}/settle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Settlement Successful!");
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || "Settlement Failed");
            }
        } catch (error) {
            alert("Network Error during settlement");
        }
    }

    const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin')
    const customers = users.filter(u => u.role === 'user')
    const deliveryPartners = users.filter(u => u.role === 'delivery_partner')

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">User Management</h1>

            {/* Create User Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-teal-700">Add New User / Partner</h2>
                <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input className="w-full p-2 border rounded text-sm" required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="w-full p-2 border rounded text-sm" required
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" className="w-full p-2 border rounded text-sm" required
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select className="w-full p-2 border rounded text-sm bg-gray-50"
                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} >
                            <option value="user">Customer</option>
                            <option value="delivery_partner">Delivery Partner</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Create</Button>
                </form>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'admins' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('admins')}
                    >
                        Administrators ({admins.length})
                    </button>
                    <button
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'customers' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        Customers ({customers.length})
                    </button>
                    <button
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'delivery' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('delivery')}
                    >
                        Delivery Partners ({deliveryPartners.length})
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Role</th>
                                {activeTab === 'delivery' ? (
                                    <>
                                        <th className="p-4 font-semibold">Wallet Balance</th>
                                        <th className="p-4 font-semibold">Settlement</th>
                                    </>
                                ) : (
                                    <th className="p-4 font-semibold">Joined Date</th>
                                )}
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                // Skeleton Loader Rows
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                        <td className="p-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : (
                                (activeTab === 'admins' ? admins : activeTab === 'delivery' ? deliveryPartners : customers).map(u => (
                                    <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${u.isDeleted ? 'bg-red-50/50 opacity-75' : ''}`}>
                                        <td className="p-4 font-medium">
                                            {u.name}
                                            {activeTab === 'delivery' && (
                                                <div className="text-xs text-blue-600 font-medium mt-1">
                                                    {/* @ts-ignore */}
                                                    {u.agentProfile?.vehicleType?.toUpperCase() || 'NO VEHICLE'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 space-y-1">
                                            <div>{u.originalEmail || u.email}</div>
                                            {u.phoneNumber && <div className="text-xs text-gray-400">{u.phoneNumber}</div>}
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className={`px-2 py-1 rounded-md text-xs font-medium border ${u.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    u.role === 'admin' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                                        u.role === 'delivery_partner' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-blue-50 text-blue-600 border-blue-200'
                                                    }`}
                                                value={u.role}
                                                onChange={(e) => updateUserRole(u._id, e.target.value)}
                                                disabled={u.role === 'superadmin' || u._id === user?.id}
                                            >
                                                <option value="user">User</option>
                                                <option value="delivery_partner">Delivery Partner</option>
                                                <option value="admin">Admin</option>
                                                <option value="superadmin">Super Admin</option>
                                            </select>
                                        </td>

                                        {/* Dynamic Columns based on Role */}
                                        {activeTab === 'delivery' ? (
                                            <>
                                                <td className="p-4">
                                                    {/* @ts-ignore */}
                                                    <div className="font-bold text-gray-800">₹{u.agentProfile?.currentCashBalance?.toLocaleString() || 0}</div>
                                                    <div className="text-[10px] text-gray-400">Cash in Hand</div>
                                                </td>
                                                <td className="p-4">
                                                    {/* @ts-ignore */}
                                                    {(u.agentProfile?.currentCashBalance || 0) > 0 ? (
                                                        <Button size="sm" variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 h-7 text-xs"
                                                            /* @ts-ignore */
                                                            onClick={() => handleSettleCash(u._id, u.agentProfile?.currentCashBalance || 0)}
                                                        >
                                                            Settle Cash
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Settled</span>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        )}

                                        <td className="p-4">
                                            {u.isDeleted ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${u.deletedBy === 'admin' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {u.deletedBy === 'admin' ? 'ADMIN REMOVED' : 'USER DELETED'}
                                                    </span>
                                                    {u.deletedAt && <span className="text-[10px] text-gray-400">on {new Date(u.deletedAt).toLocaleDateString()}</span>}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!u.isDeleted && u._id !== user?.id && (
                                                <button
                                                    onClick={() => deleteUser(u._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )))}
                            {(!loading && (activeTab === 'admins' ? admins : activeTab === 'delivery' ? deliveryPartners : customers).length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
