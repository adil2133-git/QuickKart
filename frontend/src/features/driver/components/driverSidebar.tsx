import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Truck, BadgeDollarSign, Wallet,
  Trophy, LogOut, Headphones, Settings, X,
} from "lucide-react";
import { useLogout } from "../../auth/hooks/useLogout";

type DriverNavKey = "dashboard" | "deliveries" | "earnings" | "wallet" | "rewards" | "support" | "settings";

interface NavItem {
  key: DriverNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",  label: "Dashboard",  icon: LayoutGrid,      path: "/driver/dashboard" },
  { key: "deliveries", label: "Deliveries", icon: Truck,           path: "/driver/deliveries" },
  { key: "earnings",   label: "Earnings",   icon: BadgeDollarSign, path: "/driver/earnings" },
  { key: "wallet",     label: "Wallet",     icon: Wallet,          path: "/driver/wallet" },
  { key: "rewards",    label: "Rewards",    icon: Trophy,          path: "/driver/rewards" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { key: "support",  label: "Support",  icon: Headphones, path: "/driver/support" },
  { key: "settings", label: "Settings", icon: Settings,   path: "/driver/settings" },
];

interface DriverSidebarProps {
  driverName?: string;
  driverLevel?: string;
  avatarUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DriverSidebar({
  driverName = "Driver",
  driverLevel = "BRONZE",
  avatarUrl = null,
  isOpen = false,
  onClose,
}: DriverSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, isLoggingOut } = useLogout();

  const activeKey = [...NAV_ITEMS, ...BOTTOM_ITEMS].find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )?.key;

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = activeKey === item.key;
    return (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          navigate(item.path);
          onClose?.();
        }}
        className={[
          "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-[#145C43] text-white font-semibold shadow-sm"
            : "text-[#5F7166] hover:bg-[#F0F7F4] hover:text-[#145C43]",
        ].join(" ")}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {item.label}
      </motion.button>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand & close */}
      <div className="mb-6 px-3 flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-[#145C43] tracking-tight">QuickKart</p>
          <p className="text-[11px] text-[#6E7C74] font-medium uppercase tracking-wider">Driver Portal</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#6E7C74] hover:bg-[#F5F7F3]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Driver card */}
      <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-[#F5F7F3] border border-[#E3E7E1] px-3 py-2.5">
        <div className="relative h-8 w-8 flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={driverName} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145C43] text-xs font-bold text-white">
              {driverName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#16241D] leading-tight">{driverName}</p>
          <p className="text-[10px] text-[#145C43] font-semibold">{driverLevel} Partner</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="mt-4 space-y-0.5 border-t border-[#E3E7E1] pt-4">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            logout();
            onClose?.();
          }}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {isLoggingOut ? "Logging out…" : "Logout"}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 flex-shrink-0 flex-col bg-white border-r border-[#E3E7E1] px-3 py-5">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 shadow-2xl md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}