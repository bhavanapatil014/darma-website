"use client"
import * as React from "react"
import { useRouter } from "next/navigation"

interface User {
    id: string
    name: string
    email: string
    role?: string
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string, dateOfBirth?: string, phoneNumber?: string) => Promise<void>
    logout: () => void
    sendOtp: (identifier: string) => Promise<void>
    verifyOtp: (identifier: string, otp: string) => Promise<void>
    isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [isLoading, setIsLoading] = React.useState(true) // Start true to prevent premature redirects
    const router = useRouter()

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // setIsLoading(true); // Already true
            fetch('http://localhost:4000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to verify token');
                })
                .then(data => {
                    setUser(data.user);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false); // No token found, checking done.
        }
    }, []);

    const login = async (email: string, password: string) => {
        // ... existing login ...
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/auth/login', {
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
            router.push("/account");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Login failed.");
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (email: string, password: string, name: string, dateOfBirth?: string, phoneNumber?: string) => {
        // ... existing register ...
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/auth/register', {
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
            router.push("/account");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Registration failed.");
        } finally {
            setIsLoading(false)
        }
    }

    const sendOtp = async (identifier: string) => {
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to send OTP');
            }
            alert("OTP sent successfully!");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to send OTP.");
        } finally {
            setIsLoading(false)
        }
    }

    const verifyOtp = async (identifier: string, otp: string) => {
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:4000/api/auth/verify-otp', {
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
            router.push("/account");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Verification failed.");
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
