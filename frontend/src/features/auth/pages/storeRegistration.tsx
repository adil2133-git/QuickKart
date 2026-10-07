import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Store, User, FileText, Upload, CheckCircle2, Eye, EyeOff, Info, ArrowRight, Loader2, Navigation, Search } from "lucide-react";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import OtpVerificationModal from "../components/otpVerificationModal";
import PasswordStrengthBar from "../components/shared/passwordStrengthBar";
import { storeRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

import storeRegBg from "../../../assets/store_reg_bg.png";

type UploadState = {
  file: File | null;
  name: string | null;
  size: string | null;
  uploaded: boolean;
};

type Coords = { lat: number; lng: number };

type ConfirmedLocation = {
  lat: number;
  lng: number;
  resolvedAddress: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ─── Upload Card ─────────────────────────────────────────────────────────────
function UploadCard({
  icon,
  label,
  sub,
  upload,
  onUpload,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  upload: UploadState;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { uploaded, name, size } = upload;

  return (
    <div
      onClick={() => ref.current?.click()}
      className={`relative flex items-center justify-between p-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
        uploaded 
          ? "border-[#063826] bg-[#E2EDE7]/70 text-[#063826]" 
          : "border-[#E5E7EB] bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#6E7C74]"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (f.size > 5 * 1024 * 1024) {
              showErrorToast("File Too Large", { subtitle: "Document must be under 5MB" });
              return;
            }
            onUpload(f);
          }
        }}
      />
      
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-2xl ${uploaded ? "bg-[#063826] text-white" : "bg-white text-[#6E7C74] border border-[#E5E7EB]"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#1A3326] truncate">{label}</p>
          {uploaded ? (
            <p className="text-[11px] text-[#2C4E3F] truncate font-medium mt-0.5">
              {name} • <span className="text-[#6E7C74]">{size}</span>
            </p>
          ) : (
            <p className="text-[10.5px] text-[#7A8C82] mt-0.5">{sub}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 pl-2">
        {uploaded ? (
          <span className="text-xs font-bold text-[#063826] flex items-center gap-1">
            <CheckCircle2 size={16} /> Uploaded
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#063826] hover:underline flex items-center gap-1">
            <Upload size={14} /> Browse
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Location Step (Leaflet Map Picker) ───────────────────────────────────────
function LocationStep({
  confirmed,
  onConfirm,
  initialAddressHint,
}: {
  confirmed: ConfirmedLocation | null;
  onConfirm: (loc: ConfirmedLocation | null) => void;
  initialAddressHint: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ map: L.Map; markerIcon: L.DivIcon } | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchText, setSearchText] = useState("");
  const [searching, setGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [pending, setPending] = useState<Coords | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [searchError, setSearchError] = useState("");

  const hintAppliedRef = useRef(false);

  const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
  const DEFAULT_ZOOM = 5;

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    setResolvedAddress(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      setResolvedAddress(data?.display_name || null);
    } catch {
      setResolvedAddress(null);
    } finally {
      setResolving(false);
    }
  }, []);

  const setPendingCoords = useCallback((lat: number, lng: number) => {
    const rounded = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    setPending(rounded);
    onConfirm(null);
    void reverseGeocode(rounded.lat, rounded.lng);
  }, [onConfirm, reverseGeocode]);

  const placeMarker = useCallback((map: L.Map, icon: L.DivIcon, lat: number, lng: number) => {
    if (markerRef.current) markerRef.current.remove();
    const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
    marker.on("dragend", (e) => {
      const pos = (e.target as L.Marker).getLatLng();
      setPendingCoords(pos.lat, pos.lng);
    });
    markerRef.current = marker;
  }, [setPendingCoords]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:36px;height:36px;
          background:#063826;
          border:3px solid #FFFFFF;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 4px 14px rgba(6,56,38,0.4);
        "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, markerIcon, lat, lng);
      setPendingCoords(lat, lng);
    });

    mapInstanceRef.current = { map, markerIcon };
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !confirmed || !mapInstanceRef.current) return;
    const { map, markerIcon } = mapInstanceRef.current;
    map.setView([confirmed.lat, confirmed.lng], 17);
    placeMarker(map, markerIcon, confirmed.lat, confirmed.lng);
    setPending({ lat: confirmed.lat, lng: confirmed.lng });
    setResolvedAddress(confirmed.resolvedAddress);
  }, [mapReady]);

  useEffect(() => {
    if (!hintAppliedRef.current && initialAddressHint && !searchText) {
      hintAppliedRef.current = true;
      setSearchText(initialAddressHint);
    }
  }, [initialAddressHint, searchText]);

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query || !mapInstanceRef.current) return;
    setSearchError("");
    setGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const { map, markerIcon } = mapInstanceRef.current;
        map.setView([lat, lng], 17);
        placeMarker(map, markerIcon, lat, lng);
        setPendingCoords(lat, lng);
      } else {
        setSearchError("Couldn't find that address. Try a nearby landmark, or pin it manually on the map.");
      }
    } catch {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setSearchError("");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { map, markerIcon } = mapInstanceRef.current!;
        map.setView([lat, lng], 17);
        placeMarker(map, markerIcon, lat, lng);
        setPendingCoords(lat, lng);
        setGpsLoading(false);
      },
      () => {
        setSearchError("Couldn't get your location. Check location permissions, or search/pin manually.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    if (!pending) return;
    onConfirm({ lat: pending.lat, lng: pending.lng, resolvedAddress });
  };

  const isConfirmed = !!confirmed;

  return (
    <div className="space-y-3">
      
      {/* Search Input Row */}
      <div className="relative flex items-center">
        <span className="absolute left-4 text-[#94A3B8]">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search location..."
          className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#063826] focus:bg-white outline-none transition-all shadow-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchText.trim()}
          className="absolute right-1.5 py-1.5 px-3.5 rounded-full text-xs font-semibold bg-[#063826] text-white hover:bg-[#042418] disabled:opacity-50 transition-all cursor-pointer"
        >
          {searching ? "Finding..." : "Search"}
        </button>
      </div>

      {/* GPS Trigger Button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#063826] hover:underline cursor-pointer ml-1"
      >
        <Navigation size={14} className={gpsLoading ? "animate-spin" : ""} />
        <span>Use Current Location</span>
      </button>

      {searchError && (
        <p className="text-xs text-red-600 pl-1">{searchError}</p>
      )}

      {/* Map Box */}
      <div
        className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
          isConfirmed ? "border-[#063826]" : pending ? "border-[#063826]/60" : "border-[#E5E7EB]"
        }`}
      >
        <div ref={mapRef} style={{ height: "240px", width: "100%", zIndex: 1 }} />
      </div>

      {/* Pin Confirmation Box */}
      <div
        className={`rounded-2xl p-3.5 text-xs space-y-2 ${
          isConfirmed ? "bg-[#E2EDE7]/70 border border-[#063826]/30 text-[#063826]" : "bg-[#FAF9F6] border border-[#E5E7EB] text-[#6E7C74]"
        }`}
      >
        {!pending && (
          <p className="text-center text-[#94A3B8]">
            No pin yet — search above, use current location, or click directly on the map.
          </p>
        )}

        {pending && (
          <>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfirmed ? "bg-[#063826]" : "bg-[#063826]"}`} />
              <p className="font-mono font-semibold text-[#16241D]">
                {pending.lat}, {pending.lng}
              </p>
              {isConfirmed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#063826] text-white ml-auto">
                  ✓ Confirmed
                </span>
              )}
            </div>

            <p className="leading-relaxed">
              {resolving ? (
                <span>Looking up address for pin...</span>
              ) : resolvedAddress ? (
                <>Nearest match: <span className="font-medium text-[#063826]">{resolvedAddress}</span></>
              ) : (
                "Coordinates pinned cleanly."
              )}
            </p>

            {!isConfirmed && (
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-2 rounded-full text-xs font-semibold bg-[#063826] text-white hover:bg-[#042418] transition-all cursor-pointer mt-1"
              >
                Confirm Location Pin
              </button>
            )}

            {isConfirmed && (
              <button
                type="button"
                onClick={() => onConfirm(null)}
                className="text-[11px] font-semibold underline text-[#063826] cursor-pointer"
              >
                Change Location Pin
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main StoreRegistration Component ───────────────────────────────────────
export default function StoreRegistration() {
  const navigate = useNavigate();

  const [location, setLocation] = useState<ConfirmedLocation | null>(null);

  const [tradeLicense, setTradeLicense] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });
  const [ownerID, setOwnerID] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });
  const [storeFront, setStoreFront] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const inputPillClass =
    "w-full px-5 py-3 text-xs sm:text-sm rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#063826] focus:bg-white outline-none transition-all shadow-sm";

  const formik = useFormik({
    initialValues: {
      storeName: "",
      ownerName: "",
      address: "",
      pincode: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: storeRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");

      if (!location) {
        const locErr = "Please confirm your store location on the map";
        setError(locErr);
        showErrorToast("Location Required", { subtitle: locErr });
        setSubmitting(false);
        return;
      }

      if (!tradeLicense.file || !ownerID.file || !storeFront.file) {
        const docErr = "Trade license, owner ID, and store front photo are all required";
        setError(docErr);
        showErrorToast("Documents Required", { subtitle: docErr });
        setSubmitting(false);
        return;
      }

      try {
        const lowerEmail = values.email.trim().toLowerCase();
        const formData = new FormData();
        formData.append("storeName", values.storeName.trim());
        formData.append("ownerName", values.ownerName.trim());
        formData.append("address", values.address.trim());
        formData.append("pincode", values.pincode.trim());
        formData.append("email", lowerEmail);
        formData.append("phone", values.phone.trim());
        formData.append("password", values.password);
        formData.append("confirmPassword", values.confirmPassword);
        formData.append("lat", String(location.lat));
        formData.append("lng", String(location.lng));
        formData.append("tradeLicense", tradeLicense.file);
        formData.append("ownerId", ownerID.file);
        formData.append("storeFront", storeFront.file);

        await api.post("/auth/register/store", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtpModal(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleStoreVerified = () => {
    setShowOtpModal(false);
    showSuccessToast("Application Submitted", { subtitle: "We will review your supermarket application soon." });
    navigate("/store/pending");
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full overflow-hidden font-sans bg-[#F9F8F6] select-none">
      {showOtpModal && (
        <OtpVerificationModal
          email={targetEmail}
          onClose={() => setShowOtpModal(false)}
          onVerified={handleStoreVerified}
        />
      )}

      {/* Left Panel: Split-Screen Hero Image & Branding */}
      <aside className="hidden md:flex flex-col justify-between w-[360px] lg:w-[440px] xl:w-[480px] h-full p-8 lg:p-12 relative overflow-hidden bg-[#063826] text-white flex-shrink-0">
        
        {/* Left Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={storeRegBg} 
            alt="QuickKart Store Partner" 
            className="w-full h-full object-cover object-center"
          />
          {/* Vignette Gradient for Crisp Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        </div>

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Bottom Hero Typography & Statement */}
        <div className="relative z-10 mt-auto">
          <span className="font-bold text-2xl tracking-tight text-white mb-2 block" style={{ fontFamily: "Fraunces, serif" }}>
            QuickKart
          </span>
          <h1 
            className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Partner with QuickKart
          </h1>
          <p className="text-xs lg:text-sm text-white/90 font-normal leading-relaxed max-w-sm">
            Join our network of premium local merchants. Elevate your business with our cutting-edge logistics and reach thousands of customers in your area instantly.
          </p>
          <div className="mt-8 text-[11px] text-white/60 font-medium">
            © 2024 QuickKart Logistics.
          </div>
        </div>
      </aside>

      {/* Right Panel: Form Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-8 lg:p-12">
        <div className="max-w-[560px] mx-auto">

          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-4 border-b border-black/5">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-left cursor-pointer">
              <span className="text-xl font-bold tracking-tight text-[#063826]" style={{ fontFamily: "Fraunces, serif" }}>
                QuickKart
              </span>
            </button>
            <button onClick={() => navigate("/login")} className="text-xs font-semibold text-[#063826] hover:underline cursor-pointer">
              Sign In
            </button>
          </div>

          {/* Page Heading */}
          <div className="mb-4">
            <h2 
              className="text-2xl sm:text-4xl font-bold text-[#063826]"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Register your Store
            </h2>
            <p className="text-xs sm:text-sm text-[#5D6F65] mt-1.5">
              Partner with us to reach thousands of customers in your locality.
            </p>
          </div>

          {/* Admin Review Notice Pill */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 mb-6 rounded-2xl sm:rounded-3xl bg-[#E2EDE7]/70 border border-[#C5DCD0] text-xs text-[#063826]">
            <Info size={18} className="shrink-0 text-[#063826]" />
            <p className="leading-tight italic">
              Your store will be reviewed and approved by our admin team within 24–48 hours after submission. Ensure all documents are clear and valid.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
            
            {/* Section 1: Store Basics */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider uppercase">
                  1. STORE BASICS
                </span>
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  placeholder="e.g., Fresh Valley Supermarket"
                  value={formik.values.storeName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.storeName && formik.errors.storeName && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.storeName}</p>
                )}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  placeholder="Full Legal Name"
                  value={formik.values.ownerName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.ownerName && formik.errors.ownerName && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.ownerName}</p>
                )}
              </div>
            </div>

            {/* Section 2: Contact & Credentials */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider uppercase">
                  2. CONTACT & CREDENTIALS
                </span>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="store@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number, e.g. 9876543210"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.phone}</p>
                )}
              </div>

              {/* Password & Confirm Password Side-by-Side Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`${inputPillClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={formik.values.password} />
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`${inputPillClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Physical Presence */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider uppercase">
                  3. PHYSICAL PRESENCE
                </span>
              </div>

              {/* Address */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Street Address, Area"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.address && formik.errors.address && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.address}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  placeholder="6-digit ZIP/PIN code"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.pincode && formik.errors.pincode && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.pincode}</p>
                )}
              </div>

              {/* Interactive Store Location Map */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Store Location <span className="text-red-500">*</span>
                </label>
                <LocationStep
                  confirmed={location}
                  onConfirm={setLocation}
                  initialAddressHint={
                    formik.values.address.trim() && formik.values.pincode.trim()
                      ? `${formik.values.address.trim()}, ${formik.values.pincode.trim()}, India`
                      : ""
                  }
                />
              </div>
            </div>

            {/* Section 4: Document Verification */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider uppercase">
                  4. DOCUMENT VERIFICATION
                </span>
              </div>

              <div className="space-y-3">
                <UploadCard
                  icon={<FileText size={20} />}
                  label="Trade License"
                  sub="PDF, JPG or PNG (Max 5MB)"
                  upload={tradeLicense}
                  onUpload={(f) => setTradeLicense({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />

                <UploadCard
                  icon={<User size={20} />}
                  label="Owner ID Proof"
                  sub="Government Issued ID (Aadhaar / PAN)"
                  upload={ownerID}
                  onUpload={(f) => setOwnerID({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />

                <UploadCard
                  icon={<Store size={20} />}
                  label="Store Front Photo"
                  sub="Clear photo of the shop entrance"
                  upload={storeFront}
                  onUpload={(f) => setStoreFront({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-2">
              <p className="text-[11px] text-center text-[#5D6F65] mb-3">
                By clicking submit, you agree to QuickKart's{" "}
                <a href="#" className="font-semibold underline text-[#063826]">
                  Merchant Terms &amp; Conditions
                </a>.
              </p>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#063826] hover:bg-[#042418] active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#063826]/20 cursor-pointer disabled:opacity-70"
              >
                {formik.isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Store Application <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-center text-[#5D6F65]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-bold text-[#063826] hover:underline"
                >
                  Partner Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}