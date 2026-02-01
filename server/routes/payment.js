/**
 * Payment API Routes
 * Handles Razorpay integration, order creation, and payment verification
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { createOrder, verifyPayment, calculateCommission, processRefund, isConfigured, getKeyId, getPaymentDetails } from '../services/payment.js';
import Order from '../models/Order.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';

const router = express.Router();

// ============ CONFIG ============

/**
 * @route   GET /api/payment/config
 * @desc    Get Razorpay key for frontend
 * @access  Public
 */
router.get('/config', (req, res) => {
    res.json({
        success: true,
        configured: isConfigured(),
        keyId: getKeyId()
    });
});

// ============ ORDER CREATION ============

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a new order and Razorpay payment
 * @access  Private
 */
router.post('/create-order', protect, async (req, res) => {
    try {
        const { listingId, deliveryMethod, deliveryAddress } = req.body;

        // Validate listing
        const listing = await Listing.findById(listingId).populate('seller');
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.status !== 'active') {
            return res.status(400).json({ error: 'This listing is no longer available' });
        }

        // Can't buy your own listing
        if (listing.seller._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot buy your own listing' });
        }

        // Calculate commission split
        const deliveryFee = deliveryMethod === 'meetup' ? 0 : 50; // Placeholder delivery fee
        const commission = calculateCommission(listing.price, deliveryFee);

        // Create Razorpay order
        const razorpayOrder = await createOrder(
            commission.total,
            'INR',
            `order_${Date.now()}`,
            {
                listingId: listing._id.toString(),
                buyerId: req.user._id.toString(),
                sellerId: listing.seller._id.toString()
            }
        );

        // Create order in our database
        const order = new Order({
            listing: listing._id,
            buyer: req.user._id,
            seller: listing.seller._id,
            amount: {
                itemPrice: listing.price,
                deliveryFee,
                platformFee: commission.platformFee,
                total: commission.total
            },
            commission: {
                platformPercent: commission.platformPercent,
                platformAmount: commission.platformFee,
                sellerAmount: commission.sellerAmount
            },
            payment: {
                method: 'razorpay',
                razorpayOrderId: razorpayOrder.orderId,
                status: 'pending'
            },
            delivery: {
                method: deliveryMethod || 'meetup',
                address: deliveryAddress || {}
            },
            status: 'payment_pending'
        });

        await order.save();

        res.json({
            success: true,
            order: {
                id: order._id,
                orderId: order.orderId,
                razorpayOrderId: razorpayOrder.orderId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: getKeyId()
            },
            breakdown: commission
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/payment/create-credit-order
 * @desc    Process payment using user's Credit Balance (AI Escrow)
 * @access  Private
 */
router.post('/create-credit-order', protect, async (req, res) => {
    try {
        const { listingId, deliveryMethod, deliveryAddress } = req.body;
        const buyer = await User.findById(req.user._id);

        // 1. Validate listing
        const listing = await Listing.findById(listingId).populate('seller');
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        if (listing.status !== 'active') return res.status(400).json({ error: 'Item no longer available' });
        if (listing.seller._id.toString() === buyer._id.toString()) return res.status(400).json({ error: 'Cannot buy your own item' });

        // 2. Calculate Costs
        const deliveryFee = deliveryMethod === 'meetup' ? 0 : 50;
        const commission = calculateCommission(listing.price, deliveryFee);
        const totalAmount = commission.total;

        // 3. Check Balance
        if (buyer.credits < totalAmount) {
            return res.status(400).json({ error: `nsufficient credits. Required: ${totalAmount}, Available: ${buyer.credits}` });
        }

        // 4. Process "Transaction" (Deduct from Buyer, Hold in Escrow)
        // We do NOT add to seller yet. That happens on delivery confirmation.
        buyer.credits -= totalAmount;
        buyer.totalPurchases += 1;
        await buyer.save();

        // 5. Create Order
        const order = new Order({
            listing: listing._id,
            buyer: buyer._id,
            seller: listing.seller._id,
            amount: {
                itemPrice: listing.price,
                deliveryFee,
                platformFee: commission.platformFee,
                total: totalAmount
            },
            commission: {
                platformPercent: commission.platformPercent,
                platformAmount: commission.platformFee,
                sellerAmount: commission.sellerAmount
            },
            payment: {
                method: 'credits',
                status: 'held', // <--- ESCROW LOGIC
                paidAt: new Date()
            },
            escrow: {
                isHeld: true,
                heldAt: new Date(),
                releaseReason: 'Waiting for AI/Buyer Verification'
            },
            delivery: {
                method: deliveryMethod || 'meetup',
                address: deliveryAddress || {}
            },
            status: 'paid' // Payment is secure, so order is "paid" but funds are held
        });

        await order.save();

        // 6. Update Listing
        listing.status = 'pending';
        await listing.save();

        res.json({
            success: true,
            message: 'Payment successful! Funds held in AI Escrow.',
            order: {
                id: order._id,
                orderId: order.orderId,
                amount: totalAmount,
                status: 'paid'
            },
            remainingCredits: buyer.credits
        });

    } catch (error) {
        console.error('Credit payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ PAYMENT VERIFICATION ============

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

        // Verify signature
        const verification = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        if (!verification.isValid) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Update order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.payment.razorpayPaymentId = razorpayPaymentId;
        order.payment.razorpaySignature = razorpaySignature;
        order.payment.status = 'held'; // Funds held in escrow
        order.payment.paidAt = new Date();
        order.escrow.isHeld = true;
        order.escrow.heldAt = new Date();
        order.status = 'paid';

        await order.save();

        // Update listing status
        await Listing.findByIdAndUpdate(order.listing, { status: 'pending' });

        res.json({
            success: true,
            message: 'Payment verified! Funds held in escrow until delivery is confirmed.',
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDER MANAGEMENT ============

/**
 * @route   GET /api/payment/orders
 * @desc    Get user's orders (as buyer or seller)
 * @access  Private
 */
router.get('/orders', protect, async (req, res) => {
    try {
        const { role = 'buyer' } = req.query;

        const query = role === 'seller'
            ? { seller: req.user._id }
            : { buyer: req.user._id };

        const orders = await Order.find(query)
            .populate('listing', 'title images price')
            .populate('buyer', 'name email')
            .populate('seller', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/payment/orders/:id
 * @desc    Get single order details
 * @access  Private
 */
router.get('/orders/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('listing')
            .populate('buyer', 'name email phone')
            .populate('seller', 'name email phone');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only buyer or seller can view
        const isBuyer = order.buyer._id.toString() === req.user._id.toString();
        const isSeller = order.seller._id.toString() === req.user._id.toString();

        if (!isBuyer && !isSeller) {
            return res.status(403).json({ error: 'Not authorized to view this order' });
        }

        res.json({
            success: true,
            order,
            role: isBuyer ? 'buyer' : 'seller'
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ESCROW RELEASE ============

/**
 * @route   POST /api/payment/confirm-delivery
 * @desc    Buyer confirms delivery - releases escrow to seller
 * @access  Private
 */
router.post('/confirm-delivery', protect, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only buyer can confirm
        if (order.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the buyer can confirm delivery' });
        }

        if (order.payment.status !== 'held') {
            return res.status(400).json({ error: 'Payment is not in escrow' });
        }

        // Release escrow
        order.payment.status = 'released';
        order.escrow.releasedAt = new Date();
        order.escrow.releaseReason = 'Buyer confirmed delivery';
        order.delivery.status = 'delivered';
        order.delivery.deliveredAt = new Date();
        order.buyerConfirmed = true;
        order.confirmedAt = new Date();
        order.status = 'completed';

        await order.save();

        // Update listing status
        await Listing.findByIdAndUpdate(order.listing, { status: 'sold' });

        // Update seller stats
        await User.findByIdAndUpdate(order.seller, {
            $inc: { totalSales: 1 }
        });

        // Update buyer stats
        await User.findByIdAndUpdate(order.buyer, {
            $inc: { totalPurchases: 1 }
        });

        res.json({
            success: true,
            message: `Payment of ₹${order.commission.sellerAmount} released to seller!`,
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/payment/raise-dispute
 * @desc    Buyer raises a dispute before confirming delivery
 * @access  Private
 */
router.post('/raise-dispute', protect, async (req, res) => {
    try {
        const { orderId, reason, details } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only buyer can raise dispute
        if (order.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the buyer can raise a dispute' });
        }

        order.dispute = {
            hasDispute: true,
            reason,
            details,
            createdAt: new Date()
        };
        order.status = 'disputed';

        await order.save();

        res.json({
            success: true,
            message: 'Dispute raised. Our team will review within 24-48 hours.',
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Raise dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
