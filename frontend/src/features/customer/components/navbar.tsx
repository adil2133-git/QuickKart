import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    ChevronDown,
    Search,
    ShoppingCart,
    Bell,
    User,
    Plus,
    Home,
    Briefcase,
    Tag,
    Clock,
    X,
    Check,
    Leaf,
    Loader2,
    Wallet,
    Package,
    type LucideIcon,
} from "lucide-react";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";
import LocationPickerModal from "./locationPickerModal";
import { useAuthStore } from "../../auth/state/authState";
import { useCartStore } from "../state/cartState";
import { useNotificationStore } from "../../shared/state/notificationState";
import { useNotificationActions } from "../../shared/hooks/useNotifications";


interface SavedAddress {
    _id: string;
    label: string;
    address: string;
    coordinates: { lat: number; lng: number };
}

interface SearchItem {
    type: "product" | "store";
    label: string;
    meta: string;
}

// NotificationItem is now driven by the shared notification store

interface NavLinkItem {
    label: string;
    to: string;
}

interface NavBarProps {
    cartCount?: number;
}

/* -------------------------------------------------------------------------- */
/*  Role → home path map (mirrors ProtectedRoute + PublicOnlyRoute)          */
/* -------------------------------------------------------------------------- */

const ROLE_HOME: Record<string, string> = {
    CUSTOMER: "/customer/home",
    ADMIN: "/admin/dashboard",
    DRIVER: "/driver/dashboard",
    STORE: "/store/dashboard",
};

/* -------------------------------------------------------------------------- */
/*  Static mock data — replace when backends are ready                       */
/* -------------------------------------------------------------------------- */

const RECENT_SEARCHES: string[] = ["Free range eggs", "Wildflower honey", "Greek yogurt"];

const SEARCH_INDEX: SearchItem[] = [
    { type: "product", label: "Aged Sharp Cheddar", meta: "The Curd Shop · 200g" },
    { type: "product", label: "Estate Coffee Beans", meta: "Mountain Roast · 250g" },
    { type: "product", label: "Seedless Green Grapes", meta: "Green Garden Organics · 500g" },
    { type: "product", label: "Honey Nut Granola", meta: "Heritage Farm · 400g" },
    { type: "product", label: "Full Cream Milk", meta: "Heritage Farm · 1L" },
    { type: "store", label: "Green Garden Organics", meta: "1.2 km · 25–35 mins" },
    { type: "store", label: "Heritage Farm", meta: "0.8 km · 15–20 mins" },
    { type: "store", label: "Boutique Greens", meta: "Hydroponic · Exotics" },
];

const NAV_LINKS: NavLinkItem[] = [
    { label: "Stores", to: "/customer/stores" },
    { label: "Deals", to: "/deals" },
];

/* -------------------------------------------------------------------------- */
/*  Typography tokens                                                         */
/* -------------------------------------------------------------------------- */

const FONT_BRAND = "'Fraunces', serif";
const FONT_UI = "'Inter', sans-serif";

/* -------------------------------------------------------------------------- */
/*  Label → icon map                                                          */
/* -------------------------------------------------------------------------- */

function labelIcon(label: string): LucideIcon {
    const l = label.toLowerCase();
    if (l === "home") return Home;
    if (l === "work") return Briefcase;
    return Tag;
}

/* -------------------------------------------------------------------------- */
/*  NavTextLink                                                               */
/* -------------------------------------------------------------------------- */

function NavTextLink({ label, to }: NavLinkItem) {
    const { pathname } = useLocation();
    const isActive = pathname === to || pathname.startsWith(`${to}/`);

    return (
        <Link
            to={to}
            aria-current={isActive ? "page" : undefined}
            className="relative cursor-pointer px-1 py-1 text-[13px] font-medium tracking-wide transition-colors"
            style={{ fontFamily: FONT_UI, color: isActive ? "#145C43" : "#16241D", letterSpacing: "0.01em" }}
        >
            {label}
            <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                style={{ backgroundColor: "#145C43" }}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0.6 }}
                transition={{ duration: 0.18 }}
            />
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/*  useClickOutside                                                           */
/* -------------------------------------------------------------------------- */

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], onOutside: () => void) {
    useEffect(() => {
        function handle(e: MouseEvent | TouchEvent) {
            const target = e.target as Node;
            const inside = refs.some((r) => r.current && r.current.contains(target));
            if (!inside) onOutside();
        }
        document.addEventListener("mousedown", handle);
        document.addEventListener("touchstart", handle);
        return () => {
            document.removeEventListener("mousedown", handle);
            document.removeEventListener("touchstart", handle);
        };
    }, [refs, onOutside]);
}

/* -------------------------------------------------------------------------- */
/*  LocationPicker                                                            */
/* -------------------------------------------------------------------------- */

function LocationPicker() {
    const [open, setOpen] = useState(false);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [defaultId, setDefaultId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [switching, setSwitching] = useState<string | null>(null);

    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([btnRef, panelRef], () => setOpen(false));

    useEffect(() => {
        api.get("/customer/profile")
            .then(({ data }) => {
                setAddresses(data.profile.savedAddresses ?? []);
                setDefaultId(data.profile.defaultAddress ?? null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const active = addresses.find((a) => a._id === defaultId) ?? addresses[0];

    const handleSwitch = async (id: string) => {
        if (id === defaultId) { setOpen(false); return; }
        setSwitching(id);
        try {
            await api.patch(`/customer/address/${id}/default`);
            setDefaultId(id);
        } catch (err) {
            console.error("Failed to update default address", err);
        } finally {
            setSwitching(null);
            setOpen(false);
        }
    };

    const handleAddressSaved = async () => {
        setShowAddModal(false);
        try {
            const { data } = await api.get("/customer/profile");
            setAddresses(data.profile.savedAddresses ?? []);
            setDefaultId(data.profile.defaultAddress ?? null);
        } catch (err) {
            console.error("Failed to reload addresses", err);
        }
    };

    const pillText = loading
        ? "Loading…"
        : active
            ? `${active.label} · ${active.address.split(",")[0]}`
            : "Add address";

    return (
        <>
            <AnimatePresence>
                {showAddModal && (
                    <LocationPickerModal
                        onSaved={handleAddressSaved}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </AnimatePresence>

            <div className="relative flex-shrink-0">
                <motion.button
                    ref={btnRef}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                        borderColor: "#DCE3DC",
                        backgroundColor: open ? "rgba(220,227,220,0.35)" : "rgba(220,227,220,0.2)",
                        outlineColor: "#145C43",
                    }}
                >
                    <MapPin size={14} color="#145C43" className="shrink-0" />
                    <span className="flex min-w-0 flex-col leading-tight">
                        <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ fontFamily: FONT_UI, color: "#6E7C74", letterSpacing: "0.08em" }}
                        >
                            Deliver to
                        </span>
                        <span
                            className="block max-w-[100px] truncate text-[12px] font-semibold sm:max-w-[140px] lg:max-w-[220px]"
                            style={{ fontFamily: FONT_UI, color: "#16241D" }}
                            title={active ? `${active.label} · ${active.address}` : undefined}
                        >
                            {pillText}
                        </span>
                    </span>
                    <ChevronDown size={13} color="#16241D" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={panelRef}
                            role="dialog"
                            aria-label="Choose delivery address"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,90vw)] overflow-hidden rounded-2xl border shadow-lg"
                            style={{ borderColor: "#E3E7E1", backgroundColor: "#FFFFFF" }}
                        >
                            <div className="px-4 pt-3.5 pb-2">
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ fontFamily: FONT_UI, color: "#6E7C74", letterSpacing: "0.1em" }}
                                >
                                    Saved addresses
                                </p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 size={18} className="animate-spin" style={{ color: "#145C43" }} />
                                </div>
                            ) : addresses.length === 0 ? (
                                <p className="px-4 pb-4 text-xs" style={{ fontFamily: FONT_UI, color: "#6E7C74" }}>
                                    No saved addresses yet.
                                </p>
                            ) : (
                                <ul role="list">
                                    {addresses.map((addr) => {
                                        const Icon = labelIcon(addr.label);
                                        const isActive = addr._id === defaultId;
                                        const isSwitching = switching === addr._id;

                                        return (
                                            <li key={addr._id}>
                                                <button
                                                    onClick={() => handleSwitch(addr._id)}
                                                    disabled={!!switching}
                                                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#ECF2F0] focus-visible:bg-[#ECF2F0] focus-visible:outline-none disabled:opacity-60"
                                                >
                                                    <span
                                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                        style={{
                                                            backgroundColor: isActive ? "#145C43" : "#E3E7E1",
                                                            color: isActive ? "#fff" : "#145C43",
                                                        }}
                                                    >
                                                        {isSwitching
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Icon size={14} />
                                                        }
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <span
                                                                className="text-[13px] font-semibold"
                                                                style={{ fontFamily: FONT_UI, color: "#16241D" }}
                                                            >
                                                                {addr.label}
                                                            </span>
                                                            {isActive && <Check size={13} color="#145C43" />}
                                                        </span>
                                                        <span
                                                            className="block truncate text-xs"
                                                            style={{ fontFamily: FONT_UI, color: "#6E7C74" }}
                                                        >
                                                            {addr.address}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <div className="border-t px-2 py-2" style={{ borderColor: "#E3E7E1" }}>
                                <button
                                    onClick={() => { setOpen(false); setShowAddModal(true); }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-[#ECF2F0] focus-visible:bg-[#ECF2F0] focus-visible:outline-none"
                                    style={{ fontFamily: FONT_UI, color: "#145C43" }}
                                >
                                    <Plus size={15} /> Add new address
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  SearchBar                                                                 */
/* -------------------------------------------------------------------------- */

function SearchBar() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useClickOutside([wrapRef], () => setOpen(false));

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.trim().toLowerCase();
        return SEARCH_INDEX.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
    }, [query]);

    const showRecent = open && !query.trim();
    const showResults = open && query.trim().length > 0;

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const list: (SearchItem | string)[] = showResults ? results : showRecent ? RECENT_SEARCHES : [];
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, list.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        else if (e.key === "Enter" && highlight >= 0) {
            const picked = showResults ? results[highlight]?.label : (list[highlight] as string | undefined);
            if (picked) { setQuery(picked); setOpen(false); }
        }
    };

    return (
        <div ref={wrapRef} className="relative w-full min-w-[160px] max-w-[440px] flex-1">
            <motion.div
                animate={open ? { boxShadow: "0 0 0 2px #145C4355" } : { boxShadow: "0 0 0 0px transparent" }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 rounded-full border px-4 py-2.5"
                style={{ backgroundColor: "#F5F7F3", borderColor: "#DCE3DC" }}
            >
                <Search size={16} color="#16241D" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setHighlight(-1); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder="Search products & stores…"
                    aria-label="Search products and stores"
                    className="flex-1 bg-transparent text-[13px] outline-none"
                    style={{ fontFamily: FONT_UI, color: "#16241D" }}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                        aria-label="Clear search"
                        className="rounded-full p-0.5 hover:bg-[#F5F7F3]"
                    >
                        <X size={14} color="#6E7C74" />
                    </button>
                )}
            </motion.div>

            <AnimatePresence>
                {(showRecent || showResults) && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-lg"
                        style={{ borderColor: "#E3E7E1", backgroundColor: "#FFFFFF" }}
                    >
                        {showRecent && (
                            <div className="py-2">
                                <p
                                    className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ fontFamily: FONT_UI, color: "#6E7C74", letterSpacing: "0.1em" }}
                                >
                                    Recent searches
                                </p>
                                {RECENT_SEARCHES.map((term, i) => (
                                    <button
                                        key={term}
                                        onClick={() => { setQuery(term); setOpen(false); }}
                                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-colors hover:bg-[#ECF2F0]"
                                        style={{
                                            fontFamily: FONT_UI,
                                            backgroundColor: highlight === i ? "#ECF2F0" : "transparent",
                                            color: "#16241D",
                                        }}
                                    >
                                        <Clock size={13} color="#6E7C74" /> {term}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showResults && (
                            <div className="py-2">
                                {results.length === 0 ? (
                                    <p className="px-4 py-3 text-[13px]" style={{ fontFamily: FONT_UI, color: "#6E7C74" }}>
                                        No matches for "{query}"
                                    </p>
                                ) : (
                                    results.map((item, i) => (
                                        <button
                                            key={item.label}
                                            onClick={() => { setQuery(item.label); setOpen(false); }}
                                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#ECF2F0]"
                                            style={{ backgroundColor: highlight === i ? "#ECF2F0" : "transparent" }}
                                        >
                                            <span className="min-w-0">
                                                <span
                                                    className="block truncate text-[13px] font-medium"
                                                    style={{ fontFamily: FONT_UI, color: "#16241D" }}
                                                >
                                                    {item.label}
                                                </span>
                                                <span
                                                    className="block truncate text-[11px]"
                                                    style={{ fontFamily: FONT_UI, color: "#6E7C74" }}
                                                >
                                                    {item.meta}
                                                </span>
                                            </span>
                                            <span
                                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                style={{
                                                    fontFamily: FONT_UI,
                                                    letterSpacing: "0.06em",
                                                    backgroundColor: item.type === "store" ? "#E8EFEC" : "#F5F7F3",
                                                    color: item.type === "store" ? "#145C43" : "#6E7C74",
                                                }}
                                            >
                                                {item.type}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  NotificationBell                                                          */
/* -------------------------------------------------------------------------- */

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function NotificationBell() {
    const { notifications, unreadCount, isOpen, setOpen } = useNotificationStore();
    const { handleMarkRead, handleMarkAllRead } = useNotificationActions();
    const navigate = useNavigate();
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([btnRef, panelRef], () => setOpen(false));

    const unread = unreadCount;

    return (
        <div className="relative flex-shrink-0">
            <motion.button
                ref={btnRef}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!isOpen)}
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative cursor-pointer rounded-full p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "#145C43" }}
            >
                <Bell size={18} color="#145C43" />
                {unread > 0 && (
                    <span
                        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                        style={{ backgroundColor: "#C24B3F", boxShadow: "0 0 0 2px #F7F8F5" }}
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,90vw)] overflow-hidden rounded-2xl border shadow-lg"
                        style={{ borderColor: "#E3E7E1", backgroundColor: "#FFFFFF" }}
                    >
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                            <p
                                className="text-[10px] font-semibold uppercase tracking-widest"
                                style={{ fontFamily: FONT_UI, color: "#6E7C74", letterSpacing: "0.1em" }}
                            >
                                Notifications
                            </p>
                            {unread > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] font-semibold hover:underline"
                                    style={{ fontFamily: FONT_UI, color: "#145C43" }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <ul role="list" className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <li className="flex flex-col items-center justify-center gap-2 py-10">
                                    <Bell size={28} color="#DCE3DC" />
                                    <span className="text-[13px]" style={{ color: "#9BAAA1" }}>
                                        No notifications yet
                                    </span>
                                </li>
                            ) : (
                                notifications.map((n) => (
                                    <li key={n._id} className="border-t first:border-t-0" style={{ borderColor: "#E3E7E1" }}>
                                        <button
                                            onClick={() => {
                                                if (!n.isRead) handleMarkRead(n._id);
                                                setOpen(false);
                                                if (n.orderId) navigate(`/customer/profile?tab=orders`);
                                            }}
                                            className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#ECF2F0]"
                                            style={{ background: !n.isRead ? "#E8EFEC" : undefined }}
                                        >
                                            <span
                                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: !n.isRead ? "#C24B3F" : "transparent" }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-baseline justify-between gap-2">
                                                    <span className="text-[13px] font-semibold" style={{ fontFamily: FONT_UI, color: "#16241D" }}>
                                                        {n.title}
                                                    </span>
                                                    <span className="shrink-0 text-[11px]" style={{ fontFamily: FONT_UI, color: "#9BAAA1" }}>
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                </span>
                                                <span className="block text-[12px] leading-snug" style={{ fontFamily: FONT_UI, color: "#6E7C74" }}>
                                                    {n.message}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  WalletButton                                                              */
/* -------------------------------------------------------------------------- */

function WalletButton() {
    const { pathname, search } = useLocation();
    const [balance, setBalance] = useState<number | null>(null);
    const WALLET_PATH = "/customer/profile?tab=wallet";
    const isActive = pathname === "/customer/profile" && new URLSearchParams(search).get("tab") === "wallet";

   useEffect(() => {
        api
            .get("/customer/wallet")
            .then(({ data }) => setBalance(data.balance ?? 0))
            .catch(() => setBalance(null));
    }, []);

    // Live updates (e.g. a cancellation refund landing) so the pill reflects
    // the new balance instantly instead of only after a manual page refresh.
    useEffect(() => {
        const socket = getSocket();
        const handleWalletUpdated = (payload: { balance: number }) => {
            setBalance(payload.balance);
        };
        socket.on("wallet:updated", handleWalletUpdated);
        return () => {
            socket.off("wallet:updated", handleWalletUpdated);
        };
    }, []);

    return (
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="flex-shrink-0">
            <Link
                to={WALLET_PATH}
                aria-label={balance != null ? `Wallet, balance ₹${balance}` : "Wallet"}
                aria-current={isActive ? "page" : undefined}
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex"
                style={{ backgroundColor: isActive ? "rgba(31,77,61,0.1)" : "#E8EFEC" }}
            >
                <Wallet size={15} color="#145C43" />
                <span className="text-[12px] font-semibold" style={{ fontFamily: FONT_UI, color: "#145C43" }}>
                    {balance != null ? `₹${balance.toFixed(0)}` : "Wallet"}
                </span>
            </Link>
            {/* Icon-only trigger below sm, where the balance pill is hidden */}
            <Link
                to={WALLET_PATH}
                aria-label="Wallet"
                className="flex items-center justify-center rounded-full p-1 sm:hidden"
            >
                <Wallet size={19} color="#145C43" />
            </Link>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/*  MobileMenu                                                                */
/* -------------------------------------------------------------------------- */

function MobileMenu({ onClose }: { onClose: () => void }) {
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([panelRef], onClose);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/30 lg:hidden"
        >
            <motion.div
                ref={panelRef}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col gap-5 overflow-y-auto px-5 py-5"
                style={{ backgroundColor: "#F7F8F5" }}
            >
                <div className="flex items-center justify-between">
                    <span
                        className="text-[15px] font-semibold"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        Menu
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-full p-1.5 hover:bg-[#F5F7F3]"
                    >
                        <X size={18} color="#16241D" />
                    </button>
                </div>

                <SearchBar />
                <LocationPicker />

                <nav className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: "#E3E7E1" }}>
                    <Link
                        to="/customer/home"
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#ECF2F0]"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        <Home size={16} color="#145C43" /> Home
                    </Link>

                    <Link
                        to="/customer/stores"
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#ECF2F0]"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        <Briefcase size={16} color="#145C43" /> Stores
                    </Link>

                    <Link
                        to="/customer/orders"
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#ECF2F0]"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        <Package size={16} color="#145C43" /> My Orders
                    </Link>

                    <Link
                        to="/customer/wallet"
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#ECF2F0]"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        <Wallet size={16} color="#145C43" /> My Wallet
                    </Link>

                    <Link
                        to="/customer/profile"
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#ECF2F0]"
                        style={{ fontFamily: FONT_UI, color: "#16241D" }}
                    >
                        <User size={16} color="#145C43" /> My Profile
                    </Link>
                </nav>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/*  NavBar                                                                    */
/* -------------------------------------------------------------------------- */

export default function NavBar({ cartCount: _cartCount }: NavBarProps) {
    const { pathname } = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, isAuthenticated } = useAuthStore();
    const cartCountFromStore = useCartStore((s) => s.cartItemCount());
    const fetchCart = useCartStore((s) => s.fetchCart);
    const cartCount = _cartCount ?? cartCountFromStore;

    const logoHref = isAuthenticated && user
        ? (ROLE_HOME[user.role] ?? "/customer/home")
        : "/";

    useEffect(() => {
        if (isAuthenticated) {
            void fetchCart();
        }
    }, [fetchCart, isAuthenticated]);

    // ── Fixed routes ──────────────────────────────────────────────────────────
    const CART_PATH = "/customer/cart";
    const PROFILE_PATH = "/customer/profile";

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="sticky top-0 z-50 border-b"
            style={{
                backgroundColor: "#F7F8F5",
                borderColor: "#E3E7E1",
                boxShadow: "0px 1px 8px rgba(0,0,0,0.06)",
            }}
        >
            <div
                className="mx-auto flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-10"
                style={{ maxWidth: 1280, height: 72 }}
            >
                {/* ── Logo ── */}
                <Link to={logoHref} className="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
                    <motion.span
                        whileHover={{ rotate: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl sm:h-9 sm:w-9"
                        style={{ backgroundColor: "#145C43" }}
                    >
                        <Leaf size={16} color="#FFFFFF" strokeWidth={2.25} className="sm:hidden" />
                        <Leaf size={18} color="#FFFFFF" strokeWidth={2.25} className="hidden sm:block" />
                    </motion.span>
                    <span
                        className="hidden cursor-pointer text-[19px] font-semibold leading-none tracking-tight sm:block lg:text-[21px]"
                        style={{
                            fontFamily: FONT_BRAND,
                            fontWeight: 480,
                            color: "#16241D",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        QuickKart
                    </span>
                </Link>

                {/* Location — visible from sm up; lives in the mobile drawer below sm */}
                <div className="hidden sm:block">
                    <LocationPicker />
                </div>

                {/* Search — visible from md up; lives in the mobile drawer below md */}
                <div className="hidden md:block md:flex-1">
                    <SearchBar />
                </div>

                {/* Nav Links — desktop only */}
                <nav className="hidden flex-shrink-0 items-center gap-6 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <NavTextLink key={link.to} label={link.label} to={link.to} />
                    ))}
                </nav>

                {/* Action icons */}
                <div className="ml-auto flex flex-shrink-0 items-center gap-2.5 sm:gap-4">
                    {/* Search trigger — opens the drawer below md, where the inline search bar is hidden */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open search"
                        className="flex items-center justify-center rounded-full p-1 md:hidden"
                    >
                        <Search size={19} color="#145C43" />
                    </button>

                    <WalletButton />

                    <NotificationBell />

                    {/* ── Cart ── */}
                    <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="relative">
                        <Link
                            to={CART_PATH}
                            aria-label={`Cart, ${cartCount} items`}
                            aria-current={pathname === CART_PATH ? "page" : undefined}
                            className="flex items-center justify-center rounded-full p-1"
                            style={{
                                backgroundColor: pathname === CART_PATH
                                    ? "rgba(31,77,61,0.1)"
                                    : "transparent",
                            }}
                        >
                            <ShoppingCart size={20} color="#145C43" />
                        </Link>
                        <AnimatePresence>
                            {cartCount > 0 && (
                                <motion.div
                                    key="badge"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
                                    style={{ backgroundColor: "#145C43" }}
                                >
                                    <span
                                        className="font-bold text-white"
                                        style={{ fontSize: 9, fontFamily: FONT_UI }}
                                    >
                                        {cartCount}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── Profile — hidden below sm; reachable via drawer instead ── */}
                    <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="hidden lg:block">
                        <Link
                            to={PROFILE_PATH}
                            aria-label="Profile"
                            aria-current={pathname === PROFILE_PATH ? "page" : undefined}
                            className="flex items-center justify-center rounded-full p-1"
                            style={{
                                backgroundColor: pathname === PROFILE_PATH
                                    ? "rgba(31,77,61,0.1)"
                                    : "transparent",
                            }}
                        >
                            <User size={18} color="#145C43" />
                        </Link>
                    </motion.div>

                    {/* ── Hamburger — mobile/tablet only ── */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        className="flex flex-col items-center justify-center gap-[3px] rounded-full p-1.5 lg:hidden"
                    >
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#145C43" }} />
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#145C43" }} />
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#145C43" }} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
            </AnimatePresence>
        </motion.header>
    );
}