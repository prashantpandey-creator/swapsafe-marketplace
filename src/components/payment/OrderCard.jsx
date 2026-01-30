/**
 * OrderCard Component
 * Displays order information with status and actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderCard = ({ order, role = 'buyer' }) => {
    const getStatusConfig = () => {
        switch (order.status) {
            case 'completed':
                return { icon: <CheckCircle />, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Completed' };
            case 'paid':
            case 'processing':
                return { icon: <Package />, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Processing' };
            case 'shipped':
                return { icon: <Truck />, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'In Transit' };
            case 'disputed':
                return { icon: <AlertTriangle />, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Disputed' };
            default:
                return { icon: <Clock />, color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'Pending' };
        }
    };

    const status = getStatusConfig();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-legion-card border border-white/10 rounded-xl overflow-hidden hover:border-legion-gold/30 transition-colors"
        >
            <div className="flex gap-4 p-4">
                {/* Product Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-700 shrink-0">
                    {order.listing?.images?.[0] ? (
                        <img
                            src={order.listing.images[0]}
                            alt={order.listing.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Package className="w-8 h-8" />
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="text-white font-semibold truncate">
                                {order.listing?.title || 'Item'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Order #{order.orderId}
                            </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.icon}
                            {status.label}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>
                            <p className="text-legion-gold font-bold text-lg">
                                ₹{order.amount?.total?.toLocaleString('en-IN')}
                            </p>
                            <p className="text-gray-500 text-xs">
                                {role === 'seller'
                                    ? `You'll receive: ₹${order.commission?.sellerAmount?.toLocaleString('en-IN')}`
                                    : `${order.delivery?.method || 'meetup'} delivery`
                                }
                            </p>
                        </div>
                        <Link
                            to={`/order/${order._id}`}
                            className="flex items-center gap-1 text-sm text-legion-gold hover:text-yellow-300 transition-colors"
                        >
                            View Details
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Escrow indicator for paid orders */}
            {order.escrow?.isHeld && (
                <div className="px-4 py-2 bg-blue-500/10 border-t border-blue-500/20 flex items-center gap-2 text-sm text-blue-400">
                    <Shield className="w-4 h-4" />
                    <span>Funds held in escrow until delivery confirmed</span>
                </div>
            )}
        </motion.div>
    );
};

// Import Shield for the escrow indicator
import { Shield } from 'lucide-react';

export default OrderCard;
