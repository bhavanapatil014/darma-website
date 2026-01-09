"use client"
import AdminNegotiations from "@/components/admin/admin-negotiations"

export default function NegotiationsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Price Negotiations</h1>
            <p className="text-gray-500">Review and manage price negotiation offers from users.</p>
            <AdminNegotiations />
        </div>
    )
}
