"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: '',
        logoUrl: '',
        heroTitle: '',
        heroSubtitle: '',
        contactEmail: ''
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const res = await fetch('http://localhost:4000/api/settings')
            const data = await res.json()
            setSettings(data)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await fetch('http://localhost:4000/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                alert("Settings saved!")
            }
        } catch (error) {
            alert("Failed to save")
        }
    }

    if (loading) return <div className="p-8">Loading Settings...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Site Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Site Name</label>
                    <input className="w-full p-2 border rounded"
                        value={settings.siteName}
                        onChange={e => setSettings({ ...settings, siteName: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Logo URL</label>
                    <input className="w-full p-2 border rounded"
                        value={settings.logoUrl}
                        onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} />
                    <p className="text-xs text-gray-500 mt-1">Upload image in Products page first to generate a URL if needed.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Hero Title</label>
                    <input className="w-full p-2 border rounded"
                        value={settings.heroTitle}
                        onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
                    <textarea className="w-full p-2 border rounded"
                        value={settings.heroSubtitle}
                        onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input className="w-full p-2 border rounded"
                        value={settings.contactEmail}
                        onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} />
                </div>

                <Button type="submit" className="w-full">Save Changes</Button>
            </form>
        </div>
    )
}
