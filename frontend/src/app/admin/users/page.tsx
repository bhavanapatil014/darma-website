"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
    const { user } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'admins' | 'customers'>('admins')
    const [formData, setFormData] = useState({ name: '', email: '', password: '' })
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
            const res = await fetch(`https://darma-website.onrender.com/api/auth/users?_t=${Date.now()}`, {
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

    async function createAdmin(e: React.FormEvent) {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/auth/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                alert("Admin user created!")
                setFormData({ name: '', email: '', password: '' })
                fetchUsers() // Refresh list
            } else {
                const err = await res.json()
                alert(err.message)
            }
        } catch (error) {
            alert("Failed to create admin")
        }
    }

    async function deleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user? This will soft-delete their account.")) return;
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`https://darma-website.onrender.com/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                fetchUsers()
            } else {
                alert("Failed to delete user")
            }
        } catch (error) {
            alert("Error deleting user")
        }
    }

    const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin')
    const customers = users.filter(u => u.role === 'user')

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">User Management</h1>

            {/* Create Admin Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-teal-700">Add New Administrator</h2>
                <form onSubmit={createAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Create Admin</Button>
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
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Joined Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {(activeTab === 'admins' ? admins : customers).map(u => (
                                <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${u.isDeleted ? 'bg-red-50/50 opacity-75' : ''}`}>
                                    <td className="p-4 font-medium">{u.name}</td>
                                    <td className="p-4 text-gray-600 space-y-1">
                                        <div>{u.email}</div>
                                        {u.phoneNumber && <div className="text-xs text-gray-400">{u.phoneNumber}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-blue-50 text-blue-600'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
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
                            ))}
                            {(activeTab === 'admins' ? admins : customers).length === 0 && (
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
