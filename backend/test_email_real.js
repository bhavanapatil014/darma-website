const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log("--- Starting Email Test ---");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_PASS:", process.env.SMTP_PASS ? "****" : "MISSING");

    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('put-your')) {
        console.error("❌ ERROR: SMTP_USER is set to default placeholder or missing.");
        console.log("Please update backend/.env with your actual Gmail address.");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Built-in service for Gmail
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log("Attempting to send mail...");
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to yourself
            subject: "Test Email Debug",
            text: "If you receive this, your email configuration is correct!",
        });
        console.log("✅ SUCCESS! Email sent.");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ FAILED to send email.");
        console.error("Error Message:", error.message);
        console.log("\nTROUBLESHOOTING TIPS:");
        if (error.code === 'EAUTH') {
            console.log("1. Check your email and password in .env.");
            console.log("2. IMPORTANT: If using Gmail, you MUST use an 'App Password', not your login password.");
            console.log("   - Go to Google Account > Security > 2-Step Verification > App Passwords.");
        }
    }
}

testEmail();
