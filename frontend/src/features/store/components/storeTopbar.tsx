import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useNotificationStore } from "../../shared/state/notificationState";
import { useNotificationActions } from "../../shared/hooks/useNotifications";

// Derives a human-readable title from the current path so every page
// gets the right heading without each page having to pass it manually.
function titleFromPath(pathname: string): string {
  if (pathname === "/store/dashboard")           return "Dashboard";
  if (pathname === "/store/orders")              return "Orders";
  if (pathname === "/store/products/new")        return "Add Product";
  if (pathname.match(/^\/store\/products\/.+\/edit$/)) return "Edit Product";
  if (pathname === "/store/products")            return "Products";
  if (pathname === "/store/inventory")           return "Inventory";
  if (pathname === "/store/categories")          return "Categories";
  if (pathname === "/store/analytics")           return "Analytics";
  if (pathname === "/store/revenue")             return "Revenue";
  if (pathname === "/store/settings")            return "Settings";
  if (pathname === "/store/profile")             return "Profile";
  return "Store Panel";
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

interface TopbarProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
}

export default function Topbar({ onNotificationClick, onMenuClick }: TopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);

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

  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-[#E3E7E1] bg-white px-4 sm:px-8">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E3E7E1] text-[#16241D] hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-[#16241D]">{title}</h2>
      </div>

      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => {
            setOpen(!isOpen);
            onNotificationClick?.();
          }}
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
          }
          className="relative rounded-full p-2 text-[#16241D] transition-colors hover:bg-slate-100"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
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
                  className="text-[11px] font-semibold text-[#145C43] hover:underline"
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
                        if (n.orderId) navigate(`/store/orders/${n.orderId}`);
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
    </header>
  );
}