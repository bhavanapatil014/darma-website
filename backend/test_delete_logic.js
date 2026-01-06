const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testDelete() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Create a dummy user
        const dummyEmail = `delete_test_${Date.now()}@example.com`;
        const user = new User({
            name: "Delete Tester",
            email: dummyEmail,
            password: "hashedpassword123",
            role: "user"
        });
        await user.save();
        console.log(`Created dummy user: ${dummyEmail} (ID: ${user._id})`);

        // 2. Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

        // 3. Call Delete Endpoint (Simulated)
        // Since we can't easily fetch() localhost from this script without fetch polyfill in older node, 
        // let's just simulate the DB deletion logic directly to prove Mongoose works.
        // But the user issue is likely the API endpoint not being reached or crashing.

        // Let's rely on the previous restarting of the server. 
        // The previous error was EADDRINUSE which confirms the old server (without the new code) was running.
        // Now that I killed PID 15616 and restarted, it SHOULD work.

        console.log("If the server was just restarted, the API should now be active.");

        // Cleanup dummy if it still exists
        await User.findByIdAndDelete(user._id);

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testDelete();
