"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface Category {
    _id: string
    name: string
    slug: string
    description?: string
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    useEffect(() => {
        loadCategories()
    }, [])

    async function loadCategories() {
        setLoading(true)
        try {
            const res = await fetch(`https://darma-website.onrender.com/api/categories`)
            const data = await res.json()
            setCategories(data)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const slug = name.toLowerCase().replace(/ /g, '-')
            const res = await fetch(`https://darma-website.onrender.com/api/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, description })
            })
            if (res.ok) {
                alert("Category created!")
                setName("")
                setDescription("")
                loadCategories()
            } else {
                const err = await res.json()
                alert(err.message || "Failed to create")
            }
        } catch (error) {
            console.error(error)
            alert("Failed to create category")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            await fetch(`https://darma-website.onrender.com/api/categories/${id}`, { method: 'DELETE' })
            loadCategories()
        } catch (error) {
            console.error(error)
        }
    }

    if (loading) return <div className="p-8">Loading Categories...</div>

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Category Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input className="w-full p-2 border rounded" required
                                value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea className="w-full p-2 border rounded"
                                value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full">Create Category</Button>
                    </form>
                </div>

                {/* List */}
                <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Slug</th>
                                <th className="pb-2">Description</th>
                                <th className="pb-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat._id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 font-medium">{cat.name}</td>
                                    <td className="py-3 text-sm text-gray-500">{cat.slug}</td>
                                    <td className="py-3 text-sm text-gray-500">{cat.description}</td>
                                    <td className="py-3">
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cat._id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
