import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  IndianRupee, PackageCheck, Star, Wallet,
  MapPin, Navigation,
  ChevronRight, Store, Phone,
} from "lucide-react";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDashboardStore } from "../state/driverDashboardState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverWalletStore } from "../state/driverWalletState";
import { useDriverWalletActions } from "../hooks/useDriverWallet";
import { useDriverEarningsStore } from "../state/driverEarningsState";
import { useDriverEarningsActions } from "../hooks/useDriverEarnings";
import { toast } from "sonner";

// Framer Motion stagger helpers
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};

// ── Hero status card ──────────────────────────────────────────────────────────
function HeroCard() {
  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const { toggleAvailability, fetchAvailability } = useDriverDeliveryActions();
  const [shiftStart, setShiftStart] = useState<Date | null>(null);

  useEffect(() => {
    void fetchAvailability(); // hydrate real isOnline from the DB on mount/refresh
  }, [fetchAvailability]);

  const shiftLabel = shiftStart
    ? shiftStart.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleToggle = async () => {
    const nextOnline = !isOnline;
    if (nextOnline) {
      setShiftStart(new Date());
    } else {
      setShiftStart(null);
    }

    try {
      await toggleAvailability(nextOnline);
    } catch {
      toast.error("Could not update availability. Try again.");
    }
  };

  return (
    <motion.div
      variants={card}
      className={[
        "relative overflow-hidden rounded-3xl p-6 transition-all duration-500",
        isOnline
          ? "bg-[#E7EFEA]/70 border border-[#1F4D3D]/25"
          : "bg-white border border-[#E3E7E1]",
      ].join(" ")}
    >
      {/* Decorative circle */}
      <div className={`absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15 transition-colors ${
        isOnline ? "bg-[#1F4D3D]" : "bg-rose-300"
      }`} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <motion.span
              animate={isOnline ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`}
            />
            <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
              isOnline
                ? "bg-emerald-50 text-[#1F4D3D] border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <h2 className={`text-xl font-bold ${isOnline ? "text-[#1F4D3D]" : "text-[#16241D]"}`}>
            {isOnline ? "Receiving requests" : "You're offline"}
          </h2>
          {isOnline && shiftLabel && (
            <p className="mt-0.5 text-xs text-[#1F4D3D]/90 font-medium">
              Shift started at {shiftLabel}
            </p>
          )}
          {!isOnline && (
            <p className="mt-0.5 text-xs text-[#6E7C74]">
              Go online to start receiving delivery requests
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleToggle}
          className={[
            "mt-1 rounded-2xl px-6 py-2.5 text-sm font-bold transition-all shadow-sm cursor-pointer",
            isOnline
              ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
          ].join(" ")}
        >
          {isOnline ? "Go Offline" : "Go Online"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
function KpiCards() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);
  const statsLoading = useDriverDeliveryStore((s) => s.statsLoading);
  const { fetchTodayStats } = useDriverDeliveryActions();

  const walletSummary = useDriverWalletStore((s) => s.summary);
  const walletLoading = useDriverWalletStore((s) => s.isLoading);
  const { fetchWalletSummary } = useDriverWalletActions();

  useEffect(() => {
    void fetchTodayStats();
    void fetchWalletSummary();
  }, [fetchTodayStats, fetchWalletSummary]);

  const kpis = [
    {
      icon: IndianRupee,
      label: "Earnings",
      value: `₹${(stats?.todayEarnings ?? 0).toFixed(0)}`,
      sub: stats?.earningsChangePercent != null
        ? `${stats.earningsChangePercent > 0 ? "+" : ""}${stats.earningsChangePercent}% vs yesterday`
        : "Today",
      subColor: (stats?.earningsChangePercent ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500",
      loading: statsLoading && !stats,
    },
    {
      icon: PackageCheck,
      label: "Deliveries",
      value: String(stats?.completedCount ?? 0),
      sub: "Today",
      subColor: "text-[#6E7C74]",
      loading: statsLoading && !stats,
    },
    {
      icon: Star,
      label: "Rating",
      value: "—",
      sub: "Coming soon",
      subColor: "text-[#6E7C74]",
      loading: false,
    },
    {
      icon: Wallet,
      label: "Wallet",
      value: `₹${(walletSummary?.availableBalance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      sub: "Available balance",
      subColor: "text-[#6E7C74]",
      loading: walletLoading && !walletSummary,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          variants={card}
          custom={i}
          className="rounded-2xl border border-[#E3E7E1] bg-white p-4"
        >
          {statsLoading && !stats ? (
            <div className="animate-pulse space-y-2">
              <div className="h-7 w-7 rounded-lg bg-[#F5F7F3]" />
              <div className="h-4 w-16 rounded bg-[#F5F7F3]" />
              <div className="h-7 w-12 rounded bg-[#F5F7F3]" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#E7EFEA]">
                <kpi.icon className="h-3.5 w-3.5 text-[#1F4D3D]" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6E7C74]">
                {kpi.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#16241D] leading-none">{kpi.value}</p>
              <p className={`mt-1 text-[11px] font-medium ${kpi.subColor}`}>{kpi.sub}</p>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Active delivery ───────────────────────────────────────────────────────────
function ActiveDeliveryCard() {
  const navigate = useNavigate();
  const delivery = useDriverDeliveryStore((s) => s.activeDelivery);
  const activeLoading = useDriverDeliveryStore((s) => s.activeLoading);
  const { fetchActiveDelivery } = useDriverDeliveryActions();

  useEffect(() => { void fetchActiveDelivery(); }, [fetchActiveDelivery]);

  if (activeLoading && !delivery) {
    return (
      <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 rounded bg-[#F5F7F3]" />
          <div className="h-20 rounded-xl bg-[#F5F7F3]" />
        </div>
      </motion.div>
    );
  }

  if (!delivery) {
    return (
      <motion.div
        variants={card}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E7E1] bg-white p-8 text-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7EFEA]"
        >
          <PackageCheck className="h-7 w-7 text-[#1F4D3D]" />
        </motion.div>
        <p className="text-sm font-semibold text-[#16241D]">No Active Delivery</p>
        <p className="mt-1 text-xs text-[#6E7C74]">New requests will appear when assigned to you</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white overflow-hidden">
      <div className="border-b border-[#E3E7E1] bg-[#F5F7F3] px-5 py-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1F4D3D]">Active Delivery</p>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          In progress
        </span>
      </div>

      <div className="p-5">
        <p className="mb-4 text-xs font-semibold text-[#6E7C74]">Order #{delivery.orderNumber}</p>

        {/* Route */}
        <div className="mb-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1F4D3D]">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#6E7C74]">Pickup</p>
              <p className="text-sm font-semibold text-[#16241D]">{delivery.store.name}</p>
              <p className="text-xs text-[#6E7C74]">{delivery.store.address}</p>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2 text-[#E3E7E1]">
            <div className="h-px flex-1 border-b border-dashed border-[#E3E7E1]" />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#6E7C74]">Drop</p>
              <p className="text-sm font-semibold text-[#16241D]">{delivery.customer.name}</p>
              <p className="text-xs text-[#6E7C74]">{delivery.customer.address}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {delivery.customer.phone && (
            <a
              href={`tel:${delivery.customer.phone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E3E7E1] py-2.5 text-xs font-semibold text-[#1F4D3D] hover:bg-[#F5F7F3] transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call Customer
            </a>
          )}
          <button
            onClick={() => navigate("/driver/deliveries")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1F4D3D] py-2.5 text-xs font-bold text-white hover:bg-[#163D30] transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" />
            Open Map
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Bonus progress ────────────────────────────────────────────────────────────
function BonusCard() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);
  if (!stats) return null;

  const pct = Math.min(100, (stats.currentCount / stats.dailyTarget) * 100);
  const remaining = Math.max(0, stats.dailyTarget - stats.currentCount);

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1F4D3D]">Daily Bonus</p>
          <p className="mt-0.5 text-sm font-semibold text-[#16241D]">
            {remaining > 0
              ? `${remaining} more to unlock ₹${stats.targetBonus}`
              : "🎉 Bonus unlocked!"}
          </p>
        </div>
        <span className="text-xs font-bold text-[#6E7C74]">
          {stats.currentCount} / {stats.dailyTarget}
        </span>
      </div>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#F5F7F3]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-[#1F4D3D] to-emerald-500"
        />
      </div>

      <div className="flex justify-between text-[10px] text-[#6E7C74]">
        <span>Target: {stats.dailyTarget} deliveries</span>
        <span className="font-semibold text-[#1F4D3D]">Earn ₹{stats.targetBonus}</span>
      </div>
    </motion.div>
  );
}

// ── Location + mini sparkline ─────────────────────────────────────────────────
function LocationAndChart() {
  const locationStatus = useDriverDashboardStore((s) => s.locationStatus);
  const currentArea = useDriverDashboardStore((s) => s.currentArea);

  const earningsSummary = useDriverEarningsStore((s) => s.summary);
  const earningsLoading = useDriverEarningsStore((s) => s.isLoading);
  const { fetchEarningsSummary } = useDriverEarningsActions();

  useEffect(() => {
    void fetchEarningsSummary();
  }, [fetchEarningsSummary]);

  const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekData =
    earningsSummary?.last7Days && earningsSummary.last7Days.length > 0
      ? earningsSummary.last7Days.map((d) => ({ day: d.label, v: d.total }))
      : defaultDays.map((day) => ({ day, v: 0 }));

  const statusDot: Record<string, string> = {
    active: "bg-emerald-500",
    acquiring: "bg-amber-400 animate-pulse",
    denied: "bg-rose-500",
    unavailable: "bg-slate-400",
    idle: "bg-slate-300",
  };

  const statusLabel: Record<string, string> = {
    active: `GPS Active${currentArea ? ` · ${currentArea}` : ""}`,
    acquiring: "Acquiring GPS…",
    denied: "Location denied — enable in browser settings",
    unavailable: "GPS unavailable",
    idle: "Go online to share location",
  };

  return (
    <div className="space-y-3">
      {/* Location */}
      <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#E7EFEA]">
          <Navigation className="h-4 w-4 text-[#1F4D3D]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6E7C74]">Location</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[locationStatus]}`} />
            <p className="text-xs font-medium text-[#16241D] truncate">{statusLabel[locationStatus]}</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly sparkline */}
      <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E7C74]">Weekly Earnings</p>
          {earningsSummary && (
            <span className="text-xs font-bold text-[#1F4D3D]">
              ₹{(earningsSummary.thisWeek ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <div className="h-20">
          {earningsLoading && !earningsSummary ? (
            <div className="h-full w-full animate-pulse rounded-lg bg-[#F5F7F3]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F4D3D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1F4D3D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E3E7E1", backgroundColor: "#ffffff" }}
                  formatter={(v: unknown) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Earned"]}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#1F4D3D"
                  strokeWidth={2}
                  fill="url(#earningsGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[#6E7C74]">
          {weekData.map((d) => <span key={d.day}>{d.day}</span>)}
        </div>
      </motion.div>
    </div>
  );
}

// ── Quick nav ─────────────────────────────────────────────────────────────────
function QuickNav() {
  const navigate = useNavigate();
  const requests = useDriverDeliveryStore((s) => s.requests);

  return (
    <motion.div variants={card}>
      <button
        onClick={() => navigate("/driver/deliveries")}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#E3E7E1] bg-white p-4 text-left hover:bg-[#F5F7F3] transition-colors cursor-pointer"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7EFEA]">
          <PackageCheck className="h-4 w-4 text-[#1F4D3D]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#16241D]">View Deliveries</p>
          <p className="text-xs text-[#6E7C74]">
            {requests.length > 0 ? `${requests.length} request${requests.length > 1 ? "s" : ""} waiting` : "Manage your orders"}
          </p>
        </div>
        {requests.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {requests.length}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-[#1F4D3D]" />
      </button>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverDashboard() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <HeroCard />
      <KpiCards />

      {/* 2-column grid */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <ActiveDeliveryCard />
          <QuickNav />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <BonusCard />
          <LocationAndChart />
        </div>
      </div>
    </motion.div>
  );
}