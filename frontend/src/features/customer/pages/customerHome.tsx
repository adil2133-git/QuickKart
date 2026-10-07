// src/features/customer/pages/customerHome.tsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
    MapPin, ShoppingCart, Star,
    Plus, Check, ArrowRight, Clock, Leaf, RotateCcw, History,
    Gift, BadgeCheck, ImagePlus, Eye, X, type LucideIcon,
} from "lucide-react";
import LocationPickerModal from "../components/locationPickerModal";
import api from "../../../api/axios";
import { useLocationStore } from "../state/locationState";
import { useStoresListStore } from "../state/storesListState";
import { useCartStore } from "../state/cartState";
import { useViewedProductsStore } from "../state/viewProductState";
import DeliveryTrackingWidget from "../components/deliveryTrackingWidget";
import type { StoreProfileSummary } from "../types/store";

// ─── Animation Variants ────────────────────────────────────────────────────────
// NOTE: explicitly typed as `Variants` from framer-motion. Without this,
// TS widens `transition.ease` to `number[]` instead of the literal tuple
// Framer Motion expects, which is what was throwing the "not assignable to
// type 'Variant'" error in your terminal.

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.07 },
    }),
};
const staggerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    storeId?: { storeName: string };
    categoryId?: { name: string };
    unit?: string;
    weight?: string;
}

interface Category {
    _id: string;
    name: string;
    image?: string;
}

// Shape returned by GET /customer/home/recent-orders — note the backend uses
// the real schema field names (productName / categoryName), unlike the
// `Product` shape above.
interface OrderedProduct {
    _id: string;
    productName: string;
    price: number;
    images?: string[];
    unit?: string;
    stockQuantity?: number;
    storeId?: { _id: string; storeName: string };
    categoryId?: { _id: string; categoryName: string };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`rounded-lg animate-pulse ${className}`}
            style={{ backgroundColor: "#F5F7F3", ...style }}
        />
    );
}

function ProductCardSkeleton() {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E7E1" }}>
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Compact skeleton for the 4-across "Order It Again" row.
function OrderAgainCardSkeleton() {
    return (
        <div className="rounded-xl border p-2.5" style={{ borderColor: "#E3E7E1" }}>
            <Skeleton className="h-20 w-full mb-2.5" />
            <Skeleton className="h-3 w-4/5 mb-2" />
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
        </div>
    );
}

function StoreSkeleton() {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E3E7E1" }}>
            <Skeleton className="h-56 w-full rounded-none" />
            <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, action, icon: Icon }: { title: string; action: string; icon?: LucideIcon }) {
    return (
        <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="flex items-end justify-between mb-6"
        >
            <span className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                {Icon && <Icon size={18} color="#145C43" />}
                {title}
            </span>
            <motion.span
                whileHover={{ x: 3 }} transition={{ duration: 0.2 }}
                className="text-xs font-semibold cursor-pointer flex items-center gap-1"
                style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}
            >
                {action} <ArrowRight size={11} />
            </motion.span>
        </motion.div>
    );
}

// ─── Card Shell ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0px 12px 32px rgba(31,77,61,0.22)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`rounded-xl overflow-hidden bg-white border ${className}`}
            style={{ borderColor: "#E3E7E1", boxShadow: "0px 1px 4px rgba(0,0,0,0.06)" }}
        >
            {children}
        </motion.div>
    );
}

// ─── Add to Cart Button ────────────────────────────────────────────────────────

function AddToCartButton({ onAdd, icon = false, productId, label = "Add to Cart", addedLabel = "Added!" }: { onAdd?: () => void; icon?: boolean; productId?: string; label?: string; addedLabel?: string }) {    const [added, setAdded] = useState(false);
    const addToCart = useCartStore((s) => s.addToCart);

    const handleClick = async () => {
        if (productId) {
            await addToCart(productId, 1);
        }
        setAdded(true);
        onAdd?.();
        setTimeout(() => setAdded(false), 1800);
    };

    if (icon) {
        return (
            <motion.button
                whileTap={{ scale: 0.88 }} onClick={handleClick}
                className="w-10 h-10 rounded-lg flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: added ? "#145C43" : "#145C43", boxShadow: "0px 2px 12px rgba(31,77,61,0.22)" }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {added
                        ? <motion.span key="c" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Check size={14} color="white" /></motion.span>
                        : <motion.span key="p" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Plus size={14} color="white" /></motion.span>
                    }
                </AnimatePresence>
            </motion.button>
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.94 }} onClick={handleClick}
            className="flex items-center gap-2 rounded-lg border-none cursor-pointer text-white transition-colors duration-300"
            style={{ backgroundColor: added ? "#145C43" : "#145C43", padding: "8px 16px", fontFamily: "'Inter', sans-serif", fontSize: 14 }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {added
                    ? <motion.span key="c" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2"><Check size={14} /> {addedLabel}</motion.span>
                    : <motion.span key="a" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2"><ShoppingCart size={14} /> {label}</motion.span>
                }
            </AnimatePresence>
        </motion.button>
    );
}

// ─── Compact "+" add button (used in the tighter 4-across rows) ──────────────

function AddToCartIconButtonSmall({ productId }: { productId?: string }) {
    const [added, setAdded] = useState(false);
    const addToCart = useCartStore((s) => s.addToCart);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (productId) await addToCart(productId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <motion.button
            whileTap={{ scale: 0.85 }} onClick={handleClick}
            className="w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer flex-shrink-0"
            style={{ backgroundColor: "#145C43" }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {added
                    ? <motion.span key="c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}><Check size={12} color="white" /></motion.span>
                    : <motion.span key="p" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}><Plus size={12} color="white" /></motion.span>
                }
            </AnimatePresence>
        </motion.button>
    );
}

// ─── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <Star size={13} fill="#145C43" color="#145C43" />
            <span className="text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

// ─── Store Status Badge ────────────────────────────────────────────────────────

function StoreStatusBadge({ status, index }: { status: StoreProfileSummary["status"]; index: number }) {
    const config = {
        OPEN:   { bg: "rgba(31,77,61,0.18)",   dot: "#145C43", text: "#145C43", label: "Open" },
        BUSY:   { bg: "rgba(180,120,0,0.18)",    dot: "#B47800", text: "#B47800", label: "Busy" },
        CLOSED: { bg: "rgba(180,60,60,0.18)",    dot: "#B43C3C", text: "#B43C3C", label: "Closed" },
    }[status];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="absolute top-4 right-4 rounded-full px-3 py-1 flex items-center gap-1.5"
            style={{ backgroundColor: config.bg, backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: config.dot }}
            />
            <span className="text-xs font-bold" style={{ color: config.text }}>
                {config.label}
            </span>
        </motion.div>
    );
}

// ─── "Bought Before" ribbon badge (Order It Again cards) ─────────────────────

function BoughtBeforeBadge() {
    return (
        <div
            className="absolute top-2 left-2 rounded-full px-2 py-0.5 flex items-center gap-1"
            style={{ backgroundColor: "rgba(20,92,67,0.88)", backdropFilter: "blur(6px)" }}
        >
            <RotateCcw size={9} color="white" />
            <span className="text-[10px] font-semibold text-white">Bought before</span>
        </div>
    );
}

// ─── "Viewed" ribbon badge (Recently Viewed cards) ────────────────────────────

function ViewedBadge() {
    return (
        <div
            className="absolute top-2 left-2 rounded-full px-2 py-0.5 flex items-center gap-1"
            style={{ backgroundColor: "rgba(20,92,67,0.88)", backdropFilter: "blur(6px)" }}
        >
            <Eye size={9} color="white" />
            <span className="text-[10px] font-semibold text-white">Viewed</span>
        </div>
    );
}

// ─── Category emoji fallback map ──────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
    fruits: "🍊", dairy: "🥛", bakery: "🍞", snacks: "🌰",
    vegetables: "🥕", pantry: "🫙", meat: "🥩", beverages: "☕",
    default: "🛒",
};
function categoryEmoji(name: string): string {
    return CATEGORY_EMOJI[name.toLowerCase()] ?? CATEGORY_EMOJI.default;
}

// ─── Store card background (deterministic from name) ─────────────────────────

const STORE_CARD_COLORS = ["#F5F7F3", "#ECF2F0", "#F2F4F1", "#EDF1EC", "#F0F3EF"];
function storeCardColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return STORE_CARD_COLORS[Math.abs(hash) % STORE_CARD_COLORS.length];
}

// ─── Product emoji from category name ─────────────────────────────────────────

const PRODUCT_EMOJI: Record<string, string> = {
    dairy: "🧀", fruits: "🍇", bakery: "🍞", snacks: "🥣",
    vegetables: "🥕", pantry: "🫙", meat: "🥩", beverages: "☕",
    default: "🛒",
};
function productEmoji(cat?: string): string {
    if (!cat) return PRODUCT_EMOJI.default;
    return PRODUCT_EMOJI[cat.toLowerCase()] ?? PRODUCT_EMOJI.default;
}

const PRODUCT_BG: Record<string, string> = {
    dairy: "#F5F7F3", fruits: "#E8EFEC", bakery: "#F5F7F3", snacks: "#E8EFEC",
    vegetables: "#E8EFEC", beverages: "#F5F7F3", default: "#F5F7F3",
};
function productBg(cat?: string): string {
    if (!cat) return PRODUCT_BG.default;
    return PRODUCT_BG[cat.toLowerCase()] ?? PRODUCT_BG.default;
}

// ─── Estimated delivery window, derived from distance ─────────────────────────

function etaWindow(distanceKm: number | null): string {
    if (distanceKm == null) return "—";
    if (distanceKm < 1) return "10–15";
    if (distanceKm < 3) return "15–25";
    return "25–40";
}

// ─── Hero rotating badge (moved here from the navbar) ─────────────────────────
// Cycles through a few reassurance messages every few seconds.

interface HeroMessage {
    icon: LucideIcon;
    text: string;
}

const HERO_MESSAGES: HeroMessage[] = [
    { icon: Clock, text: "Avg delivery: 20–30 min" },
    { icon: Gift, text: "Free delivery over ₹300" },
    { icon: BadgeCheck, text: "Fresh & quality assured" },
];

const HERO_ROTATE_MS = 3500;

function HeroRotatingBadge() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const reducedMotion = typeof window !== "undefined"
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) return;
        const id = window.setInterval(() => {
            setIndex((i) => (i + 1) % HERO_MESSAGES.length);
        }, HERO_ROTATE_MS);
        return () => window.clearInterval(id);
    }, []);

    const { icon: Icon, text } = HERO_MESSAGES[index];

    return (
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 w-fit" style={{ backgroundColor: "#E8EFEC" }}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#145C43" }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="flex items-center justify-center">
                        <Icon size={11} color="#fff" />
                    </motion.span>
                </AnimatePresence>
            </span>
            <span className="relative inline-grid">
                <span aria-hidden="true" className="invisible col-start-1 row-start-1 text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {[...HERO_MESSAGES].sort((a, b) => b.text.length - a.text.length)[0].text}
                </span>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                        className="col-start-1 row-start-1 text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                        {text}
                    </motion.span>
                </AnimatePresence>
            </span>
        </div>
    );
}

// ─── Horizontal scroll row with edge fade + arrow controls ───────────────────
// Shared by Order It Again (optionally) and Recently Viewed so both sections
// share one scroll-affordance pattern instead of two different ones.

function useHorizontalScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const update = () => {
        const el = ref.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        update();
        const el = ref.current;
        if (!el) return;
        el.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            el.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    const scrollBy = (dir: 1 | -1) => {
        ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
    };

    return { ref, canScrollLeft, canScrollRight, scrollBy, update };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerHome() {
    const navigate = useNavigate();

    // ── Location / profile state, from useLocationStore ───────────────────────
    const activeAddress = useLocationStore((s) => s.activeAddress);
    const activeCoords = useLocationStore((s) => s.activeCoords);
    const profileLoading = useLocationStore((s) => s.profileLoading);
    const showLocationModal = useLocationStore((s) => s.showLocationModal);
    const fetchProfile = useLocationStore((s) => s.fetchProfile);
    const onLocationSaved = useLocationStore((s) => s.onLocationSaved);
    const openLocationModal = useLocationStore((s) => s.openLocationModal);

    // ── Nearby stores, from useStoresListStore ─────────────────────────────────
    const nearbyStores = useStoresListStore((s) => s.stores);
    const loadingNearby = useStoresListStore((s) => s.storesLoading);
    const fetchNearbyStores = useStoresListStore((s) => s.fetchNearbyStores);

    // ── Categories / products — no shared store yet, kept local for now ───────
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingTrending, setLoadingTrending] = useState(true);

    // ── Order It Again — customer's own recent order history (backend) ────────
    const [recentlyOrdered, setRecentlyOrdered] = useState<OrderedProduct[]>([]);
    const [loadingRecentOrders, setLoadingRecentOrders] = useState(true);

    // ── Recently Viewed — client-side, batched, persisted locally ─────────────
    const viewedProducts = useViewedProductsStore((s) => s.displayed);
    // NOTE: if your store exposes a "clear" action (e.g. `clearViewed` /
    // `reset`), wire it in here — left as a no-op fallback so this compiles
    // even if the store doesn't have one yet.
    const clearViewedAction = useViewedProductsStore((s) => (s as unknown as { clearViewed?: () => void }).clearViewed);

const { ref: recentRowRef, canScrollRight: recentCanScrollRight } = useHorizontalScroll();

    // ── 1. Fetch profile on mount ─────────────────────────────────────────────
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ── 2. Fetch nearby stores when we have coordinates ───────────────────────
    useEffect(() => {
        if (!activeCoords) return;
        fetchNearbyStores(activeCoords.lat, activeCoords.lng, 10);
    }, [activeCoords, fetchNearbyStores]);

    // ── 3. Fetch categories, popular, trending in parallel ────────────────────
    useEffect(() => {
        api.get("/customer/categories")
            .then(({ data }) => setCategories(data.categories ?? []))
            .catch(console.error)
            .finally(() => setLoadingCategories(false));

        api.get("/customer/products/popular")
            .then(({ data }) => setPopularProducts(data.products ?? []))
            .catch(console.error)
            .finally(() => setLoadingPopular(false));

        api.get("/customer/products/trending")
            .then(({ data }) => setTrendingProducts(data.products ?? []))
            .catch(console.error)
            .finally(() => setLoadingTrending(false));

        api.get("/customer/home/recent-orders")
            .then(({ data }) => setRecentlyOrdered(data.products ?? []))
            .catch(console.error)
            .finally(() => setLoadingRecentOrders(false));
    }, []);

    // ── Navigate to a store's menu page ────────────────────────────────────────
    const goToStore = (storeId: string) => {
        navigate(`/customer/store/${storeId}`);
    };

    // ── Navigate to a single product's detail page ─────────────────────────────
    const goToProduct = (storeId: string, productId: string) => {
        navigate(`/customer/store/${storeId}/product/${productId}`);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#F7F8F5", fontFamily: "'Inter', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            {/* Location picker modal */}
            <AnimatePresence>
                {showLocationModal && (
                    <LocationPickerModal onSaved={onLocationSaved} />
                )}
            </AnimatePresence>

            {/* Live delivery tracking — floating card / minimized side tab */}
            <DeliveryTrackingWidget />

            <main className="mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14" style={{ maxWidth: 1200 }}>

                {/* ── HERO BANNER ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-2xl bg-white border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10 overflow-hidden p-6 sm:p-10 lg:p-12"
                    style={{ borderColor: "#E3E7E1" }}
                >
                    <div className="flex flex-col gap-4 flex-1 w-full lg:max-w-[440px]">
                        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex w-fit items-center gap-1.5 rounded-full px-3 py-1"
                            style={{ backgroundColor: "#E8EFEC" }}>
                            <Leaf size={11} color="#145C43" />
                            <span className="text-xs font-medium" style={{ color: "#145C43" }}>Curated Selection</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.55 }}
                            className="font-bold leading-tight m-0 text-2xl sm:text-3xl lg:text-[34px]"
                            style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>
                            {activeAddress
                                ? <>Delivering to <br /><span style={{ color: "#145C43" }}>{activeAddress.label}</span></>
                                : <>Freshness Delivered<br />To Your Doorstep</>
                            }
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-xs sm:text-sm m-0 leading-relaxed text-[#6E7C74] max-w-sm">
                            {activeAddress
                                ? activeAddress.address
                                : "Experience the warmth of your local neighbourhood market from the comfort of your home."
                            }
                        </motion.p>

                        {/* Single, unambiguous CTA + offer line */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                            className="flex flex-wrap items-center gap-3 pt-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="text-white rounded-xl font-semibold cursor-pointer border-none px-6 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base w-full sm:w-auto"
                                style={{ backgroundColor: "#145C43", fontFamily: "'Inter', sans-serif" }}
                                onClick={() => !activeAddress && openLocationModal()}
                            >
                                {activeAddress ? "Start Shopping" : "Set delivery location"}
                            </motion.button>
                            {activeAddress && (
                                <span className="text-xs" style={{ color: "#6E7C74" }}>Free delivery on orders over ₹300</span>
                            )}
                        </motion.div>

                        {/* Rotating reassurance badge */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                            className="pt-1">
                            <HeroRotatingBadge />
                        </motion.div>
                    </div>

                    {/* ── Hero image slot ── */}
                    <div
                        className="hidden lg:flex flex-shrink-0 items-center justify-center rounded-xl"
                        style={{
                            width: 360,
                            height: 320,
                            border: "2px dashed #DCE3DC",
                            backgroundColor: "#F5F7F3",
                        }}
                    >
                        <div className="flex flex-col items-center gap-2 px-6 text-center">
                            <ImagePlus size={28} color="#9BAAA1" />
                            <span className="text-xs font-medium" style={{ color: "#9BAAA1", fontFamily: "'Inter', sans-serif" }}>
                                Fresh Local Produce
                            </span>
                            <span className="text-[11px]" style={{ color: "#B7C2BC", fontFamily: "'Inter', sans-serif" }}>
                                Direct from neighbourhood partners
                            </span>
                        </div>
                    </div>
                </motion.section>

                {/* ── ORDER IT AGAIN ── */}
                {(loadingRecentOrders || recentlyOrdered.length > 0) && (
                    <section>
                        <SectionHeader title="Order It Again" action="View Order History" />
                        {loadingRecentOrders ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                                {Array.from({ length: 4 }).map((_, i) => <OrderAgainCardSkeleton key={i} />)}
                            </div>
                        ) : (
                            <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                                viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                                {recentlyOrdered.slice(0, 4).map((item) => {
                                    const catName = item.categoryId?.categoryName;
                                    const storeId = item.storeId?._id;
                                    return (
                                        <motion.div key={item._id} variants={scaleIn}>
                                            <Card className="h-full">
                                                <div
                                                    onClick={() => storeId && goToProduct(storeId, item._id)}
                                                    className="relative cursor-pointer"
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                                                        className="h-24 flex items-center justify-center text-4xl overflow-hidden"
                                                        style={{ backgroundColor: productBg(catName) }}>
                                                        {item.images?.[0]
                                                            ? <img src={item.images[0]} alt={item.productName} className="w-full h-full object-cover" />
                                                            : <span className="select-none">{productEmoji(catName)}</span>
                                                        }
                                                    </motion.div>
                                                    <BoughtBeforeBadge />
                                                </div>
                                                <div className="p-3">
                                                    <span className="text-[11px] font-medium block truncate" style={{ color: "#145C43" }}>{item.storeId?.storeName}</span>
                                                    <span
                                                        onClick={() => storeId && goToProduct(storeId, item._id)}
                                                        className="font-semibold block truncate cursor-pointer"
                                                        style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#16241D", lineHeight: "18px", marginTop: 2 }}>
                                                        {item.productName}
                                                    </span>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#145C43" }}>₹{item.price}</span>
                                                        <AddToCartIconButtonSmall productId={item._id} />
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </section>
                )}

                {/* ── RECENTLY VIEWED — moved up from the foot of the page to sit
                       beside Order It Again, so it's seen by everyone, not just
                       people who scroll all the way down. Same Card shell as the
                       rest of the page instead of a bare image+text stack, plus a
                       scroll-fade edge and a "Clear all" action. ── */}
                {(viewedProducts.length > 0) && (
                    <section>
                        <div className="flex items-end justify-between mb-6">
                            <motion.span variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                                className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                                <History size={18} color="#145C43" />
                                Recently Viewed
                            </motion.span>
                            <motion.button
                                whileHover={{ opacity: 0.7 }}
                                onClick={() => clearViewedAction?.()}
                                className="text-xs font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer"
                                style={{ color: "#9BAAA1", fontFamily: "'Inter', sans-serif" }}
                            >
                                <X size={12} /> Clear all
                            </motion.button>
                        </div>

                        <div className="relative">
                            <motion.div
                                ref={recentRowRef}
                                variants={staggerContainer} initial="hidden" whileInView="show"
                                viewport={{ once: true, margin: "-40px" }}
                                className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                                {viewedProducts.map((item) => {
                                    const catName = item.categoryId?.categoryName;
                                    return (
                                        <motion.div key={item._id} variants={fadeUp} className="flex-shrink-0" style={{ width: 168 }}>
                                            <Card className="flex flex-col h-full">
                                                <div
                                                    onClick={() => goToProduct(item.storeId, item._id)}
                                                    className="relative h-28 flex items-center justify-center text-4xl overflow-hidden cursor-pointer"
                                                    style={{ backgroundColor: productBg(catName) }}>
                                                    {item.images?.[0]
                                                        ? <img src={item.images[0]} alt={item.productName} className="w-full h-full object-cover" />
                                                        : <span className="select-none">{productEmoji(catName)}</span>
                                                    }
                                                    <ViewedBadge />
                                                </div>
                                                <div
                                                    onClick={() => goToProduct(item.storeId, item._id)}
                                                    className="px-3 pt-2.5 flex-1 cursor-pointer"
                                                >
                                                    <span className="font-medium block truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#16241D" }}>{item.productName}</span>
                                                    <span className="text-xs block" style={{ color: "#9BAAA1" }}>{item.unit || catName}</span>
                                                </div>
                                                <div className="px-3 py-2.5 flex items-center justify-between">
                                                    <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#145C43" }}>₹{item.price}</span>
                                                    <AddToCartIconButtonSmall productId={item._id} />
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* Fade edge only shows while there's more to scroll */}
                            {recentCanScrollRight && (
                                <div className="absolute right-0 top-0 bottom-1 w-12 pointer-events-none"
                                    style={{ background: "linear-gradient(to right, rgba(247,248,245,0), #F7F8F5)" }} />
                            )}
                        </div>
                    </section>
                )}

                {/* ── BROWSE BY CATEGORY ── */}
                <section>
                    <SectionHeader title="Browse by Category" action="View All Categories" />
                    {loadingCategories ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 sm:gap-4">
                                    <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full" />
                                    <Skeleton className="h-3 sm:h-4 w-14 sm:w-16" />
                                </div>
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#6E7C74" }}>No categories yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
                            {categories.slice(0, 6).map((cat, i) => (
                                <motion.button key={cat._id} variants={fadeUp} custom={i}
                                    whileHover={{ y: -6 }} whileTap={{ scale: 0.94 }}
                                    className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer border-none bg-transparent">
                                    <motion.div whileHover={{ boxShadow: "0px 8px 24px rgba(31,77,61,0.30)", borderColor: "#145C43" }}
                                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center overflow-hidden transition-shadow"
                                        style={{ backgroundColor: "#F5F7F3", border: "2px solid #E3E7E1", boxShadow: "0px 2px 12px rgba(31,77,61,0.14)" }}>
                                        {cat.image
                                            ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                            : <span className="text-3xl sm:text-4xl md:text-5xl select-none">{categoryEmoji(cat.name)}</span>
                                        }
                                    </motion.div>
                                    <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-[90px] sm:max-w-none" style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>{cat.name}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* ── POPULAR IN THE NEIGHBORHOOD ── */}
                <section>
                    <SectionHeader title="Popular in the Neighborhood" action="View All" />
                    {loadingPopular ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : popularProducts.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#6E7C74" }}>No products available yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {popularProducts.slice(0, 4).map((p) => {
                                const catName = p.categoryId?.name;
                                return (
                                    <motion.div key={p._id} variants={scaleIn}>
                                        <Card className="flex flex-col h-full">
                                            <div className="p-[17px] pb-0">
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                                                    className="h-44 sm:h-48 rounded-lg flex items-center justify-center text-5xl sm:text-6xl overflow-hidden"
                                                    style={{ backgroundColor: productBg(catName) }}>
                                                    {p.images?.[0]
                                                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                                        : <span className="select-none">{productEmoji(catName)}</span>
                                                    }
                                                </motion.div>
                                            </div>
                                            <div className="px-[17px] pt-[17px] flex flex-col gap-0.5 flex-1">
                                                <span className="text-xs font-medium block" style={{ color: "#145C43" }}>{p.storeId?.storeName}</span>
                                                <span className="font-semibold block" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: "#16241D", lineHeight: "22px", marginTop: 3 }}>{p.name}</span>
                                                <span className="text-sm block" style={{ color: "#9BAAA1" }}>{p.unit || p.weight || catName}</span>
                                            </div>
                                            <div className="px-[17px] py-4 flex items-center justify-between">
                                                <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "#145C43" }}>₹{p.price}</span>
                                                <AddToCartButton productId={p._id} />
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

                {/* ── NEARBY STORES ── */}
                <section>
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex items-center justify-between mb-6">
                        <span className="text-xl font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                            Nearby Stores
                            {activeCoords && (
                                <span className="ml-2 text-sm font-normal" style={{ color: "#6E7C74" }}>
                                    within 10 km
                                </span>
                            )}
                        </span>
                    </motion.div>

                    {!activeCoords && !profileLoading ? (
                        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                            className="rounded-xl border p-8 text-center"
                            style={{ borderColor: "#E3E7E1", backgroundColor: "#F5F7F3" }}>
                            <MapPin size={32} color="#145C43" className="mx-auto mb-3" />
                            <p className="font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                                Set your location to see nearby stores
                            </p>
                            <p className="text-sm mb-4" style={{ color: "#6E7C74" }}>
                                We'll show you stores that deliver to your area.
                            </p>
                            <motion.button whileTap={{ scale: 0.96 }}
                                onClick={openLocationModal}
                                className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                                style={{ backgroundColor: "#145C43", color: "#FFFFFF" }}>
                                Add delivery address
                            </motion.button>
                        </motion.div>
                    ) : loadingNearby ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <StoreSkeleton /><StoreSkeleton />
                        </div>
                    ) : nearbyStores.length === 0 ? (
                        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "#E3E7E1", backgroundColor: "#F5F7F3" }}>
                            <p className="font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>No stores nearby yet</p>
                            <p className="text-sm" style={{ color: "#6E7C74" }}>We're growing! Check back soon for stores in your area.</p>
                        </div>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {nearbyStores.slice(0, 4).map((s, i) => {
                                const tags = (s as unknown as { tags?: string[] }).tags;
                                const reviewCount = (s as unknown as { reviewCount?: number }).reviewCount;

                                return (
                                <motion.div key={s._id} variants={fadeUp} custom={i}>
                                    <Card>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                                            <div
                                                onClick={() => goToStore(s._id)}
                                                className="relative flex-shrink-0 w-full sm:w-36 h-36 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
                                                style={{ backgroundColor: storeCardColor(s.storeName) }}>

                                                {s.logoUrl
                                                    ? <img src={s.logoUrl} alt={s.storeName} className="w-full h-full object-cover" />
                                                    : <span className="text-6xl opacity-20 select-none">🏪</span>
                                                }

                                                <StoreStatusBadge status={s.status} index={i} />
                                            </div>

                                            <div className="flex-1 min-w-0 w-full">
                                                <div
                                                    onClick={() => goToStore(s._id)}
                                                    className="cursor-pointer"
                                                >
                                                    <span className="font-semibold text-lg block truncate" style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>{s.storeName}</span>

                                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                        {tags && tags.length > 0 && (
                                                            <span className="text-xs truncate" style={{ color: "#6E7C74" }}>{tags.join(", ")}</span>
                                                        )}
                                                        {tags && tags.length > 0 && s.distanceKm != null && <span className="text-xs" style={{ color: "#9BAAA1" }}>·</span>}
                                                        {s.distanceKm != null && (
                                                            <span className="text-xs flex items-center gap-1" style={{ color: "#6E7C74" }}>
                                                                <MapPin size={10} /> {s.distanceKm.toFixed(1)} km
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {s.averageRating > 0 && <StarRating rating={s.averageRating} />}
                                                        {reviewCount != null && (
                                                            <span className="text-xs" style={{ color: "#9BAAA1" }}>({(reviewCount ?? 0).toLocaleString()} reviews)</span>
                                                        )}
                                                        <span style={{ color: "#9BAAA1" }}>·</span>
                                                        <Clock size={12} color="#16241D" />
                                                        <span className="text-sm" style={{ color: "#16241D" }}>
                                                            {etaWindow(s.distanceKm)} mins
                                                        </span>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    whileHover={{ backgroundColor: "#0F4A36" }}
                                                    whileTap={{ scale: 0.97 }}
                                                    disabled={s.status === "CLOSED"}
                                                    onClick={() => goToStore(s._id)}
                                                    className="w-full mt-3 rounded-lg border-none cursor-pointer text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    style={{ backgroundColor: "#145C43", padding: "10px 0", color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
                                                    {s.status === "CLOSED" ? "Closed" : "View Menu"}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

                {/* ── TRENDING TODAY ── */}
                <section className="pb-12">
                    <SectionHeader title="Trending Today" action="Explore More" />
                    {loadingTrending ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : trendingProducts.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#6E7C74" }}>No products yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {trendingProducts.slice(0, 4).map((item) => {
                                const catName = item.categoryId?.name;
                                return (
                                    <motion.div key={item._id} variants={scaleIn}>
                                        <Card className="flex flex-col h-full">
                                            <div className="p-[17px] pb-0">
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                                                    className="h-44 sm:h-48 rounded-lg flex items-center justify-center text-5xl sm:text-6xl overflow-hidden"
                                                    style={{ backgroundColor: productBg(catName) }}>
                                                    {item.images?.[0]
                                                        ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                        : <span className="select-none">{productEmoji(catName)}</span>
                                                    }
                                                </motion.div>
                                            </div>
                                            <div className="px-[17px] pt-[17px] flex-1">
                                                <span className="text-xs font-medium block" style={{ color: "#145C43" }}>{item.storeId?.storeName}</span>
                                                <span className="font-semibold block" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: "#16241D", lineHeight: "22px", marginTop: 3 }}>{item.name}</span>
                                                <span className="text-sm block" style={{ color: "#9BAAA1" }}>{item.unit || item.weight || catName}</span>
                                            </div>
                                            <div className="px-[17px] py-4 flex items-center justify-between">
                                                <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "#145C43" }}>₹{item.price}</span>
                                                <AddToCartButton productId={item._id} icon />
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

            </main>

            {/* ── Footer ── */}
            <footer className="border-t py-8 px-4 sm:px-10" style={{ borderColor: "#E3E7E1", backgroundColor: "#F7F8F5" }}>
                <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left" style={{ maxWidth: 1200 }}>
                    <div>
                        <span className="text-lg italic font-bold" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>QuickKart</span>
                        <p className="text-xs mt-1" style={{ color: "#6E7C74" }}>© 2026 QuickKart Neighbourhood Market. All rights reserved.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {["About Us", "Contact", "Privacy Policy", "Terms of Service"].map((link) => (
                            <motion.a key={link} whileHover={{ color: "#145C43" }} href="#"
                                className="text-xs transition-colors" style={{ color: "#6E7C74", fontFamily: "'Inter', sans-serif" }}>
                                {link}
                            </motion.a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}