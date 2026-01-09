"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { MessageSquare, Paperclip, X, Send } from "lucide-react"

export default function NegotiationChat({ product }: { product: any }) {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<any[]>([])
    const [text, setText] = useState('')
    const [image, setImage] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Load Chat
    useEffect(() => {
        if (isOpen && user) {
            fetchChat()
            const interval = setInterval(fetchChat, 5000) // Poll every 5s
            return () => clearInterval(interval)
        }
    }, [isOpen, user])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages, isOpen])

    const fetchChat = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`https://darma-website.onrender.com/api/negotiate/product/${product.id || product._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data) setMessages(data.messages || [])
            }
        } catch (e) { console.error(e) }
    }

    const handleSend = async () => {
        if (!text.trim() && !image) return
        setLoading(true)
        console.log("Sending negotiation...", { text, hasImage: !!image })
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://darma-website.onrender.com/api/negotiate/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: product.id || product._id, text, image })
            })
            if (res.ok) {
                setText('')
                setImage('')
                fetchChat()
            } else {
                console.error("Failed to send", res.status)
                const errorData = await res.json().catch(() => ({}))
                alert(`Failed to send: ${res.status} ${errorData.message || res.statusText}`)
            }
        } catch (e) {
            console.error("Negotiation send error", e)
            alert("Failed to send message due to network error.")
        }
        setLoading(false)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // MVP: Client-side Base64 convert (Simpler than server upload for now)
        const reader = new FileReader()
        reader.onloadend = () => {
            setImage(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    if (!user) return null

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Negotiate / Chat with Dealer
            </Button>

            {isOpen && (
                <div className="fixed bottom-4 left-4 right-4 md:right-auto md:w-96 md:left-4 bg-white rounded-lg shadow-2xl border z-[200] flex flex-col max-h-[600px] overflow-hidden">
                    {/* Header */}
                    <div className="bg-teal-700 text-white p-3 flex justify-between items-center">
                        <h3 className="font-bold text-sm">Negotiation: {product.name}</h3>
                        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3 min-h-[300px]">
                        {messages.length === 0 && <p className="text-center text-xs text-gray-400 mt-10">Start the conversation...</p>}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.sender === 'user' ? 'bg-teal-100 text-teal-900 rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
                                    }`}>
                                    {m.image && <img src={m.image} alt="attachment" className="w-full rounded mb-2 max-h-40 object-cover" />}
                                    {m.text && <p>{m.text}</p>}
                                    <div className="text-[10px] opacity-50 text-right mt-1">
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Image Preview */}
                    {image && (
                        <div className="p-2 bg-gray-100 border-t flex justify-between items-center">
                            <span className="text-xs text-gray-500">Image attached</span>
                            <button onClick={() => setImage('')} className="text-red-500 text-xs hover:underline">Remove</button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 bg-white border-t flex gap-2 items-center">
                        <label className="cursor-pointer text-gray-400 hover:text-gray-600 p-1">
                            <Paperclip className="w-5 h-5" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <input
                            type="text"
                            className="flex-1 text-sm border-none focus:ring-0 px-2 py-1 outline-none"
                            placeholder="Type a message..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={(!text.trim() && !image) || loading}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center shrink-0 ${(!text.trim() && !image) || loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md'}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
