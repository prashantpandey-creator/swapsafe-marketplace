import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// 10 attempts per 15 min per IP — applies to login + register + guest
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.getAvatar(),
                isVerified: user.isVerified,
                credits: user.credits,
                trustLevel: user.trustLevel,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.isBanned) {
            return res.status(403).json({ error: 'This account has been suspended' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.getAvatar(),
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
                rating: user.rating,
                totalSales: user.totalSales,
                credits: user.credits,
                trustLevel: user.trustLevel,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// @route   POST /api/auth/google
// @access  Public
router.post('/google', authLimiter, async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ error: 'Google auth not configured on server' });
        }

        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleId;
                if (picture && !user.avatar) user.avatar = picture;
                await user.save();
            } else {
                user = await User.create({
                    name,
                    email,
                    googleId,
                    avatar: picture || '',
                    password: (await import('crypto')).randomBytes(32).toString('hex'),
                    isVerified: true,
                });
            }
        }

        if (user.isBanned) {
            return res.status(403).json({ error: 'This account has been suspended' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.getAvatar(),
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
                rating: user.rating,
                totalSales: user.totalSales,
                credits: user.credits,
                trustLevel: user.trustLevel,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Invalid Google credential' });
    }
});

// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// @route   POST /api/auth/guest
// @access  Public
router.post('/guest', authLimiter, async (req, res) => {
    try {
        const crypto = await import('crypto');

        const guestUser = await User.create({
            name: `Guest${Date.now()}`,
            email: `guest_${crypto.randomUUID()}@temp.buyerslegion.com`,
            password: crypto.randomBytes(32).toString('hex'),
            isGuest: true,
            guestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            accountStatus: 'temporary'
        });

        const token = jwt.sign(
            { id: guestUser._id, isGuest: true },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            user: {
                id: guestUser._id,
                name: guestUser.name,
                email: guestUser.email,
                avatar: guestUser.getAvatar(),
                isGuest: true,
                guestExpiresAt: guestUser.guestExpiresAt,
                accountStatus: guestUser.accountStatus,
                createdAt: guestUser.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ error: 'Server error creating guest account' });
    }
});

// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.getAvatar(),
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
                rating: user.rating,
                totalSales: user.totalSales,
                totalPurchases: user.totalPurchases,
                credits: user.credits,
                trustLevel: user.trustLevel,
                isGuest: user.isGuest,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, location, avatar } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (location) user.location = location;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.getAvatar(),
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
                credits: user.credits,
                trustLevel: user.trustLevel,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
