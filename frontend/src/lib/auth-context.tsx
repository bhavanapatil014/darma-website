"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface User {
    id: string
    name: string
    email: string
    role?: string
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string, redirectPath?: string) => Promise<void>
    register: (email: string, password: string, name: string, dateOfBirth?: string, phoneNumber?: string, redirectPath?: string) => Promise<void>
    logout: () => void
    sendOtp: (identifier: string) => Promise<void>
    verifyOtp: (identifier: string, otp: string, redirectPath?: string) => Promise<void>
    isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // ... (state lines 25-50 same, skipping)
    const [user, setUser] = React.useState<User | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const router = useRouter()

    React.useEffect(() => {
        // Pre-warm backend (Render Cold Start mitigation)
        fetch(`https://darma-website.onrender.com/api/settings`).catch(() => { });

        const token = localStorage.getItem('token');
        if (token) {
            fetch(`https://darma-website.onrender.com/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                    } else if (res.status === 401 || res.status === 403) {
                        // Only remove token if explicitly unauthorized
                        console.warn("Token expired or invalid (401/403). Logging out.");
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        console.warn(`Auth check failed with status ${res.status}. Preserving token.`);
                        // Do not clear token. Backend might be starting up (502) or erroring (500).
                    }
                })
                .catch((err) => {
                    console.error("Network error during auth check. Preserving token.", err);
                    // Do not clear token.
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string, redirectPath?: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`https://darma-website.onrender.com/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Login failed');
            }
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('token', data.token);
            router.push(redirectPath || "/account");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Login failed.");
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (email: string, password: string, name: string, dateOfBirth?: string, phoneNumber?: string, redirectPath?: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`https://darma-website.onrender.com/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, dateOfBirth, phoneNumber })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Registration failed');
            }
            const data = await res.json();
            setUser(data.user);
            // Auto login on register doesn't set token usually, but here it might? 
            // The Original code didn't save token in register, so user had to login potentially? 
            // Wait, original code: router.push("/account"). 
            // But if token isn't saved, reload loses auth.
            // Assuming backend returns token on register (it usually does).
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            router.push(redirectPath || "/account");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Registration failed.");
        } finally {
            setIsLoading(false)
        }
    }

    const sendOtp = async (identifier: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`https://darma-website.onrender.com/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to send OTP');
            }
            const data = await res.json();
            if (data.debugOtp) {
                toast.success(`OTP Sent! (Code: ${data.debugOtp})`);
            } else {
                toast.success("OTP sent successfully!");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send OTP.");
        } finally {
            setIsLoading(false)
        }
    }

    const verifyOtp = async (identifier: string, otp: string, redirectPath?: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`https://darma-website.onrender.com/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Verification failed');
            }
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('token', data.token);
            router.push(redirectPath || "/account");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Verification failed.");
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('token')
        router.push("/")
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, sendOtp, verifyOtp, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
