const mongoose = require('mongoose');
const Order = require('./models/Order');
const { products } = require('./data');
require('dotenv').config();

async function backfillProductDetails() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Backfill");

        // Create a map for quick lookup
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });

        const orders = await Order.find({});
        for (const order of orders) {
            let updated = false;
            for (const item of order.products) {
                if (!item.name && productMap[item.product]) {
                    item.name = productMap[item.product].name;
                    item.image = productMap[item.product].image;
                    updated = true;
                }
            }
            // Fix legacy validation error
            if (!order.paymentMethod) {
                order.paymentMethod = 'card';
                order.paymentStatus = 'paid';
                updated = true;
            }

            if (updated) {
                await order.save();
                console.log(`Updated details for Order ${order._id}`);
            }
        }
        console.log("Backfill complete");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

backfillProductDetails();
