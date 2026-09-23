import { useEffect, useRef } from "react";
import { Bell, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDashboardStore } from "../state/driverDashboardState";
import { toast } from "sonner";
import { useNotificationStore } from "../../shared/state/notificationState";
import { useNotificationActions } from "../../shared/hooks/useNotifications";

function titleFromPath(pathname: string): string {
  if (pathname === "/driver/dashboard")  return "Dashboard";
  if (pathname === "/driver/deliveries") return "Deliveries";
  if (pathname === "/driver/earnings")   return "Earnings";
  if (pathname === "/driver/wallet")     return "Wallet";
  if (pathname === "/driver/rewards")    return "Rewards";
  if (pathname === "/driver/profile")    return "Profile";
  return "Driver Portal";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DriverTopbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);

  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const requests = useDriverDeliveryStore((s) => s.requests);
  const locationStatus = useDriverDashboardStore((s) => s.locationStatus);
  const { toggleAvailability } = useDriverDeliveryActions();

  const { notifications, unreadCount, isOpen, setOpen } = useNotificationStore();
  const { handleMarkRead, handleMarkAllRead } = useNotificationActions();

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inside =
        (btnRef.current && btnRef.current.contains(target)) ||
        (panelRef.current && panelRef.current.contains(target));
      if (!inside) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpen]);

  const handleToggle = async () => {
    try {
      await toggleAvailability(!isOnline);
    } catch {
      toast.error("Could not update availability. Try again.");
    }
  };

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E3E7E1] bg-white px-6">
      <h1 className="text-[15px] font-semibold text-[#16241D] tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {isOnline && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#F5F7F3] border border-[#E3E7E1] px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${
              locationStatus === "active" ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
            }`} />
            <span className="text-[11px] font-medium text-[#5F7166]">
              {locationStatus === "active" ? "GPS" : "Locating…"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className={[
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all cursor-pointer",
            isOnline
              ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              : "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200",
          ].join(" ")}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-white animate-pulse" : "bg-rose-500"}`} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>

        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen(!isOpen)}
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#16241D] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
          >
            <Bell className="h-[18px] w-[18px]" />
            {(unreadCount > 0 || requests.length > 0) && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount || requests.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div
              ref={panelRef}
              className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,90vw)] overflow-hidden rounded-2xl border border-[#E3E7E1] bg-white shadow-lg"
            >
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6E7C74]">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#1F4D3D] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <ul role="list" className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="flex flex-col items-center justify-center gap-2 py-10">
                    <Bell size={28} className="text-[#9BAAA1]" />
                    <span className="text-[13px] text-[#6E7C74]">No notifications yet</span>
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li key={n._id} className="border-t border-[#E3E7E1] first:border-t-0">
                      <button
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n._id);
                          setOpen(false);
                          if (n.orderId) navigate("/driver/deliveries");
                        }}
                        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F5F7F3] cursor-pointer"
                        style={{ background: !n.isRead ? "#E7EFEA" : undefined }}
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: !n.isRead ? "#1F4D3D" : "transparent" }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-[13px] font-semibold text-[#16241D]">
                              {n.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-[#6E7C74]">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                          <span className="block text-[12px] leading-snug text-[#6E7C74]">
                            {n.message}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/driver/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
          aria-label="Profile"
        >
          <UserCircle className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}