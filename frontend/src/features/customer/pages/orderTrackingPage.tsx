import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Phone,
  Truck,
  MapPin,
  PackageCheck,
  Check,
  Clock,
  Star,
  MessageCircle,
  Navigation,
  Store,
  ClipboardList,
  Headphones,
  XCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
   Bike,
  AlertTriangle,
} from "lucide-react";
import { useActiveDeliveryStore } from "../state/activeDeliveryState";
import { useActiveDeliveryTracking } from "../hooks/useActiveDeliveryTracking";
import { useOrderDetail, useCancelOrder } from "../hooks/useMyOrders";
import { estimateEtaMinutes, haversineKm } from "../lib/deliveryEta";

const STATUS_ORDER = [
  "PENDING",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const CANCELLABLE_RAW_STATUSES = ["PENDING", "ACCEPTED", "PACKING"];

// Four stops shown on the "Tracking Details" timeline — deliberately fewer
// than the full backend status list, to match the simpler, scannable design.
const TIMELINE_STEPS = [
  { label: "Order Confirmed", threshold: "ACCEPTED" },
  { label: "Picked Up", threshold: "PICKED_UP" },
  { label: "On the Way", threshold: "OUT_FOR_DELIVERY" },
  { label: "Delivered", threshold: "DELIVERED" },
] as const;

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:48px;height:48px;border-radius:50%;
    background:linear-gradient(145deg, #145C43, #1A7A5A);
    border:3px solid white;
    box-shadow:0 8px 32px rgba(20,92,67,0.4), 0 0 0 8px rgba(20,92,67,0.1);
    display:flex;align-items:center;justify-content:center;font-size:22px;
    transition: all 0.3s ease;
  ">🚚</div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:40px;height:40px;background:#B43C3C;
    border:4px solid white;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 4px 20px rgba(180,60,60,0.3), 0 0 0 8px rgba(180,60,60,0.08);
  "></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:white;border:3px solid #145C43;
    display:flex;align-items:center;justify-content:center;font-size:16px;
    box-shadow:0 2px 16px rgba(0,0,0,0.12);
  ">🏪</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function LiveMap({
  driverPos,
  destinationPos,
  storePos,
  etaMinutes,
}: {
  driverPos: { lat: number; lng: number };
  destinationPos: { lat: number; lng: number } | null;
  storePos: { lat: number; lng: number } | null;
  etaMinutes: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Layer | null>(null);
  const hasFitBoundsRef = useRef(false);
  const driverPosRef = useRef(driverPos);
  const destinationPosRef = useRef(destinationPos);
  const storePosRef = useRef(storePos);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    driverPosRef.current = driverPos;
    destinationPosRef.current = destinationPos;
    storePosRef.current = storePos;
  }, [destinationPos, driverPos, storePos]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialDriver = driverPosRef.current;

    const map = L.map(containerRef.current, {
      center: [initialDriver.lat, initialDriver.lng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], {
      icon: driverIcon,
    }).addTo(map);

    if (storePos)
      L.marker([storePos.lat, storePos.lng], { icon: storeIcon }).addTo(map);
    if (destinationPos)
      L.marker([destinationPos.lat, destinationPos.lng], {
        icon: destinationIcon,
      }).addTo(map);

    // Route polyline
    if (destinationPos) {
      const routePoints: L.LatLngExpression[] = [
        [driverPos.lat, driverPos.lng],
        [destinationPos.lat, destinationPos.lng],
      ];
      const routeLine = L.polyline(routePoints, {
        color: "#145C43",
        weight: 4,
        opacity: 0.7,
        dashArray: "8, 8",
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
      routeLayerRef.current = routeLine;

      // Animated dash offset
      let offset = 0;
      const animateRoute = () => {
        if (routeLine && routeLine.getElement()) {
          offset = (offset + 1) % 16;
          const el = routeLine.getElement();
          if (el) {
            (el as HTMLElement).style.strokeDashoffset = `-${offset}`;
          }
        }
        requestAnimationFrame(animateRoute);
      };
      animateRoute();
    }

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [destinationPos, driverPos.lat, driverPos.lng, storePos]);

  useEffect(() => {
    if (!mapRef.current) return;
    driverMarkerRef.current?.setLatLng([driverPos.lat, driverPos.lng]);

    if (!hasFitBoundsRef.current && mapRef.current && destinationPos) {
      const points: [number, number][] = [
        [driverPos.lat, driverPos.lng],
        [destinationPos.lat, destinationPos.lng],
      ];
      if (storePos) points.push([storePos.lat, storePos.lng]);
      mapRef.current.fitBounds(points, { padding: [80, 80], maxZoom: 14 });
      hasFitBoundsRef.current = true;
    }
  }, [destinationPos, driverPos.lat, driverPos.lng, storePos]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    if (!mapRef.current || !destinationPos) return;
    const points: [number, number][] = [
      [driverPos.lat, driverPos.lng],
      [destinationPos.lat, destinationPos.lng],
    ];
    if (storePos) points.push([storePos.lat, storePos.lng]);
    mapRef.current.fitBounds(points, { padding: [80, 80], maxZoom: 14 });
  };

  const toggleFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  };

  return (
    <div className={`relative ${isMapFullscreen ? "fixed inset-0 z-50" : "w-full h-full"}`}>
      <div ref={containerRef} className="w-full h-full rounded-2xl" />

      {/* Floating live-tracking pill */}
      <div className="absolute top-4 left-4 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Live Tracking
          </span>
        </div>
        <div className="text-lg font-bold text-gray-900">
          {etaMinutes != null ? `${etaMinutes} min away` : "Calculating…"}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <ZoomIn size={18} color="#16241D" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <ZoomOut size={18} color="#16241D" />
        </button>
        <button
          onClick={handleFitBounds}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <Maximize2 size={16} color="#16241D" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          {isMapFullscreen ? <Minimize2 size={16} color="#16241D" /> : <Maximize2 size={16} color="#16241D" />}
        </button>
      </div>
    </div>
  );
}

// ─── Order Tracking Content ──────────────────────────────────────────────────
// The reusable core of this page. CustomerProfilePage embeds this directly
// inside its "My Orders" tab (swapped in when a "Track Order" is tapped, no
// route change); the standalone route below wraps it in its own page chrome
// for direct links / notifications.

export function OrderTrackingContent({
  orderId,
  onBack,
}: {
  orderId: string;
  onBack: () => void;
}) {
  useActiveDeliveryTracking();
  const delivery = useActiveDeliveryStore((s) => s.delivery);
  const isLoading = useActiveDeliveryStore((s) => s.isLoading);
  const { detail } = useOrderDetail(orderId);
  const { cancelOrder } = useCancelOrder();
  const [isCancelling, setIsCancelling] = useState(false);

  const driverPos = delivery?.driver.currentLocation ?? null;
  const destinationPos = delivery?.deliveryCoordinates ?? null;
  const storePos = delivery?.store.coordinates ?? null;
  const eta = driverPos && destinationPos ? estimateEtaMinutes(driverPos, destinationPos) : null;
  const distanceKm = driverPos && destinationPos ? haversineKm(driverPos, destinationPos) : null;

  const isMatchingOrder = delivery?.orderId === orderId;

  const statusIdx = delivery ? STATUS_ORDER.indexOf(delivery.orderStatus) : -1;
  let currentStepIdx = -1;
  TIMELINE_STEPS.forEach((step, i) => {
    if (statusIdx >= STATUS_ORDER.indexOf(step.threshold)) currentStepIdx = i;
  });

  const pickedIdx = STATUS_ORDER.indexOf("PICKED_UP");
  const deliveredIdx = STATUS_ORDER.indexOf("DELIVERED");
  const clampedIdx = Math.min(Math.max(statusIdx, pickedIdx), deliveredIdx);
  const progressPct = ((clampedIdx - pickedIdx) / (deliveredIdx - pickedIdx)) * 100;

 const driverInitial = delivery?.driver.name?.trim().charAt(0).toUpperCase() || "D";

  // "Expected by" is a wall-clock label derived from `eta` (minutes from
  // now). Reading Date.now() directly during render is impure (flagged by
  // react-hooks/purity), so the clock read has to live in an effect. That
  // makes the state update below one of the legitimate exceptions to
  // set-state-in-effect: anchoring a value that depends on something
  // outside React (the system clock) can only happen after render.
  const [etaAnchor, setEtaAnchor] = useState(() => Date.now());
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEtaAnchor(Date.now());
  }, [eta]);
  const expectedByLabel =
    eta != null ? new Date(etaAnchor + eta * 60000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;
  const canCancel = detail ? CANCELLABLE_RAW_STATUSES.includes(detail.rawStatus) : false;

  const handleCancel = async () => {
    setIsCancelling(true);
    const ok = await cancelOrder(orderId);
    setIsCancelling(false);
    if (ok) onBack();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Compact header — works both embedded and standalone */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono">#{delivery?.orderNumber || detail?.orderNumber}</span>
          {isMatchingOrder && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: "#145C43", borderTopColor: "transparent" }}
            />
            <span className="text-sm text-gray-500">Loading tracking info…</span>
          </div>
        </div>
      ) : detail?.rawStatus === "READY_FOR_PICKUP" && detail?.driverSearchFailed ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 px-8 text-center max-w-md">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FBEAE6" }}>
              <AlertTriangle size={40} color="#C0392B" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Still looking for a driver</h3>
            <p className="text-sm text-gray-500">
              We're having trouble finding a driver for order #{detail?.orderNumber}. The
              store has been notified and will follow up shortly — you don't need to
              do anything right now.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onBack}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white border-none cursor-pointer mt-2"
              style={{ backgroundColor: "#145C43" }}
            >
              Back to My Orders
            </motion.button>
          </div>
        </div>
      ) : !isMatchingOrder || !driverPos ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 px-8 text-center max-w-md">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5F7F3" }}>
              <PackageCheck size={40} color="#9BAAA1" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Nothing to track right now</h3>
            <p className="text-sm text-gray-500">
              This order isn't out for delivery, or has already arrived. Check My Orders for its full status.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onBack}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white border-none cursor-pointer mt-2"
              style={{ backgroundColor: "#145C43" }}
            >
              Back to My Orders
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Map + sidebar row */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:h-[600px]">
            {/* Map */}
            <div className="h-[320px] sm:h-[400px] lg:h-full rounded-2xl overflow-hidden shadow-lg bg-white">
              <LiveMap driverPos={driverPos} destinationPos={destinationPos} storePos={storePos} etaMinutes={eta} />
            </div>

            {/* Sidebar */}
            <div className="lg:overflow-y-auto lg:pr-1 space-y-4">
              {/* Estimated Arrival card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-4 sm:p-6"
                style={{ backgroundColor: "#145C43" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                    Estimated Arrival
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    On the way
                  </span>
                </div>

                <div className="flex items-end gap-2 mb-6">
                  <span className="text-5xl font-bold text-white leading-none">{eta ?? "—"}</span>
                  <span className="text-lg font-semibold text-white/80 mb-1">MIN</span>
                </div>

                <div className="relative h-1.5 rounded-full bg-white/20 mb-2.5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute -top-2.5 flex items-center justify-center w-7 h-7 rounded-full bg-white shadow"
                    style={{ left: `calc(${progressPct}% - 14px)` }}
                  >
                    <Truck size={14} color="#145C43" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Picked Up</span>
                  <span>Delivered</span>
                </div>
              </motion.div>

              {/* Driver card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-semibold"
                      style={{ backgroundColor: "#E8EFEC", color: "#145C43" }}
                    >
                      {driverInitial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base sm:text-lg text-gray-900 truncate">{delivery!.driver.name}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span className="text-xs font-medium text-amber-700">4.9</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1.5 truncate">
                        <Bike size={14} className="shrink-0" />
                        {delivery!.driver.vehicleType || "Scooter"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                      <span className="font-mono text-xs truncate">{delivery!.driver.vehicleNumber || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  {delivery!.driver.phone ? (
                    <a
                      href={`tel:${delivery!.driver.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-700 font-medium text-xs sm:text-sm hover:bg-green-100 transition-colors border border-green-100"
                    >
                      <Phone size={15} />
                      Call
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-400 font-medium text-xs sm:text-sm border border-gray-100 cursor-not-allowed"
                    >
                      <Phone size={15} />
                      Call
                    </button>
                  )}
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium text-xs sm:text-sm transition-colors"
                    style={{ backgroundColor: "#145C43" }}
                  >
                    <MessageCircle size={15} />
                    Chat
                  </button>
                </div>
              </motion.div>

              {/* Tracking details timeline */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} color="#6E7C74" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Tracking Details
                  </span>
                </div>
                <div>
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone = i < currentStepIdx;
                    const isActive = i === currentStepIdx;
                    const isLast = i === TIMELINE_STEPS.length - 1;
                    return (
                      <div key={step.label} className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <motion.div
                            initial={isActive ? { scale: 0.8 } : false}
                            animate={isActive ? { scale: 1 } : false}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                              isDone || isActive ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isDone ? (
                              <Check size={14} strokeWidth={3} />
                            ) : isActive ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </motion.div>
                          {!isLast && (
                            <div
                              className="w-0.5 flex-1"
                              style={{ minHeight: 28, backgroundColor: isDone ? "#16A34A" : "#E5E7EB" }}
                            />
                          )}
                        </div>
                        <div className={`pb-4 sm:pb-5 ${isLast ? "pb-0" : ""}`}>
                          <span className={`text-xs sm:text-sm font-medium block ${isDone || isActive ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </span>
                          {isActive && step.label === "On the Way" && eta != null && (
                            <span className="text-[11px] sm:text-xs text-green-600 mt-0.5 block">Arriving in {eta} mins</span>
                          )}
                          {isActive && step.label !== "On the Way" && (
                            <span className="text-[11px] sm:text-xs text-green-600 mt-0.5 block">In progress…</span>
                          )}
                          {isDone && <span className="text-[11px] sm:text-xs text-gray-400 mt-0.5 block">Completed</span>}
                          {!isDone && !isActive && step.label === "Delivered" && expectedByLabel && (
                            <span className="text-[11px] sm:text-xs text-gray-400 mt-0.5 block">Expected by {expectedByLabel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Delivering To + Order Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-2xl p-4 sm:p-6 bg-white border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <MapPin size={16} color="#145C43" />
                <span className="text-sm sm:text-base font-semibold text-gray-900">Delivering To</span>
              </div>
              <p className="font-semibold text-sm sm:text-base text-gray-900">{detail?.recipientName || "—"}</p>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                {detail?.deliveryAddress || delivery!.deliveryAddress}
              </p>
              {distanceKm != null && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <Navigation size={12} />
                  <span>
                    Estimated distance: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                  </span>
                </div>
              )}
              {(detail?.store?.name || delivery!.store.storeName) && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                  <Store size={12} />
                  <span>Picked up from {detail?.store?.name || delivery!.store.storeName}</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl p-4 sm:p-6 bg-white border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} color="#145C43" />
                  <span className="text-sm sm:text-base font-semibold text-gray-900">Order Summary</span>
                </div>
                {detail?.paymentStatus === "PAID" && (
                  <span className="text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-50 text-green-700">Paid</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mb-3">ID: #{detail?.orderNumber || delivery?.orderNumber}</p>
              <div className="flex items-start justify-between gap-4 text-xs sm:text-sm mb-4">
                <span className="text-gray-600 line-clamp-2">
                  {detail?.products?.length
                    ? detail.products.map((p) => `${p.productName} ×${p.quantity}`).join(", ")
                    : "Loading items…"}
                </span>
                <span className="font-bold text-gray-900 whitespace-nowrap">
                  {detail ? `₹${detail.totalAmount}` : ""}
                </span>
              </div>
              <button className="w-full border border-gray-200 rounded-xl py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                View Digital Invoice
              </button>
            </motion.div>
          </div>

          {/* Support / cancel links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2 pb-4">
            <button className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <Headphones size={16} />
              Contact Support
            </button>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle size={16} />
                {isCancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standalone page (direct links / notifications) ────────────────────────

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8F5" }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <OrderTrackingContent orderId={orderId!} onBack={() => navigate("/customer/profile?tab=orders")} />
      </div>
    </div>
  );
}