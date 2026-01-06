const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

async function migrateRecentOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Migration");

        const targetEmail = 'rabiya@darma.com';
        const sourceEmail = 'bhavanapatil5351@gmail.com';

        const result = await Order.updateMany(
            { email: sourceEmail },
            { $set: { email: targetEmail } }
        );

        console.log(`Updated ${result.modifiedCount} orders from ${sourceEmail} to ${targetEmail}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateRecentOrders();
