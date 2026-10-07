import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Package } from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import { useFetchOrderDetail, useUpdateOrderStatus } from "../hooks/useStoreOrders";
import { useOrderCancelledWatcher } from "../hooks/useOrderCancelledWatcher";
import { OrderCancelledModal } from "../components/orderCancelledModal";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackingChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchDetail = useFetchOrderDetail();
  const updateStatus = useUpdateOrderStatus();

  const {
    selectedOrder,
    isLoadingDetail,
    packingItems,
    togglePackingItem,
    markAllPacked,
    isUpdatingStatus,
  } = useStoreOrdersStore();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  // Live-detect the customer cancelling this exact order mid-pack.
  const { justCancelled, dismiss } = useOrderCancelledWatcher(selectedOrder?.orderStatus);

  const packedCount = packingItems.filter((i) => i.isPacked).length;
  const totalCount = packingItems.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
  const allPacked = packedCount === totalCount && totalCount > 0;

  const handleReadyForPickup = async () => {
    if (!selectedOrder) return;
    const ok = await updateStatus(selectedOrder.id, "READY_FOR_PICKUP");
    if (ok) navigate(`/store/orders/${selectedOrder.id}/complete`);
  };

  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F7F8F5] font-['Inter',sans-serif]">
        <p className="text-sm text-[#6E7C74]">Loading checklist…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F7F8F5] font-['Inter',sans-serif]">
      {justCancelled && selectedOrder && (
        <OrderCancelledModal
          orderNumber={selectedOrder.orderNumber}
          onAcknowledge={() => {
            dismiss();
            navigate("/store/orders");
          }}
        />
      )}

      {/* ── Progress bar card ──────────────────────────────────────────────────── */}
      <div className="m-4 sm:m-8 mb-0 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#16241D]">Order Progress</p>
            <p className="mt-0.5 text-xs text-[#6E7C74]">Scanning items for customer shipment</p>
          </div>
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-bold text-[#1F4D3D]">{progressPercent}%</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4D3D]">
              {packedCount}/{totalCount} Packed
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F5F7F3]">
          <div
            className="h-full rounded-full bg-[#1F4D3D] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Items grid ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-4 sm:pt-5">
        {packingItems.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#6E7C74]">
            No items found for this order.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {packingItems.map((item) => (
              <button
                key={item.productId}
                onClick={() => togglePackingItem(item.productId)}
                className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  item.isPacked
                    ? "border-[#1F4D3D]"
                    : "border-[#E3E7E1] hover:border-[#1F4D3D]/50"
                }`}
              >
                {/* Product image */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#F5F7F3]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-12 w-12 text-[#1F4D3D]" />
                    </div>
                  )}

                  {/* Check overlay */}
                  <div
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      item.isPacked
                        ? "border-[#1F4D3D] bg-[#1F4D3D]"
                        : "border-white bg-white/60"
                    }`}
                  >
                    {item.isPacked && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>

                {/* Item info */}
                <div
                  className={`px-4 py-3 transition-colors ${
                    item.isPacked ? "bg-[#E7EFEA]" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#16241D]">{item.productName}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.isPacked
                          ? "bg-[#1F4D3D] text-white"
                          : "bg-[#F5F7F3] text-[#6E7C74]"
                      }`}
                    >
                      {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs italic text-[#6E7C74]">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-[#E3E7E1] bg-white px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#6E7C74]">
            <div className="flex items-center gap-1.5">
              {/* Truck + person icon placeholder */}
              <span className="text-lg">🚚</span>
              <span className="text-lg">👤</span>
            </div>
            <span className="font-medium">Scheduled for pickup at 4:30 PM</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={markAllPacked}
              disabled={allPacked || selectedOrder?.orderStatus === "CANCELLED"}
              className="flex-1 sm:flex-initial rounded-full border border-[#E3E7E1] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] disabled:opacity-40 cursor-pointer text-center"
            >
              Mark All Packed
            </button>

            <button
              onClick={handleReadyForPickup}
              disabled={!allPacked || isUpdatingStatus || selectedOrder?.orderStatus === "CANCELLED"}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                allPacked
                  ? "bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] text-[#16241D]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-60"
              }`}
            >
              Ready for Pickup
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}