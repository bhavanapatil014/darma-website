"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Phone, ArrowRight, MessageCircle } from "lucide-react"

import { useSearchParams } from "next/navigation"

function LoginContent() {
    const { login, sendOtp, verifyOtp, isLoading } = useAuth()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || undefined

    // ... View State ...
    const [view, setView] = useState<'phone-input' | 'otp-verify' | 'email-login'>('phone-input')
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Handlers
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phoneNumber.length < 10) {
            alert("Please enter a valid 10-digit phone number")
            return
        }
        await sendOtp(phoneNumber)
        setView('otp-verify')
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        await verifyOtp(phoneNumber, otp, redirectPath)
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        await login(email, password, redirectPath)
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">

                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 border-2 border-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xl">D</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">Dermakart</span>
                    </div>

                    {view === 'email-login' ? (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Login via Email</h1>
                            <p className="text-gray-500 text-sm">Enter your registered email credentials details</p>
                        </>
                    ) : view === 'otp-verify' ? (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
                            <p className="text-gray-500 text-sm">Enter the code sent to +91 {phoneNumber}</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Login with OTP</h1>
                            <p className="text-gray-500 text-sm">Enter your log in details</p>
                        </>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="bg-white">
                    {view === 'phone-input' && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none border-r my-2 pr-2">
                                    <div className="w-5 h-4 bg-orange-500 relative overflow-hidden rounded-sm mr-2 shadow-sm">
                                        <div className="absolute top-1/3 bottom-1/3 w-full bg-white flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-700"></div>
                                        </div>
                                        <div className="absolute bottom-0 h-1/3 w-full bg-green-600"></div>
                                    </div>
                                    <span className="text-gray-500 text-sm font-medium">+91</span>
                                    <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    className="block w-full pl-28 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Phone number"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPhoneNumber(val);
                                    }}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 h-12"
                                disabled={isLoading || phoneNumber.length < 10}
                            >
                                {isLoading ? "Sending..." : (
                                    <>Request OTP <ArrowRight className="w-4 h-4" /></>
                                )}
                            </Button>
                        </form>
                    )}

                    {view === 'otp-verify' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full text-center tracking-[1em] py-3 border border-gray-300 rounded-md text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="------"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg h-12"
                                disabled={isLoading || otp.length < 4}
                            >
                                {isLoading ? "Verifying..." : "Verify & Login"}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setView('phone-input')}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Use a different number
                                </button>
                            </div>
                        </form>
                    )}

                    {view === 'email-login' && (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Login"}
                            </Button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative mt-8 mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or Login Using</span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                        >
                            <MessageCircle className="w-5 h-5 text-green-500" />
                            WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={() => setView(view === 'email-login' ? 'phone-input' : 'email-login')}
                            className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium ${view === 'email-login'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {view === 'email-login' ? (
                                <>
                                    <Phone className="w-4 h-4" />
                                    Phone
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    Email
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer Terms */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            I accept that I have read & understood <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link> and <Link href="#" className="underline hover:text-gray-600">T&Cs</Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        Don't have an account? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { Suspense } from "react"

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
