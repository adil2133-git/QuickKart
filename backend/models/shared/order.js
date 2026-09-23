const mongoose = require("mongoose");

// snapshot of a product at order time, so later price/name changes don't affect past orders
const orderProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

const orderSchema = new mongoose.Schema(
    {
        // e.g. QK1751234567890
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomerProfile",
            required: true,
        },

        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreProfile",
            required: true,
        },

        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            default: null,
        },

        // tracks how many dispatch rounds have run for this order
        deliveryRequestRound: {
            type: Number,
            default: 0,
        },

        deliveryRoundExpiresAt: {
            type: Date,
            default: null,
        },

        driverSearchFailed: {
            type: Boolean,
            default: false,
        },

        products: [orderProductSchema],

        subtotal: {
            type: Number,
            required: true,
        },

        deliveryCharge: {
            type: Number,
            required: true,
            default: 0,
        },

        handlingFee: {
            type: Number,
            required: true,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        paymentMethod: {
            type: String,
            enum: ["ONLINE", "COD"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING",
        },

        // portion of the total paid from wallet balance, rest via Razorpay
        walletAmountUsed: {
            type: Number,
            default: 0,
        },

        // Only meaningful for COD orders once cash has been collected
        // (paymentStatus flips to PAID via confirmCashCollected). Tracks
        // whether that cash has since been handed back to the platform.
        codSettlementStatus: {
            type: String,
            enum: ["PENDING", "SETTLED"],
            default: "PENDING",
        },

        codSettledAt: {
            type: Date,
            default: null,
        },

        // set alongside paymentStatus flipping to PAID via confirmCashCollected
        codCollectedAt: {
            type: Date,
            default: null,
        },

        razorpayOrderId: {
            type: String,
            unique: true,
            sparse: true,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
        },

        deliveryAddress: {
            type: String,
            required: true,
        },

        deliveryCoordinates: {
            lat: {
                type: Number,
                default: null,
            },
            lng: {
                type: Number,
                default: null,
            },
        },

        recipientName: {
            type: String,
            required: true,
        },

        recipientPhone: {
            type: String,
            required: true,
        },

        orderStatus: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "PACKING",
                "READY_FOR_PICKUP",
                "DRIVER_ASSIGNED",
                "PICKED_UP",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
            ],
            default: "PENDING",
        },

        deliveredAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: false,
        },
    }
);

orderSchema.path("orderNumber").default(function () {
    return "QK" + Date.now();
});

module.exports = mongoose.model("Order", orderSchema);