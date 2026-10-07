import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../api/apiError";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet,
  Landmark,
  CalendarClock,
  TrendingUp,
  Truck,
  Gift,
  Banknote,
  SlidersHorizontal,
  Coins,
  Clock,
  ShieldCheck,
  HelpCircle,
  Headphones,
  Download,
  X,
} from "lucide-react";
import { useDriverWalletStore, type WalletTab } from "../state/driverWalletState";
import { useDriverWalletActions } from "../hooks/useDriverWallet";
import type { WalletTransaction, WalletTransactionType, CodOrderEntry } from "../types/driverWallet";

// ── Motion helpers (matches driverDashboard.tsx / driverEarningsPage.tsx) ──────
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};

// ── Formatting helpers ──────────────────────────────────────────────────────────
const formatINR = (value?: number | null) =>
  `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  const date = d.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" });
};

// ── Transaction type presentation ───────────────────────────────────────────────
const TXN_META: Record<
  WalletTransactionType,
  { icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; label: string; pillClass: string }
> = {
  EARNING: {
    icon: Truck,
    iconBg: "bg-[#E7EFEA]",
    iconColor: "text-[#1F4D3D]",
    label: "Earning",
    pillClass: "bg-[#E7EFEA] text-[#1F4D3D]",
  },
  BONUS: {
    icon: Gift,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    label: "Bonus",
    pillClass: "bg-emerald-50 text-emerald-700",
  },
  WITHDRAWAL: {
    icon: Banknote,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    label: "Withdrawal",
    pillClass: "bg-rose-50 text-rose-700",
  },
  ADJUSTMENT: {
    icon: SlidersHorizontal,
    iconBg: "bg-[#F5F7F3]",
    iconColor: "text-[#6E7C74]",
    label: "Adjustment",
    pillClass: "bg-[#F5F7F3] text-[#6E7C74]",
  },
};

const isCredit = (type: WalletTransactionType) => type !== "WITHDRAWAL";

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TAB_CONFIG: { key: WalletTab; label: string }[] = [
  { key: "BALANCE", label: "Wallet Balance" },
  { key: "COD_SETTLEMENT", label: "COD Settlement" },
];

function TabBar() {
  const activeTab = useDriverWalletStore((s) => s.activeTab);
  const setActiveTab = useDriverWalletStore((s) => s.setActiveTab);

  return (
    <div className="mb-6 flex gap-4 sm:gap-6 border-b border-[#E3E7E1] overflow-x-auto scrollbar-hide flex-nowrap">
      {TAB_CONFIG.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={[
              "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap",
              isActive
                ? "border-[#1F4D3D] text-[#1F4D3D]"
                : "border-transparent text-[#6E7C74] hover:text-[#16241D]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Withdraw modal ───────────────────────────────────────────────────────────────
function WithdrawModal({
  availableBalance,
  onClose,
}: {
  availableBalance: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(availableBalance));
  const { withdrawFunds } = useDriverWalletActions();
  const isWithdrawing = useDriverWalletStore((s) => s.isWithdrawing);

  const handleSubmit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (parsed > availableBalance) {
      toast.error("Amount exceeds your available balance.");
      return;
    }
    try {
      await withdrawFunds(parsed);
      toast.success(`${formatINR(parsed)} withdrawal initiated.`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Withdrawal failed. Please try again."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-bold text-[#16241D]">Withdraw Funds</p>
          <button onClick={onClose} className="text-[#6E7C74] hover:text-[#16241D] cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-[#6E7C74]">Amount</label>
        <div className="mb-1 flex items-center rounded-xl border border-[#E3E7E1] px-3.5 py-2.5">
          <span className="mr-1.5 text-sm font-semibold text-[#6E7C74]">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#16241D] outline-none"
          />
        </div>
        <p className="mb-5 text-xs text-[#9BAAA1]">
          Available balance: {formatINR(availableBalance)}
        </p>

        <button
          onClick={handleSubmit}
          disabled={isWithdrawing}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1F4D3D] py-2.5 text-sm font-bold text-white hover:bg-[#163D30] transition-colors cursor-pointer disabled:opacity-50"
        >
          {isWithdrawing ? "Processing…" : "Confirm Withdrawal"}
        </button>
      </motion.div>
    </div>
  );
}

// ── Wallet Balance tab ───────────────────────────────────────────────────────────
function WalletBalanceTab() {
  const summary = useDriverWalletStore((s) => s.summary);
  const isLoading = useDriverWalletStore((s) => s.isLoading);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="h-44 animate-pulse rounded-3xl bg-[#F5F7F3]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="h-20 animate-pulse rounded-2xl bg-[#F5F7F3]" />
          <div className="h-20 animate-pulse rounded-2xl bg-[#F5F7F3]" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Available balance hero */}
        <motion.div
          variants={card}
          className="relative overflow-hidden rounded-3xl border border-[#E3E7E1] bg-gradient-to-br from-white to-[#F5F7F3] p-4 sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#E7EFEA] opacity-60 pointer-events-none" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6E7C74]">
              Available for Withdrawal
            </p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-[#16241D]">
              {formatINR(summary.availableBalance)}
            </p>

            <div className="mt-4 sm:mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex items-center gap-2 rounded-xl bg-[#A9CC3B] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-[#16241D] hover:bg-[#98B933] active:bg-[#87A62C] transition-colors cursor-pointer"
              >
                <Landmark className="h-4 w-4" />
                Withdraw Funds
              </button>
              <button
                onClick={() => toast.info("Payout schedule details coming soon.")}
                className="rounded-xl border border-[#E3E7E1] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#145C43] hover:bg-[#F5F7F3] transition-colors cursor-pointer"
              >
                View Payout Schedule
              </button>
            </div>
          </div>
        </motion.div>

        {/* Side stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4">
            <div className="flex items-center gap-2 text-[#6E7C74]">
              <CalendarClock className="h-3.5 w-3.5 text-[#1F4D3D]" />
              <p className="text-xs font-semibold">Next Scheduled Payout</p>
            </div>
            <p className="mt-1.5 text-base sm:text-lg font-bold text-[#16241D]">
              {formatDate(summary.nextPayoutDate)}
            </p>
          </motion.div>

          <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4">
            <div className="flex items-center gap-2 text-[#6E7C74]">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-xs font-semibold">Earned this Month</p>
            </div>
            <p className="mt-1.5 text-base sm:text-lg font-bold text-emerald-600">
              +{formatINR(summary.earnedThisMonth)}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Recent transactions */}
      <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
          <p className="text-sm sm:text-base font-bold text-[#16241D]">Recent Transactions</p>
          <button
            onClick={() => toast.info("CSV export coming soon.")}
            className="flex items-center gap-1 text-xs font-semibold text-[#1F4D3D] hover:underline cursor-pointer"
          >
            <Download className="h-3 w-3" />
            Download CSV
          </button>
        </div>

        {summary.transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 sm:px-6 pb-10 pt-2 text-center">
            <Coins className="h-8 w-8 text-[#9BAAA1]" />
            <p className="text-sm text-[#6E7C74]">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-t border-b border-[#E3E7E1] bg-[#F5F7F3]">
                  <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                    Details
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions.map((txn: WalletTransaction) => {
                  const meta = TXN_META[txn.type];
                  const credit = isCredit(txn.type);
                  return (
                    <tr key={txn.id} className="border-b border-[#E3E7E1] last:border-b-0">
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}>
                            <meta.icon className={`h-4 w-4 ${meta.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#16241D]">
                              {txn.orderNumber ? `Order #${txn.orderNumber}` : meta.label}
                            </p>
                            <p className="truncate text-xs text-[#6E7C74]">{txn.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.pillClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm text-[#6E7C74] whitespace-nowrap">
                        {formatDateTime(txn.createdAt)}
                      </td>
                      <td
                        className={`px-4 sm:px-6 py-3 sm:py-3.5 text-right text-sm font-bold whitespace-nowrap ${
                          credit ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {credit ? "+" : "-"}
                        {formatINR(txn.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showWithdraw && (
        <WithdrawModal
          availableBalance={summary.availableBalance}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </motion.div>
  );
}

// ── COD status pill ──────────────────────────────────────────────────────────────
function CodStatusPill({ status }: { status: CodOrderEntry["status"] }) {
  if (status === "SETTLED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Settled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

// ── COD Settlement tab ───────────────────────────────────────────────────────────
function CodSettlementTab() {
  const cod = useDriverWalletStore((s) => s.cod);
  const codLoading = useDriverWalletStore((s) => s.codLoading);
  const isSettling = useDriverWalletStore((s) => s.isSettling);
  const { fetchCodSummary, settleCod } = useDriverWalletActions();
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchCodSummary(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSettle = async () => {
    try {
      const settled = await settleCod();
      toast.success(`${formatINR(settled)} settled successfully.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Settlement failed. Please try again."));
    }
  };

  if (codLoading && !cod) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F5F7F3]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[#F5F7F3]" />
      </div>
    );
  }

  if (!cod) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <motion.div variants={card} className="flex items-center gap-3 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#E7EFEA]">
            <Coins className="h-5 w-5 text-[#1F4D3D]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6E7C74]">Total Cash Collected</p>
            <p className="text-lg sm:text-xl font-bold text-[#16241D]">{formatINR(cod.totalCashCollected)}</p>
          </div>
        </motion.div>

        <motion.div variants={card} className="flex items-center gap-3 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6E7C74]">Pending Settlement</p>
            <p className="text-lg sm:text-xl font-bold text-[#16241D]">{formatINR(cod.pendingSettlement)}</p>
          </div>
        </motion.div>

        <motion.div
          variants={card}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5 sm:col-span-2 lg:col-span-1"
        >
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[#6E7C74]">Settlement Due</p>
              {cod.settlementDueAmount > 0 && (
                <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600">
                  Due Soon
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#16241D]">{formatINR(cod.settlementDueAmount)}</p>
          </div>
          <button
            onClick={handleSettle}
            disabled={isSettling || cod.settlementDueAmount <= 0}
            className="flex-shrink-0 rounded-xl bg-[#1F4D3D] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white hover:bg-[#163D30] transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSettling ? "Settling…" : "Settle Amount"}
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Recent activity table */}
        <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <p className="text-sm sm:text-base font-bold text-[#16241D]">Recent Activity</p>
          </div>

          {cod.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 sm:px-6 pb-10 pt-2 text-center">
              <Coins className="h-8 w-8 text-[#9BAAA1]" />
              <p className="text-sm text-[#6E7C74]">No COD orders yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-[#E3E7E1] bg-[#F5F7F3]">
                      <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">Date</th>
                      <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">Order ID</th>
                      <th className="px-4 sm:px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                        Amount Collected
                      </th>
                      <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cod.orders.map((o) => (
                      <tr key={o.orderId} className="border-b border-[#E3E7E1] last:border-b-0">
                        <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-medium text-[#16241D] whitespace-nowrap">{formatDate(o.date)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                          <span className="rounded-md bg-[#E7EFEA] px-2 py-1 text-xs font-semibold text-[#1F4D3D]">
                            #{o.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-right text-sm font-bold text-[#16241D] whitespace-nowrap">
                          {formatINR(o.amountCollected)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                          <CodStatusPill status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                <p className="text-xs text-[#6E7C74]">
                  Showing {cod.orders.length} of {cod.total} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-[#E3E7E1] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-[#1F4D3D] hover:bg-[#F5F7F3] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(cod.pages, p + 1))}
                    disabled={page >= cod.pages}
                    className="rounded-lg bg-[#E7EFEA] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-[#1F4D3D] hover:bg-[#E3E7E1] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Side panel */}
        <div className="space-y-4">
          <motion.div
            variants={card}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F4D3D] to-[#163D30] p-4 sm:p-5"
          >
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                <p className="text-sm font-bold text-white">Settlement Policy</p>
              </div>
              <p className="text-xs leading-relaxed text-emerald-100">
                COD amounts collected must be settled within 48 hours of order completion to
                maintain an active driver status.
              </p>
              <button
                onClick={() => toast.info("Full policy details coming soon.")}
                className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors cursor-pointer"
              >
                Read Full Policy
              </button>
            </div>
          </motion.div>

          <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5">
            <p className="mb-3 text-sm font-bold text-[#16241D]">Payment Support</p>
            <div className="space-y-2">
              <button
                onClick={() => toast.info("Dispute flow coming soon.")}
                className="flex w-full items-center gap-2.5 rounded-xl border border-[#E3E7E1] px-3.5 py-2.5 text-left text-xs font-semibold text-[#16241D] hover:bg-[#F5F7F3] transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#1F4D3D]" />
                Dispute a Transaction
              </button>
              <button
                onClick={() => toast.info("Support chat coming soon.")}
                className="flex w-full items-center gap-2.5 rounded-xl border border-[#E3E7E1] px-3.5 py-2.5 text-left text-xs font-semibold text-[#16241D] hover:bg-[#F5F7F3] transition-colors cursor-pointer"
              >
                <Headphones className="h-3.5 w-3.5 text-[#1F4D3D]" />
                Chat with Support
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverWalletPage() {
  const activeTab = useDriverWalletStore((s) => s.activeTab);
  const { fetchWalletSummary, fetchCodSummary } = useDriverWalletActions();

  useEffect(() => {
    if (activeTab === "BALANCE") {
      void fetchWalletSummary();
    } else {
      void fetchCodSummary(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7EFEA]">
          <Wallet className="h-4.5 w-4.5 text-[#1F4D3D]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#16241D] leading-tight">Payment Management</h1>
          <p className="text-xs text-[#6E7C74]">Manage your wallet balance and cash settlements</p>
        </div>
      </div>

      <TabBar />

      {activeTab === "BALANCE" ? <WalletBalanceTab /> : <CodSettlementTab />}
    </div>
  );
}