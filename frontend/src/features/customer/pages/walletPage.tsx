import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Settings2,
    Receipt,
    ShieldCheck,
    ArrowLeft,
} from "lucide-react";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";

interface WalletTransaction {
    id: string;
    amount: number;
    type: "REFUND_CREDIT" | "ORDER_PAYMENT" | "ADMIN_ADJUSTMENT" | "CANCELLATION_FEE";
    description?: string;
    orderNumber?: string | null;
    createdAt: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

const TX_META: Record<
    WalletTransaction["type"],
    { label: string; icon: typeof ArrowDownLeft; credit: boolean }
> = {
    REFUND_CREDIT: { label: "Refund credited", icon: ArrowDownLeft, credit: true },
    ORDER_PAYMENT: { label: "Order payment", icon: ArrowUpRight, credit: false },
    ADMIN_ADJUSTMENT: { label: "Adjustment", icon: Settings2, credit: true },
    CANCELLATION_FEE: { label: "Cancellation fee", icon: ArrowUpRight, credit: false },
};

function TransactionSkeletonRow() {
    return (
        <div className="flex items-center justify-between px-5 py-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: "#F5F7F3" }} />
                <div className="space-y-2">
                    <div className="h-3 w-32 rounded" style={{ backgroundColor: "#F5F7F3" }} />
                    <div className="h-2.5 w-20 rounded" style={{ backgroundColor: "#F5F7F3" }} />
                </div>
            </div>
            <div className="h-3 w-14 rounded" style={{ backgroundColor: "#F5F7F3" }} />
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: typeof ArrowDownLeft;
    label: string;
    value: string;
    tint: "green" | "rust" | "neutral";
}) {
    const tones = {
        green: { bg: "#E8EFEC", fg: "#145C43" },
        rust: { bg: "#F5E6E0", fg: "#9C4A3A" },
        neutral: { bg: "#F5F7F3", fg: "#6E7C74" },
    }[tint];

    return (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E3E7E1" }}>
            <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: tones.bg }}
            >
                <Icon size={16} color={tones.fg} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "#16241D" }}>
                {value}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "#6E7C74" }}>
                {label}
            </p>
        </div>
    );
}

// ─── Wallet content (reusable — standalone page below embeds it in full-page
// chrome; CustomerProfilePage embeds it directly inside its own "Wallet" tab)
// ─────────────────────────────────────────────────────────────────────────────

export function WalletContent() {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchWallet = () =>
            api
                .get("/customer/wallet")
                .then(({ data }) => {
                    if (cancelled) return;
                    setBalance(data.balance ?? 0);
                    setTransactions(data.transactions ?? []);
                })
                .catch(console.error)
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });

        fetchWallet();

        // A refund (or any other wallet credit) landing while this page is
        // open — re-pull so the new transaction and balance show up without
        // a manual refresh.
        const socket = getSocket();
        const handleWalletUpdated = () => fetchWallet();
        socket.on("wallet:updated", handleWalletUpdated);

        return () => {
            cancelled = true;
            socket.off("wallet:updated", handleWalletUpdated);
        };
    }, []);

    const { totalRefunded, totalSpent } = useMemo(() => {
        return transactions.reduce(
            (acc, t) => {
                if (t.type === "REFUND_CREDIT" || t.type === "ADMIN_ADJUSTMENT") acc.totalRefunded += t.amount;
                if (t.type === "ORDER_PAYMENT") acc.totalSpent += t.amount;
                return acc;
            },
            { totalRefunded: 0, totalSpent: 0 }
        );
    }, [transactions]);

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ── Balance card ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl p-5 sm:p-7 text-white"
                style={{ backgroundColor: "#145C43" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 opacity-85">
                        <Wallet size={16} />
                        <span className="text-xs font-semibold uppercase tracking-widest">Wallet Balance</span>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                        <ShieldCheck size={12} />
                        Refund credit
                    </span>
                </div>
                <div className="mt-4 text-3xl sm:text-5xl font-bold leading-none">
                    {loading ? (
                        <span className="inline-block h-8 sm:h-10 w-36 sm:w-40 animate-pulse rounded" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} />
                    ) : (
                        <>₹{balance.toFixed(2)}</>
                    )}
                </div>
                <p className="mt-3 max-w-md text-xs leading-relaxed opacity-75">
                    Refunds from cancelled orders land here instantly and are applied automatically
                    at your next checkout — no action needed.
                </p>
                <Wallet size={150} className="pointer-events-none absolute -right-6 -bottom-10 opacity-10" />
            </motion.div>

            {/* ── Stat row ── */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon={ArrowDownLeft} label="Total refunded" value={`₹${totalRefunded.toFixed(2)}`} tint="green" />
                <StatCard icon={ArrowUpRight} label="Used at checkout" value={`₹${totalSpent.toFixed(2)}`} tint="rust" />
                <StatCard icon={ShieldCheck} label="No top-ups needed — credits arrive automatically" value="How it works" tint="neutral" />
            </div>

            {/* ── Transaction history ── */}
            <section className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                    <Receipt size={16} color="#145C43" />
                    <h2 className="text-sm font-semibold" style={{ color: "#145C43" }}>
                        Recent Transactions
                    </h2>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#E3E7E1" }}>
                    {/* Column headers — desktop only */}
                    {!loading && transactions.length > 0 && (
                        <div
                            className="hidden items-center gap-4 border-b px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider sm:grid"
                            style={{ borderColor: "#E3E7E1", color: "#9BAAA1", gridTemplateColumns: "110px 1fr 90px 100px" }}
                        >
                            <span>Date</span>
                            <span>Description</span>
                            <span>Status</span>
                            <span className="text-right">Amount</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="divide-y" style={{ borderColor: "#E3E7E1" }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <TransactionSkeletonRow key={i} />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-14">
                            <Wallet size={30} color="#DCE3DC" />
                            <span className="text-sm" style={{ color: "#9BAAA1" }}>
                                No transactions yet
                            </span>
                        </div>
                    ) : (
                        <ul className="divide-y" style={{ borderColor: "#E3E7E1" }}>
                            {transactions.map((t) => {
                                const meta = TX_META[t.type];
                                const Icon = meta.icon;
                                return (
                                    <li
                                        key={t.id}
                                        className="grid grid-cols-1 items-center gap-2 px-5 py-4 sm:gap-4"
                                        style={{ gridTemplateColumns: "1fr" }}
                                    >
                                        <div className="flex items-center justify-between gap-3 sm:hidden">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                                                    style={{ backgroundColor: meta.credit ? "#E8EFEC" : "#F5E6E0" }}
                                                >
                                                    <Icon size={15} color={meta.credit ? "#145C43" : "#9C4A3A"} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: "#16241D" }}>
                                                        {t.description || meta.label}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "#9BAAA1" }}>
                                                        {formatDate(t.createdAt)}
                                                        {t.orderNumber ? ` · #${t.orderNumber}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className="text-sm font-semibold whitespace-nowrap"
                                                style={{ color: meta.credit ? "#145C43" : "#9C4A3A" }}
                                            >
                                                {meta.credit ? "+" : "-"}₹{t.amount.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Desktop table row */}
                                        <div
                                            className="hidden items-center gap-4 sm:grid"
                                            style={{ gridTemplateColumns: "110px 1fr 90px 100px" }}
                                        >
                                            <span className="text-xs" style={{ color: "#6E7C74" }}>
                                                {formatDate(t.createdAt)}
                                                <span className="block text-[11px]" style={{ color: "#9BAAA1" }}>
                                                    {formatTime(t.createdAt)}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-2.5 min-w-0">
                                                <span
                                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                                                    style={{ backgroundColor: meta.credit ? "#E8EFEC" : "#F5E6E0" }}
                                                >
                                                    <Icon size={14} color={meta.credit ? "#145C43" : "#9C4A3A"} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-medium" style={{ color: "#16241D" }}>
                                                        {t.description || meta.label}
                                                    </span>
                                                    {t.orderNumber && (
                                                        <span className="block truncate text-xs" style={{ color: "#9BAAA1" }}>
                                                            Order #{t.orderNumber}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <span>
                                                <span
                                                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                                                    style={{ backgroundColor: "#E8EFEC", color: "#145C43" }}
                                                >
                                                    Success
                                                </span>
                                            </span>
                                            <span
                                                className="text-right text-sm font-semibold whitespace-nowrap"
                                                style={{ color: meta.credit ? "#145C43" : "#9C4A3A" }}
                                            >
                                                {meta.credit ? "+" : "-"}₹{t.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}

// ─── Standalone page (direct links) ───────────────────────────────────────────

export default function WalletPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#F7F8F5", fontFamily: "'Inter', sans-serif" }}>
            <main className="mx-auto px-4 sm:px-10 py-6 sm:py-10" style={{ maxWidth: 880 }}>
                <Link
                    to="/customer/profile?tab=wallet"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Profile
                </Link>
                <h1 className="mb-6 text-2xl font-semibold" style={{ color: "#16241D" }}>
                    My Wallet
                </h1>
                <WalletContent />
            </main>
        </div>
    );
}
