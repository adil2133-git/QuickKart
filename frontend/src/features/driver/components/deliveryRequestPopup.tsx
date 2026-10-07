import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, IndianRupee, Package, X, Navigation } from "lucide-react";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useCountdown } from "../hooks/useCountdown";
import type { DeliveryRequest } from "../types/driverDelivery";

// Matches backend's REQUEST_EXPIRY_SECONDS (deliveryDispatchService.js) — only
// used here to size the progress bar, not for the countdown itself.
const REQUEST_WINDOW_SECONDS = 30;

function RequestCard({
  request,
  onAccept,
  onDecline,
  onExpire,
  isAccepting,
}: {
  request: DeliveryRequest;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
  isAccepting: boolean;
}) {
  const remaining = useCountdown(request.expiresAt, onExpire);

  const pct = Math.max(0, (remaining / REQUEST_WINDOW_SECONDS) * 100);
  const urgency = remaining <= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
      className="w-full max-w-sm sm:w-80 rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-[#E3E7E1] overflow-hidden"
    >
      {/* Timer bar */}
      <div className="h-1 bg-[#F5F7F3]">
        <motion.div
          className={`h-full transition-colors ${urgency ? "bg-rose-500" : "bg-[#1F4D3D]"}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E7C74]">New Request</p>
            <p className="text-sm font-bold text-[#16241D]">Order #{request.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold tabular-nums ${urgency ? "text-rose-600" : "text-[#1F4D3D]"}`}>
              {remaining}s
            </span>
            <button
              onClick={onDecline}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#6E7C74] hover:bg-[#F5F7F3] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Route */}
        <div className="mb-3 rounded-xl bg-[#F5F7F3] p-3 space-y-2 border border-[#E3E7E1]">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1F4D3D]">
              <Navigation className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Pickup</p>
              <p className="text-xs font-semibold text-[#16241D] truncate">{request.storeName}</p>
            </div>
          </div>
          <div className="ml-2.5 h-3 w-px bg-[#E3E7E1]" />
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
              <MapPin className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Drop</p>
              <p className="text-xs font-semibold text-[#16241D] truncate">{request.recipientName}</p>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mb-4 flex items-center justify-between text-xs text-[#6E7C74]">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3 text-[#1F4D3D]" />
            {request.itemCount} {request.itemCount === 1 ? "item" : "items"}
          </span>
          <span>{request.pickupDistanceKm?.toFixed(1) ?? "—"} km pickup</span>
          <span className="flex items-center gap-0.5 font-bold text-[#16241D]">
            <IndianRupee className="h-3 w-3" />
            {request.estimatedEarnings?.toFixed(0) ?? "—"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onDecline}
            className="flex-1 rounded-xl border border-[#E3E7E1] py-2.5 text-xs font-semibold text-[#145C43] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
          >
            Decline
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAccept}
            disabled={isAccepting || remaining === 0}
            className="flex-1 rounded-xl bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] py-2.5 text-xs font-bold text-[#16241D] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isAccepting ? "Accepting…" : "Accept"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DeliveryRequestPopup() {
  const requests = useDriverDeliveryStore((s) => s.requests);
  const removeRequest = useDriverDeliveryStore((s) => s.removeRequest);
  const { acceptRequest, declineRequest } = useDriverDeliveryActions();

  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Show only the most recent request — stack would be overwhelming
  const latest = requests[0] ?? null;

  const handleAccept = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      await acceptRequest(requestId);
      removeRequest(requestId);
    } catch {
      // toast already shown in acceptRequest
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
    } finally {
      removeRequest(requestId);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex flex-col items-end space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {latest && (
          <div key={latest.requestId} className="w-full sm:w-auto pointer-events-auto">
            <RequestCard
              request={latest}
              onAccept={() => handleAccept(latest.requestId)}
              onDecline={() => handleDecline(latest.requestId)}
              onExpire={() => removeRequest(latest.requestId)}
              isAccepting={acceptingId === latest.requestId}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Badge showing more waiting requests */}
      <AnimatePresence>
        {requests.length > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-[#2F1B12] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            +{requests.length - 1} more waiting
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}