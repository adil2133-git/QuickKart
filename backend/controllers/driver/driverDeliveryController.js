const Order = require("../../models/shared/order");
const DriverProfile = require("../../models/driver/driverProfile");
const DriverDeliveryRequest = require("../../models/driver/driverDeliveryRequest");
const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const { sendOrderDeliveredEmail } = require("../../services/mailService");
const { emitToStore, emitToCustomer, emitToDriver } = require("../../socket");
const { notifyCustomer, notifyStore, notifyDriver } = require("../../services/notificationService");
const driverWalletService = require("../../services/driverWalletService");

const resolveDriverProfile = async (req) => {
    const profile = await DriverProfile.findOne({ userId: req.user.userID });
    if (!profile) throw new Error("Driver profile not found");
    return profile;
};

// shapes an order + request into the delivery request card the frontend renders
const toRequestShape = (order, request) => ({
    requestId: request._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    storeName: order.storeId?.storeName ?? "Store",
    storeAddress: order.storeId?.address ?? "",
    deliveryAddress: order.deliveryAddress,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    deliveryCharge: order.deliveryCharge,
    itemCount: (order.products || []).reduce((s, i) => s + i.quantity, 0),
    products: order.products || [],
    createdAt: request.createdAt,
    pickupDistanceKm: request.pickupDistanceKm ?? 0,
    deliveryDistanceKm: request.deliveryDistanceKm ?? 0,
    estimatedEarnings: request.estimatedEarnings ?? 0,
    expiresInSeconds: request.expiresAt
        ? Math.max(0, Math.round((new Date(request.expiresAt).getTime() - Date.now()) / 1000))
        : 0,
});

// shapes an order into the active-delivery object the frontend tracks
const toActiveShape = (order, currentStage) => ({
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    isPriority: false,
    currentStage: currentStage || orderStatusToStage(order.orderStatus),
    orderStatus: order.orderStatus,
    store: {
        name: order.storeId?.storeName ?? "Store",
        address: order.storeId?.address ?? "",
        logoUrl: order.storeId?.logoUrl ?? null,
        phone: order.storeId?.phone ?? null,
    },
    customer: {
        name: order.recipientName,
        address: order.deliveryAddress,
        phone: order.recipientPhone ?? null,
        deliveryInstruction: order.deliveryInstruction ?? null,
    },
    products: (order.products || []).map((p) => ({
        productId: p.productId?.toString() ?? "",
        productName: p.productName,
        quantity: p.quantity,
        price: p.price,
    })),
    itemCount: (order.products || []).reduce((s, i) => s + i.quantity, 0),
    paymentMethod: order.paymentMethod,
    amountToCollect: order.paymentMethod === "COD" ? order.totalAmount : 0,
    progressSteps: [],
    cashCollected: false,
});

// mirrors the frontend's orderStatusToStage mapping
const orderStatusToStage = (status) => {
    switch (status) {
        case "DRIVER_ASSIGNED": return "NAVIGATE_TO_STORE";
        case "PICKED_UP": return "PICKED_UP";
        case "OUT_FOR_DELIVERY": return "NAVIGATE_TO_CUSTOMER";
        case "DELIVERED": return "DELIVERED";
        default: return "NAVIGATE_TO_STORE";
    }
};

// maps a driver stage to an order status, for stages that should change it
const stageToOrderStatus = (stage) => {
    switch (stage) {
        case "PICKED_UP": return "PICKED_UP";
        case "NAVIGATE_TO_CUSTOMER": return "OUT_FOR_DELIVERY";
        case "DELIVERED": return "DELIVERED";
        default: return null; // REACHED_STORE / REACHED_CUSTOMER don't change order status
    }
};

// GET /api/driver/deliveries/requests
const getDeliveryRequests = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const requests = await DriverDeliveryRequest.find({
            driverId: driver._id,
            status: "PENDING",
        })
            .sort({ createdAt: -1 })
            .lean();

        if (!requests.length) {
            return res.status(200).json({ success: true, requests: [] });
        }

        const orderIds = requests.map((r) => r.orderId);
        const orders = await Order.find({ _id: { $in: orderIds } })
            .populate({ path: "storeId", select: "storeName address logoUrl phone" })
            .lean();

        const orderMap = {};
        orders.forEach((o) => { orderMap[o._id.toString()] = o; });

        const shaped = requests
            .map((r) => {
                const order = orderMap[r.orderId.toString()];
                return order ? toRequestShape(order, r) : null;
            })
            .filter(Boolean);

        return res.status(200).json({ success: true, requests: shaped });
    } catch (err) {
        console.error("[getDeliveryRequests]", err);
        return res.status(500).json({ success: false, message: "Failed to load delivery requests." });
    }
};

// POST /api/driver/deliveries/requests/:requestId/accept
const acceptDeliveryRequest = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { requestId } = req.params;

        const request = await DriverDeliveryRequest.findOne({
            _id: requestId,
            driverId: driver._id,
            status: "PENDING",
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "This order is no longer available.",
            });
        }

        const requestedOrder = await Order.findById(request.orderId).select("paymentMethod");
        if (!requestedOrder || !driverWalletService.isEligibleForOrder(driver, requestedOrder)) {
            await DriverDeliveryRequest.findByIdAndUpdate(requestId, { status: "EXPIRED" });
            return res.status(403).json({
                success: false,
                message:
                    driver.codRestrictionStatus === "WARNING"
                        ? "You can't accept new COD orders until your pending cash is settled."
                        : "You can't accept new delivery requests until your pending cash is settled.",
            });
        }

        // atomic assignment — only succeeds if no driver is assigned yet, so
        // two drivers accepting at the same moment can't both win
        const order = await Order.findOneAndUpdate(
            {
                _id: request.orderId,
                orderStatus: "READY_FOR_PICKUP",
                driverId: null,
            },
            {
                $set: {
                    driverId: driver._id,
                    orderStatus: "DRIVER_ASSIGNED",
                },
            },
            { new: true }
        ).populate({ path: "storeId", select: "storeName address" });

        if (!order) {
            // another driver won the race — expire this driver's request
            await DriverDeliveryRequest.findByIdAndUpdate(requestId, { status: "EXPIRED" });
            return res.status(409).json({
                success: false,
                message: "This order was just picked up by another driver.",
            });
        }

        await DriverDeliveryRequest.findByIdAndUpdate(requestId, { status: "ACCEPTED" });

        // expire every other driver's pending request for this order
        const otherRequests = await DriverDeliveryRequest.find({
            orderId: order._id,
            _id: { $ne: requestId },
            status: "PENDING",
        }).populate({ path: "driverId", select: "userId" });

        if (otherRequests.length) {
            await DriverDeliveryRequest.updateMany(
                { orderId: order._id, _id: { $ne: requestId }, status: "PENDING" },
                { status: "EXPIRED" }
            );

            const { emitToDriver } = require("../../socket");
            otherRequests.forEach((r) => {
                // raw socket event just removes the card instantly — the
                // persisted notification below is what actually surfaces the message
                emitToDriver(r.driverId._id ?? r.driverId, "delivery:request:taken", {
                    orderId: order._id.toString(),
                    requestId: requestId,
                    message: "This order was picked up by another driver.",
                });

                if (r.driverId?.userId) {
                    notifyDriver.requestTaken(
                        r.driverId.userId,
                        order.orderNumber,
                        order._id
                    ).catch(() => {});
                }
            });
        }

        driver.availabilityStatus = "BUSY";
        await driver.save();

        emitToStore(order.storeId._id ?? order.storeId, "order:statusChanged", {
            orderId: order._id.toString(),
            orderStatus: "DRIVER_ASSIGNED",
        });

        CustomerProfile.findById(order.customerId)
            .populate("userId", "_id")
            .lean()
            .then((cp) => {
                if (!cp) return;
                emitToCustomer(cp._id, "order:statusChanged", {
                    orderId: order._id.toString(),
                    orderStatus: "DRIVER_ASSIGNED",
                    orderNumber: order.orderNumber,
                });
                if (cp.userId?._id) {
                    notifyCustomer.driverAssigned(cp.userId._id, order.orderNumber, driver.fullName ?? "Your driver", order._id).catch(() => {});
                }
            }).catch(() => {});

        StoreProfile.findById(order.storeId._id ?? order.storeId)
            .populate("userId", "_id")
            .lean()
            .then((sp) => {
                if (sp?.userId?._id) {
                    notifyStore.driverAssigned(sp.userId._id, order.orderNumber, driver.fullName ?? "Driver", order._id).catch(() => {});
                }
            }).catch(() => {});

        notifyDriver.assigned(
            req.user.userID,
            order.orderNumber,
            order.storeId?.storeName ?? "the store",
            order._id
        ).catch(() => {});

        return res.status(200).json({
            success: true,
            activeDelivery: toActiveShape(order, "NAVIGATE_TO_STORE"),
        });
    } catch (err) {
        console.error("[acceptDeliveryRequest]", err);
        return res.status(500).json({ success: false, message: "Failed to accept delivery request." });
    }
};

// POST /api/driver/deliveries/requests/:requestId/decline
const declineDeliveryRequest = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { requestId } = req.params;

        const updated = await DriverDeliveryRequest.findOneAndUpdate(
            { _id: requestId, driverId: driver._id, status: "PENDING" },
            { status: "REJECTED" }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Request not found or already handled." });
        }

        return res.status(200).json({ success: true, message: "Request declined." });
    } catch (err) {
        console.error("[declineDeliveryRequest]", err);
        return res.status(500).json({ success: false, message: "Failed to decline delivery request." });
    }
};

// GET /api/driver/deliveries/active
const getActiveDelivery = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const order = await Order.findOne({
            driverId: driver._id,
            orderStatus: { $in: ["DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
        })
            .populate({ path: "storeId", select: "storeName address" })
            .lean();

        return res.status(200).json({
            success: true,
            activeDelivery: order ? toActiveShape(order) : null,
        });
    } catch (err) {
        console.error("[getActiveDelivery]", err);
        return res.status(500).json({ success: false, message: "Failed to load active delivery." });
    }
};

// PATCH /api/driver/deliveries/:orderId/stage
// stages run: NAVIGATE_TO_STORE -> REACHED_STORE -> PICKED_UP
//             -> NAVIGATE_TO_CUSTOMER -> REACHED_CUSTOMER -> DELIVERED
const advanceDeliveryStage = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { orderId } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, message: "stage is required." });
        }

        const order = await Order.findOne({ _id: orderId, driverId: driver._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const newOrderStatus = stageToOrderStatus(stage);
        if (newOrderStatus) {
            order.orderStatus = newOrderStatus;
        }

        let completedAt = null;
        let tierUp = null;
        if (stage === "DELIVERED") {
            order.deliveredAt = new Date();
            completedAt = order.deliveredAt.toISOString();
            driver.totalDeliveries += 1;
            driver.availabilityStatus = "ONLINE";

            // Recompute the driver's tier from the new delivery count.
            // Previously currentLevel was set to "BRONZE" at signup and never
            // touched again — every driver was permanently Bronze regardless
            // of activity.
            const previousLevel = driver.currentLevel;
            const { resolveTier } = require("../../services/driverTierService");
            driver.currentLevel = resolveTier(driver.totalDeliveries).key;
            if (driver.currentLevel !== previousLevel) {
                tierUp = driver.currentLevel;
            }

            // Earnings only land in pendingBalance now — they move to
            // availableBalance (withdrawable) once the T+1 settlement cron
            // runs 24h later. See driverWalletService.creditEarning.
            const earningResult = await driverWalletService.creditEarning({ driver, order });
            const payout = earningResult?.amount ?? 0;

            await driver.save();

            if (tierUp) {
                emitToDriver(driver._id, "driver:tierChanged", { newLevel: tierUp });
            }

            notifyDriver.delivered(
                req.user.userID,
                order.orderNumber,
                order.deliveryCharge ?? 0,
                order._id
            ).catch(() => {});
        }

        await order.save();

        if (newOrderStatus) {
            CustomerProfile.findById(order.customerId)
                .populate("userId", "_id")
                .lean()
                .then((cp) => {
                    if (!cp) return;
                    emitToCustomer(cp._id, "order:statusChanged", {
                        orderId: order._id.toString(),
                        orderStatus: newOrderStatus,
                        orderNumber: order.orderNumber,
                    });
                    const uid = cp.userId?._id;
                    if (!uid) return;
                    if (stage === "PICKED_UP")            notifyCustomer.pickedUp(uid, order.orderNumber, order._id).catch(() => {});
                    if (stage === "NAVIGATE_TO_CUSTOMER") notifyCustomer.outForDelivery(uid, order.orderNumber, order._id).catch(() => {});
                    if (stage === "DELIVERED")            notifyCustomer.delivered(uid, order.orderNumber, order._id).catch(() => {});
                }).catch(() => {});
        }

        if (stage === "REACHED_STORE" || stage === "PICKED_UP" || stage === "DELIVERED") {
            StoreProfile.findById(order.storeId)
                .populate("userId", "_id")
                .lean()
                .then((sp) => {
                    emitToStore(order.storeId, "order:statusChanged", {
                        orderId: order._id.toString(),
                        orderStatus: newOrderStatus ?? order.orderStatus,
                    });
                    if (stage === "REACHED_STORE" && sp?.userId?._id) {
                        notifyStore.driverArrived(sp.userId._id, order.orderNumber, driver.fullName ?? "Driver", order._id).catch(() => {});
                    }
                    if (stage === "DELIVERED" && sp?.userId?._id) {
                        notifyStore.delivered(sp.userId._id, order.orderNumber, order._id).catch(() => {});
                    }
                }).catch(() => {});
        }

        if (stage === "DELIVERED") {
            CustomerProfile.findById(order.customerId)
                .populate("userId", "name email")
                .lean()
                .then((customerProfile) => {
                    if (customerProfile?.userId?.email) {
                        sendOrderDeliveredEmail({
                            toEmail: customerProfile.userId.email,
                            customerName: customerProfile.userId.name,
                            order,
                        }).catch(() => {});
                    }
                })
                .catch((err) => console.error("[order delivered email] Failed:", err));
        }

        return res.status(200).json({
            success: true,
            currentStage: stage,
            completedAt,
            tierUp,
        });
    } catch (err) {
        console.error("[advanceDeliveryStage]", err);
        return res.status(500).json({ success: false, message: "Failed to update delivery stage." });
    }
};

// POST /api/driver/deliveries/:orderId/cash-collected
const confirmCashCollected = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, driverId: driver._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.paymentMethod !== "COD") {
            return res.status(400).json({ success: false, message: "Order is not a COD order." });
        }

        // tracked on the driver's profile for settlement later; also
        // recomputes the COD restriction tier (Warning/Restricted/Suspended)
        const restriction = driverWalletService.collectCash({ driver, order });
        await Promise.all([driver.save(), order.save()]);

        driverWalletService.notifyCodRestrictionChange(driver, restriction.oldTier, restriction.newTier);

        emitToDriver(driver._id, "wallet:updated", {
            cashCollected: driver.cashCollected,
            cashPendingSettlement: driver.cashPendingSettlement,
            codRestrictionStatus: driver.codRestrictionStatus,
            reason: "COD_COLLECTED",
        });

        return res.status(200).json({
            success: true,
            message: "Cash collection confirmed.",
            cashPendingSettlement: driver.cashPendingSettlement,
            codRestrictionStatus: driver.codRestrictionStatus,
        });
    } catch (err) {
        console.error("[confirmCashCollected]", err);
        return res.status(500).json({ success: false, message: "Failed to confirm cash collection." });
    }
};

// GET /api/driver/deliveries/completed
const getCompletedDeliveries = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ driverId: driver._id, orderStatus: "DELIVERED" })
                .populate({ path: "storeId", select: "storeName logoUrl" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ driverId: driver._id, orderStatus: "DELIVERED" }),
        ]);

        const deliveries = orders.map((o) => ({
            orderId: o._id.toString(),
            orderNumber: o.orderNumber,
            storeName: o.storeId?.storeName ?? "Store",
            storeLogoUrl: o.storeId?.logoUrl ?? null,
            customerName: o.recipientName,
            deliveryAddress: o.deliveryAddress,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod,
            itemCount: (o.products || []).reduce((s, i) => s + i.quantity, 0),
            completedAt: o.deliveredAt || o.createdAt,
            earnings: o.deliveryCharge ?? 0,
        }));

        return res.status(200).json({
            success: true,
            deliveries,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("[getCompletedDeliveries]", err);
        return res.status(500).json({ success: false, message: "Failed to load delivery history." });
    }
};

// GET /api/driver/deliveries/stats/today
const getTodayStats = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const todayFilter = {
            driverId: driver._id,
            orderStatus: "DELIVERED",
            $or: [
                { deliveredAt: { $gte: startOfDay } },
                { deliveredAt: null, createdAt: { $gte: startOfDay } },
            ],
        };

        const yesterdayFilter = {
            driverId: driver._id,
            orderStatus: "DELIVERED",
            $or: [
                { deliveredAt: { $gte: startOfYesterday, $lt: startOfDay } },
                { deliveredAt: null, createdAt: { $gte: startOfYesterday, $lt: startOfDay } },
            ],
        };

        const [todayOrders, yesterdayOrders] = await Promise.all([
            Order.find(todayFilter).lean(),
            Order.find(yesterdayFilter).lean(),
        ]);

        const todayEarnings = todayOrders.reduce((s, o) => s + (o.deliveryCharge || 0), 0);
        const yesterdayEarnings = yesterdayOrders.reduce((s, o) => s + (o.deliveryCharge || 0), 0);

        const earningsChangePercent = yesterdayEarnings > 0
            ? Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100)
            : 0;

        // hardcoded for now — move to config once per-driver targets are needed
        const dailyTarget = 15;
        const targetBonus = 200;

        return res.status(200).json({
            success: true,
            stats: {
                todayEarnings,
                completedCount: todayOrders.length,
                currentCount: todayOrders.length,
                dailyTarget,
                targetBonus,
                earningsChangePercent,
                cashCollected: todayOrders
                    .filter((o) => o.paymentMethod === "COD")
                    .reduce((s, o) => s + o.totalAmount, 0),
                totalDeliveries: driver.totalDeliveries,
            },
        });
    } catch (err) {
        console.error("[getTodayStats]", err);
        return res.status(500).json({ success: false, message: "Failed to load stats." });
    }
};

// PATCH /api/driver/availability
const updateAvailability = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { status } = req.body; // "ONLINE" | "OFFLINE"

        if (!["ONLINE", "OFFLINE"].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be ONLINE or OFFLINE." });
        }

        if (status === "OFFLINE" && driver.availabilityStatus === "BUSY") {
            return res.status(409).json({
                success: false,
                message: "Cannot go offline while you have an active delivery.",
            });
        }

        if (status === "ONLINE" && !driverWalletService.canGoOnline(driver)) {
            return res.status(403).json({
                success: false,
                message:
                    driver.codRestrictionStatus === "SUSPENDED"
                        ? "Your account is suspended due to unsettled COD cash. Please contact admin."
                        : "You can't go online until your pending COD cash is settled.",
                codRestrictionStatus: driver.codRestrictionStatus,
                cashPendingSettlement: driver.cashPendingSettlement,
            });
        }

        driver.availabilityStatus = status;
        await driver.save();

        // a dispatch round only reaches drivers who were online at that moment —
        // if orders are already waiting, send them now instead of the next retry
        if (status === "ONLINE") {
            const { dispatchToOnlineDriver } = require("../../services/deliveryDispatchService");
            dispatchToOnlineDriver(driver).catch((err) =>
                console.error("[dispatchToOnlineDriver]", err)
            );
        }

        return res.status(200).json({ success: true, status: driver.availabilityStatus });
    } catch (err) {
        console.error("[updateAvailability]", err);
        return res.status(500).json({ success: false, message: "Failed to update availability." });
    }
};

// GET /api/driver/earnings
const getEarningsSummary = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const now = new Date();

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        // Week starts Monday
        const dayOfWeek = (startOfToday.getDay() + 6) % 7; // 0 = Monday
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const dateExpr = { $ifNull: ["$deliveredAt", "$createdAt"] };
        const sumInRange = async (from, to) => {
            const result = await Order.aggregate([
                {
                    $match: {
                        driverId: driver._id,
                        orderStatus: "DELIVERED",
                    },
                },
                {
                    $project: {
                        deliveryCharge: 1,
                        effectiveDate: dateExpr,
                    },
                },
                {
                    $match: {
                        effectiveDate: to ? { $gte: from, $lt: to } : { $gte: from },
                    },
                },
                { $group: { _id: null, total: { $sum: "$deliveryCharge" }, count: { $sum: 1 } } },
            ]);
            return { total: result[0]?.total ?? 0, count: result[0]?.count ?? 0 };
        };

        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const [
            today, yesterday,
            thisWeek, lastWeek,
            thisMonth, lastMonth,
            allTime,
            dailyAgg,
        ] = await Promise.all([
            sumInRange(startOfToday, null),
            sumInRange(startOfYesterday, startOfToday),
            sumInRange(startOfWeek, null),
            sumInRange(startOfLastWeek, startOfWeek),
            sumInRange(startOfMonth, null),
            sumInRange(startOfLastMonth, startOfMonth),
            sumInRange(new Date(0), null),
            Order.aggregate([
                {
                    $match: {
                        driverId: driver._id,
                        orderStatus: "DELIVERED",
                    },
                },
                {
                    $project: {
                        deliveryCharge: 1,
                        effectiveDate: dateExpr,
                    },
                },
                {
                    $match: {
                        effectiveDate: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$effectiveDate" } },
                        total: { $sum: "$deliveryCharge" },
                    },
                },
            ]),
        ]);

        const dailyMap = new Map(dailyAgg.map((d) => [d._id, d.total]));
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(startOfToday);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            last7Days.push({
                label: d.toLocaleDateString("en-US", { weekday: "short" }),
                total: dailyMap.get(key) ?? 0,
            });
        }

        const pctChange = (curr, prev) => {
            if (prev > 0) return Math.round(((curr - prev) / prev) * 100);
            return curr > 0 ? 100 : 0;
        };

        // hardcoded for now — move to config once per-driver targets are needed
        const weeklyTargetDeliveries = 10;
        const weeklyTargetBonus = 200;
        const monthlyGoalAmount = 5000;

        return res.status(200).json({
            success: true,
            earnings: {
                today: today.total,
                todayChangePercent: pctChange(today.total, yesterday.total),
                thisWeek: thisWeek.total,
                weekChangePercent: pctChange(thisWeek.total, lastWeek.total),
                thisMonth: thisMonth.total,
                monthChangePercent: pctChange(thisMonth.total, lastMonth.total),
                total: allTime.total,
                totalDeliveries: driver.totalDeliveries,
                monthDeliveries: thisMonth.count,
                monthlyGoalAmount,
                pendingBalance: driver.pendingBalance,
                availableBalance: driver.availableBalance,
                cashPendingSettlement: driver.cashPendingSettlement,
                codRestrictionStatus: driver.codRestrictionStatus,
                weeklyChallenge: {
                    target: weeklyTargetDeliveries,
                    current: thisWeek.count,
                    bonus: weeklyTargetBonus,
                },
                last7Days,
            },
        });
    } catch (err) {
        console.error("[getEarningsSummary]", err);
        return res.status(500).json({ success: false, message: "Failed to load earnings." });
    }
};

module.exports = {
    getDeliveryRequests,
    acceptDeliveryRequest,
    declineDeliveryRequest,
    getActiveDelivery,
    advanceDeliveryStage,
    confirmCashCollected,
    getCompletedDeliveries,
    getTodayStats,
    getEarningsSummary,
    updateAvailability,
};