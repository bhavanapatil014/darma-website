const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Using the URI you provided in your .env earlier (checking history to be safe)
// Or use the hardcoded one if env fails
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://bhavanapatil014:Bhavana%40014@cluster0.sx2k5.mongodb.net/darma_db?retryWrites=true&w=majority&appName=Cluster0";

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected!");

        const email = "admin@dermakart.com";
        const password = "admin123";

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log("User exists. Updating role to Super Admin...");
            user.role = 'superadmin';
            user.password = hashedPassword;
            await user.save();
        } else {
            console.log("Creating new Super Admin...");
            user = new User({
                name: "Super Admin",
                email: email,
                password: hashedPassword,
                role: 'superadmin',
                phoneNumber: "9876543210"
            });
            await user.save();
        }

        console.log("------------------------------------------------");
        console.log("SUCCESS! Admin Account Ready.");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("------------------------------------------------");
        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

createAdmin();
