require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkDB = async () => {
    try {
        console.log("--- DB DIAGNOSTIC START ---");
        const mongoUri = process.env.MONGO_URI;
        console.log(`Target URI: ${mongoUri ? 'Defined in .env' : 'UNDEFINED'}`);

        console.log("Attempting Connection...");
        await mongoose.connect(mongoUri, {
            tls: true,
            tlsInsecure: true
        });
        console.log("Connected!");

        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);

        if (count > 0) {
            const admin = await User.findOne({ email: 'admin@darma.com' });
            if (admin) {
                console.log("SUCCESS: Admin User Found!");
                console.log(`ID: ${admin._id}`);
                console.log(`Role: ${admin.role}`);
                console.log(`Password Hash: ${admin.password.substring(0, 10)}...`);
            } else {
                console.log("FAILURE: Admin user NOT found, but other users exist.");
                const allUsers = await User.find({});
                allUsers.forEach(u => console.log(`- Found: ${u.email}`));
            }
        } else {
            console.log("FAILURE: Database is EMPTY.");
        }

    } catch (e) {
        console.error("CONNECTION ERROR:", e);
    } finally {
        console.log("--- DB DIAGNOSTIC END ---");
        mongoose.disconnect();
    }
};

checkDB();
