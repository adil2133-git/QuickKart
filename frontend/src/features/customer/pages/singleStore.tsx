import {
  useState,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  StarHalf,
  Share2,
  ShoppingCart,
  Check,
  Search,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  MapPin,
  ChevronDown,
  Loader2,
  AlertCircle,
  PackageOpen,
} from "lucide-react";
import { useSingleStoreStore, type Product, type OperatingHour, type RatingBar } from "../state/singleStoreState";
import { useCartStore } from "../state/cartState";

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  bg: "#F7F8F5",
  ink: "#16241D",
  muted: "#6E7C74",
  brown: "#145C43",
  green: "#145C43",
  line: "#E3E7E1",
  card: "#FFFFFF",
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function StarRow({ rating = 0, size = 14, color = PALETTE.brown }: { rating?: number; size?: number; color?: string }) {
  return (
    <div className="flex items-center gap-0.5" style={{ color }}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= Math.floor(rating)) return <Star key={i} size={size} fill={color} strokeWidth={0} />;
        if (i - 0.5 <= rating) return <StarHalf key={i} size={size} fill={color} strokeWidth={0} />;
        return <Star key={i} size={size} fill="none" stroke={color} strokeWidth={1.5} />;
      })}
    </div>
  );
}

function AddButton({ withLabel = false, onAdd, productId }: { withLabel?: boolean; onAdd?: () => void; productId?: string }) {
  const [added, setAdded] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);

  const handleClick = async (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (productId) {
      await addToCart(productId, 1);
    }
    onAdd?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  if (withLabel) {
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-white transition-all active:scale-95"
        style={{ backgroundColor: added ? PALETTE.green : PALETTE.brown }}
      >
        {added ? <Check size={14} /> : <ShoppingCart size={14} />}
        {added ? "Added" : "Add"}
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      className="w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-md transition-all active:scale-90"
      style={{ backgroundColor: added ? PALETTE.green : PALETTE.brown }}
    >
      {added ? <Check size={20} /> : <span className="text-xl leading-none">+</span>}
    </button>
  );
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl ${className}`} style={{ backgroundColor: "#ece3d4" }} />;
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 border" style={{ borderColor: "rgba(210,196,185,0.3)" }}>
      <ShimmerBlock className="aspect-square mb-4" />
      <ShimmerBlock className="h-3 w-1/3 mb-2" />
      <ShimmerBlock className="h-4 w-2/3 mb-4" />
      <ShimmerBlock className="h-5 w-1/4" />
    </div>
  );
}

// ─── FIX: accept storeId as a prop so we always use the URL param string,
//         never product.storeId which may be a populated object. ─────────────

function ProductCard({ product, storeId }: { product: Product; storeId: string }) {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const img = product.images?.[0] || "https://placehold.co/400x400/f3ede4/735a3e?text=No+Image";
  const outOfStock = product.availabilityStatus === "OUT_OF_STOCK";

  const handleCardClick = () => {
    // Use the storeId prop (from useParams) — never product.storeId
    navigate(`/customer/store/${storeId}/product/${product._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white rounded-3xl p-4 border border-[#E3E7E1]/30 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
      onMouseEnter={() => setShowAdd(true)}
      onMouseLeave={() => setShowAdd(false)}
    >
      <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
        <img
          src={img}
          alt={product.productName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wide uppercase">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-grow">
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: PALETTE.muted }}>
          {product.categoryId?.categoryName || "Uncategorised"}
        </span>
        <h4 className="text-base font-semibold leading-snug" style={{ fontFamily: "'Inter', sans-serif", color: PALETTE.ink }}>
          {product.productName}
        </h4>
        <div className="flex items-center justify-between mt-auto pt-4">
          <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: PALETTE.brown }}>
            ₹{Number(product.price).toFixed(2)}
            {product.unit && <small className="text-xs font-normal" style={{ color: PALETTE.muted }}> /{product.unit}</small>}
          </span>
          {!outOfStock && (
            <div
              className="transition-all duration-300"
              style={{ opacity: showAdd ? 1 : 0, transform: showAdd ? "translateY(0)" : "translateY(8px)" }}
            >
              <AddButton withLabel productId={product._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FIX: same fix for BestsellerCard ────────────────────────────────────────

function BestsellerCard({ item, storeId }: { item: Product; storeId: string }) {
  const navigate = useNavigate();
  const img = item.images?.[0] || "https://placehold.co/400x400/f3ede4/735a3e?text=No+Image";

  const handleCardClick = () => {
    // Use the storeId prop (from useParams) — never item.storeId
    navigate(`/customer/store/${storeId}/product/${item._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex bg-white rounded-3xl overflow-hidden border border-[#E3E7E1]/30 hover:shadow-xl transition-all duration-300 group cursor-pointer"
      style={{ height: 224 }}
    >
      <div className="w-2/5 relative overflow-hidden flex-shrink-0">
        <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg" style={{ backgroundColor: PALETTE.brown }}>
          BESTSELLER
        </span>
        <img src={img} alt={item.productName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div className="w-3/5 p-6 flex flex-col justify-between">
        <div>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600, color: PALETTE.ink }}>{item.productName}</h3>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: PALETTE.muted }}>{item.description}</p>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600, color: PALETTE.brown }}>
            ₹{Number(item.price).toFixed(2)}
            {item.unit && <small className="text-xs font-normal" style={{ color: PALETTE.muted }}> /{item.unit}</small>}
          </span>
          <AddButton productId={item._id} />
        </div>
      </div>
    </div>
  );
}

function formatHours(operatingHours: OperatingHour[] = []) {
  if (!operatingHours.length) return [{ label: "Hours not set", value: "" }];
  return operatingHours
    .filter((h) => !h.isClosed && h.openTime && h.closeTime)
    .map((h) => ({ label: h.day, value: `${h.openTime} – ${h.closeTime}` }));
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest" as const, label: "Newest" },
  { value: "priceAsc" as const, label: "Price: Low to High" },
  { value: "priceDesc" as const, label: "Price: High to Low" },
];

// ─── Page entry ───────────────────────────────────────────────────────────────

export default function FreshMartStorePage() {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PALETTE.bg }}>
        <div className="flex flex-col items-center gap-3" style={{ color: PALETTE.muted }}>
          <AlertCircle size={32} />
          <p className="text-sm">No store ID provided in the URL.</p>
        </div>
      </div>
    );
  }

  return <StorePageContent storeId={storeId} />;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function StorePageContent({ storeId }: { storeId: string }) {
  // ── Zustand selectors ──────────────────────────────────────────────────────
  const store = useSingleStoreStore((s) => s.store);
  const storeLoading = useSingleStoreStore((s) => s.storeLoading);
  const storeError = useSingleStoreStore((s) => s.storeError);

  const bestsellers = useSingleStoreStore((s) => s.bestsellers);
  const bestsellersLoading = useSingleStoreStore((s) => s.bestsellersLoading);

  const categories = useSingleStoreStore((s) => s.categories);

  const products = useSingleStoreStore((s) => s.products);
  const productsLoading = useSingleStoreStore((s) => s.productsLoading);
  const productsError = useSingleStoreStore((s) => s.productsError);
  const page = useSingleStoreStore((s) => s.page);
  const pages = useSingleStoreStore((s) => s.pages);
  const loadingMore = useSingleStoreStore((s) => s.loadingMore);

  const activeCategory = useSingleStoreStore((s) => s.activeCategory);
  const searchInput = useSingleStoreStore((s) => s.searchInput);
  const sort = useSingleStoreStore((s) => s.sort);
  const sortOpen = useSingleStoreStore((s) => s.sortOpen);

  const ratingSummary = useSingleStoreStore((s) => s.ratingSummary);
  const reviews = useSingleStoreStore((s) => s.reviews);
  const reviewsLoading = useSingleStoreStore((s) => s.reviewsLoading);

  const followed = useSingleStoreStore((s) => s.followed);
  const fetchCart = useCartStore((s) => s.fetchCart);

  // ── Actions ────────────────────────────────────────────────────────────────
  const fetchStore = useSingleStoreStore((s) => s.fetchStore);
  const fetchBestsellers = useSingleStoreStore((s) => s.fetchBestsellers);
  const fetchCategories = useSingleStoreStore((s) => s.fetchCategories);
  const fetchProducts = useSingleStoreStore((s) => s.fetchProducts);
  const fetchReviews = useSingleStoreStore((s) => s.fetchReviews);
  const setActiveCategory = useSingleStoreStore((s) => s.setActiveCategory);
  const setSearchInput = useSingleStoreStore((s) => s.setSearchInput);
  const setSearch = useSingleStoreStore((s) => s.setSearch);
  const setSort = useSingleStoreStore((s) => s.setSort);
  const setSortOpen = useSingleStoreStore((s) => s.setSortOpen);
  const toggleFollowed = useSingleStoreStore((s) => s.toggleFollowed);
  const resetStore = useSingleStoreStore((s) => s.resetStore);

  // ── Bootstrap all data on mount ────────────────────────────────────────────
  useEffect(() => {
    fetchStore(storeId);
    fetchBestsellers(storeId);
    fetchCategories();
    fetchReviews(storeId);
    void fetchCart();
    return () => resetStore();
  }, [fetchBestsellers, fetchCart, fetchCategories, fetchReviews, fetchStore, resetStore, storeId]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  // ── Re-fetch products when filters change ──────────────────────────────────
  const search = useSingleStoreStore((s) => s.search);
  useEffect(() => {
    fetchProducts(storeId, 1);
  }, [activeCategory, fetchProducts, search, sort, storeId]);

  // ── Sort dropdown close on outside click ───────────────────────────────────
  const sortRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [setSortOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(231,215,193,0.4); }
        .reviews-scroll::-webkit-scrollbar { width: 4px; }
        .reviews-scroll::-webkit-scrollbar-track { background: transparent; }
        .reviews-scroll::-webkit-scrollbar-thumb { background: #E7D7C1; border-radius: 10px; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: PALETTE.bg, color: PALETTE.ink, fontFamily: "'Inter', sans-serif" }}>
        <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-20">

          {/* ── Hero ── */}
          <header className="relative mt-4 sm:mt-8 group">
            <div className="h-56 sm:h-72 md:h-[360px] w-full rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-lg">
              <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
              {storeLoading ? (
                <ShimmerBlock className="w-full h-full rounded-none" />
              ) : (
                <img
                  src={store?.coverImageUrl || "https://placehold.co/1200x400/f3ede4/735a3e?text=Store+Cover"}
                  alt={store?.storeName || "Store cover"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </div>

            <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-8 z-20 flex flex-col md:flex-row md:items-end gap-4 sm:gap-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 sm:border-8 shadow-xl overflow-hidden flex-shrink-0 bg-white" style={{ borderColor: PALETTE.bg }}>
                {storeLoading ? (
                  <ShimmerBlock className="w-full h-full rounded-none" />
                ) : (
                  <img src={store?.logoUrl || "https://placehold.co/200x200/f3ede4/735a3e?text=Logo"} alt={`${store?.storeName} logo`} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-grow flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  {storeLoading ? (
                    <>
                      <ShimmerBlock className="h-8 w-56 mb-3" />
                      <ShimmerBlock className="h-4 w-72" />
                    </>
                  ) : storeError ? (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#ba1a1a" }}>
                      <AlertCircle size={16} /> Couldn't load store details.
                    </div>
                  ) : (
                    <>
                      <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em", color: PALETTE.ink }} className="text-2xl sm:text-3xl mb-1.5">
                        {store?.storeName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1" style={{ color: PALETTE.brown }}>
                          <Star size={14} fill={PALETTE.brown} strokeWidth={0} />
                          <span className="text-xs font-bold">{(store?.averageRating ?? 0).toFixed(1)}</span>
                          <span className="text-xs" style={{ color: PALETTE.muted }}>({store?.reviewCount ?? 0} reviews)</span>
                        </div>
                        {store?.distanceKm != null && (
                          <>
                            <span style={{ color: PALETTE.muted }}>•</span>
                            <span className="text-xs flex items-center gap-1" style={{ color: PALETTE.muted }}>
                              <MapPin size={12} /> {store.distanceKm} KM Away
                            </span>
                          </>
                        )}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-white"
                          style={{ backgroundColor: store?.status === "OPEN" ? PALETTE.green : store?.status === "BUSY" ? "#a36b1f" : "#9b9286" }}
                        >
                          {store?.status === "OPEN" ? "OPEN NOW" : store?.status === "BUSY" ? "BUSY" : "CLOSED"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={toggleFollowed}
                    className="px-5 sm:px-6 py-2.5 rounded-full border text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer"
                    style={{ borderColor: PALETTE.brown, color: followed ? "#fff" : PALETTE.brown, backgroundColor: followed ? PALETTE.brown : "transparent" }}
                  >
                    {followed ? "Following" : "Follow Store"}
                  </button>
                  <button className="px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer" style={{ backgroundColor: "#ede7de", color: PALETTE.ink }}>
                    Contact
                  </button>
                  <button className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer" style={{ borderColor: PALETTE.line, color: PALETTE.muted }}>
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ── KPI Cards ── */}
          <section className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { value: store?.totalOrders ? `${store.totalOrders}+` : "—", label: "Orders" },
              { value: bestsellers.length || "—", label: "Best Sellers" },
              { value: (store?.averageRating ?? 0).toFixed(1), label: "Avg Rating" },
              { value: store?.reviewCount ?? "—", label: "Reviews" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 rounded-2xl flex flex-col items-center text-center shadow-sm">
                <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: PALETTE.brown }}>
                  {storeLoading ? "–" : stat.value}
                </span>
                <span className="text-[10px] uppercase tracking-widest mt-1 font-medium" style={{ color: PALETTE.muted }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </section>

          {/* ── Curated Bestsellers ── */}
          <section className="mt-16">
            <div className="flex justify-between items-end mb-8">
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 700 }}>Curated Bestsellers</h2>
            </div>
            {bestsellersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[0, 1].map((i) => <ShimmerBlock key={i} className="h-[224px]" />)}
              </div>
            ) : bestsellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-3xl border border-dashed gap-2" style={{ borderColor: PALETTE.line, color: PALETTE.muted }}>
                <PackageOpen size={28} />
                <p className="text-sm">No bestsellers yet — check back once orders start rolling in.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── FIX: pass storeId prop ── */}
                {bestsellers.map((item) => <BestsellerCard key={item._id} item={item} storeId={storeId} />)}
              </div>
            )}
          </section>

          {/* ── Product Catalog ── */}
          <section className="mt-20">
            <div
              className="sticky top-0 z-50 py-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#E3E7E1]/20"
              style={{ backgroundColor: "rgba(247,248,245,0.85)", backdropFilter: "blur(12px)" }}
            >
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: PALETTE.muted }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: PALETTE.line, backgroundColor: "#fff" }}
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto cat-scroll">
                <button
                  onClick={() => setActiveCategory("All")}
                  className="px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                  style={{
                    backgroundColor: activeCategory === "All" ? PALETTE.brown : "#fff",
                    color: activeCategory === "All" ? "#fff" : PALETTE.muted,
                    border: `1px solid ${activeCategory === "All" ? PALETTE.brown : PALETTE.line}`,
                  }}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCategory(cat._id)}
                    className="px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                    style={{
                      backgroundColor: activeCategory === cat._id ? PALETTE.brown : "#fff",
                      color: activeCategory === cat._id ? "#fff" : PALETTE.muted,
                      border: `1px solid ${activeCategory === cat._id ? PALETTE.brown : PALETTE.line}`,
                    }}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="relative w-full md:w-auto flex justify-end" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all"
                  style={{ borderColor: PALETTE.line, backgroundColor: "#fff", color: PALETTE.muted }}
                >
                  <SlidersHorizontal size={14} />
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown size={14} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-lg border z-50 overflow-hidden w-48" style={{ borderColor: PALETTE.line }}>
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => { setSort(o.value); setSortOpen(false); }}
                        className="block w-full text-left px-4 py-2.5 text-xs hover:bg-[#F5F7F3] transition-colors"
                        style={{ color: sort === o.value ? PALETTE.green : PALETTE.ink, fontWeight: sort === o.value ? 600 : 400 }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product grid */}
            {productsError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "#ba1a1a" }}>
                <AlertCircle size={24} />
                <p className="text-sm">{productsError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {productsLoading
                  ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : /* ── FIX: pass storeId prop ── */
                    products.map((p) => <ProductCard key={p._id} product={p} storeId={storeId} />)}
                {!productsLoading && products.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-2" style={{ color: PALETTE.muted }}>
                    <PackageOpen size={28} />
                    <p className="text-sm">No products match your search.</p>
                  </div>
                )}
              </div>
            )}

            {/* Load more */}
            {!productsLoading && page < pages && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => fetchProducts(storeId, page + 1, { append: true })}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full border text-sm font-medium transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
                  style={{ borderColor: PALETTE.brown, color: PALETTE.brown }}
                >
                  {loadingMore && <Loader2 size={16} className="animate-spin" />}
                  {loadingMore ? "Loading..." : "Load More Products"}
                </button>
              </div>
            )}
          </section>

          {/* ── Store Info & Reviews ── */}
          <section className="mt-24 grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 space-y-8">
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 700 }}>Store Intelligence</h2>
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border flex items-start gap-4" style={{ backgroundColor: PALETTE.card, borderColor: "rgba(210,196,185,0.3)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(115,90,62,0.1)", color: PALETTE.brown }}>
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1" style={{ color: PALETTE.ink }}>Operating Hours</h4>
                    {storeLoading ? (
                      <ShimmerBlock className="h-4 w-40" />
                    ) : (
                      formatHours(store?.operatingHours).map((h) => (
                        <p key={h.label} className="text-sm" style={{ color: PALETTE.muted }}>
                          {h.label}{h.value ? `: ${h.value}` : ""}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border flex items-start gap-4" style={{ backgroundColor: PALETTE.card, borderColor: "rgba(210,196,185,0.3)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(55,104,71,0.1)", color: PALETTE.green }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: PALETTE.ink }}>Store Address</h4>
                    <p className="text-sm" style={{ color: PALETTE.muted }}>{storeLoading ? "Loading..." : store?.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-8">
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 700 }}>Customer Sentiment</h2>
              <div className="bg-white p-8 rounded-3xl border border-[#E3E7E1]/30 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div className="text-center md:pr-8 flex-shrink-0" style={{ borderRight: "1px solid rgba(210,196,185,0.3)" }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: PALETTE.ink, lineHeight: 1 }} className="mb-1">
                      {(ratingSummary?.averageRating ?? 0).toFixed(1)}
                    </div>
                    <StarRow rating={ratingSummary?.averageRating ?? 0} size={20} />
                    <div className="text-[10px] uppercase tracking-widest mt-2" style={{ color: PALETTE.muted }}>
                      {ratingSummary?.totalReviews ?? 0} Ratings
                    </div>
                  </div>

                  <div className="flex-grow w-full space-y-2">
                    {(ratingSummary?.bars || [5, 4, 3, 2, 1].map((s) => ({ star: s, pct: 0 } as RatingBar))).map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs w-4" style={{ color: PALETTE.muted }}>{star}</span>
                        <div className="flex-grow h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F7F3" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PALETTE.brown }} />
                        </div>
                        <span className="text-xs w-8" style={{ color: PALETTE.muted }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 reviews-scroll">
                  {reviewsLoading ? (
                    Array.from({ length: 2 }).map((_, i) => <ShimmerBlock key={i} className="h-20" />)
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: PALETTE.muted }}>No reviews yet.</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="border-t border-[#E3E7E1]/30 pt-6 first:border-t-0 first:pt-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#E8EFEC", color: PALETTE.brown }}>
                              {r.initials}
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold" style={{ color: PALETTE.ink }}>{r.name}</h5>
                              <StarRow rating={r.rating} size={12} />
                            </div>
                          </div>
                          <span className="text-xs" style={{ color: PALETTE.muted }}>
                            {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: PALETTE.muted }}>{r.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t py-12 px-10 text-center" style={{ backgroundColor: PALETTE.card, borderColor: PALETTE.line }}>
          <div className="max-w-[1200px] mx-auto">
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600, color: PALETTE.brown }} className="mb-2">
              QuickKart
            </h3>
            <p className="text-sm" style={{ color: PALETTE.muted }}>Empowering local artisans and bringing fresh produce to your doorstep.</p>
            <div className="mt-8 flex justify-center gap-6">
              {["Privacy Policy", "Terms of Service", "Help Center"].map((l) => (
                <a key={l} href="#" className="text-sm transition-colors" style={{ color: PALETTE.muted }}>{l}</a>
              ))}
            </div>
            <p className="mt-8 text-xs" style={{ color: PALETTE.muted }}>© 2024 QuickKart Marketplace. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}