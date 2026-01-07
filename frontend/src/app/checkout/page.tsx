"use client"
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";

const CheckoutContent = () => {
    const { items: cartItems, total: cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter(); // To parse query params
    const searchParams = useSearchParams();

    // Buy Now State
    const [buyNowItem, setBuyNowItem] = useState<{ product: any, quantity: number } | null>(null);
    const isBuyNow = searchParams.get('buyNow') === 'true';

    // derived state
    const items = isBuyNow && buyNowItem ? [{
        ...buyNowItem.product,
        quantity: buyNowItem.quantity
        // Adapter for CartItem interface if needed
    }] : cartItems;

    const total = isBuyNow && buyNowItem
        ? (buyNowItem.product.price * buyNowItem.quantity)
        : cartTotal;

    const [isSuccess, setIsSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("card");

    // Fetch Buy Now Item Details
    useEffect(() => {
        if (isBuyNow) {
            const pId = searchParams.get('productId');
            const qty = parseInt(searchParams.get('quantity') || '1');

            if (pId) {
                fetch(`http://localhost:4000/api/products/${pId}`)
                    .then(res => res.json())
                    .then(product => {
                        setBuyNowItem({ product, quantity: qty });
                    })
                    .catch(err => console.error("Failed to load buy now product", err));
            }
        }
    }, [isBuyNow, searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const customerData = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: (user?.email || formData.get('email')) as string,
            address: `${formData.get('address')}, ${formData.get('city')} ${formData.get('zipCode')}`,
            phone: formData.get('phone') as string || "9999999999",
        }

        try {
            if (paymentMethod === 'cod') {
                await createOrderInDB(customerData, 'pending', 'cod');
            } else {
                // Razorpay Flow
                const orderRes = await fetch('http://localhost:4000/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: total })
                });

                if (!orderRes.ok) throw new Error("Failed to initiate payment");
                const orderData = await orderRes.json();

                // DUMMY CHECK
                if (orderData.id.startsWith('order_dummy_')) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const verifyRes = await fetch('http://localhost:4000/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: orderData.id,
                            razorpay_payment_id: "pay_dummy_" + Date.now(),
                            razorpay_signature: "dummy_signature"
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.status === 'success') {
                        await createOrderInDB(customerData, 'paid', 'razorpay');
                    } else {
                        alert("Payment Verification Failed");
                        setIsLoading(false);
                    }
                    return;
                }

                const options = {
                    key: "rzp_test_YOUR_KEY_HERE",
                    amount: orderData.amount,
                    currency: "INR",
                    name: "Venkata",
                    description: "Purchase",
                    order_id: orderData.id,
                    handler: async function (response: any) {
                        const verifyRes = await fetch('http://localhost:4000/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.status === 'success') {
                            await createOrderInDB(customerData, 'paid', 'razorpay');
                        } else {
                            alert("Verification Failed");
                            setIsLoading(false);
                        }
                    },
                    prefill: {
                        name: customerData.name,
                        email: customerData.email,
                        contact: customerData.phone
                    },
                    theme: { color: "#2A9D8F" },
                    modal: { ondismiss: () => setIsLoading(false) }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to process order.");
            setIsLoading(false);
        }
    };

    const createOrderInDB = async (customer: any, paymentStatus: string, method: string) => {
        const orderData = {
            customerName: customer.name,
            email: customer.email,
            address: customer.address,
            products: items.map(item => ({
                product: item.id || item._id, // Handle mismatch if any
                name: item.name,
                image: item.image,
                quantity: item.quantity,
                priceAtPurchase: item.price
            })),
            totalAmount: total,
            status: 'pending',
            paymentMethod: method,
            paymentStatus: paymentStatus
        };

        const res = await fetch('http://localhost:4000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) throw new Error("Order creation failed");

        const data = await res.json();
        setOrderId(data._id);
        setIsSuccess(true);

        // ONLY clear main cart if it was a REGULAR checkout
        if (!isBuyNow) {
            clearCart();
        }
        setIsLoading(false);
    }

    if (isSuccess) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
                <p className="text-lg font-mono bg-gray-100 inline-block px-4 py-2 rounded-md mb-6">
                    Order ID: #{orderId}
                </p>
                <div className="mb-8">
                    <p className="text-muted-foreground text-lg mb-2">
                        Thank you for your purchase. We have sent a confirmation email to your inbox.
                    </p>
                    <p className="text-sm text-gray-500">
                        Payment Method: <span className="font-semibold uppercase">{paymentMethod}</span>
                    </p>
                </div>

                <Button asChild size="lg" className="rounded-full">
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                <Button asChild>
                    <Link href="/shop">Start Shopping</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Form */}
                <div>
                    <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name</label>
                                <input name="firstName" required className="w-full p-2 border rounded-md" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <input name="lastName" required className="w-full p-2 border rounded-md" placeholder="Doe" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                name="email"
                                required
                                type="email"
                                className={`w-full p-2 border rounded-md ${user ? 'bg-gray-100 text-gray-500' : ''}`}
                                placeholder="john@example.com"
                                defaultValue={user?.email || ''}
                                readOnly={!!user}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Address</label>
                            <input name="address" required className="w-full p-2 border rounded-md" placeholder="123 Main St" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">City</label>
                                <input name="city" required className="w-full p-2 border rounded-md" placeholder="New York" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Zip Code</label>
                                <input name="zipCode" required className="w-full p-2 border rounded-md" placeholder="10001" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <input name="phone" required type="tel" className="w-full p-2 border rounded-md" placeholder="9876543210" />
                        </div>

                        <h2 className="text-xl font-semibold mt-8 mb-4">Payment Method</h2>
                        <div className="grid gap-4">
                            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 text-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Credit / Debit Card</span>
                                        <span className="text-xs text-gray-500">Visa, Mastercard, RuPay</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </label>

                            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="upi"
                                        checked={paymentMethod === 'upi'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 text-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">UPI</span>
                                        <span className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </label>

                            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 text-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Cash on Delivery</span>
                                        <span className="text-xs text-gray-500">Pay when you receive</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </label>
                        </div>

                        <Button size="lg" className="w-full mt-6" type="submit" disabled={isLoading || items.reduce((sum, item) => sum + item.quantity, 0) > 10}>
                            {isLoading ? "Processing..." : `Place Order - ₹${total.toFixed(2)}`}
                        </Button>
                        {items.reduce((sum, item) => sum + item.quantity, 0) > 10 && (
                            <p className="text-red-500 text-sm mt-2 text-center">
                                Maximum limit is 10 items per order. Please reduce quantity.
                            </p>
                        )}
                    </form>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-6 rounded-2xl h-fit sticky top-24">
                    <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                    <div className="text-sm text-gray-500 mb-4">
                        Total Items: <span className="font-medium text-black">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="space-y-4 mb-6">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.name} x {item.quantity}</span>
                                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-24 text-center">Loading checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    )
}
