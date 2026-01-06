const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        console.log("Attempting to connect to MongoDB Atlas...");
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 20000, // Wait 20s before giving up
            tls: true,
            tlsInsecure: true // Keep this for your network
        });

        console.log('--- SUCCESS: Connected to MongoDB Atlas ---');

    } catch (error) {
        console.error('--- CRITICAL ERROR: Could not connect to MongoDB Atlas ---');
        console.error('Check if your IP address is whitelisted in MongoDB Atlas Network Access.');
        console.error('Error Details:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
