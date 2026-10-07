import { useNavigate } from "react-router-dom";
import StatsRow from "../components/dashboard/StatsRow";
import OrdersTableCard from "../components/dashboard/OrdersTableCard";
import BestSellingCard from "../components/dashboard/BestSellingCard";
import StoreStatusCard from "../components/dashboard/StoreStatusCard";
import MerchantSupportCard from "../components/dashboard/MerchantSupportCard";
import RestockBanner from "../components/dashboard/RestockBanner";
import { useStoreDashboard } from "../hooks/useStoreDashboard";
import { useStoreDashboardSocket } from "../hooks/useStoreDashboardSocket";
import type { Order } from "../types/dashboard";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { summary, isLoading, error, updateStatus } = useStoreDashboard();
  useStoreDashboardSocket();

  if (isLoading && !summary) {
    return <div className="p-6 text-sm text-[#6E7C74]">Loading dashboard…</div>;
  }

  if (error && !summary) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!summary) return null;

  const handleOrderMenuClick = (order: Order) => {
    navigate(`/store/orders/${order._id}`);
  };

  return (
    <main className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6">
      <StatsRow stats={summary.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrdersTableCard
            orders={summary.incomingOrders}
            onViewAll={() => navigate("/store/orders")}
            onOrderMenuClick={handleOrderMenuClick}
          />
        </div>

        <div className="space-y-6">
          <BestSellingCard items={summary.bestSelling} />
          <StoreStatusCard
            status={summary.status}
            todaysHours={summary.todaysHours}
            onStatusChange={updateStatus}
          />
          <MerchantSupportCard integrationStatus="ONLINE" />
        </div>
      </div>

      <RestockBanner onRestockClick={() => navigate("/store/products")} />
    </main>
  );
}