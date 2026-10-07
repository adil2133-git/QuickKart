// src/features/driver/components/NewRequestsTab.tsx
import { useState } from "react";
import { MapPin, Navigation, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryRequest } from "../types/driverDelivery";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useCountdown } from "../hooks/useCountdown";

// Matches backend's REQUEST_EXPIRY_SECONDS (deliveryDispatchService.js) — only
// used here to size the ring's fill proportion, not for the countdown itself.
const REQUEST_WINDOW_SECONDS = 30;

// ─── Stats Cards ─────────────────────────────────────────────────────────────

function StatsCards() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);
  const statsLoading = useDriverDeliveryStore((s) => s.statsLoading);

  if (statsLoading && !stats) {
    return (
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-[#E3E7E1] bg-white p-5"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const progress = Math.min(
    ((stats.currentCount ?? 0) / (stats.dailyTarget ?? 1)) * 100,
    100
  );
  const remaining = Math.max(
    (stats.dailyTarget ?? 0) - (stats.currentCount ?? 0),
    0
  );

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Today's Earnings */}
      <div className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">
            Today's Earnings
          </p>
          {(stats.earningsChangePercent ?? 0) !== 0 && (
            <span className="text-xs font-semibold text-emerald-600">
              +{stats.earningsChangePercent}% vs yesterday
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-[#16241D]">
          ₹{(stats.todayEarnings ?? 0).toFixed(2)}
        </p>
      </div>

      {/* Completed */}
      <div className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-5 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">
          Completed
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-[#16241D]">
          {stats.completedCount ?? 0}{" "}
          <span className="text-sm sm:text-base font-normal text-[#6E7C74]">Deliveries</span>
        </p>
      </div>

      {/* Daily Target Bonus */}
      <div className="rounded-2xl border border-[#E7EFEA] bg-[#E7EFEA]/40 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#1F4D3D]">Daily Target Bonus</p>
          <span className="text-xs font-bold text-[#1F4D3D]">
            {stats.currentCount ?? 0} / {stats.dailyTarget ?? 0}
          </span>
        </div>
        {remaining > 0 ? (
          <p className="mb-3 text-sm text-[#6E7C74]">
            Deliver {remaining} more to unlock ₹{stats.targetBonus ?? 0} bonus.
          </p>
        ) : (
          <p className="mb-3 text-sm font-semibold text-emerald-700">
            🎉 Target reached! Bonus earned.
          </p>
        )}
        <div className="h-2 overflow-hidden rounded-full bg-[#E3E7E1]">
          <div
            className="h-full rounded-full bg-[#1F4D3D] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[#6E7C74]">
          <span>Daily Target: {stats.dailyTarget ?? 0}</span>
          <span>Earn: ₹{stats.targetBonus ?? 0}.00</span>
        </div>
      </div>
    </div>
  );
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({
  expiresAt,
  onExpire,
}: {
  expiresAt: number;
  onExpire: () => void;
}) {
  const remaining = useCountdown(expiresAt, onExpire);

  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const frac = remaining / REQUEST_WINDOW_SECONDS;
  const dash = circ * frac;
  const color =
    remaining > 15 ? "#1F4D3D" : remaining > 5 ? "#D97706" : "#DC2626";

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#E3E7E1"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="relative text-xs font-bold" style={{ color }}>
        {remaining}s
      </span>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request }: { request: DeliveryRequest }) {
  const { acceptRequest, declineRequest } = useDriverDeliveryActions();
  const removeRequest = useDriverDeliveryStore((s) => s.removeRequest);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptRequest(request.requestId);
      toast.success("Delivery accepted!");
    } catch {
      toast.error("Failed to accept. Try again.");
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await declineRequest(request.requestId);
    } catch {
      toast.error("Failed to decline.");
      setDeclining(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="mb-0.5 text-xs text-[#6E7C74]">#{request.orderNumber}</p>
          <h3 className="text-base font-bold text-[#16241D]">{request.storeName}</h3>
        </div>
        <CountdownRing
          expiresAt={request.expiresAt}
          onExpire={() => removeRequest(request.requestId)}
        />
      </div>

      {/* Distance info */}
      <div className="mb-4 space-y-1.5 border-b border-[#E3E7E1] pb-4">
        <div className="flex items-center gap-2 text-sm text-[#6E7C74]">
          <MapPin className="h-4 w-4 text-[#1F4D3D]" />
          <span>Pickup: {request.pickupDistanceKm} km away</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6E7C74]">
          <Navigation className="h-4 w-4 text-[#1F4D3D]" />
          <span>Delivery: {request.deliveryDistanceKm} km distance</span>
        </div>
      </div>

      {/* Earnings */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[#6E7C74]">Est. Earnings</span>
        <span className="flex items-center text-base font-bold text-[#1F4D3D]">
          <IndianRupee className="h-3.5 w-3.5" />
          {request.estimatedEarnings.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting || declining}
          className="flex-1 rounded-xl bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] py-2.5 text-sm font-bold text-[#16241D] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {accepting ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={accepting || declining}
          className="flex-1 rounded-xl border border-[#E3E7E1] py-2.5 text-sm font-semibold text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] disabled:opacity-60 cursor-pointer"
        >
          {declining ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface NewRequestsTabProps {
  requests: DeliveryRequest[];
  loading: boolean;
  error: string | null;
}

export default function NewRequestsTab({
  requests,
  loading,
  error,
}: NewRequestsTabProps) {
  return (
    <div>
      <StatsCards />

      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6E7C74]">
        Available Requests
      </h3>

      {loading && (
        <div className="flex h-40 items-center justify-center text-[#6E7C74]">
          Loading requests…
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#E3E7E1] text-center bg-white">
          <p className="font-semibold text-[#16241D]">No requests right now</p>
          <p className="text-sm text-[#6E7C74]">
            Stay online to receive new delivery requests.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requests.map((r) => (
          <RequestCard key={r.requestId} request={r} />
        ))}
      </div>
    </div>
  );
}