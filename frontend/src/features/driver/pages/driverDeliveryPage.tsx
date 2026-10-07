// src/features/driver/pages/driverDeliveriesPage.tsx
import { useEffect } from "react";
import NewRequestsTab from "../components/newRequestTab";
import ActiveDeliveryTab from "../components/activeDeliveryTab";
import CompletedHistoryTab from "../components/completedHistoryTab";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDeliveryStore, type DeliveryTab } from "../state/driverDeliveryState";

const TAB_CONFIG: { key: DeliveryTab; label: string }[] = [
  { key: "NEW_REQUESTS", label: "New Requests" },
  { key: "ACTIVE_DELIVERY", label: "Active Deliveries" },
  { key: "COMPLETED_HISTORY", label: "Completed History" },
];

export default function DriverDeliveriesPage() {
  const activeTab = useDriverDeliveryStore((s) => s.activeTab);
  const setActiveTab = useDriverDeliveryStore((s) => s.setActiveTab);

  const requests = useDriverDeliveryStore((s) => s.requests);
  const requestsLoading = useDriverDeliveryStore((s) => s.requestsLoading);
  const requestsError = useDriverDeliveryStore((s) => s.requestsError);

  const activeDelivery = useDriverDeliveryStore((s) => s.activeDelivery);
  const activeLoading = useDriverDeliveryStore((s) => s.activeLoading);
  const activeError = useDriverDeliveryStore((s) => s.activeError);

  const {
    fetchRequests,
    fetchActiveDelivery,
    fetchCompleted,
    fetchTodayStats,
  } = useDriverDeliveryActions();

  // Load data for the active tab whenever it changes
  useEffect(() => {
    if (activeTab === "NEW_REQUESTS") {
      fetchRequests();
      fetchTodayStats();
    } else if (activeTab === "ACTIVE_DELIVERY") {
      fetchActiveDelivery();
    } else if (activeTab === "COMPLETED_HISTORY") {
      fetchCompleted(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="mb-2 text-xl sm:text-3xl font-bold text-[#16241D]">Delivery Management</h1>

      {/* Tab bar */}
      <div className="mb-6 flex gap-4 sm:gap-6 border-b border-[#E3E7E1] overflow-x-auto scrollbar-hide">
        {TAB_CONFIG.map(({ key, label }) => {
          const isActive = activeTab === key;
          const count = key === "NEW_REQUESTS" && requests.length > 0 ? ` (${requests.length})` : "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                "-mb-px border-b-2 pb-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap",
                isActive
                  ? "border-[#1F4D3D] text-[#1F4D3D]"
                  : "border-transparent text-[#6E7C74] hover:text-[#16241D]",
              ].join(" ")}
            >
              {label}
              {count}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "NEW_REQUESTS" && (
        <NewRequestsTab requests={requests} loading={requestsLoading} error={requestsError} />
      )}

      {activeTab === "ACTIVE_DELIVERY" && (
        <ActiveDeliveryTab delivery={activeDelivery} loading={activeLoading} error={activeError} />
      )}

      {activeTab === "COMPLETED_HISTORY" && <CompletedHistoryTab />}
    </div>
  );
}