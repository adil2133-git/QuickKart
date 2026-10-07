import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import {
  useFetchOrderDetail,
  useUpdateOrderStatus,
  useRetryDriverSearch,
  useCancelUndeliverableOrder,
} from "../hooks/useStoreOrders";
import { useOrderCancelledWatcher } from "../hooks/useOrderCancelledWatcher";
import { OrderCancelledModal } from "../components/orderCancelledModal";
import type { OrderStatus } from "../types/storeOrders";

// ─── Order progress steps ─────────────────────────────────────────────────────

type ProgressStep = {
  key: OrderStatus;
  label: string;
};

const PROGRESS_STEPS: ProgressStep[] = [
  { key: "PENDING", label: "Received" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PACKING", label: "Packing" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
];

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function getStepState(stepKey: OrderStatus, currentStatus: OrderStatus): "done" | "active" | "idle" {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "idle";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StepIcon({ state }: { state: "done" | "active" | "idle" }) {
  if (state === "done") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F4D3D]">
        <CheckCircle2 className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1F4D3D] bg-white">
        <div className="h-3 w-3 rounded-full bg-[#1F4D3D]" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E3E7E1] bg-white">
      <Circle className="h-4 w-4 text-[#9BAAA1]" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchDetail = useFetchOrderDetail();
  const updateStatus = useUpdateOrderStatus();
  const retryDriverSearch = useRetryDriverSearch();
  const cancelUndeliverableOrder = useCancelUndeliverableOrder();

  const { selectedOrder, isLoadingDetail, detailError, isUpdatingStatus } =
    useStoreOrdersStore();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  const order = selectedOrder;

  // Live-detect the customer cancelling this exact order while it's open here.
  const { justCancelled, dismiss } = useOrderCancelledWatcher(order?.orderStatus);

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleStartPacking = async () => {
    if (!order) return;
    const ok = await updateStatus(order.id, "PACKING");
    if (ok) navigate(`/store/orders/${order.id}/packing`);
  };

   const handleMarkReady = async () => {
    if (!order) return;
    const ok = await updateStatus(order.id, "READY_FOR_PICKUP");
    if (ok) navigate(`/store/orders/${order.id}/complete`);
  };

  const handleRetryDriverSearch = async () => {
    if (!order) return;
    await retryDriverSearch(order.id);
  };

  const handleCancelUndeliverable = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      `Cancel order #${order.orderNumber}? The customer will be refunded in full and notified.`
    );
    if (!confirmed) return;
    const ok = await cancelUndeliverableOrder(order.id);
    if (ok) navigate("/store/orders");
  };

  // ── Loading / error states ────────────────────────────────────────────────────
  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F7F8F5] font-['Inter',sans-serif]">
        <p className="text-sm text-[#6E7C74]">Loading order…</p>
      </div>
    );
  }

  if (detailError || !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#F7F8F5] font-['Inter',sans-serif]">
        <p className="text-sm text-rose-600">{detailError ?? "Order not found"}</p>
        <button
          onClick={() => navigate("/store/orders")}
          className="rounded-xl bg-[#1F4D3D] px-5 py-2 text-sm font-semibold text-white hover:bg-[#163D30] cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F7F8F5] font-['Inter',sans-serif]">
      {justCancelled && (
        <OrderCancelledModal
          orderNumber={order.orderNumber}
          onAcknowledge={() => {
            dismiss();
            navigate("/store/orders");
          }}
        />
      )}

      {/* ── Progress tracker ───────────────────────────────────────────────────── */}
      <div className="border-b border-[#E3E7E1] bg-white px-4 sm:px-8 py-3.5 sm:py-5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-[380px]">
          {PROGRESS_STEPS.map((step, idx) => {
            const state = getStepState(step.key, order.orderStatus);
            const isLast = idx === PROGRESS_STEPS.length - 1;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* Left connector */}
                  {idx > 0 && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        getStepState(PROGRESS_STEPS[idx - 1].key, order.orderStatus) === "done"
                          ? "bg-[#1F4D3D]"
                          : "bg-[#E3E7E1]"
                      }`}
                    />
                  )}
                  <StepIcon state={state} />
                  {/* Right connector */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        state === "done" ? "bg-[#1F4D3D]" : "bg-[#E3E7E1]"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    state === "idle" ? "text-[#6E7C74]" : "text-[#16241D]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── No drivers found banner ───────────────────────────────────────────── */}
      {order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed && (
        <div className="mx-4 sm:mx-8 mt-4 sm:mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                No drivers were found for this order
              </p>
              <p className="mt-1 text-sm text-amber-700">
                We searched nearby drivers repeatedly with no luck. You can try
                the search again, or cancel the order with a full refund to the
                customer.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRetryDriverSearch}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full bg-[#1F4D3D] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-[#163D30] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Driver Search
            </button>
            <button
              onClick={handleCancelUndeliverable}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Cancel & Refund
            </button>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Customer card */}
          <div className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#16241D]">{order.recipientName}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-[#6E7C74]">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-[#1F4D3D]" />
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
              <span className="rounded-full bg-[#E7EFEA] px-3 py-1 text-xs font-semibold text-[#1F4D3D] w-fit">
                Home Delivery
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#E3E7E1] pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">
                  Placed On
                </p>
                <p className="mt-1 text-sm font-medium text-[#16241D]">
                  {formatDateTime(order.placedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">
                  Payment Method
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#1F4D3D]" />
                  <p className="text-sm font-medium text-[#16241D]">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-2xl border border-[#E3E7E1] bg-white">
            <div className="border-b border-[#E3E7E1] px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">
                Order Items
              </p>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[#E3E7E1] bg-[#F5F7F3] px-6 py-2">
              {["PRODUCT", "PRICE", "QTY", "TOTAL"].map((h) => (
                <span key={h} className="text-xs font-semibold tracking-wider text-[#6E7C74]">
                  {h}
                </span>
              ))}
            </div>

            {order.products.map((item, idx) => (
              <div
                key={item.productId}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-4 ${
                  idx !== order.products.length - 1 ? "border-b border-[#E3E7E1]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7EFEA]">
                      <Package className="h-5 w-5 text-[#1F4D3D]" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#16241D]">{item.productName}</span>
                </div>
                <span className="text-sm text-[#6E7C74]">₹{item.price.toFixed(2)}</span>
                <span className="text-sm text-[#6E7C74]">{item.quantity}x</span>
                <span className="text-sm font-semibold text-[#16241D]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Order summary */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
            <h3 className="text-base font-bold text-[#16241D]">Order Summary</h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6E7C74]">Subtotal</span>
                <span className="font-medium text-[#16241D]">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6E7C74]">Delivery Fee</span>
                <span className="font-medium text-[#16241D]">
                  ₹{order.deliveryCharge.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-[#E3E7E1] pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-[#16241D]">Total</span>
                  <span className="text-base font-bold text-[#1F4D3D]">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#E3E7E1] bg-white px-4 sm:px-8 py-3.5 sm:py-4">
         <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-xs sm:text-sm font-semibold text-[#16241D]">
            CURRENTLY:{" "}
            {order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed
              ? "NO DRIVERS FOUND"
              : order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial rounded-full border border-[#E3E7E1] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] cursor-pointer text-center">
            Contact Customer
          </button>

          {order.orderStatus === "ACCEPTED" && (
            <button
              onClick={handleStartPacking}
              disabled={isUpdatingStatus}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-[#16241D] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              Start Packing
            </button>
          )}

          {order.orderStatus === "PACKING" && (
            <button
              onClick={handleMarkReady}
              disabled={isUpdatingStatus}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-[#16241D] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              Mark Ready for Pickup
            </button>
          )}

          {order.orderStatus === "PENDING" && (
            <button
              onClick={() => updateStatus(order.id, "ACCEPTED")}
              disabled={isUpdatingStatus}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-[#16241D] transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}