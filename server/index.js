import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables FIRST before importing routes
dotenv.config();

// Import routes AFTER dotenv is loaded
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import aiRoutes from './routes/ai.js';
import shieldRoutes from './routes/shield.js';
import paymentRoutes from './routes/payment.js';
import uploadRoutes from './routes/upload.js';
import jobRoutes from './routes/jobs.js';
import priceRoutes from './routes/price.js';
import productRoutes from './routes/products.js';

const app = express();

// Middleware
// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Use env var in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
// Connect to MongoDB with Retry
const connectDB = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        console.log(`⚠️ Retrying... (${retries} attempts left)`);

        if (retries > 0) {
            setTimeout(() => connectDB(retries - 1), 5000);
        } else {
            console.error('💥 MongoDB connection failed after retries');
            process.exit(1);
        }
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected! Attempting reconnect...');
    connectDB();
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shield', shieldRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SwapSafe API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
