const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

async function testSchema() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const order = new Order({
            customerName: "Test User",
            email: "test@example.com",
            address: "123 Test St",
            products: [{
                product: "1",
                name: "Test Product",
                image: "/test.jpg",
                quantity: 1,
                priceAtPurchase: 100
            }],
            totalAmount: 100,
            status: 'pending',
            paymentMethod: 'razorpay', // Testing this value
            paymentStatus: 'paid'
        });

        await order.save();
        console.log("Order saved successfully with paymentMethod: razorpay");

        // Cleanup
        await Order.findByIdAndDelete(order._id);
        console.log("Test order cleaned up");

    } catch (error) {
        console.error("Schema Validation Failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testSchema();
