const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

async function migrateOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Migration");

        const result = await Order.updateMany(
            { email: 'rabiya@gmail.com' },
            { $set: { email: 'rabiya@darma.com' } }
        );

        console.log(`Updated ${result.modifiedCount} orders from rabiya@gmail.com to rabiya@darma.com`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateOrders();
