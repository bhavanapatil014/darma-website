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
        if (existingUser) {
            if (existingUser.isDeleted) {
                // Archive the old deleted account to free up the email
                existingUser.originalEmail = existingUser.email;
                existingUser.email = `deleted_${Date.now()}_${existingUser.email}`;
                await existingUser.save();
                // Proceed to create new user below...
            } else {
                return res.status(400).json({ message: 'User already exists' });
            }
        }

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

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

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
            // Restore deleted account automatically if they try to login again
            user.isDeleted = false;
            user.deletedAt = undefined;
            user.deletedBy = undefined;
            if (user.originalEmail) {
                user.email = user.originalEmail;
                user.originalEmail = undefined;
            }
            await user.save();
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
            // Phone (Fast2SMS Integration using free limits)
            try {
                // If the username is a standard Indian 10-digit format
                const cleanPhone = identifier.replace(/^\+91/, '').replace(/\D/g, '');

                if (cleanPhone.length === 10) {
                    if (process.env.FAST2SMS_AUTH) {
                        const axios = require('axios');
                        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
                            headers: {
                                'authorization': process.env.FAST2SMS_AUTH
                            },
                            params: {
                                'variables_values': otp,
                                'route': 'otp',
                                'numbers': cleanPhone
                            }
                        });
                        console.log(`✅ Fast2SMS SMS sent to ${cleanPhone}:`, response.data);
                    } else {
                        throw new Error("FAST2SMS_AUTH key missing from environment variables.");
                    }
                } else {
                    throw new Error(`Invalid Indian phone number length for Fast2SMS: ${cleanPhone}`);
                }
            } catch (smsError) {
                console.log(`----------------------------------------`);
                console.log(`📲 SMS SIMULATION (Fast2SMS Failed/Not Configured)`);
                console.log(`To: ${identifier}`);
                console.log(`💬 Your OTP is: ${otp}`);
                console.log(`Error msg:`, smsError.message);
                if (smsError.response && smsError.response.data) {
                    console.log(`Fast2SMS Response Data:`, JSON.stringify(smsError.response.data));
                }
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

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

        res.json({ auth: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    } catch (error) {
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
});

// POST /api/auth/login-with-phone (Firebase Auth Sync)
router.post('/login-with-phone', async (req, res) => {
    try {
        let { phoneNumber, uid } = req.body;
        console.log(`Firebase Login Attempt: ${phoneNumber} (UID: ${uid})`);

        if (!phoneNumber) return res.status(400).json({ message: "Phone Number required" });

        // Normalize Phone: Remove +91 if database stores only 10 digits, or keep it.
        // We will check both formats to be friendly.
        const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, ''); // 10 digits

        let user = await User.findOne({
            $or: [{ phoneNumber: phoneNumber }, { phoneNumber: cleanPhone }]
        });

        if (!user) {
            console.log("Creating new user from Firebase Phone Login...");
            user = new User({
                name: "New Member",
                email: `${cleanPhone}@dermakart.local`, // Dummy unique email
                phoneNumber: cleanPhone, // Store 10 digit standard
                password: await bcrypt.hash(Math.random().toString(36), 10),
                role: 'user'
            });
            await user.save();
            // welcome email might fail for dummy email, that's fine
        }

        if (user.isDeleted) return res.status(403).json({ message: "Account deleted." });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

        res.json({
            auth: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Firebase Login Error:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
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

            // Escape email to prevent Regex DoS
            const escapeRegExp = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            const safeEmail = escapeRegExp(email);

            if (manualMatch) {
                console.log("MANUAL MATCH FOUND! ID:", manualMatch._id);
                // Check regex search result
                const user = await User.findOne({ email: { $regex: new RegExp(`^${safeEmail}$`, 'i') } });
                if (!user) {
                    console.log("CRITICAL: Manual match found but Mongoose Regex failed.");
                } else {
                    console.log("Mongoose Regex also found user.");
                }
            } else {
                console.log("NO MANUAL MATCH FOUND in " + allUsers.length + " users.");
                // allUsers.forEach(u => console.log(`- ${u.email}`)); // Reduce noise
            }

            const user = await User.findOne({ email: { $regex: new RegExp(`^${safeEmail}$`, 'i') } });
            if (!user) {
                console.log(`Debug ID 852: User ${email} not found in DB.`);
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.isDeleted) {
                return res.status(403).json({ message: 'Account has been deleted.' });
            }

            const passwordIsValid = await bcrypt.compare(password, user.password);
            if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, message: 'Invalid password' });

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

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
// PUT /api/auth/users/:id/role (Super Admin Only)
router.put('/users/:id/role', verifyToken, async (req, res) => {
    if (req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Require Super Admin Role' });
    }

    try {
        const { role } = req.body;
        if (!['user', 'admin', 'superadmin', 'delivery_partner'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = role;
        await user.save();

        res.json({ message: 'Role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/auth/users/:id (Super Admin Only)
router.delete('/users/:id', verifyToken, async (req, res) => {
    console.log(`DELETE User Request: ID ${req.params.id} by ${req.userId} (Role: ${req.userRole})`);

    if (req.userRole !== 'superadmin') {
        console.warn(`DELETE Refused: User ${req.userId} is not superadmin`);
        return res.status(403).json({ message: 'Require Super Admin Role' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            console.warn(`DELETE Failed: User ${req.params.id} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletedBy = 'admin';
        user.originalEmail = user.email;
        user.email = `deleted_${Date.now()}_${user.email}`;

        await user.save();
        console.log(`DELETE Success: User ${req.params.id} soft deleted.`);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("DELETE User Error:", error);
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
});

// DELETE /api/auth/delete-me
router.delete('/delete-me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletedBy = 'self';
        user.originalEmail = user.email;
        user.email = `deleted_${Date.now()}_${user.email}`;

        await user.save();
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete account", error: error.message });
    }
});

// PUT /api/auth/update-profile
router.put('/update-profile', verifyToken, async (req, res) => {
    try {
        const { name, email, password, currentPassword, phoneNumber } = req.body;
        console.log(`Update Profile Request for ${req.userId}:`, { name, email, hasPassword: !!password });

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update Name
        if (name) user.name = name;

        // Update Phone (Allow clearing it)
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

        // Update Email (Check for uniqueness)
        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) {
                console.warn(`Update Failed: Email ${email} already in use.`);
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        // Update Password
        if (password && password.trim() !== "") {
            if (!currentPassword) {
                console.warn("Update Failed: Missing current password.");
                return res.status(400).json({ message: "Current password is required to set a new password." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                console.warn("Update Failed: Incorrect current password.");
                return res.status(400).json({ message: "Incorrect current password" });
            }
            user.password = await bcrypt.hash(password, 10);
            console.log("Password updated successfully.");
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
});

module.exports = router;
