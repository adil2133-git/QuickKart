import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Star, ShoppingCart, ChevronDown,
  Grid3X3, List, Store, Zap, ArrowRight, BadgePercent, Clock,
  Navigation, Check, ChevronRight as ChevronRightIcon,
  X, ChevronLeft, Sparkles, Filter, Loader2,
} from "lucide-react";
import api from "../../../api/axios";
import { useLocationStore } from "../state/locationState";
import { useStoresListStore } from "../state/storesListState";
import { useCartStore } from "../state/cartState";

// ─── Color tokens (HTML theme) ────────────────────────────────────────────────
const C = {
  bg:            "#F7F8F5",
  surface:       "#FFFFFF",
  surfaceCtx:    "#EFF2EF",
  surfaceCtxLow: "#F5F7F3",
  surfaceCtxHigh:"#E3E7E1",
  primary:       "#145C43",
  primaryCont:   "#145C43",
  onPrimary:     "#FFFFFF",
  secondary:     "#16241D",
  secondaryCont: "#E8EFEC",
  onSecondaryCont:"#145C43",
  tertiary:      "#145C43",
  tertiaryCont:  "#145C43",
  outline:       "#6E7C74",
  outlineVar:    "#E3E7E1",
  onSurface:     "#16241D",
  onSurfaceVar:  "#6E7C74",
  error:         "#BA1A1A",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "grid" | "list";

interface ApiCategory {
  _id: string;
  categoryName: string;
  image?: string;
}

interface ApiProductStore {
  _id: string;
  storeName: string;
  averageRating: number;
  distanceKm: number | null;
  status: "OPEN" | "CLOSED" | "BUSY";
}

interface ApiProduct {
  _id: string;
  productName: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unit?: string;
  images?: string[];
  availabilityStatus: string;
  isBestseller?: boolean;
  categoryId?: { _id: string; categoryName: string; image?: string } | null;
  store: ApiProductStore | null;
}

const DISTANCE_OPTIONS = [1, 2, 5, 10];
const RATING_OPTIONS = [4.5, 4.0, 3.5];
const SORT_OPTIONS = ["Best Match", "Distance", "Rating", "Lowest Price", "Highest Price"] as const;
type SortLabel = typeof SORT_OPTIONS[number];
const SORT_MAP: Record<SortLabel, string> = {
  "Best Match": "bestMatch",
  "Distance": "distance",
  "Rating": "rating",
  "Lowest Price": "priceLow",
  "Highest Price": "priceHigh",
};

// ─── Category emoji fallback (purely decorative, not data) ───────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  fruits: "🍊", "fruits & vegetables": "🥕", dairy: "🥛", "dairy & eggs": "🥚", bakery: "🍞",
  snacks: "🌰", vegetables: "🥕", pantry: "🫙", meat: "🥩", beverages: "☕",
  organic: "🌿", "frozen foods": "🧊", default: "🛒",
};
function categoryEmoji(name?: string): string {
  if (!name) return CATEGORY_EMOJI.default;
  return CATEGORY_EMOJI[name.toLowerCase()] ?? CATEGORY_EMOJI.default;
}

// ─── Star row ──────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={11}
          fill={i <= Math.round(rating) ? C.primaryCont : "transparent"}
          color={C.primaryCont}
          strokeWidth={i <= Math.round(rating) ? 0 : 1.5}
        />
      ))}
      <span className="text-[11px] ml-0.5" style={{ color: C.onSurfaceVar }}>({rating.toFixed(1)})</span>
    </div>
  );
}

// ─── Add to Cart button (real cart) ────────────────────────────────────────────
function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const addToCart = useCartStore(s => s.addToCart);
  const quantity = useCartStore(s => s.getItemQuantity(productId));
  const isUpdating = useCartStore(s => s.isUpdating === productId);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      disabled={disabled || isUpdating}
      onClick={(e) => { e.stopPropagation(); addToCart(productId, 1); }}
      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      style={{ backgroundColor: quantity > 0 ? C.tertiary : C.primary, color: C.onPrimary }}
    >
      {isUpdating ? (
        <Loader2 size={12} className="animate-spin" />
      ) : quantity > 0 ? (
        <span className="flex items-center gap-1"><Check size={12}/> In Cart ({quantity})</span>
      ) : (
        <span className="flex items-center gap-1"><ShoppingCart size={12}/> Add</span>
      )}
    </motion.button>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, viewMode, onOpen }: { product: ApiProduct; viewMode: ViewMode; onOpen: () => void }) {
  const catName = product.categoryId?.categoryName;
  const outOfStock = product.availabilityStatus !== "AVAILABLE" || product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(20,92,67,0.14)" }}
      onClick={onOpen}
      className={`relative flex rounded-xl border overflow-hidden cursor-pointer bg-white ${
        viewMode === "list" ? "flex-row items-center gap-3 sm:gap-4 p-3" : "flex-col"
      }`}
      style={{ borderColor: C.outlineVar }}
    >
      <div
        className={`flex items-center justify-center text-4xl overflow-hidden flex-shrink-0 ${
          viewMode === "list" ? "w-20 h-20 rounded-lg" : "h-40 w-full"
        }`}
        style={{ backgroundColor: C.surfaceCtx }}
      >
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.productName} className="w-full h-full object-cover" />
          : <span className="select-none">{categoryEmoji(catName)}</span>
        }
      </div>

      {product.isBestseller && (
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border"
          style={{ backgroundColor: C.secondaryCont, borderColor: C.outlineVar, color: C.primary }}
        >
          <Zap size={9}/> Bestseller
        </span>
      )}
      {outOfStock && (
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide"
          style={{ backgroundColor: "#FEE8E8", color: "#991B1B" }}
        >
          Out of Stock
        </span>
      )}

      <div className={`flex flex-col flex-1 min-w-0 ${viewMode === "list" ? "" : "p-4"}`}>
        {product.store && (
          <span className="text-[11px] font-medium truncate" style={{ color: C.primary }}>
            {product.store.storeName}
          </span>
        )}
        <p className="font-semibold text-sm truncate mt-0.5" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
          {product.productName}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {product.store && product.store.averageRating > 0 && <StarRow rating={product.store.averageRating} />}
          {product.store?.distanceKm != null && (
            <span className="flex items-center gap-0.5 text-[11px]" style={{ color: C.onSurfaceVar }}>
              <Navigation size={10}/> {product.store.distanceKm.toFixed(1)} km
            </span>
          )}
          {product.store?.status === "CLOSED" && (
            <span className="text-[11px] font-medium" style={{ color: C.error }}>· Closed</span>
          )}
          {lowStock && (
            <span className="text-[11px] font-medium" style={{ color: "#B47800" }}>· Only {product.stockQuantity} left</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5">
          <p className="text-base font-bold leading-none" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
            ₹{product.price}{product.unit ? <span className="text-xs font-normal" style={{ color: C.onSurfaceVar }}> /{product.unit}</span> : null}
          </p>
          <AddToCartButton productId={product._id} disabled={outOfStock} />
        </div>
      </div>
    </motion.div>
  );
}

function ProductCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white animate-pulse ${viewMode === "list" ? "flex flex-row items-center gap-4 p-3" : "flex flex-col"}`}
      style={{ borderColor: C.outlineVar }}
    >
      <div className={viewMode === "list" ? "w-20 h-20 rounded-lg flex-shrink-0" : "h-40 w-full"} style={{ backgroundColor: C.surfaceCtx }} />
      <div className={`flex-1 space-y-2 ${viewMode === "list" ? "" : "p-4"}`}>
        <div className="h-3 w-20 rounded" style={{ backgroundColor: C.surfaceCtx }} />
        <div className="h-4 w-32 rounded" style={{ backgroundColor: C.surfaceCtx }} />
        <div className="h-3 w-24 rounded" style={{ backgroundColor: C.surfaceCtx }} />
      </div>
    </div>
  );
}

// ─── Quick filter pill ─────────────────────────────────────────────────────────
function QuickPill({
  icon, label, active, onClick, badgeCount,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badgeCount?: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors duration-150 flex-shrink-0"
      style={{
        backgroundColor: active ? C.primary : C.surface,
        borderColor:     active ? C.primary : C.outlineVar,
        color:           active ? "#FFFFFF" : C.onSurfaceVar,
        boxShadow:       active ? "0 2px 10px rgba(20,92,67,0.25)" : "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {icon}
      {label}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span
          className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black"
          style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : C.primaryCont, color: "#FFFFFF" }}
        >
          {badgeCount}
        </span>
      )}
    </motion.button>
  );
}

// ─── Active filter chip ────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: C.secondaryCont, borderColor: `${C.primaryCont}80`, color: C.onSecondaryCont }}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
        style={{ backgroundColor: `${C.primary}1A` }}
      >
        <X size={10} style={{ color: C.primary }} />
      </button>
    </motion.span>
  );
}

// ─── Compact Featured Store Card (real stores) ────────────────────────────────
function FeaturedStoreCard({ store, active, onClick }: { store: { _id: string; storeName: string; averageRating: number; logoUrl: string | null }; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      aria-pressed={active}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border flex-shrink-0 min-w-[90px] transition-colors duration-150 snap-start relative"
      style={{
        backgroundColor: active ? C.surfaceCtxHigh : C.surface,
        borderColor: active ? C.primaryCont : C.outlineVar,
        boxShadow: active ? "0 4px 16px rgba(20,92,67,0.16)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg border overflow-hidden"
        style={{ backgroundColor: `${C.primaryCont}22`, borderColor: C.outlineVar }}
      >
        {store.logoUrl
          ? <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
          : <Store size={18} color={C.primary} />
        }
      </div>
      <p className="text-xs font-bold leading-tight text-center truncate w-full" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
        {store.storeName}
      </p>
      <div className="flex items-center gap-1">
        <Star size={10} fill={C.primaryCont} color={C.primaryCont} />
        <span className="text-[10px]" style={{ color: C.onSurfaceVar }}>{store.averageRating.toFixed(1)}</span>
      </div>
      {active && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.tertiary }}
        >
          <Check size={11} color="#FFFFFF" />
        </span>
      )}
    </motion.button>
  );
}

function FeaturedStoresRail({
  stores, loading, selectedStoreIds, toggleStore,
}: { stores: { _id: string; storeName: string; averageRating: number; logoUrl: string | null }[]; loading: boolean; selectedStoreIds: string[]; toggleStore: (id: string) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => railRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  if (!loading && stores.length === 0) return null;

  return (
    <section className="relative py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
          <Sparkles size={14} style={{ color: C.primary }} /> Featured Stores
        </h3>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scrollBy(-200)}
            aria-label="Scroll stores left"
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ borderColor: C.outlineVar, color: C.onSurfaceVar }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollBy(200)}
            aria-label="Scroll stores right"
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ borderColor: C.outlineVar, color: C.onSurfaceVar }}
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
      <div ref={railRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[90px] h-[104px] rounded-2xl flex-shrink-0 animate-pulse" style={{ backgroundColor: C.surfaceCtx }} />
            ))
          : stores.map(s => (
              <FeaturedStoreCard
                key={s._id}
                store={s}
                active={selectedStoreIds.includes(s._id)}
                onClick={() => toggleStore(s._id)}
              />
            ))
        }
      </div>
    </section>
  );
}

// ─── Filter drawer ──────────────────────────────────────────────────────────────
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  stores: { _id: string; storeName: string }[];
  selectedStoreIds: string[];
  toggleStore: (id: string) => void;
  categories: ApiCategory[];
  selectedCategoryIds: string[];
  toggleCategory: (id: string) => void;
  minRating: number | null;
  setMinRating: (r: number | null) => void;
  maxDistanceKm: number | null;
  setMaxDistanceKm: (d: number | null) => void;
  openNow: boolean;
  setOpenNow: (v: boolean) => void;
  onClear: () => void;
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b" style={{ borderColor: C.outlineVar }}>
      <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.onSurfaceVar }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function CheckRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer group">
      <span className="flex items-center gap-3">
        <span
          className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-150 flex-shrink-0"
          style={{ backgroundColor: checked ? C.primary : "transparent", borderColor: checked ? C.primary : C.outlineVar }}
        >
          {checked && <Check size={13} color="#FFFFFF" />}
        </span>
        <span>
          <span className="text-sm font-medium block" style={{ color: C.onSurface }}>{label}</span>
          {sub && <span className="text-[11px] block" style={{ color: C.onSurfaceVar }}>{sub}</span>}
        </span>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

function FilterDrawer(props: FilterDrawerProps) {
  const {
    open, onClose, stores, selectedStoreIds, toggleStore, categories, selectedCategoryIds, toggleCategory,
    minRating, setMinRating, maxDistanceKm, setMaxDistanceKm, openNow, setOpenNow, onClear,
  } = props;
  const [storeQuery, setStoreQuery] = useState("");

  const filteredStores = stores.filter(s => s.storeName.toLowerCase().includes(storeQuery.toLowerCase()));

  const activeCount =
    selectedStoreIds.length + selectedCategoryIds.length + (minRating ? 1 : 0) + (maxDistanceKm ? 1 : 0) + (openNow ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(22,36,29,0.45)" }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed z-[61] flex flex-col
                       inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
                       sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-full sm:w-[400px] sm:rounded-t-none sm:rounded-l-3xl"
            style={{ backgroundColor: C.surface, boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" }}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: C.outlineVar }} />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              <h3 className="text-lg font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
                Filters {activeCount > 0 && <span style={{ color: C.primary }}>({activeCount})</span>}
              </h3>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ backgroundColor: C.surfaceCtx, color: C.onSurfaceVar }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <DrawerSection title="Availability">
                <CheckRow label="Open Now" sub="Only show stores currently open" checked={openNow} onChange={() => setOpenNow(!openNow)} />
              </DrawerSection>

              <DrawerSection title="Rating">
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? null : r)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      style={{
                        backgroundColor: minRating === r ? C.primary : C.surfaceCtxLow,
                        borderColor: minRating === r ? C.primary : C.outlineVar,
                        color: minRating === r ? "#FFFFFF" : C.onSurfaceVar,
                      }}
                    >
                      <Star size={12} fill={minRating === r ? "#FFFFFF" : "none"} /> {r.toFixed(1)}+
                    </button>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Distance">
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setMaxDistanceKm(maxDistanceKm === d ? null : d)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      style={{
                        backgroundColor: maxDistanceKm === d ? C.primary : C.surfaceCtxLow,
                        borderColor: maxDistanceKm === d ? C.primary : C.outlineVar,
                        color: maxDistanceKm === d ? "#FFFFFF" : C.onSurfaceVar,
                      }}
                    >
                      Within {d} km
                    </button>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Categories">
                <div className="space-y-0.5">
                  {categories.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: C.onSurfaceVar }}>No categories yet.</p>
                  ) : categories.map(c => (
                    <CheckRow key={c._id} label={c.categoryName} checked={selectedCategoryIds.includes(c._id)} onChange={() => toggleCategory(c._id)} />
                  ))}
                </div>
              </DrawerSection>

              <div className="py-5">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.onSurfaceVar }}>
                  Stores
                </h4>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.outline }} />
                  <input
                    value={storeQuery}
                    onChange={e => setStoreQuery(e.target.value)}
                    placeholder="Search stores..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: C.surfaceCtxLow, borderColor: C.outlineVar, color: C.onSurface }}
                  />
                </div>
                <div className="space-y-0.5 max-h-56 overflow-y-auto">
                  {filteredStores.length > 0 ? filteredStores.map(s => (
                    <CheckRow
                      key={s._id}
                      label={s.storeName}
                      checked={selectedStoreIds.includes(s._id)}
                      onChange={() => toggleStore(s._id)}
                    />
                  )) : (
                    <p className="text-xs py-3" style={{ color: C.onSurfaceVar }}>No stores match "{storeQuery}".</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              <button
                onClick={onClear}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-colors hover:opacity-80"
                style={{ borderColor: C.outlineVar, color: C.onSurfaceVar, backgroundColor: C.surface }}
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ backgroundColor: C.primary, color: C.onPrimary }}
              >
                Show results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────
function SortDropdown({ sortBy, setSortBy }: { sortBy: SortLabel; setSortBy: (s: SortLabel) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
        style={{ backgroundColor: C.surface, borderColor: C.outlineVar, color: C.onSurface }}
      >
        <Filter size={14} style={{ color: C.outline }} />
        Sort by: {sortBy}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 rounded-xl border py-1 z-40 min-w-[170px] shadow-lg"
            style={{ backgroundColor: C.surface, borderColor: C.outlineVar }}
          >
            {SORT_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => { setSortBy(option); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: sortBy === option ? C.primary : C.onSurfaceVar }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProductDiscoveryPage() {
  const navigate = useNavigate();

  const activeCoords = useLocationStore(s => s.activeCoords);
  const nearbyStores = useStoresListStore(s => s.stores);
  const storesLoading = useStoresListStore(s => s.storesLoading);
  const fetchNearbyStores = useStoresListStore(s => s.fetchNearbyStores);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortLabel>("Best Match");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [categories, setCategories] = useState<ApiCategory[]>([]);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Categories, once ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/customer/categories")
      .then(({ data }) => setCategories(data.categories ?? []))
      .catch(console.error);
  }, []);

  // ── Nearby stores (for filter list + featured rail) ────────────────────────
  useEffect(() => {
    if (!activeCoords) return;
    fetchNearbyStores(activeCoords.lat, activeCoords.lng, 10);
  }, [activeCoords, fetchNearbyStores]);

  // ── Debounce the search box ─────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(id);
  }, [search]);

  // ── Fetch products, replacing the list, whenever a filter changes ──────────
  const fetchProducts = useCallback(async (pageArg: number, mode: "replace" | "append") => {
    if (mode === "replace") setLoadingProducts(true); else setLoadingMore(true);
    try {
      const params: Record<string, string> = {
        sortBy: SORT_MAP[sortBy],
        page: String(pageArg),
        limit: "20",
      };
      if (activeCoords) {
        params.lat = String(activeCoords.lat);
        params.lng = String(activeCoords.lng);
      }
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategoryIds.length) params.categoryIds = selectedCategoryIds.join(",");
      if (selectedStoreIds.length) params.storeIds = selectedStoreIds.join(",");
      if (minRating !== null) params.minRating = String(minRating);
      if (maxDistanceKm !== null) params.maxDistanceKm = String(maxDistanceKm);
      if (openNow) params.openNow = "true";

      const { data } = await api.get("/customer/products/search", { params });
      const newProducts: ApiProduct[] = data.products ?? [];
      setTotalProducts(data.total ?? 0);
      setProducts(prev => (mode === "append" ? [...prev, ...newProducts] : newProducts));
    } catch (err) {
      console.error("PRODUCT SEARCH ERROR:", err);
      if (mode === "replace") { setProducts([]); setTotalProducts(0); }
    } finally {
      setLoadingProducts(false);
      setLoadingMore(false);
    }
  }, [sortBy, activeCoords, debouncedSearch, selectedCategoryIds, selectedStoreIds, minRating, maxDistanceKm, openNow]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategoryIds, selectedStoreIds, minRating, maxDistanceKm, openNow, sortBy, activeCoords]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, "append");
  };

  const toggleStore = (id: string) =>
    setSelectedStoreIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleCategory = (id: string) =>
    setSelectedCategoryIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const clearAll = () => {
    setSelectedStoreIds([]);
    setSelectedCategoryIds([]);
    setOpenNow(false);
    setMinRating(null);
    setMaxDistanceKm(null);
  };

  const totalActiveFilters =
    selectedStoreIds.length + selectedCategoryIds.length + (minRating ? 1 : 0) + (maxDistanceKm ? 1 : 0) + (openNow ? 1 : 0);

  const storeName = (id: string) => nearbyStores.find(s => s._id === id)?.storeName ?? id;
  const categoryName = (id: string) => categories.find(c => c._id === id)?.categoryName ?? id;

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedStoreIds.map(id => ({ key: `store-${id}`, label: storeName(id), onRemove: () => toggleStore(id) })),
    ...selectedCategoryIds.map(id => ({ key: `cat-${id}`, label: categoryName(id), onRemove: () => toggleCategory(id) })),
    ...(minRating ? [{ key: "rating", label: `${minRating.toFixed(1)}★+`, onRemove: () => setMinRating(null) }] : []),
    ...(maxDistanceKm ? [{ key: "distance", label: `Within ${maxDistanceKm} km`, onRemove: () => setMaxDistanceKm(null) }] : []),
    ...(openNow ? [{ key: "open", label: "Open Now", onRemove: () => setOpenNow(false) }] : []),
  ];

  const goToProduct = (p: ApiProduct) => {
    if (!p.store) return;
    navigate(`/customer/store/${p.store._id}/product/${p._id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* This page renders under CustomerShell, which already mounts the real
          NavBar (with real location, cart count, and search) — no second
          header here. */}

      <main className="mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8" style={{ maxWidth:1200 }}>

        {/* ── COMPACT HERO ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, ease:"easeOut" }}
          className="mb-5 space-y-2"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
              Product Discovery
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor:`${C.tertiaryCont}18`, borderColor:`${C.tertiaryCont}60`, color: C.tertiary }}
            >
              <Check size={12}/> {activeCoords ? "Live Nearby Stock" : "Set location for nearby stock"}
            </span>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: C.onSurfaceVar }}>
            Search real products from stores near you, filter by category, rating, and distance.
          </p>
        </motion.div>

        {/* ── SEARCH BAR ─────────────────────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 border" style={{ backgroundColor: C.surface, borderColor: C.outlineVar }}>
            <Search size={16} color={C.outline}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
              style={{ color: C.onSurface }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} color={C.outline} />
              </button>
            )}
          </div>
        </div>

        {/* ── QUICK FILTERS ───────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 py-3" style={{ backgroundColor:`${C.bg}EE`, backdropFilter:"blur(16px)" }}>
          <motion.div
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.05, duration:0.35 }}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide pb-2">
              <QuickPill icon={<Clock size={14} />} label="Open Now" active={openNow} onClick={() => setOpenNow(o => !o)} />
              <QuickPill
                icon={<Navigation size={14} />}
                label={maxDistanceKm ? `Within ${maxDistanceKm} km` : "Distance"}
                active={!!maxDistanceKm}
                onClick={() => setDrawerOpen(true)}
              />
              <QuickPill
                icon={<Star size={14} />}
                label={minRating ? `${minRating.toFixed(1)}★+` : "Rating"}
                active={!!minRating}
                onClick={() => setDrawerOpen(true)}
              />
              <QuickPill
                icon={<SlidersHorizontal size={14} />}
                label="Filters"
                active={totalActiveFilters > 0}
                badgeCount={totalActiveFilters}
                onClick={() => setDrawerOpen(true)}
              />
            </div>

            <AnimatePresence>
              {activeChips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 flex-wrap pt-2 overflow-hidden"
                >
                  {activeChips.map(chip => (
                    <ActiveChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                  ))}
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold underline-offset-2 hover:underline px-1"
                    style={{ color: C.primary }}
                  >
                    Clear all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── FEATURED STORES RAIL (real) ───────────────────────────────── */}
        <div className="mt-1">
          <FeaturedStoresRail
            stores={nearbyStores.map(s => ({ _id: s._id, storeName: s.storeName, averageRating: s.averageRating, logoUrl: s.logoUrl }))}
            loading={storesLoading}
            selectedStoreIds={selectedStoreIds}
            toggleStore={toggleStore}
          />
        </div>

        {/* ── PRODUCT LIST HEADER with Sort & View Toggle ────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
              Products
              <span className="ml-2 text-xs sm:text-sm font-normal" style={{ color: C.onSurfaceVar }}>
                ({totalProducts})
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            <div className="flex rounded-xl border overflow-hidden flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              {(["grid","list"] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  aria-pressed={viewMode === m}
                  aria-label={m === "grid" ? "Grid view" : "List view"}
                  className="px-3 sm:px-3.5 py-2 transition-colors duration-150 flex items-center"
                  style={{ backgroundColor: viewMode===m ? C.primary : C.surface, color: viewMode===m ? "#FFFFFF" : C.outline }}
                >
                  {m==="grid" ? <Grid3X3 size={15}/> : <List size={15}/>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: C.outlineVar }} />

        {/* ── PRODUCT GRID / LIST ──────────────────────────────────────────── */}
        <div className="mt-8">
          {loadingProducts ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5" : "flex flex-col gap-3"}>
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} viewMode={viewMode} />)}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5" : "flex flex-col gap-3"}>
                <AnimatePresence>
                  {products.map(p => (
                    <ProductCard key={p._id} product={p} viewMode={viewMode} onOpen={() => goToProduct(p)} />
                  ))}
                </AnimatePresence>
              </div>

              {products.length < totalProducts && (
                <div className="flex justify-center mt-8">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60"
                    style={{ borderColor: C.outlineVar, color: C.primary, backgroundColor: C.surface }}
                  >
                    {loadingMore ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Loading…</span> : "Load more"}
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center justify-center py-20 text-center px-4"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.surfaceCtx }}>
                <Search size={22} color={C.outline}/>
              </div>
              <h3 className="font-bold" style={{ color: C.onSurface }}>No products found</h3>
              <p className="text-sm mt-1" style={{ color: C.onSurfaceVar }}>
                {activeCoords ? "Try adjusting your filters or search terms" : "Set your delivery location to see products near you"}
              </p>
              {(search || totalActiveFilters > 0) && (
                <motion.button
                  whileTap={{ scale:0.95 }}
                  onClick={()=>{ setSearch(""); clearAll(); }}
                  className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: C.primary, color: C.onPrimary }}
                >
                  Clear filters
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* ── DISCOVER MORE LOCALLY ────────────────────────────────────────── */}
        <section className="mt-14 mb-4">
          <h3 className="text-xl font-bold mb-5" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
            Discover More Locally
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <motion.div
              initial={{ opacity:0, x:-20 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.5 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-center bg-white border md:col-span-8 p-6 sm:p-10 lg:p-12 min-h-[300px]"
              style={{ borderColor: C.outlineVar }}
            >
              <div className="max-w-md">
                <span
                  className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3"
                  style={{ backgroundColor: C.secondaryCont, color: C.primary }}
                >
                  Flash Deal
                </span>
                <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
                  Artisanal Organic Week
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed mb-5" style={{ color: C.onSurfaceVar }}>
                  Get up to 40% off on verified organic farm products from local partner stores.
                </p>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold"
                  style={{ backgroundColor: C.primary, color:"#FFFFFF" }}
                >
                  Shop the Collection <ArrowRight size={13}/>
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity:0, x:20 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.5, delay:0.1 }}
              className="relative rounded-2xl flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white border md:col-span-4 min-h-[260px]"
              style={{ borderColor: C.outlineVar }}
            >
              <motion.div
                whileHover={{ scale:1.08, rotate:5 }}
                transition={{ duration:0.3 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-5"
                style={{ backgroundColor: C.secondaryCont }}
              >
                <BadgePercent size={32} className="sm:w-9 sm:h-9" color={C.primary}/>
              </motion.div>

              <h4 className="text-base sm:text-lg font-bold mb-2" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
                Market Rewards
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5" style={{ color: C.onSurfaceVar }}>
                Earn points for every purchase from local merchants.
              </p>
              <motion.a
                href="#"
                whileHover={{ letterSpacing:"0.04em" }}
                transition={{ duration:0.2 }}
                className="text-xs sm:text-sm font-black underline decoration-2 underline-offset-4"
                style={{ color: C.primary }}
              >
                Learn More
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        stores={nearbyStores.map(s => ({ _id: s._id, storeName: s.storeName }))}
        selectedStoreIds={selectedStoreIds}
        toggleStore={toggleStore}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        toggleCategory={toggleCategory}
        minRating={minRating}
        setMinRating={setMinRating}
        maxDistanceKm={maxDistanceKm}
        setMaxDistanceKm={setMaxDistanceKm}
        openNow={openNow}
        setOpenNow={setOpenNow}
        onClear={clearAll}
      />
    </div>
  );
}