"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login?redirect=/admin")
            } else if (user.role !== "admin" && user.role !== "superadmin") {
                alert("Unauthorized access")
                router.push("/")
            } else {
                setAuthorized(true)
            }
        }
    }, [user, isLoading, router])

    if (isLoading || !authorized) {
        return <div className="flex items-center justify-center min-h-screen">Loading Admin Panel...</div>
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto max-h-screen">
                {children}
            </main>
        </div>
    )
}
