const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database Connection
const connectDB = require('./config/db');
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Setup Static File Serving for Uploads ---
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
// ---------------------------------------------

// Import Routes
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
// const cartRoutes = require('./routes/cart'); // Cart logic is frontend-only for now
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');

// Use Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', require('./routes/payment'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/settings', require('./routes/settings'));

// JSON 404 Handler for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API Route not found' });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const startServer = async () => {
    try {
        app.listen(PORT, async () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
            console.log(`Coupons route registered at /api/coupons`);

            // --- Ensure Admin User Exists ---
            const User = require('./models/User');
            // ... (Your admin creation logic if needed) ...
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();