const nodemailer = require('nodemailer');
require('dotenv').config();

async function debugEmail() {
    console.log("=== EMAIL DEBUGGER ===");
    console.log(`User: ${process.env.SMTP_USER}`);
    console.log(`Pass: ${process.env.SMTP_PASS ? '********' : 'MISSING'}`);
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log("Attempting to verify connection...");
        await transporter.verify();
        console.log("✅ Connection Verified! Credentials seem correct.");

        console.log(`Attempting to send email to: ${process.env.SMTP_USER}...`);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: "DermaKart Debug Test",
            text: "This is a test email to verify your SMTP configuration is working.",
            html: "<h1>It Works!</h1><p>Your email configuration is correct.</p>"
        });

        console.log("✅ Email Sent!");
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Accepted: ${info.accepted}`);
        console.log(`Rejected: ${info.rejected}`);

    } catch (error) {
        console.error("❌ FAILED:");
        console.error(error);
    }
}

debugEmail();
