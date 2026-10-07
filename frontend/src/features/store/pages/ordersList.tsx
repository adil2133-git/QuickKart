import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Truck, Clock, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import { useFetchStoreOrders, useUpdateOrderStatus } from "../hooks/useStoreOrders";
import type { OrderFilterTab, StoreOrder } from "../types/storeOrders";

function getInitials(name?: string | null): string {
    if (!name) return "ST";
    return name.split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "ST";
}

function formatTime(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Currency formatter ────────────────────────────────────────────────────────
function formatINR(amount?: number | null): string {
    return "₹" + (amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    PACKING: "bg-blue-100 text-blue-700",
    READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-100 text-red-600",
};

// Shorter display labels so badges never wrap
const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    PACKING: "Packing",
    READY_FOR_PICKUP: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

const TABS: { key: OrderFilterTab; label: string }[] = [
    { key: "ALL", label: "All Orders" },
    { key: "PENDING", label: "Pending" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "READY", label: "Ready" },
];

function AvatarInitials({ name }: { name: string }) {
    const initials = getInitials(name);
    const colors = [
        "bg-amber-100 text-amber-700",
        "bg-sky-100 text-sky-700",
        "bg-violet-100 text-violet-700",
        "bg-rose-100 text-rose-700",
        "bg-teal-100 text-teal-700",
    ];
    const color = colors[initials.charCodeAt(0) % colors.length];
    return (
        <span className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color}`}>
            {initials}
        </span>
    );
}

function StatusBadge({ status, driverSearchFailed }: { status: string; driverSearchFailed?: boolean }) {
    if (status === "READY_FOR_PICKUP" && driverSearchFailed) {
        return (
            <span className="inline-block whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700">
                No Driver
            </span>
        );
    }
    const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
    const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
    return (
        <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${style}`}>
            {label}
        </span>
    );
}

function PaymentBadge({ method }: { method: string }) {
    const isOnline = method === "ONLINE";
    return (
        <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${isOnline
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
            }`}>
            {method}
        </span>
    );
}

export default function OrdersPage() {
    const navigate = useNavigate();
    const fetchOrders = useFetchStoreOrders();
    const updateStatus = useUpdateOrderStatus();

    const { orders, isLoadingOrders, ordersError, activeTab, setActiveTab, pagination } =
        useStoreOrdersStore();


    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    // ── Debounce search 400 ms ────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Fetch whenever tab / search / page changes ────────────────────────────
    // NOTE: fetchOrders is intentionally excluded from deps — it's a stable
    // hook reference but including it causes stale-closure double-fetches.
    // If your hook memoises correctly you can add it back safely.
    useEffect(() => {
        fetchOrders({ tab: activeTab, search: debouncedSearch, page, limit: 10 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, debouncedSearch, page]);

    const handleTabChange = (key: OrderFilterTab) => {
        setActiveTab(key);
        setPage(1);
    };

    const handleAccept = async (e: React.MouseEvent, order: StoreOrder) => {
        e.stopPropagation();
        await updateStatus(order.id, "ACCEPTED");
        fetchOrders({ tab: activeTab, search: debouncedSearch, page, limit: 10 });
    };

    const handleReject = async (e: React.MouseEvent, order: StoreOrder) => {
        e.stopPropagation();
        await updateStatus(order.id, "CANCELLED");
        fetchOrders({ tab: activeTab, search: debouncedSearch, page, limit: 10 });
    };

    const totalPages = pagination?.pages ?? 1;
    const total = pagination?.total ?? 0;
    const activeDrivers = 12;
    const prepTimeAvg = 18;

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 overflow-y-auto bg-[#F7F8F5] p-4 sm:p-6 lg:p-8 font-['Inter',sans-serif]">

            {/* ── Header ───────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-[#16241D]">Incoming Orders</h1>
                <div className="flex items-center gap-2 rounded-xl border border-[#E3E7E1] bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[#6E7C74] w-fit">
                    <Calendar className="h-4 w-4 text-[#1F4D3D]" />
                    <span>{formatDate(new Date().toISOString())}</span>
                </div>
            </div>

            {/* ── Tabs + search ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex rounded-xl border border-[#E3E7E1] bg-white p-1 overflow-x-auto scrollbar-hide max-w-full shrink-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key
                                ? "bg-[#1F4D3D] text-white shadow-sm"
                                : "text-[#6E7C74] hover:text-[#16241D]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex w-full sm:flex-1 items-center gap-2 rounded-xl border border-[#E3E7E1] bg-white px-4 py-2.5 min-w-[200px]">
                    <Search className="h-4 w-4 flex-shrink-0 text-[#6E7C74]" />
                    <input
                        type="text"
                        placeholder="Search order ID or name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-[#16241D] placeholder:text-[#9BAAA1] outline-none"
                    />
                </div>
            </div>

            {/* ── Table ────────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-2xl border border-[#E3E7E1] bg-white">
                <div className="min-w-[860px]">

                {/* Header row */}
                <div className="grid grid-cols-[1fr_1.6fr_0.7fr_0.9fr_0.7fr_0.7fr_0.8fr_1.3fr] gap-3 border-b border-[#E3E7E1] px-4 sm:px-6 py-3 bg-[#F5F7F3]">
                    {["ORDER ID", "CUSTOMER", "ITEMS", "AMOUNT", "PAYMENT", "TIME", "STATUS", "ACTIONS"].map((h) => (
                        <span key={h} className="text-xs font-semibold tracking-wider text-[#6E7C74] whitespace-nowrap">
                            {h}
                        </span>
                    ))}
                </div>

                {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-16 text-sm text-[#6E7C74]">
                        Loading orders…
                    </div>
                ) : ordersError ? (
                    <div className="flex items-center justify-center py-16 text-sm text-rose-600">
                        {ordersError}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-[#6E7C74]">
                        <span className="text-3xl">📋</span>
                        <p>No orders match your filters.</p>
                    </div>
                ) : (
                    orders.map((order, idx) => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/store/orders/${order.id}`)}
                            className={`grid cursor-pointer grid-cols-[1fr_1.6fr_0.7fr_0.9fr_0.7fr_0.7fr_0.8fr_1.3fr] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#F5F7F3] ${idx !== orders.length - 1 ? "border-b border-[#E3E7E1]" : ""
                                }`}
                        >
                            {/* Order ID */}
                            <span className="text-sm font-semibold text-[#16241D] truncate">
                                #{order.orderNumber}
                            </span>

                            {/* Customer */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <AvatarInitials name={order.recipientName} />
                                <span className="text-sm font-medium text-[#16241D] truncate">
                                    {order.recipientName}
                                </span>
                            </div>

                            {/* Items */}
                            <span className="text-sm text-[#6E7C74] whitespace-nowrap">
                                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                            </span>

                            {/* Amount — INR */}
                            <span className="text-sm font-semibold text-[#16241D] whitespace-nowrap">
                                {formatINR(order.totalAmount)}
                            </span>

                            {/* Payment */}
                            <PaymentBadge method={order.paymentMethod} />

                            {/* Time */}
                            <span className="text-sm text-[#6E7C74] whitespace-nowrap">
                                {formatTime(order.placedAt)}
                            </span>

                             {/* Status */}
                            <StatusBadge status={order.orderStatus} driverSearchFailed={order.driverSearchFailed} />

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {order.orderStatus === "PENDING" ? (
                                    <>
                                        <button
                                            onClick={(e) => handleAccept(e, order)}
                                            className="rounded-lg bg-[#1F4D3D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#163D30] whitespace-nowrap cursor-pointer"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={(e) => handleReject(e, order)}
                                            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 whitespace-nowrap cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/store/orders/${order.id}`);
                                        }}
                                        className="rounded-lg border border-[#E3E7E1] px-3 py-1.5 text-xs font-medium text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] whitespace-nowrap cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                </div>

                {/* ── Pagination ───────────────────────────────────────────────── */}
                {!isLoadingOrders && total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E3E7E1] px-4 sm:px-6 py-3 gap-3">
                        <span className="text-xs text-[#6E7C74]">
                            Showing {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} of {total} orders
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7E1] text-[#6E7C74] hover:bg-[#F5F7F3] disabled:opacity-40 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${p === page
                                        ? "bg-[#1F4D3D] text-white"
                                        : "border border-[#E3E7E1] text-[#6E7C74] hover:bg-[#F5F7F3]"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7E1] text-[#6E7C74] hover:bg-[#F5F7F3] disabled:opacity-40 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Stats row ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">Active Drivers</p>
                        <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#16241D]">
                            {activeDrivers}
                            <span className="ml-2 text-xs sm:text-sm font-medium text-emerald-600">+2 available</span>
                        </p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F5F7F3]">
                            <div className="h-full rounded-full bg-[#1F4D3D]" style={{ width: `${(activeDrivers / 20) * 100}%` }} />
                        </div>
                    </div>
                    <Truck className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-[#1F4D3D] ml-3 sm:ml-4" />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">Prep Time Avg</p>
                        <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#16241D]">
                            {prepTimeAvg}m
                            <span className="ml-2 text-xs sm:text-sm font-medium text-amber-600">+3m increase</span>
                        </p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F5F7F3]">
                            <div className="h-full rounded-full bg-[#1F4D3D]" style={{ width: `${(prepTimeAvg / 60) * 100}%` }} />
                        </div>
                    </div>
                    <Clock className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-[#1F4D3D] ml-3 sm:ml-4" />
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-[#E7EFEA] border border-[#1F4D3D]/30 p-4 sm:p-5">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#1F4D3D]" />
                            <p className="text-xs font-bold uppercase tracking-widest text-[#1F4D3D]">Rush Hour Alert</p>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-[#16241D]">
                            Expect 15+ more orders in the next hour based on daily trends.
                        </p>
                    </div>
                    <button className="mt-4 self-start rounded-xl bg-[#1F4D3D] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#163D30] cursor-pointer">
                        Boost Staff
                    </button>
                </div>
            </div>
        </div>
    );
}