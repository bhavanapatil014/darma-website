const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendWelcomeEmails, sendOtp, sendLoginNotification } = require('../utils/emailService');

const { verifyToken } = require('../middleware/authMiddleware');




// Debug Route: Get all users
router.get('/debug-users', async (req, res) => {
    // ... existing debug logic
});

// TEST EMAIL ROUTE
router.get('/test-email', async (req, res) => {
    try {
        const nodemailer = require('nodemailer'); // Ensure nodemailer is imported here if not globally
        console.log("Testing Email Sending...");

        // Check if Envs are loaded
        const configStatus = {
            user: process.env.SMTP_USER ? (process.env.SMTP_USER.includes('put-your') ? "Default/Exem" : "Set") : "Missing",
            pass: process.env.SMTP_PASS ? "Set" : "Missing",
            host: process.env.SMTP_HOST || 'Default (gmail)',
            port: process.env.SMTP_PORT || 'Default (587)'
        };

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000, // 10s timeout
            greetingTimeout: 5000,
            socketTimeout: 10000
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Test" <noreply@dermakart.com>',
            to: process.env.SMTP_USER, // Send to self
            subject: "Test Email from DermaKart",
            text: "If you receive this, email service is working.",
            html: "<b>Email Service Working!</b>"
        });

        res.json({ message: 'Email sent successfully', info, config: configStatus });
    } catch (error) {
        console.error("Test Email Failed:", error);
        res.status(500).json({
            message: 'Email sending failed',
            error: error.message,
            stack: error.stack,
            config: {
                user: process.env.SMTP_USER ? "Set" : "Missing",
                host: process.env.SMTP_HOST
            }
        });
    }
});


// GET /api/auth/users (Super Admin Only)
router.get('/users', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied: Super Admin only' });
        }
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, dateOfBirth, phoneNumber } = req.body;
        email = email.trim().toLowerCase(); // Sanitize & Lowercase
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (force 'user' role for public registration)
        const user = new User({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            phoneNumber,
            role: 'user'
        });

        await user.save();

        // Send Welcome Emails (Async - Fire & Forget)
        sendWelcomeEmails(user).catch(err => console.error("Welcome Email Failed:", err));

        // Send Login Notification (since they are auto-logged in)
        // Send Login Notification (REMOVED as per user request)
        // await sendLoginNotification(user, "Registration Auto-Login");

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' });

        res.status(201).json({ auth: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        let { identifier } = req.body; // email or phone
        if (!identifier) return res.status(400).json({ message: "Email or Phone is required" });
        identifier = identifier.trim();

        // Find user or create
        let user = await User.findOne({
            $or: [{ email: identifier }, { phoneNumber: identifier }]
        });

        if (!user) {
            // Auto-create user for OTP Login/Signup
            console.log("User not found in OTP flow. Creating new user...");
            const isEmail = identifier.includes('@');
            user = new User({
                name: "New Member",
                email: isEmail ? identifier : `${identifier}@dermakart.local`,
                phoneNumber: isEmail ? undefined : identifier,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                role: 'user'
            });
            await user.save();
            // Async Welcome Email
            sendWelcomeEmails(user).catch(err => console.error("Welcome Email Failed (OTP):", err));
        }
        if (user.isDeleted) {
            return res.status(403).json({ message: "Account is deleted. Please contact support." });
        }
        // If user already existed, we skip sendWelcomeEmails and just send OTP below
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send OTP
        if (identifier.includes('@')) {
            // Email
            await sendOtp(user.email, otp);
            console.log(`Debug: OTP for ${user.email} is ${otp}`);
        } else {
            // Phone (Twilio Integration)

            // 🔥 ALSO Send to User's Email if it's a real email (not fallback @dermakart.local)
            if (user.email && !user.email.includes('@dermakart.local')) {
                console.log(`Sending backup OTP email to: ${user.email}`);
                await sendOtp(user.email, otp);
            }

            try {
                if (process.env.TWILIO_SID && process.env.TWILIO_AUTH && process.env.TWILIO_PHONE) {
                    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
                    await client.messages.create({
                        body: `Your DermaKart Login OTP is ${otp}`,
                        from: process.env.TWILIO_PHONE,
                        to: identifier.startsWith('+') ? identifier : `+91${identifier}` // Default to India +91 if not provided
                    });
                    console.log(`✅ SMS sent to ${identifier} via Twilio`);
                } else {
                    throw new Error("Twilio credentials missing");
                }
            } catch (smsError) {
                console.log(`----------------------------------------`);
                console.log(`📲 SMS SIMULATION (Twilio Failed/Not Configured)`);
                console.log(`To: ${identifier}`);
                console.log(`💬 Your OTP is: ${otp}`);
                console.log(`----------------------------------------`);
            }
        }

        res.json({ message: "OTP sent successfully", debugOtp: otp });
    } catch (error) {
        res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        const user = await User.findOne({
            $or: [{ email: identifier }, { phoneNumber: identifier }]
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isDeleted) {
            return res.status(403).json({ message: "Account is deleted." });
        }

        if (!user.otp || !user.otpExpires || user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (Date.now() > user.otpExpires) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' });

        // Send Login Notification
        // Send Login Notification (REMOVED as per user request)
        // await sendLoginNotification(user, "OTP");

        res.json({ auth: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    } catch (error) {
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is missing' });
        }

        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and Password are required' });
        }

        email = email.trim().toLowerCase(); // Sanitize input
        password = password.trim();

        console.log(`Login attempt for: '${email}'`);

        // Final Debug: Fetch all users and manually compare
        try {
            // Quick connection check
            if (mongoose.connection.readyState !== 1) {
                console.error('CRITICAL: MongoDB is not connected! ReadyState:', mongoose.connection.readyState);
                return res.status(500).json({ message: 'Database Service Unavailable' });
            }

            const allUsers = await User.find({});
            const manualMatch = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (manualMatch) {
                console.log("MANUAL MATCH FOUND! ID:", manualMatch._id);
                // Check regex search result
                const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
                if (!user) {
                    console.log("CRITICAL: Manual match found but Mongoose Regex failed.");
                } else {
                    console.log("Mongoose Regex also found user.");
                }
            } else {
                console.log("NO MANUAL MATCH FOUND in " + allUsers.length + " users.");
                // allUsers.forEach(u => console.log(`- ${u.email}`)); // Reduce noise
            }

            const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
            if (!user) {
                console.log(`Debug ID 852: User ${email} not found in DB.`);
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.isDeleted) {
                return res.status(403).json({ message: 'Account has been deleted.' });
            }

            const passwordIsValid = await bcrypt.compare(password, user.password);
            if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, message: 'Invalid password' });

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

            // Send Login Notification (REMOVED as per user request)

            res.status(200).json({ auth: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        } catch (innerError) {
            console.error("Inner DB Error during login:", innerError);
            throw innerError;
        }

    } catch (error) {
        console.error("LOGIN FAIL ERROR:", error);
        res.status(500).json({ message: 'Login failed', error: error.message, stack: error.stack });
    }
});

// POST /api/auth/create-admin (Super Admin only)
router.post('/create-admin', verifyToken, async (req, res) => {
    if (req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Require Super Admin Role' });
    }

    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create admin', error: error.message });
    }
});
// DELETE /api/auth/users/:id (Super Admin Only)
router.delete('/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Require Super Admin Role' });
    }
    try {
        await User.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
});

// DELETE /api/auth/delete-me
router.delete('/delete-me', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { isDeleted: true, deletedAt: new Date() });
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete account", error: error.message });
    }
});

module.exports = router;
