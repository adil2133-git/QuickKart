import { useEffect } from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { useDashboardState } from "../../state/dashboardState";

// Admin KPI strip displaying live stats (Orders, Revenue, Drivers, Stores, Avg Time).
// Sourced from GET /admin/dashboard/kpis.

function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value}`;
}

function TrendBadge({
  direction,
  label,
}: {
  direction?: "up" | "down" | "neutral";
  label?: string;
}) {
  if (!direction || !label) return null;
  if (direction === "neutral") {
    return (
      <span className="rounded-full bg-[#F5F7F3] px-2 py-0.5 text-[11px] font-medium text-[#6E7C74]">
        {label}
      </span>
    );
  }
  const Icon: LucideIcon = direction === "up" ? TrendingUp : TrendingDown;
  const color = "text-[#16A34A]";
  return (
    <span className={`flex items-center gap-1 text-[12px] font-semibold ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white px-5 py-4 animate-pulse">
      <div className="mb-3 h-3 w-20 rounded bg-[#F5F7F3]" />
      <div className="h-6 w-16 rounded bg-[#F5F7F3]" />
    </div>
  );
}

export default function KpiStrip() {
  const { kpis, kpisLoading, kpisError, fetchKpis } = useDashboardState();

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  if (kpisLoading && !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (kpisError) {
    return (
      <div className="rounded-2xl border border-[#FBEAEA] bg-[#FBEAEA] px-5 py-4 text-[13px] text-[#BA1A1A]">
        {kpisError}
      </div>
    );
  }

  if (!kpis) return null;

  const cards: { label: string; value: string; direction?: "up" | "down" | "neutral"; trendLabel?: string }[] = [
    {
      label: "ORDERS TODAY",
      value: String(kpis.ordersToday.value),
      direction: kpis.ordersToday.direction,
      trendLabel: kpis.ordersToday.label,
    },
    {
      label: "REVENUE TODAY",
      value: formatCurrency(kpis.revenueToday.value),
      direction: kpis.revenueToday.direction,
      trendLabel: kpis.revenueToday.label,
    },
    {
      label: "DRIVERS ONLINE",
      value: String(kpis.driversOnline.value),
      direction: "neutral",
      trendLabel: "Active",
    },
    {
      label: "STORES ACTIVE",
      value: String(kpis.storesActive.value),
      direction: "neutral",
      trendLabel: "Open now",
    },
    {
      label: "AVG DELIVERY",
      value: kpis.avgDeliveryMinutes.value ? `${kpis.avgDeliveryMinutes.value}m` : "—",
      direction: kpis.avgDeliveryMinutes.direction,
      trendLabel: kpis.avgDeliveryMinutes.label,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-2xl border border-[#E3E7E1] bg-white p-3.5 sm:px-5 sm:py-4"
        >
          <p className="mb-2 text-[10px] sm:text-[11px] font-semibold tracking-wide text-[#6E7C74]">
            {kpi.label}
          </p>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-[26px] font-bold leading-none text-[#16241D]">
              {kpi.value}
            </span>
            <div>
              <TrendBadge direction={kpi.direction} label={kpi.trendLabel} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}