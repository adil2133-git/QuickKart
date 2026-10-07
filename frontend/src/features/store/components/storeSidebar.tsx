// src/features/store/components/Sidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Warehouse,
  Tags,
  LineChart,
  Wallet,
  Settings,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLogout } from "../../auth/hooks/useLogout";

export type SidebarNavKey =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "categories"
  | "analytics"
  | "revenue";

interface NavItem {
  key: SidebarNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",  label: "Dashboard",  icon: LayoutGrid,  path: "/store/dashboard" },
  { key: "orders",     label: "Orders",     icon: ShoppingBag, path: "/store/orders" },
  { key: "products",   label: "Products",   icon: Package,     path: "/store/products" },
  { key: "inventory",  label: "Inventory",  icon: Warehouse,   path: "/store/inventory" },
  { key: "categories", label: "Categories", icon: Tags,        path: "/store/categories" },
  { key: "analytics",  label: "Analytics",  icon: LineChart,   path: "/store/analytics" },
  { key: "revenue",    label: "Revenue",    icon: Wallet,      path: "/store/revenue" },
];

interface SidebarProps {
  storeName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ storeName = "QuickKart", isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, isLoggingOut } = useLogout();

  const activeKey = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )?.key;

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const navContent = (
    <div className="flex h-full w-full flex-col bg-white px-4 py-6">
      {/* Brand & close button */}
      <div className="mb-8 flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#145C43]">{storeName}</h1>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#6E7C74]">Store Panel</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] hover:bg-slate-100 hover:text-[#16241D] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleNavClick(path)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-[#145C43] text-white font-semibold shadow-sm"
                  : "text-[#5F7166] hover:bg-[#F0F7F4] hover:text-[#145C43]",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="space-y-1 border-t border-[#E3E7E1] pt-4">
        <button
          type="button"
          onClick={() => handleNavClick("/store/settings")}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
            pathname === "/store/settings"
              ? "bg-[#145C43] text-white font-semibold shadow-sm"
              : "text-[#5F7166] hover:bg-[#F0F7F4] hover:text-[#145C43]",
          ].join(" ")}
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick("/store/profile")}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
            pathname === "/store/profile"
              ? "bg-[#145C43] text-white font-semibold shadow-sm"
              : "text-[#5F7166] hover:bg-[#F0F7F4] hover:text-[#145C43]",
          ].join(" ")}
        >
          <UserCircle className="h-[18px] w-[18px]" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            logout();
          }}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#5F7166] transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:flex h-full w-64 flex-shrink-0 flex-col border-r border-[#E3E7E1]">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl"
            >
              {navContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}