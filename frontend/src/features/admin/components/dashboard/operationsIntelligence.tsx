import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import { useDashboardState } from "../../state/dashboardState";

// Operations Intelligence card showing revenue trend, order status, and system health.
// Data sourced from GET /admin/dashboard/operations.

type TabId = "revenue" | "orders" | "health";

const TABS: { id: TabId; label: string }[] = [
  { id: "revenue", label: "Revenue Trend" },
  { id: "orders", label: "Order Status" },
  { id: "health", label: "System Health" },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  Delivered: "#145C43",
  Processing: "#B47800",
  "Out for Delivery": "#145C43",
  Cancelled: "#BA1A1A",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;
  return (
    <div className="rounded-lg bg-[#0D2B21] px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg">
      ₹{value.toLocaleString("en-IN")}
    </div>
  );
}

function HealthBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
        <span className="text-[#6E7C74]">{label}</span>
        <span className="font-semibold text-[#16241D]">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F7F3]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function OperationsIntelligence() {
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const {
    revenueTrend,
    orderStatus,
    driverHealth,
    storeHealth,
    operationsLoading,
    operationsError,
    fetchOperations,
  } = useDashboardState();

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const orderStatusData = orderStatus
    ? Object.entries(orderStatus).map(([name, value]) => ({
        name,
        value,
        color: ORDER_STATUS_COLORS[name],
      }))
    : [];
  const totalOrders = orderStatusData.reduce((sum, d) => sum + d.value, 0);

  const driverMax = driverHealth
    ? driverHealth.ONLINE + driverHealth.BUSY + driverHealth.OFFLINE
    : 0;
  const storeMax = storeHealth
    ? storeHealth.OPEN + storeHealth.BUSY + storeHealth.CLOSED
    : 0;

  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white">
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-7 overflow-x-auto border-b border-[#E3E7E1] px-4 sm:px-6 pt-4 sm:pt-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-4 text-xs sm:text-[14.5px] whitespace-nowrap font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#16241D]"
                : "text-[#9BAAA1] hover:text-[#6E7C74]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#145C43]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 sm:px-6 sm:pb-5 sm:pt-4">
        {operationsError && (
          <p className="py-6 text-center text-[13px] text-[#BA1A1A]">{operationsError}</p>
        )}

        {!operationsError && operationsLoading && !orderStatus && (
          <div className="flex h-[190px] items-center justify-center text-[13px] text-[#9BAAA1]">
            Loading…
          </div>
        )}

        {!operationsError && (revenueTrend.length > 0 || orderStatus || driverHealth) && (
          <>
            {activeTab === "revenue" && (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={revenueTrend} barCategoryGap="32%" margin={{ left: -10 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9BAAA1", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#F5F7F3" }} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={40}>
                    {revenueTrend.map((entry, i) => (
                      <Cell key={i} fill={entry.active ? "#145C43" : "#DCE3DC"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === "orders" && totalOrders > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {orderStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex w-full flex-1 flex-col gap-3">
                  {orderStatusData.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-[13.5px] text-[#6E7C74]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </span>
                      <span className="text-[13.5px] font-semibold text-[#16241D]">
                        {status.value}{" "}
                        <span className="font-normal text-[#9BAAA1]">
                          ({Math.round((status.value / totalOrders) * 100)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "orders" && totalOrders === 0 && (
              <div className="flex h-[190px] items-center justify-center text-[13px] text-[#9BAAA1]">
                No orders in the last 30 days.
              </div>
            )}

            {activeTab === "health" && driverHealth && storeHealth && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                <div>
                  <p className="mb-4 text-[13px] font-semibold text-[#16241D]">
                    Driver Status
                  </p>
                  <div className="flex flex-col gap-4">
                    <HealthBar label="Online" value={driverHealth.ONLINE} max={driverMax} color="#145C43" />
                    <HealthBar label="On Delivery" value={driverHealth.BUSY} max={driverMax} color="#B47800" />
                    <HealthBar label="Offline" value={driverHealth.OFFLINE} max={driverMax} color="#9BAAA1" />
                  </div>
                </div>
                <div>
                  <p className="mb-4 text-[13px] font-semibold text-[#16241D]">
                    Store Status
                  </p>
                  <div className="flex flex-col gap-4">
                    <HealthBar label="Open" value={storeHealth.OPEN} max={storeMax} color="#145C43" />
                    <HealthBar label="Busy" value={storeHealth.BUSY} max={storeMax} color="#B47800" />
                    <HealthBar label="Closed" value={storeHealth.CLOSED} max={storeMax} color="#9BAAA1" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}