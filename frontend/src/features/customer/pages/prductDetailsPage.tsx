import React, { useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Zap,
  MapPin,
  ChevronRight,
  Share2,
  Shield,
  RotateCcw,
  Truck,
  Plus,
  Minus,
  ChevronLeft,
  Award,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  useWishlistStore,
  useProductDetailStore,
} from "../state/productState";
import { useCartStore } from "../state/cartState";
import { useProductDetail } from "../hooks/useProductDetail";
import type { Product, StoreInfo } from "../types/product";
import { useViewedProductsStore } from "../state/viewProductState";

// ─── Badge ────────────────────────────────────────────────────────────────────

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "green" | "amber" | "red" | "brown";
}> = ({ children, variant = "green" }) => {
  const styles = {
    green: "bg-[#E8EFEC] text-[#145C43] border-[#DCE3DC]",
    amber: "bg-[#FEF3E2] text-[#92400E] border-[#FCD5A0]",
    red: "bg-[#FEE8E8] text-[#991B1B] border-[#FDB8B8]",
    brown: "bg-[#F5F7F3] text-[#6E7C74] border-[#E3E7E1]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const ProductDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F7F8F5]" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="flex items-center gap-2">
        {[120, 80, 160].map((w, i) => (
          <React.Fragment key={i}>
            <div className="h-4 bg-[#E3E7E1] rounded animate-pulse" style={{ width: w }} />
            {i < 2 && <div className="w-3 h-3 bg-[#E3E7E1] rounded animate-pulse" />}
          </React.Fragment>
        ))}
      </div>
    </div>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
        <div className="aspect-square rounded-2xl bg-[#E3E7E1] animate-pulse" />
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            {[80, 110].map((w, i) => (
              <div key={i} className="h-6 bg-[#E3E7E1] rounded-full animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-[#E3E7E1] rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-[#E3E7E1] rounded animate-pulse w-1/4" />
          </div>
          <div className="h-10 bg-[#E3E7E1] rounded-lg animate-pulse w-1/2" />
          <div className="h-px bg-[#E3E7E1]" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 bg-[#E3E7E1] rounded-xl animate-pulse" />
            <div className="h-12 flex-1 bg-[#E3E7E1] rounded-xl animate-pulse" />
          </div>
          <div className="h-20 bg-[#E3E7E1] rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────

const ProductDetailError: React.FC<{ message: string; onBack: () => void }> = ({
  message,
  onBack,
}) => (
  <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-full bg-[#FEE8E8] flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-[#991B1B]" />
      </div>
      <h2 className="text-lg font-bold text-[#16241D] mb-2">Product not found</h2>
      <p className="text-sm text-[#6E7C74] mb-6">{message}</p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#145C43] text-white text-sm font-medium hover:bg-[#114E39] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  </div>
);

// ─── Image Gallery ────────────────────────────────────────────────────────────

const ImageGallery: React.FC<{ images: string[]; productName: string }> = ({
  images,
  productName,
}) => {
  const { selectedImageIndex, setSelectedImageIndex } = useProductDetailStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { product } = useProductDetailStore();

  const wishlisted = product ? isWishlisted(product._id) : false;

  const handlePrev = useCallback(() => {
    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const displayImages = images.length > 0 ? images : ["/placeholder-product.jpg"];

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-6">
      <div className="relative overflow-hidden rounded-2xl bg-[#F5F7F3] aspect-square group">
        <img
          src={displayImages[selectedImageIndex]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4 text-[#16241D]" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4 text-[#16241D]" />
            </button>
          </>
        )}

        <button
          onClick={() => product && toggleWishlist(product._id)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? "fill-rose-500 text-rose-500" : "text-[#145C43]"
            }`}
          />
        </button>

        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedImageIndex ? "w-4 bg-[#145C43]" : "w-1.5 bg-[#145C43]/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImageIndex(i)}
              aria-label={`Thumbnail ${i + 1}`}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === selectedImageIndex
                  ? "border-[#145C43]"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Quantity Selector ────────────────────────────────────────────────────────

const QuantitySelector: React.FC = () => {
  const { quantity, incrementQuantity, decrementQuantity } = useProductDetailStore();
  return (
    <div className="inline-flex items-center gap-0 rounded-xl border border-[#DCE3DC] overflow-hidden">
      <button
        onClick={decrementQuantity}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="w-10 h-10 flex items-center justify-center text-[#145C43] hover:bg-[#F5F7F3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#16241D] border-x border-[#DCE3DC]">
        {quantity}
      </span>
      <button
        onClick={incrementQuantity}
        aria-label="Increase quantity"
        className="w-10 h-10 flex items-center justify-center text-[#145C43] hover:bg-[#F5F7F3] transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

const InfoPill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 sm:gap-2.5">
    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8EFEC] flex items-center justify-center text-[#145C43] flex-shrink-0">
      {icon}
    </span>
    <span className="text-xs sm:text-sm text-[#153A2C] font-medium">{label}</span>
  </div>
);

// ─── Store Card ───────────────────────────────────────────────────────────────

const StoreCard: React.FC<{ store: StoreInfo; onViewStore?: (id: string) => void }> = ({
  store,
  onViewStore,
}) => (
  <div
    onClick={() => onViewStore?.(store._id)}
    className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#E3E7E1] bg-[#FFFFFF] hover:border-[#145C43]/50 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#145C43] flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-xs sm:text-sm">
          {store.storeName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[#16241D] text-xs sm:text-sm truncate">{store.storeName}</p>
        {store.distance && (
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#6E7C74] mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{store.distance}</span>
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs font-medium text-[#145C43] group-hover:gap-2 transition-all flex-shrink-0">
      View Store
      <ChevronRight className="w-3.5 h-3.5" />
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildStoreInfo = (product: Product): StoreInfo => {
  const s = product.storeId as unknown as {
    _id: string;
    storeName?: string;
  } | null;

  return {
    _id: s?._id ?? "",
    storeName: s?.storeName ?? "Unknown Store",
    rating: undefined,
    totalRatings: undefined,
    distance: undefined,
  };
};

// ─── Main ProductDetailPage ───────────────────────────────────────────────────

const ProductDetailPage: React.FC = () => {
  const { storeId = "", productId = "" } = useParams<{ storeId: string; productId: string }>();
  const navigate = useNavigate();

  const { product, isLoading, error } = useProductDetail(productId, storeId);
  const { quantity, reset } = useProductDetailStore();
  const recordView = useViewedProductsStore((s) => s.recordView);

  const addToCartAction = useCartStore((s) => s.addToCart);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    void fetchCart();
    return () => reset();
  }, [fetchCart, reset]);

  useEffect(() => {
    if (!product) return;

    recordView({
      _id: product._id,
      productName: product.productName,
      price: product.price,
      images: product.images ?? [],
      unit: product.unit,
      storeId: product.storeId,
      categoryId: product.categoryId,
      viewedAt: Date.now(),
    });
  }, [product, recordView]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (error || !product) {
    return (
      <ProductDetailError
        message={error ?? "This product could not be loaded."}
        onBack={() => navigate(-1)}
      />
    );
  }

  const storeInfo = buildStoreInfo(product);
  const cartQuantity = getItemQuantity(product._id);
  const isAvailable = product.availabilityStatus === "AVAILABLE";

  const handleAddToCart = () => {
    addToCartAction(product._id, quantity);
  };

  const handleViewStore = (id: string) => navigate(`/customer/store/${id}`);

  return (
    <div className="min-h-screen bg-[#F7F8F5]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-[#9BAAA1]">
          {[
            { label: "Home", path: "/customer/home" },
            { label: product.categoryId?.categoryName ?? "Category", path: "/customer/discovery" },
            { label: product.productName, path: "#" },
          ].map((crumb, i, arr) => (
            <React.Fragment key={crumb.path}>
              {i < arr.length - 1 ? (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="hover:text-[#145C43] transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-[#16241D] font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              )}
              {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* ── Main Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

          <ImageGallery images={product.images} productName={product.productName} />

          <div className="flex flex-col gap-5 bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6">

            {/* Badges */}
            {(product.isBestseller || product.categoryId?.categoryName) && (
              <div className="flex flex-wrap gap-2">
                {product.isBestseller && (
                  <Badge variant="amber"><Award className="w-3 h-3" /> Bestseller</Badge>
                )}
                {product.categoryId?.categoryName && (
                  <Badge variant="brown"><Tag className="w-3 h-3" /> {product.categoryId.categoryName}</Badge>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#16241D] leading-tight tracking-tight">
                {product.productName}
              </h1>
              {product.unit && (
                <p className="text-xs sm:text-sm text-[#9BAAA1] mt-1">per {product.unit}</p>
              )}
            </div>

            {/* Price + availability */}
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#16241D]">
                ₹{(product.price ?? 0).toLocaleString("en-IN")}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  isAvailable ? "text-[#145C43]" : "text-[#991B1B]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAvailable ? "bg-[#145C43]" : "bg-[#991B1B]"
                  }`}
                />
                {isAvailable ? "In stock" : "Out of stock"}
              </span>
            </div>

            {/* Description — shown directly, no tab click needed */}
            {product.description && (
              <p className="text-xs sm:text-sm text-[#6E7C74] leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Quantity + CTA */}
            {isAvailable && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#153A2C]">Qty</span>
                  <QuantitySelector />
                  {product.stockQuantity <= 10 && product.stockQuantity > 0 && (
                    <span className="text-xs text-rose-600 font-medium">
                      Only {product.stockQuantity} left!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm bg-[#145C43] text-white hover:bg-[#114E39] transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                    {cartQuantity > 0 && (
                      <span className="bg-white/20 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartQuantity}
                      </span>
                    )}
                  </button>

                  <div className="flex gap-2.5 sm:gap-3 flex-1">
                    <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] text-[#16241D] transition-all">
                      <Zap className="w-4 h-4" /> Buy Now
                    </button>

                    <button
                      aria-label="Share product"
                      className="w-12 h-12 rounded-xl border border-[#DCE3DC] flex items-center justify-center text-[#6E7C74] hover:bg-[#F5F7F3] transition-colors flex-shrink-0"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isAvailable && (
              <div className="h-12 rounded-xl bg-[#F5F7F3] flex items-center justify-center text-sm text-[#9BAAA1] font-medium">
                Currently unavailable
              </div>
            )}

            <div className="h-px bg-[#E3E7E1]" />

            {/* Trust pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoPill icon={<Truck className="w-4 h-4" />} label="Fast Delivery" />
              <InfoPill icon={<Shield className="w-4 h-4" />} label="Secure Pay" />
              <InfoPill icon={<RotateCcw className="w-4 h-4" />} label="Easy Returns" />
            </div>

            <div className="h-px bg-[#E3E7E1]" />

            {/* Store card */}
            {storeInfo._id && (
              <div>
                <p className="text-xs font-semibold text-[#9BAAA1] uppercase tracking-wider mb-2">
                  Sold by
                </p>
                <StoreCard store={storeInfo} onViewStore={handleViewStore} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;