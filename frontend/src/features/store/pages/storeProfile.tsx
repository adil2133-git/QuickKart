import { useEffect, useRef } from "react";
import {
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Clock,
  ToggleLeft,
  Star,
  Wallet,
  PackageCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useStoreProfileStore } from "../state/storeProfileState";

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function approvalBadge(status: string) {
  if (status === "APPROVED") return { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", Icon: CheckCircle2 };
  if (status === "REJECTED") return { label: "Rejected", className: "bg-red-50 text-red-700 ring-red-600/15", Icon: XCircle };
  return { label: "Pending Review", className: "bg-amber-50 text-amber-700 ring-amber-600/15", Icon: AlertCircle };
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Section shell ───────────────────────────────────────────────────────────
function Card({ title, subtitle, icon: Icon, children, right }: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#E7EFEA] text-[#1F4D3D]">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div>
            <h3 className="text-base font-semibold text-[#16241D]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-[#6E7C74]">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─── Read-only field row (no backend endpoint to edit these yet) ───────────
function LockedField({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">
        {label}
        <Lock className="h-3 w-3 text-[#9BAAA1]" />
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-[#E3E7E1] bg-[#F5F7F3] px-3.5 py-2.5 text-sm text-[#16241D]">
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-[#6E7C74]" />}
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

// ─── Toggle switch ───────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
        checked ? "bg-[#1F4D3D]" : "bg-[#E3E7E1]"
      }`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

export default function StoreProfilePage() {
  const {
    store,
    loading,
    error,
    savingClose,
    uploadingLogo,
    uploadingCover,
    actionError,
    actionSuccess,
    fetchProfile,
    toggleManualClose,
    uploadBranding,
    setActionError,
  } = useStoreProfileStore();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hours = (store?.operatingHours || [])
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  return (
    <div className="min-h-full bg-[#F7F8F5] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {loading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-[#6E7C74]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1F4D3D]" />
          <p className="text-sm">Loading your profile…</p>
        </div>
      ) : error || !store ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-7 w-7 text-rose-500" />
          <p className="text-sm text-[#6E7C74]">{error || "Something went wrong."}</p>
          <button
            onClick={fetchProfile}
            className="rounded-full border border-[#E3E7E1] px-4 py-2 text-sm font-medium text-[#1F4D3D] hover:bg-white cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">

          {/* ── Inline notifications ── */}
          {actionError && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-600/15">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {actionError}
              </span>
              <button onClick={() => setActionError(null)} className="text-rose-700/60 hover:text-rose-700">
                ×
              </button>
            </div>
          )}
          {actionSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-600/15">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {actionSuccess}
            </div>
          )}

          {/* ── Hero: cover + logo + identity ── */}
          <div className="overflow-hidden rounded-2xl border border-[#E3E7E1] bg-white">
            <div className="relative h-32 sm:h-44 w-full bg-gradient-to-br from-[#E7EFEA] to-[#1F4D3D]/30">
              {store.coverImageUrl && (
                <img src={store.coverImageUrl} alt="Store cover" className="h-full w-full object-cover" />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadBranding("coverImage", e.target.files[0])}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex items-center gap-1.5 rounded-full bg-[#16241D]/75 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-[#16241D] disabled:opacity-60 cursor-pointer"
              >
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                {uploadingCover ? "Uploading…" : "Change Cover"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="relative -mt-10 sm:-mt-12 flex-shrink-0">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#E7EFEA] text-xl sm:text-2xl font-bold text-[#1F4D3D] shadow-sm">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                  ) : (
                    initialsFrom(store.storeName)
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadBranding("logo", e.target.files[0])}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute -right-1 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#1F4D3D] text-white shadow hover:bg-[#163D30] cursor-pointer disabled:opacity-60"
                  title="Change logo"
                >
                  {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="min-w-0 flex-1 pt-1 sm:pt-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-[#16241D]">{store.storeName}</h1>
                  {(() => {
                    const b = approvalBadge(store.approvalStatus);
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${b.className}`}>
                        <b.Icon className="h-3 w-3" /> {b.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#6E7C74]">Owner: {store.ownerName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-xs sm:text-sm text-[#6E7C74]">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#1F4D3D] flex-shrink-0" /> <span className="truncate">{store.email}</span></span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#1F4D3D] flex-shrink-0" /> {store.phone}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#1F4D3D] flex-shrink-0" /> <span className="truncate">{store.address}</span></span>
                </div>
              </div>

              <div className="pt-2 sm:pt-3 text-left sm:text-right text-xs text-[#6E7C74] self-start sm:self-end">
                <span className="flex items-center justify-start sm:justify-end gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#1F4D3D] flex-shrink-0" /> Joined {new Date(store.registeredOn).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

              {/* ── Main grid ── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Left / main column */}
                <div className="space-y-6 lg:col-span-2">

                  <Card
                    title="Store Details"
                    subtitle="These are set during onboarding — contact support to change legal/registration details."
                    icon={ShieldCheck}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <LockedField label="Full Name" value={store.name} />
                      <LockedField label="Store Name" value={store.storeName} />
                      <LockedField label="Email Address" value={store.email} icon={Mail} />
                      <LockedField label="Phone Number" value={store.phone} icon={Phone} />
                      <div className="sm:col-span-2">
                        <LockedField label="Store Address" value={`${store.address}${store.pincode ? `, ${store.pincode}` : ""}`} icon={MapPin} />
                      </div>
                    </div>
                  </Card>

                  <Card title="Operating Hours" subtitle="Set from onboarding. Hours editing is coming to this page soon." icon={Clock}>
                    {hours.length === 0 ? (
                      <p className="text-sm text-[#6E7C74]">No hours set yet.</p>
                    ) : (
                      <div className="divide-y divide-[#E3E7E1]">
                        {hours.map((h) => (
                          <div key={h.day} className="flex items-center justify-between py-2.5 text-sm">
                            <span className="font-medium text-[#16241D]">{h.day}</span>
                            <span className={h.isClosed ? "text-[#6E7C74]" : "text-[#16241D]"}>
                              {h.isClosed || !h.openTime || !h.closeTime ? "Closed" : `${h.openTime} – ${h.closeTime}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card title="Verification Documents" subtitle="Submitted during store onboarding." icon={FileText}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {store.documents.map((doc) => (
                        <div
                          key={doc.key}
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                            doc.submitted
                              ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                              : "border-[#E3E7E1] bg-[#F5F7F3] text-[#6E7C74]"
                          }`}
                        >
                          {doc.submitted ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
                          <span className="font-medium">{doc.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right / sidebar column */}
                <div className="space-y-6">
                  <Card title="Store Availability" icon={ToggleLeft}>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F5F7F3] px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-[#16241D]">Manually closed</p>
                        <p className="text-xs text-[#6E7C74]">Overrides your operating hours when on.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {savingClose && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6E7C74]" />}
                        <ToggleSwitch checked={store.isManuallyClosed} onChange={toggleManualClose} disabled={savingClose} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6E7C74]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          store.isManuallyClosed ? "bg-slate-300" : store.storeStatus === "BUSY" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      Currently shown to customers as{" "}
                      <strong className="text-[#16241D]">
                        {store.isManuallyClosed ? "CLOSED" : store.storeStatus === "BUSY" ? "BUSY" : "OPEN (per hours)"}
                      </strong>
                    </div>
                  </Card>

                  <Card title="Store Stats" icon={Star}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F5F7F3] px-3.5 py-3">
                        <p className="flex items-center gap-1 text-[11px] font-medium text-[#6E7C74]">
                          <Star className="h-3 w-3 text-[#1F4D3D]" /> Rating
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#16241D]">—</p>
                      </div>
                      <div className="rounded-xl bg-[#F5F7F3] px-3.5 py-3">
                        <p className="flex items-center gap-1 text-[11px] font-medium text-[#6E7C74]">
                          <PackageCheck className="h-3 w-3 text-[#1F4D3D]" /> Orders
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#16241D]">—</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[#6E7C74]">
                      Rating and order totals aren't returned by <code>/store/me</code> yet — add{" "}
                      <code>averageRating</code> and <code>totalOrders</code> to that controller's response to light these up.
                    </p>
                  </Card>

                  <Card title="Earnings" icon={Wallet}>
                    <p className="text-xs text-[#6E7C74]">
                      <code>availableBalance</code> / <code>pendingBalance</code> exist on the schema but aren't
                      returned by <code>getMyStoreProfile</code> yet — add them there to show real numbers here.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}