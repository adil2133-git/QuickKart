import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DriverSidebar from "../components/driverSidebar";
import DriverTopbar from "../components/driverTopbar";
import { useAuthStore } from "../../auth/state/authState";
import { useDriverLocationTracking } from "../hooks/useDriverLocationTracking";
import { useDriverDeliverySocket } from "../hooks/useDriverDeliverySocket";
import DeliveryRequestPopup from "../components/deliveryRequestPopup";
import { useNotificationsSync } from "../../shared/hooks/useNotifications";
import { useDriverRewardsStore } from "../state/driverRewardsState";
import { useDriverRewardsActions } from "../hooks/useDriverRewards";

export default function DriverShell() {
  const user = useAuthStore((s) => s.user);
  const rewardsSummary = useDriverRewardsStore((s) => s.summary);
  const { fetchRewardsSummary } = useDriverRewardsActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useDriverLocationTracking();
  useDriverDeliverySocket();
  useNotificationsSync();

  // Previously the sidebar always showed a hardcoded "GOLD" level regardless
  // of the driver's actual tier. Fetch it once here so it's available for
  // every page under this shell.
  useEffect(() => {
    void fetchRewardsSummary();
  }, [fetchRewardsSummary]);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#16241D] font-[Inter,sans-serif]">
      <DriverSidebar
        driverName={user?.name ?? "Driver"}
        driverLevel={rewardsSummary?.currentLevelLabel ?? "Bronze"}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DriverTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global delivery request popup — appears on any page */}
      <DeliveryRequestPopup />
    </div>
  );
}