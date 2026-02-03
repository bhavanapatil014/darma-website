const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Helper: Send Email via SendGrid (HTTP) or Nodemailer (SMTP)
const sendEmailWrapper = async ({ to, subject, html }) => {
    try {
        // Option A: SendGrid (HTTP API) - Bypasses Render Firewall
        if (process.env.EMAIL_SERVICE === 'sendgrid') {
            if (!process.env.SENDGRID_API_KEY) throw new Error("Missing SENDGRID_API_KEY");

            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to,
                from: process.env.SMTP_FROM || 'bhavanapatil014@gmail.com', // MUST be verified in SendGrid
                subject,
                html,
            };
            await sgMail.send(msg);
            console.log(`✅ Email sent via SendGrid to: ${Array.isArray(to) ? to.join(', ') : to}`);
            return;
        }

        // Option B: Nodemailer (SMTP) - For Localhost or Paid Render
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DermaKart" <noreply@dermakart.com>',
            to,
            subject,
            html
        });
        console.log(`✅ Email sent via SMTP to: ${Array.isArray(to) ? to.join(', ') : to}`);

    } catch (error) {
        console.error("❌ Email Sending Failed:", error.response ? error.response.body : error.message);
        // Fallback or re-throw not needed for async notification, just log.
    }
};

// Async Transporter Creator (Legacy SMTP)
const getTransporter = async () => {
    // 1. Try Configured SMTP
    if (process.env.SMTP_USER && !process.env.SMTP_USER.includes('put-your') && process.env.SMTP_PASS && !process.env.SMTP_PASS.includes('put-your')) {
        const port = process.env.SMTP_PORT || 587; // Default to 587 (TLS)
        const isSecure = port == 465;

        console.log(`📧 Initializing SMTP Transporter (Host: ${process.env.SMTP_HOST || 'gmail'}, Port: ${port}, Secure: ${isSecure})`);

        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: port,
            secure: isSecure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            logger: true,
            debug: true,
            connectionTimeout: 10000,
        });
    }

    // 2. Fallback: Ethereal (Dev Mode)
    console.log("⚠️  SMTP Credentials missing. Using Ethereal.");
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
    const itemsList = order.products.map(item => {
        const price = typeof item.priceAtPurchase === 'number' ? item.priceAtPurchase : 0;
        return `<li>${item.name} x ${item.quantity || 1} - ₹${price.toFixed(2)}</li>`
    }).join('');

    const total = typeof order.totalAmount === 'number' ? order.totalAmount : 0;

    return `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order, ${order.customerName}!</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total Amount:</strong> ₹${total.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${(order.paymentMethod || 'Unknown').toUpperCase()}</p>
        
        <h3>Items:</h3>
        <ul>${itemsList}</ul>
        
        <h3>Shipping Address:</h3>
        <p>${order.address}</p>

        <p><strong>Status:</strong> ${order.status}</p>
        
        <p>We will notify you when your order is shipped.</p>
    `;
};

// Template for Admin Notification
const formatAdminEmail = (order, customer) => {
    const itemsList = order.products.map(item => {
        const price = typeof item.priceAtPurchase === 'number' ? item.priceAtPurchase : 0;
        return `<li>${item.name} x ${item.quantity || 1} - ₹${price.toFixed(2)}</li>`
    }).join('');

    const total = typeof order.totalAmount === 'number' ? order.totalAmount : 0;

    return `
        <h1>New Order Received</h1>
        <p><strong>Customer:</strong> ${order.customerName} (${order.email})</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Amount:</strong> ₹${total.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
        
        <h3>Items Ordered:</h3>
        <ul>${itemsList}</ul>

        <h3>Shipping Address:</h3>
        <p>${order.address}</p>

        <p><strong>Status:</strong> ${order.status} (Payment: ${order.paymentStatus})</p>
    `;
};

const isDummyEmail = (email) => {
    return !email || email.endsWith('@darma.com') || email.endsWith('@dermakart.local');
};

const sendOrderEmails = async (order, user) => {
    try {
        // 1. Send to Customer
        if (!isDummyEmail(order.email)) {
            await sendEmailWrapper({
                to: order.email,
                subject: `Order Confirmation - ${order._id}`,
                html: formatOrderEmail(order)
            });
        } else {
            console.log(`Skipped Order Email to dummy address: ${order.email}`);
        }

        // 2. Send to Admin(s)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';

        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await sendEmailWrapper({
                to: recipients,
                subject: `New Order Alert - ${order._id}`,
                html: formatAdminEmail(order, user)
            });
        }

    } catch (error) {
        console.error("Error sending order emails:", error);
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
        <a href="${process.env.FRONTEND_URL || 'https://venkataderma.com'}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Login to Your Account</a>
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
        <a href="${process.env.FRONTEND_URL || 'https://venkataderma.com'}/admin/users">View User in Admin Panel</a>
    `;
};

const sendWelcomeEmails = async (user) => {
    try {
        // 1. Send to User
        if (!isDummyEmail(user.email)) {
            await sendEmailWrapper({
                to: user.email,
                subject: "Registration Successful - Welcome to DermaKart 🌿",
                html: formatWelcomeEmail(user)
            });
        } else {
            console.log(`Skipped Welcome Email to dummy address: ${user.email}`);
        }

        // 2. Send to Admins (Notification)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';
        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await sendEmailWrapper({
                to: recipients,
                subject: `New User Alert: ${user.name}`,
                html: formatAdminNewUserEmail(user)
            });
        }

    } catch (error) {
        console.error("Error sending welcome emails:", error);
    }
};

const sendLoginNotification = async (user, method = "Password") => {
    try {
        const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // 1. Send to User
        if (!isDummyEmail(user.email)) {
            await sendEmailWrapper({
                to: user.email,
                subject: `Security Alert: Login Detected`,
                html: formatLoginNotificationEmail(user, time, method)
            });
        } else {
            console.log(`Skipped Login Notification to dummy address: ${user.email}`);
        }

        // 2. Send to Admins (Notification)
        const superAdminEmail = 'bhavanapatil5351@gmail.com';
        const adminEmail = 'bhavanapatil014@gmail.com';
        const recipients = [superAdminEmail, adminEmail].filter(Boolean);

        if (recipients.length > 0) {
            await sendEmailWrapper({
                to: recipients,
                subject: `Admin Alert: User Login - ${user.name}`,
                html: formatAdminLoginAlert(user, time, method)
            });
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
        await sendEmailWrapper({
            to: email,
            subject: "Your Login OTP - DermaKart",
            html: formatOtpEmail(otp)
        });
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



// Template for Delivery Updates
const formatDeliveryEmail = (order, type) => {
    const trackingLink = `${process.env.FRONTEND_URL || 'https://venkataderma.com'}/account/orders/${order._id}`;

    if (type === 'out_for_delivery') {
        return `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #0d9488;">🚚 Out for Delivery!</h1>
                <p>Hello ${order.customerName},</p>
                <p>Your order <strong>#${order._id.toString().slice(-6)}</strong> is on its way!</p>
                
                <div style="background: #f0fdf4; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #166534;">Share this OTP with the delivery agent:</p>
                    <h2 style="margin: 10px 0 0 0; font-size: 32px; letter-spacing: 5px; color: #15803d;">${order.deliveryOtp}</h2>
                </div>

                <p><strong>Courier:</strong> ${order.courierName || 'Venkata Express'}</p>
                <p><strong>Payment to Collect:</strong> ₹${order.paymentMethod === 'cod' && order.paymentStatus === 'pending' ? order.totalAmount : '0 (Prepaid)'}</p>
                
                <a href="${trackingLink}" style="display: inline-block; background: #0f766e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a>
            </div>
        `;
    }

    if (type === 'delivered') {
        return `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #16a34a;">✅ Delivered Successfully</h1>
                <p>Hello ${order.customerName},</p>
                <p>Your order <strong>#${order._id.toString().slice(-6)}</strong> has been delivered.</p>
                <p>We hope you enjoy your products!</p>
                <br>
                <a href="${trackingLink}" style="color: #0f766e;">View Order Details</a>
            </div>
        `;
    }

    if (type === 'failed') {
        const lastAttempt = order.deliveryAttempts && order.deliveryAttempts.length > 0
            ? order.deliveryAttempts[order.deliveryAttempts.length - 1]
            : { reason: 'Unknown' };

        return `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #dc2626;">❌ Delivery Attempt Failed</h1>
                <p>Hello ${order.customerName},</p>
                <p>We tried to deliver your order <strong>#${order._id.toString().slice(-6)}</strong> but failed.</p>
                <p><strong>Reason:</strong> ${lastAttempt.reason}</p>
                <p>We will attempt delivery again soon.</p>
            </div>
        `;
    }
};

const sendDeliveryUpdateEmail = async (order, type) => {
    try {
        if (!isDummyEmail(order.email)) {
            let subject = "";
            if (type === 'out_for_delivery') subject = `🚚 Out for Delivery: Order #${order._id.toString().slice(-6)}`;
            else if (type === 'delivered') subject = `✅ Delivered: Order #${order._id.toString().slice(-6)}`;
            else if (type === 'failed') subject = `❌ Delivery Failed: Order #${order._id.toString().slice(-6)}`;

            await sendEmailWrapper({
                to: order.email,
                subject: subject,
                html: formatDeliveryEmail(order, type)
            });
        }
    } catch (error) {
        console.error("Error sending delivery email:", error);
    }
}

module.exports = { sendOrderEmails, sendWelcomeEmails, sendOtp, sendLoginNotification, sendDeliveryUpdateEmail };
