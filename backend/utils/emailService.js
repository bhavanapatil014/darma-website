const nodemailer = require('nodemailer');

// Async Transporter Creator
const getTransporter = async () => {
    // 1. Try Configured SMTP
    if (process.env.SMTP_USER && !process.env.SMTP_USER.includes('put-your') && process.env.SMTP_PASS && !process.env.SMTP_PASS.includes('put-your')) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // 2. Fallback: Ethereal (Dev Mode)
    console.log("⚠️  SMTP Credentials missing or invalid. Using Ethereal Email for testing...");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

// Template for Order Confirmation (User)
const formatOrderEmail = (order) => {
    const itemsList = order.products.map(item =>
        `<li>${item.name} x ${item.quantity} - ₹${item.priceAtPurchase.toFixed(2)}</li>`
    ).join('');

    return `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order, ${order.customerName}!</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
        
        <h3>Items:</h3>
        <ul>${itemsList}</ul>
        
        <h3>Shipping Address:</h3>
        <p>${order.address}</p>
        
        <p>We will notify you when your order is shipped.</p>
    `;
};

// Template for Admin Notification
const formatAdminEmail = (order, customer) => {
    const itemsList = order.products.map(item =>
        `<li>${item.name} x ${item.quantity} - ₹${item.priceAtPurchase.toFixed(2)}</li>`
    ).join('');

    return `
        <h1>New Order Received</h1>
        <p><strong>Customer:</strong> ${order.customerName} (${order.email})</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        
        <h3>Items Ordered:</h3>
        <ul>${itemsList}</ul>

        <h3>Shipping Address:</h3>
        <p>${order.address}</p>

        <h3>Status:</h3>
        <p>${order.status} (Payment: ${order.paymentStatus})</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/orders">View in Admin Panel</a>
    `;
};

const isDummyEmail = (email) => {
    return !email || email.endsWith('@darma.com') || email.endsWith('@dermakart.local');
};

const sendOrderEmails = async (order, user) => {
    try {
        const transporter = await getTransporter(); // Get valid transporter

        // 1. Send to Customer
        if (!isDummyEmail(order.email)) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart" <noreply@dermakart.com>',
                to: order.email, // Use email from order directly
                subject: `Order Confirmation - ${order._id}`,
                html: formatOrderEmail(order),
            });
            console.log(`Email sent to customer: ${order.email}`);
        } else {
            console.log(`Skipped Order Email to dummy address: ${order.email}`);
        }

        // 2. Send to Admin(s)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';

        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart System" <system@dermakart.com>',
                to: recipients,
                subject: `New Order Alert - ${order._id}`,
                html: formatAdminEmail(order, user),
            });
            console.log(`Email sent to admins: ${recipients.join(', ')}`);
        }

    } catch (error) {
        console.error("Error sending emails:", error);
    }
};

// Template for Welcome Email (User)
const formatWelcomeEmail = (user) => {
    return `
        <h1>Registration Successful!</h1>
        <p>Hello ${user.name},</p>
        <p>You have successfully registered on DermaKart.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>We are thrilled to have you on board. Start shopping for the best skincare products now!</p>
        <br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Login to Your Account</a>
    `;
};

// Template for Admin New User Notification
const formatAdminNewUserEmail = (user) => {
    return `
        <h1>New User Registration</h1>
        <p>A new user has just signed up.</p>
        <ul>
            <li><strong>Name:</strong> ${user.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Role:</strong> ${user.role}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/users">View User in Admin Panel</a>
    `;
};

const sendWelcomeEmails = async (user) => {
    try {
        const transporter = await getTransporter();

        // 1. Send to User
        if (!isDummyEmail(user.email)) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart" <noreply@dermakart.com>',
                to: user.email,
                subject: "Registration Successful - Welcome to DermaKart 🌿",
                html: formatWelcomeEmail(user),
            });
            console.log(`Registration email sent to user: ${user.email}`);
        } else {
            console.log(`Skipped Welcome Email to dummy address: ${user.email}`);
        }

        // 2. Send to Admins (Notification)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';
        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart System" <system@dermakart.com>',
                to: recipients,
                subject: `New User Alert: ${user.name}`,
                html: formatAdminNewUserEmail(user),
            });
            console.log(`New user alert sent to admins: ${recipients.join(', ')}`);
        }

    } catch (error) {
        console.error("Error sending welcome emails:", error);
    }
};

const sendLoginNotification = async (user, method = "Password") => {
    try {
        const transporter = await getTransporter();
        const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // 1. Send to User
        if (!isDummyEmail(user.email)) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart" <noreply@dermakart.com>',
                to: user.email,
                subject: `Security Alert: Login Detected`,
                html: formatLoginNotificationEmail(user, time, method),
            });
            console.log(`Login notification sent to user: ${user.email}`);
        } else {
            console.log(`Skipped Login Notification to dummy address: ${user.email}`);
        }

        // 2. Send to Admins (Notification)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';
        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"DermaKart System" <system@dermakart.com>',
                to: recipients,
                subject: `Admin Alert: User Login - ${user.name}`,
                html: formatAdminLoginAlert(user, time, method),
            });
            console.log(`Login alert sent to admins: ${recipients.join(', ')}`);
        }

    } catch (error) {
        console.error("Error sending login notifications:", error);
    }
};

// Template for OTP Email
const formatOtpEmail = (otp) => {
    return `
        <h1>Your Login OTP</h1>
        <p>Use the following One Time Password to log in to DermaKart:</p>
        <h2 style="background-color: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `;
};

const sendOtp = async (email, otp) => {
    try {
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DermaKart" <noreply@dermakart.com>',
            to: email,
            subject: "Your Login OTP - DermaKart",
            html: formatOtpEmail(otp),
        });
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error("Error sending OTP email:", error);
    }
}

// Template for Login Notification (User)
const formatLoginNotificationEmail = (user, time, method) => {
    return `
        <h1>New Login Alert</h1>
        <p>Hello ${user.name},</p>
        <p>Your account was just logged into successfully.</p>
        <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Method:</strong> ${method}</li>
        </ul>
        <p>If this was not you, please contact support immediately.</p>
    `;
};

// Template for Login Notification (Admin)
const formatAdminLoginAlert = (user, time, method) => {
    return `
        <h1>User Login Alert</h1>
        <p>A user has logged in.</p>
        <ul>
            <li><strong>User:</strong> ${user.name} (${user.email})</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Method:</strong> ${method}</li>
            <li><strong>Role:</strong> ${user.role}</li>
        </ul>
    `;
};



module.exports = { sendOrderEmails, sendWelcomeEmails, sendOtp, sendLoginNotification };
