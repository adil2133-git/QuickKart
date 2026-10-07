import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, X, AlertTriangle } from "lucide-react";
import { useCancelOrder, useOrdersList, useOrdersTab } from "../hooks/useMyOrders";
import type { CustomerOrder, OrderStatus } from "../types/myOrders";
import { stageIndexForStatus } from "../types/myOrders";

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, string> = {
  PROCESSING: "Processing",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function StatusPill({ status }: { status: OrderStatus }) {
  const isCancelled = status === "CANCELLED";

  const classes = isCancelled
    ? "bg-[#F5E6E0] text-[#9C4A3A]"
    : "bg-[#E8EFEC] text-[#145C43]";

  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${classes}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Progress tracker ─────────────────────────────────────────────────────────

function ProgressTracker({ order }: { order: CustomerOrder }) {
  const reachedIndex = stageIndexForStatus(order.status);
  const barColor = order.status === "CANCELLED" ? "bg-[#DCE3DC]" : "bg-[#145C43]";
  const labelColor = order.status === "CANCELLED" ? "text-[#9BAAA1]" : "text-[#145C43]";

  const stages = [
    { key: "PROCESSING", label: "Processing" },
    { key: "PACKED", label: "Packed" },
    { key: "DELIVERY", label: "Delivery" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-[#16241D]">Order Progress</span>
        <span className={`text-sm font-bold ${labelColor}`}>{order.progressPercent}%</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex-1 h-1.5 rounded-full bg-[#E3E7E1] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${i <= reachedIndex ? barColor : ""}`}
              style={{ width: i <= reachedIndex ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {stages.map((stage, i) => (
          <span
            key={stage.key}
            className={`text-[11px] font-semibold tracking-wide uppercase ${
              i <= reachedIndex ? labelColor : "text-[#9BAAA1]"
            }`}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onTrackOrder,
}: {
  order: CustomerOrder;
  onTrackOrder?: (orderId: string) => void;
}) {
  const extraCount = order.itemCount - order.previewItems.length;
  const isPast = order.status === "DELIVERED" || order.status === "CANCELLED";
  const showCallRider = order.status === "OUT_FOR_DELIVERY";
  const canCancel = order.status === "PROCESSING";

 const { cancelOrder } = useCancelOrder();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // When embedded inside the profile page's "My Orders" tab, tracking swaps
  // the tab's content in place (no route change). When used standalone
  // (MyOrdersPage), there's no callback, so it falls back to the full-page route.
  const handleTrack = () => {
    if (onTrackOrder) onTrackOrder(order.id);
    else navigate(`/customer/track/${order.id}`);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    const ok = await cancelOrder(order.id);
    setIsCancelling(false);
    if (!ok) setConfirming(false);
    // on success the order disappears from this list on its own (removeOrder),
    // so there's nothing left to reset here
  };

  const formattedDate = new Date(order.placedAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[#16241D]" style={{ fontFamily: "Georgia, serif" }}>
            {order.storeName}
          </h3>
          <p className="text-xs text-[#6E7C74] mt-1 font-mono">
            #{order.orderNumber} · {formattedDate}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#F5F7F3] shrink-0 flex items-center justify-center">
          {order.previewItems[0]?.image ? (
            <img
              src={order.previewItems[0].image}
              alt={order.previewItems[0].name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl sm:text-2xl">🛒</span>
          )}
          {extraCount > 0 && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-semibold">+{extraCount}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-base text-[#16241D] truncate">{order.itemSummary}</p>
          <p className="text-xs sm:text-sm text-[#6E7C74]">{order.itemCount} items total</p>
        </div>
      </div>

      {!isPast && (
        <div className="mb-5">
          <ProgressTracker order={order} />
        </div>
      )}

      {!isPast && order.driverSearchFailed && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-xs sm:text-sm text-amber-800">
            We're having trouble finding a driver for this order. The store has
            been notified and will follow up shortly.
          </p>
        </div>
      )}

      {confirming ? (
        <div className="border-t border-[#E3E7E1] pt-4 mt-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FBEAE6] border border-[#F0C9BE] rounded-xl p-3 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm text-[#8A3B2A]">Cancel this order? This can't be undone.</p>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => setConfirming(false)}
                disabled={isCancelling}
                className="text-xs sm:text-sm font-semibold text-[#145C43] hover:underline disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-[#C0392B] hover:bg-[#A5321F] text-white text-xs sm:text-sm font-semibold rounded-lg px-3 sm:px-3.5 py-1.5 sm:py-2 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-[#E3E7E1] pt-4 mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-lg sm:text-xl font-bold text-[#16241D]" style={{ fontFamily: "Georgia, serif" }}>
            ₹{order.totalAmount.toFixed(2)}
          </span>

          <div className="flex items-center gap-3 sm:gap-4">
            {canCancel && (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#9C4A3A] hover:underline"
              >
                <X size={14} />
                Cancel Order
              </button>
            )}

            {isPast ? (
              <button className="text-xs sm:text-sm font-semibold text-[#145C43] hover:underline">
                View Details
              </button>
            ) : showCallRider ? (
              <button
                onClick={handleTrack}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#145C43] hover:bg-[#114E39] text-white rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors"
              >
                <Phone size={14} />
                Call Rider
              </button>
            ) : (
              <button
                onClick={handleTrack}
                className="text-xs sm:text-sm font-semibold text-[#145C43] hover:underline"
              >
                Track Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders content (reusable — standalone page below embeds it in full-page
// chrome; CustomerProfilePage embeds it directly inside its own tab) ─────────

export function OrdersContent({
  onTrackOrder,
}: {
  onTrackOrder?: (orderId: string) => void;
} = {}) {
  const { activeTab, setActiveTab } = useOrdersTab();
  const { orders, isLoading, error } = useOrdersList(activeTab);

  return (
    <>
      <div className="flex items-center gap-6 sm:gap-8 border-b border-[#E3E7E1] mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-base sm:text-lg font-semibold relative -mb-px ${
            activeTab === "active" ? "text-[#16241D]" : "text-[#9BAAA1]"
          }`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          Active Orders
          {activeTab === "active" && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#145C43] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-3 text-base sm:text-lg font-semibold relative -mb-px ${
            activeTab === "past" ? "text-[#16241D]" : "text-[#9BAAA1]"
          }`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          Past Orders
          {activeTab === "past" && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#145C43] rounded-full" />
          )}
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-[#6E7C74] py-16">Loading your orders…</p>
      ) : error ? (
        <p className="text-center text-[#6E7C74] py-16">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6E7C74]">
            {activeTab === "active" ? "No active orders right now." : "No past orders yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onTrackOrder={onTrackOrder} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]" style={{ fontFamily: "'Inter', sans-serif" }}>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          to="/customer/profile?tab=orders"
          className="mb-4 sm:mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>
        <h1
          className="text-2xl sm:text-4xl font-bold text-[#16241D] mb-2"
          style={{ fontFamily: "Georgia, serif" }}
        >
          My Orders
        </h1>
        <p className="text-xs sm:text-sm text-[#6E7C74] mb-6 sm:mb-8">Track and manage your recent marketplace purchases</p>

        <OrdersContent />
      </main>
    </div>
  );
}