import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Star,
    MapPin,
    Clock,
    ChevronDown,
    Check,
    AlertCircle,
} from "lucide-react";
import { useLocationStore } from "../state/locationState";
import { useStoresListStore, type SortKey } from "../state/storesListState";
import { useCartStore } from "../state/cartState";
import type { StoreProfileSummary } from "../types/store";

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
    bg: "#F7F8F5",
    ink: "#16241D",
    muted: "#6E7C74",
    brown: "#145C43",
    green: "#145C43",
    busy: "#B47800",
    closed: "#9BAAA1",
    line: "#E3E7E1",
    card: "#FFFFFF",
    gold: "#A9CC3B",
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function ShimmerBlock({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-2xl ${className}`} style={{ backgroundColor: "#F5F7F3" }} />;
}

function StoreCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl p-4 border" style={{ borderColor: "rgba(210,196,185,0.3)" }}>
            <ShimmerBlock className="h-44 mb-4" />
            <ShimmerBlock className="h-5 w-2/3 mb-2" />
            <ShimmerBlock className="h-3 w-1/2 mb-4" />
            <ShimmerBlock className="h-4 w-1/3" />
        </div>
    );
}

// ─── Store card background (deterministic from name) ─────────────────────────

const CARD_COLORS = ["#145C43", "#0D2B21", "#123A2C", "#0A1F17", "#16241D"];
function storeCardColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

// ─── Estimated delivery window, derived from distance ─────────────────────────
// distanceKm can be null if a store hasn't set coordinates correctly server-side.

function etaWindow(distanceKm: number | null): string {
    if (distanceKm == null) return "ETA unavailable";
    if (distanceKm < 1) return "15–25 min";
    if (distanceKm < 3) return "20–30 min";
    if (distanceKm < 6) return "30–45 min";
    return "45–60 min";
}

function statusColor(status: StoreProfileSummary["status"]) {
    return status === "OPEN" ? PALETTE.green : status === "BUSY" ? PALETTE.busy : PALETTE.closed;
}

function statusLabel(status: StoreProfileSummary["status"]) {
    return status === "OPEN" ? "Open" : status === "BUSY" ? "Busy" : "Closed";
}

// ─── Store Card ────────────────────────────────────────────────────────────────

function StoreCard({ store, onOpen }: { store: StoreProfileSummary; onOpen: (id: string) => void }) {
    const isClosed = store.status === "CLOSED";
    const color = statusColor(store.status);

    return (
        <div
            onClick={() => onOpen(store._id)}
            className="bg-white rounded-3xl overflow-hidden border hover:shadow-2xl transition-all duration-300 cursor-pointer"
            style={{ borderColor: "rgba(210,196,185,0.3)" }}
        >
            <div
                className="relative h-44 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: storeCardColor(store.storeName) }}
            >
                {store.logoUrl ? (
                    <img
                        src={store.logoUrl}
                        alt={store.storeName}
                        className="w-full h-full object-cover"
                        style={{ opacity: isClosed ? 0.55 : 1 }}
                    />
                ) : (
                    <span className="text-7xl opacity-20 select-none">🏪</span>
                )}

                <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold text-white">{statusLabel(store.status)}</span>
                </div>

                <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                >
                    <MapPin size={11} color="#fff" />
                    <span className="text-xs font-medium text-white">
                        {store.distanceKm != null ? `${store.distanceKm.toFixed(1)} km` : "—"}
                    </span>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                    <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600, color: PALETTE.ink }}>
                        {store.storeName}
                    </h4>
                    {store.averageRating > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <Star size={12} fill={PALETTE.gold} stroke={PALETTE.gold} />
                            <span className="text-sm font-bold" style={{ color: PALETTE.ink }}>
                                {store.averageRating.toFixed(1)}
                            </span>
                            {store.reviewCount > 0 && (
                                <span className="text-xs" style={{ color: PALETTE.muted }}>({store.reviewCount})</span>
                            )}
                        </div>
                    )}
                </div>

                <p className="text-sm mt-1 mb-3 truncate" style={{ color: PALETTE.muted }}>{store.address}</p>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(210,196,185,0.3)" }}>
                    <div className="flex items-center gap-1.5">
                        <Clock size={13} color={isClosed ? "#b0a290" : PALETTE.muted} />
                        <span className="text-sm" style={{ color: isClosed ? "#b0a290" : PALETTE.muted }}>
                            {isClosed ? "Currently closed" : etaWindow(store.distanceKm)}
                        </span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: isClosed ? "#b0a290" : PALETTE.brown }}>
                        {isClosed ? "Closed" : "View Menu →"}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Sort dropdown ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "nearest", label: "Nearest" },
    { value: "rating", label: "Top Rated" },
    { value: "popular", label: "Most Popular" },
];

function SortDropdown({
    value,
    open,
    onToggle,
    onChange,
}: {
    value: SortKey;
    open: boolean;
    onToggle: () => void;
    onChange: (k: SortKey) => void;
}) {
    const current = SORT_OPTIONS.find((o) => o.value === value)!;

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-medium transition-all"
                style={{ borderColor: PALETTE.line, backgroundColor: "#fff", color: PALETTE.muted }}
            >
                <span style={{ color: "#6E7C74" }}>Sorted by</span>
                <span style={{ color: PALETTE.ink, fontWeight: 600 }}>{current.label}</span>
                <ChevronDown size={14} />
            </button>

            {open && (
                <div
                    className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-lg border z-50 overflow-hidden w-44"
                    style={{ borderColor: PALETTE.line }}
                >
                    {SORT_OPTIONS.map((o) => (
                        <button
                            key={o.value}
                            onClick={() => onChange(o.value)}
                            className="flex items-center justify-between w-full text-left px-4 py-2.5 text-xs hover:bg-[#F5F7F3] transition-colors"
                            style={{ color: value === o.value ? PALETTE.brown : PALETTE.ink, fontWeight: value === o.value ? 600 : 400 }}
                        >
                            {o.label}
                            {value === o.value && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Open Now toggle ───────────────────────────────────────────────────────────

function OpenNowToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium" style={{ color: PALETTE.muted }}>Open Now</span>
            <button
                onClick={() => onChange(!checked)}
                aria-pressed={checked}
                className="relative rounded-full transition-colors"
                style={{ width: 40, height: 22, backgroundColor: checked ? PALETTE.green : PALETTE.line }}
            >
                <span
                    className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                    style={{ width: 18, height: 18, left: checked ? 19 : 3 }}
                />
            </button>
        </div>
    );
}

// ─── Empty states ──────────────────────────────────────────────────────────────

function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div
            className="rounded-3xl border p-12 text-center"
            style={{ backgroundColor: PALETTE.card, borderColor: "rgba(210,196,185,0.3)" }}
        >
            <div className="mx-auto mb-4 flex justify-center" style={{ color: PALETTE.gold }}>{icon}</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600, color: PALETTE.brown }} className="mb-1.5">
                {title}
            </p>
            <p className="text-sm mb-5" style={{ color: PALETTE.muted }}>{description}</p>
            <button
                onClick={onAction}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                style={{ backgroundColor: PALETTE.brown, color: PALETTE.bg }}
            >
                {actionLabel}
            </button>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StoresPage() {
    const navigate = useNavigate();

    // ── Zustand selectors ──────────────────────────────────────────────────────
    const activeCoords = useLocationStore((s) => s.activeCoords);
    const profileLoading = useLocationStore((s) => s.profileLoading);
    const openLocationModal = useLocationStore((s) => s.openLocationModal);
    const fetchProfile = useLocationStore((s) => s.fetchProfile);

    const stores = useStoresListStore((s) => s.stores);
    const storesLoading = useStoresListStore((s) => s.storesLoading);
    const storesError = useStoresListStore((s) => s.storesError);
    const fetchCart = useCartStore((s) => s.fetchCart);
    const sortKey = useStoresListStore((s) => s.sortKey);
    const openNowOnly = useStoresListStore((s) => s.openNowOnly);
    const sortOpen = useStoresListStore((s) => s.sortOpen);
    const fetchNearbyStores = useStoresListStore((s) => s.fetchNearbyStores);
    const setSortKey = useStoresListStore((s) => s.setSortKey);
    const setOpenNowOnly = useStoresListStore((s) => s.setOpenNowOnly);
    const setSortOpen = useStoresListStore((s) => s.setSortOpen);

    // ── Fetch nearby stores whenever coordinates are available ────────────────
    useEffect(() => {
        if (activeCoords) {
            fetchNearbyStores(activeCoords.lat, activeCoords.lng, 10);
        }
    }, [activeCoords, fetchNearbyStores]);

    // ── Fetch profile on mount to ensure coords are loaded & auth is fresh ─
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        void fetchCart();
    }, [fetchCart]);

    // ── Derived: filtered + sorted list ────────────────────────────────────────
    const visibleStores = useMemo(() => {
        let list = [...stores];

        if (openNowOnly) {
            list = list.filter((s) => s.status === "OPEN");
        }

        switch (sortKey) {
            case "rating":
                list.sort((a, b) => b.averageRating - a.averageRating);
                break;
            case "popular":
                list.sort((a, b) => b.totalOrders - a.totalOrders);
                break;
            case "nearest":
            default:
                list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
                break;
        }

        return list;
    }, [stores, sortKey, openNowOnly]);

    const goToStore = (storeId: string) => navigate(`/customer/store/${storeId}`);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
                rel="stylesheet"
            />
            <style>{`
        .cat-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

            <div className="min-h-screen" style={{ backgroundColor: PALETTE.bg, color: PALETTE.ink, fontFamily: "'Inter', sans-serif" }}>
                <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-10">

                    {/* ── Header ── */}
                    <div className="flex items-end justify-between flex-wrap gap-5 mb-8">
                        <div>
                            <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: PALETTE.ink }} className="mb-1.5">
                                Artisanal Discovery
                            </h1>
                            <p className="text-sm" style={{ color: PALETTE.muted }}>Sourced locally, delivered within the hour.</p>
                        </div>

                        {activeCoords && stores.length > 0 && (
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 rounded-2xl sm:rounded-full border px-4 sm:px-5 py-2 sm:py-2.5 bg-white w-full sm:w-auto justify-between" style={{ borderColor: PALETTE.line }}>
                                <SortDropdown
                                    value={sortKey}
                                    open={sortOpen}
                                    onToggle={() => setSortOpen(!sortOpen)}
                                    onChange={(k) => { setSortKey(k); setSortOpen(false); }}
                                />
                                <div className="hidden sm:block w-px h-5" style={{ backgroundColor: PALETTE.line }} />
                                <OpenNowToggle checked={openNowOnly} onChange={setOpenNowOnly} />
                            </div>
                        )}
                    </div>

                    {/* ── Body ── */}
                    {!activeCoords && !profileLoading ? (
                        <EmptyState
                            icon={<MapPin size={36} />}
                            title="Set your location to discover stores"
                            description="We'll show you the artisanal stores delivering to your area."
                            actionLabel="Set delivery location"
                            onAction={openLocationModal}
                        />
                    ) : storesLoading || profileLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => <StoreCardSkeleton key={i} />)}
                        </div>
                    ) : storesError ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "#ba1a1a" }}>
                            <AlertCircle size={24} />
                            <p className="text-sm">{storesError}</p>
                        </div>
                    ) : stores.length === 0 ? (
                        <EmptyState
                            icon={<MapPin size={36} />}
                            title="No stores deliver to your location yet"
                            description="We're expanding our neighbourhood network. Try a different address nearby."
                            actionLabel="Change Location"
                            onAction={openLocationModal}
                        />
                    ) : visibleStores.length === 0 ? (
                        <EmptyState
                            icon={<Clock size={32} />}
                            title="Nothing's open right now"
                            description={'Every nearby store is closed or busy. Turn off "Open Now" to see them anyway.'}
                            actionLabel="Show all stores"
                            onAction={() => setOpenNowOnly(false)}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visibleStores.map((store) => (
                                <StoreCard key={store._id} store={store} onOpen={goToStore} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}