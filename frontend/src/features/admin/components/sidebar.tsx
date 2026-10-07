import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    ChevronDown,
    UserCircle2,
    LogOut,
    X,
    type LucideIcon,
} from "lucide-react";

import { useLogout } from "../../auth/hooks/useLogout";
import { useAdminNavStore } from "../state/adminNavState";

interface NavLeaf {
    label: string;
    id: string;
    route: string;
}

interface NavItem {
    label: string;
    id: string;
    icon: LucideIcon;
    route?: string;
    children?: NavLeaf[];
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", id: "dashboard", icon: LayoutDashboard, route: "/admin/dashboard" },
    {
        label: "User Management",
        id: "user-management",
        icon: Users,
        route: "/admin/users",
        children: [
            { label: "Customers", id: "customers", route: "/admin/users/customers" },
            { label: "Stores", id: "um-stores", route: "/admin/users/stores" },
            { label: "Drivers", id: "um-drivers", route: "/admin/users/drivers" },
        ],
    },
    {
        label: "Approvals",
        id: "approvals",
        icon: ShieldCheck,
        route: "/admin/approvals/store",
        children: [
            { label: "Store Applications", id: "store-applications", route: "/admin/approvals/store" },
            { label: "Driver Applications", id: "driver-applications", route: "/admin/approvals/drivers" },
        ],
    },
    {
        label: "Orders",
        id: "orders",
        icon: ShoppingCart,
        route: "/admin/orders",
        children: [
            { label: "Order Monitoring", id: "order-monitoring", route: "/admin/orders/monitoring" },
            { label: "Complaints & Disputes", id: "complaints-disputes", route: "/admin/orders/disputes" },
        ],
    },
    {
        label: "Finance",
        id: "finance",
        icon: Wallet,
        route: "/admin/finance",
        children: [
            { label: "Revenue Overview", id: "revenue-overview", route: "/admin/finance/revenue" },
            { label: "COD Settlements", id: "cod-settlements", route: "/admin/finance/cod-settlements" },
            { label: "Withdrawal Requests", id: "withdrawal-requests", route: "/admin/finance/withdrawals" },
        ],
    },
    {
        label: "Analytics",
        id: "analytics",
        icon: BarChart3,
        route: "/admin/analytics",
        children: [
            { label: "Performance Reports", id: "performance-reports", route: "/admin/analytics/performance" },
            { label: "Top Stores", id: "top-stores", route: "/admin/analytics/top-stores" },
            { label: "Top Drivers", id: "top-drivers", route: "/admin/analytics/top-drivers" },
        ],
    },
    { label: "Settings", id: "settings", icon: Settings, route: "/admin/settings" },
];

function findParentId(childId: string): string | null {
    for (const item of NAV_ITEMS) {
        if (item.children?.some((c) => c.id === childId)) {
            return item.id;
        }
    }
    return null;
}

function isRouteActive(currentPath: string, itemRoute: string): boolean {
    return currentPath === itemRoute || currentPath.startsWith(itemRoute + "/");
}

function SidebarNavContent({ onClose }: { onClose?: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { logout, isLoggingOut } = useLogout();

    const findActiveItem = () => {
        for (const item of NAV_ITEMS) {
            if (item.children) {
                for (const child of item.children) {
                    if (isRouteActive(currentPath, child.route)) {
                        return { parentId: item.id, childId: child.id };
                    }
                }
            }
            if (item.route && isRouteActive(currentPath, item.route)) {
                return { parentId: null, childId: item.id };
            }
        }
        return { parentId: null, childId: "dashboard" };
    };

    const { parentId, childId } = findActiveItem();
    const activeId = childId;

    const [openGroup, setOpenGroup] = useState<string | null>(parentId);
    const activeOpenGroup = openGroup ?? parentId;

    const handleGroupClick = (item: NavItem) => {
        if (!item.children) {
            if (item.route) {
                navigate(item.route);
                onClose?.();
            }
            return;
        }

        if (openGroup === item.id) {
            setOpenGroup(null);
        } else {
            setOpenGroup(item.id);
            if (item.route) {
                navigate(item.route);
                onClose?.();
            }
        }
    };

    const handleChildClick = (child: NavLeaf) => {
        navigate(child.route);
        onClose?.();
        const pId = findParentId(child.id);
        if (pId) {
            setOpenGroup(pId);
        }
    };

    return (
        <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div>
                {/* Top: Logo and close button */}
                <div className="flex items-center justify-between px-4 py-5">
                    <div>
                        <p className="font-serif text-[17px] font-bold tracking-tight text-[#145C43]">
                            QuickKart
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7C74]">
                            Admin Panel
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-[#6E7C74] hover:bg-[#F0F7F4] hover:text-[#145C43] lg:hidden"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 px-3">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const hasChildren = !!item.children;
                        const isGroupOpen = activeOpenGroup === item.id;
                        const isActive =
                            activeId === item.id ||
                            (item.children?.some((c) => c.id === activeId) ?? false);

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => handleGroupClick(item)}
                                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                                        isActive
                                            ? "bg-[#145C43] font-semibold text-white shadow-sm"
                                            : "text-[#5F7166] hover:bg-[#F0F7F4] hover:text-[#145C43]"
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span
                                            className={`relative flex h-5 w-5 items-center justify-center ${
                                                isActive ? "text-[#A9CC3B]" : ""
                                            }`}
                                        >
                                            {isActive && (
                                                <span className="absolute -left-[15px] h-5 w-[3px] rounded-full bg-[#A9CC3B]" />
                                            )}
                                            <Icon size={18} strokeWidth={2} />
                                        </span>
                                        <span>{item.label}</span>
                                    </span>
                                    {hasChildren && (
                                        <ChevronDown
                                            size={15}
                                            className={`text-[#6E7C74] transition-transform duration-200 ${
                                                isGroupOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    )}
                                </button>

                                {hasChildren && (
                                    <div
                                        className={`grid overflow-hidden transition-all duration-200 ease-in-out ${
                                            isGroupOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        }`}
                                    >
                                        <div className="min-h-0">
                                            <div className="ml-[26px] flex flex-col gap-0.5 border-l border-[#E3E7E1] py-1 pl-4">
                                                {item.children!.map((child) => {
                                                    const isChildActive = activeId === child.id;
                                                    return (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => handleChildClick(child)}
                                                            className={`rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-normal transition-colors ${
                                                                isChildActive
                                                                    ? "bg-[#145C43] font-semibold text-white"
                                                                    : "text-[#6E7C74] hover:bg-[#F5F7F3] hover:text-[#16241D]"
                                                            }`}
                                                        >
                                                            {child.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom: Admin profile / logout */}
            <div className="flex flex-col gap-1 border-t border-[#E3E7E1] px-3 py-4">
                <button
                    onClick={() => {
                        navigate("/admin/profile");
                        onClose?.();
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                >
                    <UserCircle2 size={18} />
                    <span>Admin Profile</span>
                </button>
                <button
                    onClick={() => {
                        logout();
                        onClose?.();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                >
                    <LogOut size={18} />
                    <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
                </button>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const { sidebarOpen, closeSidebar } = useAdminNavStore();

    return (
        <>
            {/* Desktop persistent sidebar */}
            <aside className="hidden h-screen w-[264px] shrink-0 flex-col justify-between border-r border-[#E3E7E1] bg-white lg:flex">
                <SidebarNavContent />
            </aside>

            {/* Mobile / Tablet overlay drawer */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeSidebar}
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="relative z-10 flex h-full w-[264px] max-w-[85vw] flex-col justify-between border-r border-[#E3E7E1] bg-white shadow-2xl"
                        >
                            <SidebarNavContent onClose={closeSidebar} />
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}