const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const allOrders = await Order.find({});
        console.log(`Total orders in DB: ${allOrders.length}`);

        const rabiyaOrders = await Order.find({ email: 'rabiya@darma.com' });
        console.log(`Orders for rabiya@darma.com: ${rabiyaOrders.length}`);

        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
        console.log("\n--- Most Recent 5 Orders ---");
        recentOrders.forEach(o => {
            console.log(`ID: ${o._id} | Email: ${o.email} | Date: ${o.createdAt} | Status: ${o.status}`);
        });

        if (rabiyaOrders.length === 0) {
            console.log("No orders found for this user. Listing all emails in orders:");
            allOrders.forEach(o => console.log(`- ${o.email}`));
        } else {
            console.log("Sample Order:", JSON.stringify(rabiyaOrders[0], null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkOrders();
