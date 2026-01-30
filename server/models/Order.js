import mongoose from 'mongoose';

/**
 * Order Schema - Tracks purchases and payment flow
 */
const orderSchema = new mongoose.Schema({
    // Order ID (human readable)
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    // The listing being purchased
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    // Buyer
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Seller
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Pricing
    amount: {
        itemPrice: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 }, // Our commission
        total: { type: Number, required: true }
    },
    // Commission split (Razorpay Route)
    commission: {
        platformPercent: { type: Number, default: 5 }, // 5% to Buyers Legion
        platformAmount: { type: Number, default: 0 },
        sellerAmount: { type: Number, default: 0 }
    },
    // Payment details
    payment: {
        method: { type: String, enum: ['razorpay', 'cod', 'upi'], default: 'razorpay' },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        status: {
            type: String,
            enum: ['pending', 'paid', 'held', 'released', 'refunded', 'failed'],
            default: 'pending'
        },
        paidAt: { type: Date }
    },
    // Escrow - funds held until delivery confirmed
    escrow: {
        isHeld: { type: Boolean, default: false },
        heldAt: { type: Date },
        releasedAt: { type: Date },
        releaseReason: { type: String }
    },
    // Delivery
    delivery: {
        method: { type: String, enum: ['meetup', 'shiprocket', 'porter', 'legion_runner'], default: 'meetup' },
        trackingId: { type: String },
        status: {
            type: String,
            enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
            default: 'pending'
        },
        address: {
            line1: { type: String },
            line2: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String }
        },
        deliveredAt: { type: Date }
    },
    // Order status
    status: {
        type: String,
        enum: ['created', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'],
        default: 'created'
    },
    // Dispute/Issue
    dispute: {
        hasDispute: { type: Boolean, default: false },
        reason: { type: String },
        details: { type: String },
        createdAt: { type: Date },
        resolvedAt: { type: Date },
        resolution: { type: String }
    },
    // Buyer confirmation
    buyerConfirmed: {
        type: Boolean,
        default: false
    },
    confirmedAt: { type: Date }
}, {
    timestamps: true
});

// Generate readable order ID
orderSchema.pre('save', function (next) {
    if (!this.orderId) {
        this.orderId = `BL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
    next();
});

// Calculate commission split
orderSchema.methods.calculateSplit = function () {
    const platformPercent = this.commission.platformPercent || 5;
    const total = this.amount.itemPrice;

    this.commission.platformAmount = Math.round(total * platformPercent / 100);
    this.commission.sellerAmount = total - this.commission.platformAmount;

    return {
        platform: this.commission.platformAmount,
        seller: this.commission.sellerAmount
    };
};

// Index for queries
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
