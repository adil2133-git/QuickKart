import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Truck,
  Wallet,
  Banknote,
  Receipt,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Award,
} from "lucide-react";
import { useDriverEarningsStore } from "../state/driverEarningsState";
import { useDriverEarningsActions } from "../hooks/useDriverEarnings";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";

// ── Motion helpers (matches driverDashboard.tsx) ───────────────────────────────
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
  if (!iso) return { date: "N/A", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "N/A", time: "" };
  const date = d.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

// ── KPI cards ─────────────────────────────────────────────────────────────────
function KpiCards() {
  const summary = useDriverEarningsStore((s) => s.summary);
  const isLoading = useDriverEarningsStore((s) => s.isLoading);

  const kpis = [
    {
      icon: IndianRupee,
      label: "Today's Earnings",
      value: formatINR(summary?.today ?? 0),
      changePercent: summary?.todayChangePercent ?? 0,
      sub: "from yesterday",
    },
    {
      icon: Receipt,
      label: "Weekly Earnings",
      value: formatINR(summary?.thisWeek ?? 0),
      changePercent: summary?.weekChangePercent ?? 0,
      sub: "from last week",
    },
    {
      icon: Truck,
      label: "Monthly Earnings",
      value: formatINR(summary?.thisMonth ?? 0),
      changePercent: summary?.monthChangePercent ?? 0,
      sub: "from last month",
    },
    {
      icon: Award,
      label: "Total Earnings",
      value: formatINR(summary?.total ?? 0),
      changePercent: null,
      sub: `${summary?.totalDeliveries ?? 0} deliveries all-time`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpis.map((kpi) => (
        <motion.div
          key={kpi.label}
          variants={card}
          className="rounded-2xl border border-[#E3E7E1] bg-white p-3.5 sm:p-5"
        >
          {isLoading && !summary ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-20 sm:w-24 rounded bg-[#F5F7F3]" />
              <div className="h-6 sm:h-7 w-16 sm:w-20 rounded bg-[#F5F7F3]" />
              <div className="h-3 w-24 sm:w-28 rounded bg-[#F5F7F3]" />
            </div>
          ) : (
            <>
              <div className="mb-2 sm:mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-[#6E7C74]">{kpi.label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E7EFEA]">
                  <kpi.icon className="h-3.5 w-3.5 text-[#1F4D3D]" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#16241D] leading-none">{kpi.value}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-medium">
                {kpi.changePercent !== null ? (
                  <>
                    {kpi.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={kpi.changePercent >= 0 ? "text-emerald-600" : "text-rose-500"}>
                      {kpi.changePercent >= 0 ? "+" : ""}
                      {kpi.changePercent}%
                    </span>
                    <span className="text-[#9BAAA1]">{kpi.sub}</span>
                  </>
                ) : (
                  <span className="text-[#9BAAA1]">{kpi.sub}</span>
                )}
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Delivery earnings breakdown ─────────────────────────────────────────────────
function DeliveryEarningsCard() {
  const summary = useDriverEarningsStore((s) => s.summary);
  if (!summary) return null;

  const goalPct = Math.min(
    100,
    summary.monthlyGoalAmount > 0 ? (summary.thisMonth / summary.monthlyGoalAmount) * 100 : 0
  );

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <div>
          <p className="text-sm sm:text-base font-bold text-[#16241D]">Delivery Earnings</p>
          <p className="text-xs text-[#6E7C74]">Standard delivery fees this month</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7EFEA]">
          <Truck className="h-4 w-4 text-[#1F4D3D]" />
        </div>
      </div>

      <div className="border-t border-[#E3E7E1] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs sm:text-sm text-[#6E7C74]">Delivery Fees ({summary.monthDeliveries} orders)</span>
          <span className="text-xs sm:text-sm font-semibold text-[#16241D]">{formatINR(summary.thisMonth)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs sm:text-sm text-[#6E7C74]">All-time Deliveries</span>
          <span className="text-xs sm:text-sm font-semibold text-[#16241D]">{summary.totalDeliveries}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 sm:pb-5">
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#F5F7F3]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goalPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-[#1F4D3D] to-emerald-500"
          />
        </div>
        <p className="text-xs italic text-[#6E7C74]">
          {goalPct.toFixed(0)}% of your {formatINR(summary.monthlyGoalAmount)} monthly goal achieved.
        </p>
      </div>
    </motion.div>
  );
}

// ── Wallet & cash card ───────────────────────────────────────────────────────────
function WalletCashCard() {
  const navigate = useNavigate();
  const summary = useDriverEarningsStore((s) => s.summary);
  if (!summary) return null;

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <div>
          <p className="text-sm sm:text-base font-bold text-[#16241D]">Wallet & Cash</p>
          <p className="text-xs text-[#6E7C74]">Balance and COD cash on hand</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
          <Wallet className="h-4 w-4 text-emerald-600" />
        </div>
      </div>

      <div className="border-t border-[#E3E7E1] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs sm:text-sm text-[#6E7C74]">Wallet Balance</span>
          <span className="text-xs sm:text-sm font-semibold text-[#16241D]">{formatINR(summary.walletBalance)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs sm:text-sm text-[#6E7C74]">Cash Pending Settlement</span>
          <span className="text-xs sm:text-sm font-semibold text-amber-600">
            {formatINR(summary.cashPendingSettlement)}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 sm:pb-5">
        <button
          onClick={() => navigate("/driver/wallet")}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1F4D3D] py-2.5 text-xs font-bold text-white hover:bg-[#163D30] transition-colors cursor-pointer"
        >
          <Banknote className="h-3.5 w-3.5" />
          Go to Wallet
        </button>
      </div>
    </motion.div>
  );
}

// ── Weekly trend chart ───────────────────────────────────────────────────────────
function WeeklyTrendCard() {
  const summary = useDriverEarningsStore((s) => s.summary);
  if (!summary) return null;

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
      <p className="mb-1 text-base font-bold text-[#16241D]">Last 7 Days</p>
      <p className="mb-4 text-xs text-[#6E7C74]">Your daily delivery earnings this week</p>
      <div className="h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={summary.last7Days}>
            <defs>
              <linearGradient id="weeklyEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F4D3D" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1F4D3D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6E7C74" }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E3E7E1" }}
              formatter={(v: unknown) => [formatINR(Number(v)), "Earnings"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#1F4D3D"
              strokeWidth={2}
              fill="url(#weeklyEarningsGrad)"
              dot={{ r: 3, fill: "#1F4D3D", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Recent earnings table ────────────────────────────────────────────────────────
function RecentEarningsTable() {
  const navigate = useNavigate();
  const deliveries = useDriverDeliveryStore((s) => s.completedDeliveries);
  const isLoading = useDriverDeliveryStore((s) => s.completedLoading);
  const setActiveTab = useDriverDeliveryStore((s) => s.setActiveTab);

  const recent = deliveries.slice(0, 5);

  const handleViewAll = () => {
    setActiveTab("COMPLETED_HISTORY");
    navigate("/driver/deliveries");
  };

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <p className="text-base font-bold text-[#16241D]">Recent Earnings</p>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-[#1F4D3D] hover:underline cursor-pointer"
        >
          View All
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading && recent.length === 0 ? (
        <div className="space-y-3 px-4 sm:px-6 pb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F5F7F3]" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 sm:px-6 pb-10 pt-2 text-center">
          <Receipt className="h-8 w-8 text-[#9BAAA1]" />
          <p className="text-sm text-[#6E7C74]">No completed deliveries yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-b border-[#E3E7E1] bg-[#F5F7F3]">
                <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                  Date &amp; Time
                </th>
                <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#6E7C74] whitespace-nowrap">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => {
                const { date, time } = formatDateTime(d.completedAt);
                return (
                  <tr key={d.orderId} className="border-b border-[#E3E7E1] last:border-b-0">
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-[#16241D]">{date}</p>
                      <p className="text-xs text-[#6E7C74]">{time}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className="rounded-md bg-[#E7EFEA] px-2 py-1 text-xs font-semibold text-[#1F4D3D]">
                        #{d.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-sm text-[#6E7C74]">
                        <Truck className="h-3.5 w-3.5 text-[#1F4D3D]" />
                        Delivery
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right text-sm font-bold text-[#16241D] whitespace-nowrap">
                      {formatINR(d.earnings)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ── Weekly challenge banner ──────────────────────────────────────────────────────
function WeeklyChallengeBanner() {
  const summary = useDriverEarningsStore((s) => s.summary);
  if (!summary || !summary.weeklyChallenge) return null;

  const { current = 0, target = 0, bonus = 0 } = summary.weeklyChallenge;
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const unlocked = current >= target;

  return (
    <motion.div
      variants={card}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4D3D] to-[#163D30] p-5 sm:p-8"
    >
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div className="max-w-md">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3 w-3" />
            Weekly Challenge
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {unlocked ? "🎉 Bonus unlocked!" : `Earn an extra ${formatINR(bonus)} this week!`}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100">
            {unlocked
              ? `You've completed ${current} deliveries this week — the bonus is yours.`
              : `Complete ${remaining} more deliveries this week to unlock a ${formatINR(bonus)} bonus.`}
          </p>
        </div>

        <div className="w-full md:w-56 flex-shrink-0 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white">
            <span>Progress</span>
            <span>
              {current}/{target}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-white"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverEarningsPage() {
  const { fetchEarningsSummary } = useDriverEarningsActions();
  const { fetchCompleted } = useDriverDeliveryActions();

  useEffect(() => {
    void fetchEarningsSummary();
    void fetchCompleted(1);
  }, [fetchEarningsSummary, fetchCompleted]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <KpiCards />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DeliveryEarningsCard />
        <WalletCashCard />
      </div>

      <WeeklyTrendCard />
      <RecentEarningsTable />
      <WeeklyChallengeBanner />
    </motion.div>
  );
}
