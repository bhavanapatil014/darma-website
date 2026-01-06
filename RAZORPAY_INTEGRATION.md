# Razorpay Integration Guide for Darma Shop

This guide outlines the steps to integrate Razorpay into your existing Next.js + Node.js application.

## 1. Prerequisites
- Create a [Razorpay Account](https://dashboard.razorpay.com/signup).
- In Dashboard > Settings > API Keys, generate your **Key ID** and **Key Secret**.

## 2. Backend Integration (Node.js)

### Step 2.1: Install Razorpay SDK
Run this in your `backend` directory:
```bash
npm install razorpay
```

### Step 2.2: Update Environment Variables
Add these to `backend/.env`:
```env
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### Step 2.3: Create Payment Route
Create a new file `backend/routes/payment.js`:

```javascript
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create an Order
router.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Amount in smallest currency unit (paise)
            currency: "INR",
            receipt: "order_rcptid_" + Date.now(),
        };
        const order = await instance.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});

// 2. Verify Payment Signature
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ status: 'success', message: 'Payment verified' });
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### Step 2.4: Register Route
In `backend/server.js`:
```javascript
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);
```

---

## 3. Frontend Integration (Next.js)

### Step 3.1: Install Razorpay Script
In `frontend/src/app/layout.tsx`, add the script to the `<head>` or use `next/script`:

```tsx
import Script from 'next/script'

// Inside your RootLayout return:
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```

### Step 3.2: Update Checkout Page
In `frontend/src/app/checkout/page.tsx`, update the `handleSubmit` function only for the "Card/UPI" flow:

```tsx
// 1. Create Order on Server
const orderRes = await fetch('http://localhost:4000/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: total }) // total from cart
});
const orderData = await orderRes.json();

// 2. Initialize Razorpay
const options = {
    key: "YOUR_RAZORPAY_KEY_ID", // Can be public
    amount: orderData.amount, 
    currency: "INR",
    name: "Darma Shop",
    description: "Purchase",
    order_id: orderData.id, // Order ID from backend
    handler: async function (response: any) {
        // 3. Verify Payment on Success
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
            // 4. Create actual Order in Database
            createAppOrder(formData, 'paid', 'razorpay');
        } else {
            alert("Payment Verification Failed");
        }
    },
    prefill: {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email'),
        contact: "9999999999" // Add phone input to form if needed
    },
    theme: {
        color: "#2A9D8F"
    }
};

const rzp = new (window as any).Razorpay(options);
rzp.open();
```

## 4. Testing
- Use **Test Mode** keys from Razorpay.
- Use Razorpay's [Test Card Details](https://razorpay.com/docs/payments/payments/test-card-details/) to simulate success/failure.
