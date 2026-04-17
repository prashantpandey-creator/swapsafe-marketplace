import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check guest expiration
        if (req.user.isGuest && req.user.guestExpiresAt && req.user.guestExpiresAt < new Date()) {
            return res.status(401).json({
                error: 'Guest session expired',
                code: 'GUEST_EXPIRED',
                message: 'Create an account to continue using the marketplace'
            });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Not authorized, token invalid' });
    }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        } catch (error) {
            // Token invalid, but we continue without user
        }
    }

    next();
};
