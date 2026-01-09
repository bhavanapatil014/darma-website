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
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {(activeTab === 'admins' ? admins : customers).map(u => (
                                <tr key={u._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">
                                        {u.name}
                                        {u.isDeleted && <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded font-bold">DELETED</span>}
                                    </td>
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
                                </tr>
                            ))}
                            {(activeTab === 'admins' ? admins : customers).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No users found in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
