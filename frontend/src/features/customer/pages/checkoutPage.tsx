import { Check, ChevronDown, Loader2, Lock, MapPin, ShoppingBag, Tag } from "lucide-react";
import {
  useAddressDropdown,
  useCartItems,
  useCoupon,
  useDeliveryInstructions,
  useLoadCheckoutSummary,
  useOrderTotals,
  usePayment,
  usePlaceOrder,
} from "../hooks/useCheckout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SavedAddress } from "../types/checkout";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Moved off the cream/terracotta palette (a look that's become an AI-generated
// default) toward something that reads as "fresh groceries": a deep forest
// green for structure/brand, and a citrus lime as the one high-energy accent,
// reserved for the primary action and success states so it stays meaningful.
//
//   --ink        #16241D   primary text
//   --ink-muted  #6E7C74   secondary text
//   --brand      #145C43   headings, icons, borders-on-focus
//   --brand-soft #E8EFEC   badges, subtle fills
//   --paper      #F7F8F5   page background
//   --line       #E3E7E1   hairline borders
//   --citrus     #A9CC3B   primary CTA, success accents (used sparingly)

// ─── StepBadge ────────────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#145C43] text-white text-sm font-semibold shrink-0">
      {n}
    </span>
  );
}

// ─── AddressDropdown ──────────────────────────────────────────────────────────
// Addresses are now flat strings from the backend (label + address + optional
// coordinates) rather than the old structured mock shape — no name/city/zip
// fields exist server-side, so the dropdown renders what's actually there.
//
// The address string is condensed rather than shown at full weight: an
// "Deliver to" eyebrow + label carry the at-a-glance info, the full string
// sits underneath in a quieter, truncated line, since it's the part of the
// page a returning user changes least often.

function AddressRow({ addr }: { addr: SavedAddress }) {
  return (
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[#6E7C74]">
          Deliver to
        </span>
        <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-[#145C43] bg-[#E8EFEC] px-2 py-0.5 rounded-full">
          {addr.label || "Address"}
        </span>
      </div>
      <p
        className="text-sm font-medium text-[#16241D] mt-1 truncate"
        title={addr.address}
      >
        {addr.address}
      </p>
    </div>
  );
}

function AddressDropdown() {
  const { addresses, selectedAddressId, setSelectedAddressId, selected } = useAddressDropdown();
  const [open, setOpen] = useState(false);

  if (addresses.length === 0) {
    return (
      <div className="border border-dashed border-[#DCE3DC] rounded-xl px-4 py-5 text-center">
        <p className="text-sm text-[#6E7C74]">No saved addresses yet.</p>
        <button className="mt-2 text-sm font-medium text-[#145C43] hover:underline">
          + Add a delivery address
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 border border-[#DCE3DC] rounded-xl px-4 py-3.5 bg-white hover:border-[#145C43] transition-colors focus:outline-none focus:ring-2 focus:ring-[#145C43]/30"
      >
        {/* flex-1 is the fix: without it this div shrinks to fit-content instead
            of filling the space before the chevron, which is what was causing
            the label/address to render with unpredictable, floating positions. */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <MapPin size={16} className="text-[#145C43] shrink-0" />
          {selected ? (
            <AddressRow addr={selected} />
          ) : (
            <p className="text-sm text-[#6E7C74]">Select a delivery address</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-[#6E7C74] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#DCE3DC] rounded-xl shadow-xl overflow-hidden">
          {addresses.map((addr) => (
            <button
              key={addr._id}
              onClick={() => {
                setSelectedAddressId(addr._id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#ECF2F0] transition-colors ${
                addr._id === selectedAddressId ? "bg-[#ECF2F0]" : ""
              }`}
            >
              <AddressRow addr={addr} />
              {addr._id === selectedAddressId && (
                <Check size={16} className="text-[#145C43] shrink-0" />
              )}
            </button>
          ))}
          <div className="border-t border-[#E3E7E1]">
            <button className="w-full px-4 py-3 text-sm font-medium text-[#145C43] hover:bg-[#ECF2F0] transition-colors text-left">
              + Add new address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DeliveryInstructions ─────────────────────────────────────────────────────

function DeliveryInstructions() {
  const { deliveryInstructions, setDeliveryInstructions } = useDeliveryInstructions();

  return (
    <section className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <StepBadge n={2} />
        <h2 className="text-base sm:text-lg font-semibold text-[#16241D]">Delivery Instructions</h2>
      </div>
      <p className="text-xs sm:text-sm text-[#6E7C74] mb-3">Special requests for the delivery partner</p>
      <textarea
        value={deliveryInstructions}
        onChange={(e) => setDeliveryInstructions(e.target.value)}
        rows={3}
        placeholder="e.g. Leave at the gate, Call upon arrival, Ring the bell twice…"
        className="w-full border border-[#DCE3DC] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#16241D] placeholder-[#9BAAA1] resize-none focus:outline-none focus:ring-2 focus:ring-[#145C43]/30 focus:border-[#145C43] transition-colors bg-[#F5F7F3]"
      />
    </section>
  );
}

// ─── PaymentMethod ────────────────────────────────────────────────────────────
// Online payment isn't wired up on the backend yet — that option is shown
// but disabled, so it's clear it's coming rather than silently broken.

function PaymentMethod() {
  const { paymentMethod, setPaymentMethod, walletBalance, useWallet, setUseWallet } = usePayment();

  return (
    <section className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <StepBadge n={3} />
        <h2 className="text-base sm:text-lg font-semibold text-[#16241D]">Payment Method</h2>
      </div>
      <div className="space-y-3">
        <label
          className={`flex items-center gap-3 sm:gap-4 border rounded-xl p-3.5 sm:p-4 cursor-pointer transition-colors ${
            paymentMethod === "ONLINE" ? "border-[#145C43] bg-[#ECF2F0]" : "border-[#DCE3DC] bg-white hover:bg-[#F5F7F3]"
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="online"
            checked={paymentMethod === "ONLINE"}
            onChange={() => setPaymentMethod("ONLINE")}
            className="accent-[#145C43] w-4 h-4"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#16241D]">Online Payment</p>
            <p className="text-[11px] sm:text-xs text-[#6E7C74] truncate">UPI, Cards, Net Banking &mdash; via Razorpay</p>
          </div>
          <span className="text-base sm:text-lg shrink-0">💳</span>
        </label>

        {paymentMethod === "ONLINE" && walletBalance > 0 && (
          <label className="flex items-center gap-3 px-3.5 sm:px-4 py-3 rounded-xl border border-dashed border-[#B9D6C9] bg-[#F5FAF7] cursor-pointer">
            <input
              type="checkbox"
              checked={useWallet}
              onChange={(e) => setUseWallet(e.target.checked)}
              className="accent-[#145C43] w-4 h-4 shrink-0"
            />
            <span className="text-xs sm:text-sm text-[#16241D] flex-1">
              Use wallet balance{" "}
              <span className="font-semibold text-[#145C43]">
                (₹{walletBalance.toFixed(2)} available)
              </span>
            </span>
          </label>
        )}

        <label
          className={`flex items-center gap-3 sm:gap-4 border rounded-xl p-3.5 sm:p-4 cursor-pointer transition-colors ${
            paymentMethod === "COD" ? "border-[#145C43] bg-[#ECF2F0]" : "border-[#DCE3DC] bg-white hover:bg-[#F5F7F3]"
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            className="accent-[#145C43] w-4 h-4"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#16241D]">Cash on Delivery (COD)</p>
            <p className="text-[11px] sm:text-xs text-[#6E7C74]">Pay when you receive the items</p>
          </div>
          <span className="text-base sm:text-lg shrink-0">💵</span>
        </label>
      </div>
    </section>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────

function OrderSummary() {
  const { couponCode, setCouponCode, couponApplied, applyCoupon } = useCoupon();
  const totals = useOrderTotals();
  const cartItems = useCartItems();
  const { paymentMethod } = usePayment();
  const { submit, isPlacingOrder } = usePlaceOrder();
  const navigate = useNavigate();

  const isEmpty = cartItems.length === 0;
  const belowMinOrder = !isEmpty && totals.productTotal < totals.minOrderValue;
  const isBlocked = Boolean(totals.pricingError) || belowMinOrder;

  const handlePlaceOrder = async () => {
    const order = await submit();
    if (order) {
      navigate("/customer/profile?tab=orders");
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 min-w-0">
      <div className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-[#16241D] mb-4 sm:mb-5">Order Summary</h2>

        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={14} className="text-[#6E7C74]" />
          <span className="text-xs sm:text-sm italic text-[#6E7C74] truncate">
            {cartItems[0]?.productId.storeId?.storeName ?? "Your cart"}
          </span>
        </div>

        {isEmpty ? (
          <p className="text-sm text-[#6E7C74] py-6 text-center">Your cart is empty.</p>
        ) : (
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
            {cartItems.map((item) => (
              <div key={item.productId._id} className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#E8EFEC] flex items-center justify-center text-xl sm:text-2xl shrink-0 overflow-hidden">
                  {item.productId.images?.[0] ? (
                    <img
                      src={item.productId.images[0]}
                      alt={item.productId.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🛒"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-[#16241D] leading-tight truncate">
                    {item.productId.productName}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#6E7C74]">
                    {item.productId.unit ? `${item.productId.unit} · ` : ""}Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#16241D] shrink-0">
                  ₹{(item.productId.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#E3E7E1] pt-4 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-[#153A2C]">
            <span>Product Total</span>
            <span>₹{totals.productTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-[#153A2C]">
            <span>Delivery Charge</span>
            {totals.freeDeliveryApplied ? (
              <span className="font-semibold text-green-600">FREE</span>
            ) : (
              <span className="font-semibold">₹{totals.deliveryCharge.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-[#153A2C]">
            <span>Packaging Fee</span>
            <span>₹{totals.packagingFee.toFixed(2)}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-xs sm:text-sm text-green-600 font-medium">
              <span>Coupon Discount</span>
              <span>−₹{totals.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          {totals.walletAmountToApply > 0 && (
            <div className="flex justify-between text-xs sm:text-sm text-[#145C43] font-medium">
              <span>Wallet Applied</span>
              <span>−₹{totals.walletAmountToApply.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#E3E7E1] mt-4 pt-4 flex justify-between items-center">
          <span className="text-sm sm:text-base font-semibold text-[#16241D]">
            {totals.walletAmountToApply > 0 ? "Amount to Pay" : "Grand Total"}
          </span>
          <span className="text-base sm:text-lg font-bold text-[#145C43]">
            ₹{(paymentMethod === "ONLINE" ? totals.amountToPay : totals.grandTotal).toFixed(2)}
          </span>
        </div>

        {totals.pricingError && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {totals.pricingError}
          </p>
        )}
        {belowMinOrder && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Minimum order value is ₹{totals.minOrderValue}. Add ₹
            {(totals.minOrderValue - totals.productTotal).toFixed(2)} more to checkout.
          </p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isEmpty || isPlacingOrder || isBlocked}
          className="mt-5 w-full bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] text-[#16241D] rounded-xl py-3.5 text-sm font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9CC3B]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPlacingOrder && <Loader2 size={16} className="animate-spin" />}
          {isPlacingOrder
            ? paymentMethod === "ONLINE"
              ? "Processing payment…"
              : "Placing order…"
            : paymentMethod === "ONLINE" && totals.amountToPay > 0
              ? `Pay ₹${totals.amountToPay.toFixed(2)}`
              : "Place Order"}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#6E7C74]">
          <Lock size={11} />
          <span>Secure encrypted checkout</span>
        </div>
      </div>

      {/* Coupon — local-only placeholder until real coupon validation exists server-side */}
      <div className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-[#145C43]" />
          <span className="text-sm font-semibold text-[#16241D]">Offers &amp; Coupons</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={couponApplied}
            className="flex-1 border border-[#DCE3DC] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#16241D] placeholder-[#9BAAA1] focus:outline-none focus:ring-2 focus:ring-[#145C43]/30 focus:border-[#145C43] disabled:bg-[#F5F7F3] disabled:text-[#6E7C74] transition-colors"
          />
          <button
            onClick={applyCoupon}
            disabled={couponApplied || !couponCode.trim()}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#145C43] border border-[#145C43] rounded-lg hover:bg-[#145C43] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {couponApplied ? "Applied" : "Apply"}
          </button>
        </div>
        {couponApplied && (
          <p className="text-xs text-green-600 mt-2 font-medium">🎉 ₹50 off applied!</p>
        )}
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { isLoadingSummary, summaryError } = useLoadCheckoutSummary();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8F5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-[#E3E7E1] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/home")}
            className="text-xl font-bold text-[#16241D] tracking-tight italic hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#145C43]/30 rounded"
            style={{ fontFamily: "Georgia, serif" }}
          >
            QuickKart
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#145C43] uppercase tracking-widest">
            <Lock size={12} />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoadingSummary ? (
          <div className="flex items-center justify-center py-24 text-[#6E7C74] gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading your checkout…</span>
          </div>
        ) : summaryError ? (
          <div className="text-center py-24">
            <p className="text-sm text-[#6E7C74]">{summaryError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-[#145C43] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Left — min-w-0 is required here: without it, this grid item's
                default min-width:auto lets un-wrapped content (the long
                address string) force the track wider than the viewport,
                pushing the Order Summary column off-screen to the right. */}
            <div className="space-y-5 min-w-0">
              <section className="bg-white rounded-2xl border border-[#E3E7E1] p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <StepBadge n={1} />
                  <h2 className="text-base sm:text-lg font-semibold text-[#16241D]">Select Delivery Address</h2>
                </div>
                <AddressDropdown />
              </section>
              <DeliveryInstructions />
              <PaymentMethod />
            </div>

            {/* Right */}
            <OrderSummary />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#9BAAA1]">
        © 2024 QuickKart. Digital Craftsmanship.
      </footer>
    </div>
  );
}