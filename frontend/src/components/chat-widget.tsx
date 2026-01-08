"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, X, MessageCircle, User, Bot } from "lucide-react"

type Message = {
    id: string
    text: string
    sender: 'user' | 'bot'
    options?: { label: string; value: string }[]
}

import { usePathname } from "next/navigation";

export function ChatWidget() {
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! How can we help you with your skincare journey today?',
            sender: 'bot',
            timestamp: new Date(),
            options: [
                { label: "Track my Order", value: "track_order" },
                { label: "Shipping Info", value: "shipping" },
                { label: "Product Consulatation", value: "consult" },
                { label: "Contact Support", value: "contact" }
            ]
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = (text: string) => {
        if (!text.trim()) return

        // Add User Message
        const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' }
        setMessages(prev => [...prev, userMsg])
        setInputValue("")

        // Simulate Bot Response
        setTimeout(() => {
            let botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm not sure I understand that. Please select an option below or email us at support@dermakart.com",
                sender: 'bot',
                options: [
                    { label: "Track my Order", value: "track_order" },
                    { label: "Contact Support", value: "contact" }
                ]
            }

            const lowerText = text.toLowerCase();

            if (lowerText.includes('track') || lowerText === 'track_order') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "You can track your orders in your Account Dashboard. Would you like to go there now?",
                    sender: 'bot',
                    options: [
                        { label: "Go to My Orders", value: "link_orders" },
                        { label: "Back to Menu", value: "menu" }
                    ]
                }
            } else if (lowerText.includes('shipping') || lowerText === 'shipping') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "We offer FREE Shipping on all orders above ₹999. Standard delivery takes 3-5 business days.",
                    sender: 'bot',
                    options: [{ label: "Back to Menu", value: "menu" }]
                }
            } else if (lowerText.includes('consult') || lowerText === 'consult') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "For personalized skincare advice, our experts are here! What is your skin type?",
                    sender: 'bot',
                    options: [
                        { label: "Oily / Acne Prone", value: "skin_oily" },
                        { label: "Dry / Sensitive", value: "skin_dry" },
                        { label: "Combination", value: "skin_combo" }
                    ]
                }
            } else if (lowerText.includes('skin_oily')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "For Oily skin, we recommend our Salicylic Acid Cleanser and Niacinamide Serum. Check out our 'Treatments' category!",
                    sender: 'bot',
                    options: [{ label: "Shop Treatments", value: "link_shop" }]
                }
            } else if (lowerText.includes('skin_dry')) { // Fix logic
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "For Dry skin, try our Hyaluronic Acid Moisturizer and Vitamin C Serum for a glow!",
                    sender: 'bot',
                    options: [{ label: "Shop Skincare", value: "link_shop" }]
                }
            } else if (lowerText.includes('contact') || lowerText === 'contact') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "You can reach us at:\n📞 +91 98765 43210\n📧 support@venkata.com\n\nOperating Hours: 9 AM - 6 PM (Mon-Sat)",
                    sender: 'bot',
                    options: [{ label: "Back to Menu", value: "menu" }]
                }
            } else if (lowerText === 'menu') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "What else can I help you with?",
                    sender: 'bot',
                    options: [
                        { label: "Track my Order", value: "track_order" },
                        { label: "Shipping Info", value: "shipping" },
                        { label: "Product Consulatation", value: "consult" },
                        { label: "Contact Support", value: "contact" }
                    ]
                }
            } else if (lowerText === 'link_orders') {
                window.location.href = '/account';
                return;
            } else if (lowerText === 'link_shop') {
                window.location.href = '/shop';
                return;
            }

            setMessages(prev => [...prev, botResponse])
        }, 600)
    }

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ backgroundColor: '#ffffff', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    className="fixed bottom-24 right-5 md:bottom-6 md:right-6 w-14 h-14 rounded-full z-50 transition-all hover:scale-110 flex items-center justify-center border border-gray-200"
                >
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-black text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Venkata Bot</h3>
                                <p className="text-xs text-gray-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://wa.me/919370561021?text=Hi%20Darma%2C%20I%20visited%20your%20website%20and%20have%20a%20query."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center transition-colors"
                                title="Chat on WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </a>
                            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-none'
                                        }`}
                                >
                                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                                    {/* Options (Only for Bot) */}
                                    {msg.options && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.options.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => handleSend(opt.value)}
                                                    className="bg-gray-100 hover:bg-gray-200 text-black text-xs px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend(inputValue);
                            }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-100 border-none rounded-full px-4 text-sm focus:ring-1 focus:ring-black outline-none"
                            />
                            <Button type="submit" size="icon" className="rounded-full w-10 h-10 shrink-0">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
