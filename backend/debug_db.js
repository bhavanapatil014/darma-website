const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
require('dotenv').config();

const testConnection = async () => {
    console.log('Starting DB diagnosis...');
    try {
        await connectDB();
        console.log('Connection function executed.');

        // Wait a bit for connection to be fully ready if async logic inside connectDB is complex
        // check mongoose state
        console.log('Mongoose validation state:', mongoose.connection.readyState);
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

        if (mongoose.connection.readyState !== 1) {
            console.log('Waiting for connection...');
            await new Promise(resolve => {
                mongoose.connection.once('open', resolve);
                mongoose.connection.once('error', (err) => {
                    console.error('Event Connection Error:', err);
                    resolve();
                });
            });
        }

        console.log('Mongoose state after wait:', mongoose.connection.readyState);

        if (mongoose.connection.readyState === 1) {
            console.log('Attempting to find products...');
            const products = await Product.find({});
            console.log(`Found ${products.length} products.`);
        } else {
            console.error('Failed to establish connection in test script.');
        }

    } catch (error) {
        console.error('Diagnostic Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

testConnection();
