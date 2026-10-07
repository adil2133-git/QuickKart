import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Hash,
  Calendar,
  AtSign,
  Loader2,
  Store as StoreIcon,
  MapPinned,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import api from "../../../api/axios";
import LocationPreviewMap from "../../admin/components/locationPreview";
import { useLogout } from "../hooks/useLogout";

import heroBg from "../../../assets/hero-bg1.webp";

type Role = "driver" | "store";

interface DocumentItem {
  label: string;
  key: string;
  submitted: boolean;
}

interface BaseProfile {
  name: string;
  phone: string;
  email: string;
  registeredOn: string;
  role: string;
  approvalStatus: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";
  rejectionReason?: string | null;
  documents: DocumentItem[];
}

interface DriverProfile extends BaseProfile {
  driverId: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
}

interface StoreProfileInfo extends BaseProfile {
  storeId: string;
  storeName: string;
  ownerName: string;
  address: string;
  pincode: string | null;
  storeStatus: "OPEN" | "CLOSED" | "BUSY";
  coordinates: { lat: number; lng: number } | null;
}

type ProfileInfo = DriverProfile | StoreProfileInfo;

interface PendingApprovalProps {
  role: Role;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function statusLabel(status: ProfileInfo["approvalStatus"]) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Review";
    case "ACTIVE":
      return "Approved 🎉";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status;
  }
}

const roleConfig = {
  driver: {
    endpoint: "driver",
    heroIcon: <Clock size={28} className="text-[#063826]" />,
    sidebarTagline: "Join our network of elite delivery partners.",
    sidebarBody: "Deliver groceries fast and earn on your schedule with QuickKart Logistics.",
    cardLabel: "Applicant Name",
    idLabel: "Driver ID",
    nextStepsDescription: "Our admin team verifies your background check, license, and vehicle registration.",
    getIdentity: (p: ProfileInfo) => (p as DriverProfile).driverId,
    extraFields: (p: ProfileInfo) => {
      const d = p as DriverProfile;
      return [
        { icon: <Hash size={14} />, label: "Vehicle Type", value: d.vehicleType },
        { icon: <Hash size={14} />, label: "Vehicle Number", value: d.vehicleNumber },
        { icon: <Hash size={14} />, label: "License Number", value: d.licenseNumber },
      ];
    },
  },
  store: {
    endpoint: "store",
    heroIcon: <StoreIcon size={28} className="text-[#063826]" />,
    sidebarTagline: "Grow your business with hyperlocal delivery.",
    sidebarBody: "Join our network of premium local stores and reach thousands of customers instantly.",
    cardLabel: "Account Holder",
    idLabel: "Store ID",
    nextStepsDescription: "Our team verifies your trade license, owner ID, and store location details.",
    getIdentity: (p: ProfileInfo) => (p as StoreProfileInfo).storeId,
    extraFields: (p: ProfileInfo) => {
      const s = p as StoreProfileInfo;
      return [
        { icon: <StoreIcon size={14} />, label: "Store Name", value: s.storeName },
        { icon: <Hash size={14} />, label: "Owner Name", value: s.ownerName },
        { icon: <MapPinned size={14} />, label: "Address", value: s.address },
        { icon: <MapPin size={14} />, label: "Pincode", value: s.pincode || "—" },
      ];
    },
  },
} as const;

function buildSteps(description: string) {
  return [
    { number: 1, title: "Admin Review", description, done: true },
    {
      number: 2,
      title: "Notification",
      description: "Receive confirmation once your application is reviewed and verified.",
      done: false,
    },
    {
      number: 3,
      title: "Login & Start",
      description: "Access your merchant dashboard and start fulfilling orders.",
      done: false,
    },
  ];
}

export default function PendingApproval({ role }: PendingApprovalProps) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const navigate = useNavigate();
  const config = roleConfig[role];
  const { logout: handleLogout, isLoggingOut } = useLogout();

  const fetchProfile = async () => {
    try {
      setError(null);
      const { data } = await api.get<{
        success: boolean;
        message?: string;
        driver?: ProfileInfo;
        store?: ProfileInfo;
      }>(`/${config.endpoint}/me`);

      if (!data.success) {
        throw new Error(data.message || "Failed to load your application status.");
      }

      const fetched = data[config.endpoint as "driver" | "store"];
      if (!fetched) {
        throw new Error("Profile data not found in response.");
      }

      setProfile(fetched);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong fetching application status."
      );
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    })();

    const interval = setInterval(() => {
      fetchProfile();
    }, 60_000);

    return () => clearInterval(interval);
  }, [role]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await fetchProfile();
    setChecking(false);
    setLastChecked(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#063826]" />
          <p className="text-xs font-semibold text-[#5D6F65]">
            Checking your application status...
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !profile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6 p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm">
          <AlertCircle size={36} className="text-red-500" />
          <p className="text-xs font-medium text-[#1E293B]">
            {error || "We couldn't load your application status."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              fetchProfile().finally(() => setLoading(false));
            }}
            className="text-xs font-semibold py-2.5 px-6 rounded-full bg-[#063826] text-white hover:bg-[#042418] transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isApproved = profile.approvalStatus === "ACTIVE";
  const isRejected = profile.approvalStatus === "REJECTED";
  const steps = buildSteps(config.nextStepsDescription);
  const identity = config.getIdentity(profile);
  const extraFields = config.extraFields(profile);
  const storeCoordinates =
    role === "store" ? (profile as StoreProfileInfo).coordinates : null;

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full overflow-hidden font-sans bg-[#F9F8F6] select-none">
      
      {/* ── Left Split-Screen Hero Panel ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col justify-between w-[360px] lg:w-[440px] xl:w-[480px] h-full p-8 lg:p-12 relative overflow-hidden bg-[#063826] text-white flex-shrink-0">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="QuickKart Logistics" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        </div>

        <div className="relative z-10" />

        <div className="relative z-10 mt-auto">
          <span className="font-bold text-2xl tracking-tight text-white mb-2 block" style={{ fontFamily: "Fraunces, serif" }}>
            QuickKart
          </span>
          <h1 
            className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {config.sidebarTagline}
          </h1>
          <p className="text-xs lg:text-sm text-white/90 font-normal leading-relaxed max-w-sm">
            {config.sidebarBody}
          </p>
          <div className="mt-8 text-[11px] text-white/60 font-medium">
            © 2024 QuickKart Logistics.
          </div>
        </div>
      </aside>

      {/* ── Right Main Area ─────────────────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-8 lg:p-12">
        <div className="max-w-[560px] mx-auto space-y-6">

          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-black/5">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-left cursor-pointer">
              <span className="text-xl font-bold tracking-tight text-[#063826]" style={{ fontFamily: "Fraunces, serif" }}>
                QuickKart
              </span>
            </button>
            <button onClick={handleLogout} className="text-xs font-semibold text-red-600 hover:underline cursor-pointer flex items-center gap-1">
              <LogOut size={12} /> Logout
            </button>
          </div>

          {/* APPROVED CELEBRATION CARD */}
          {isApproved && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#E2EDE7] via-emerald-50 to-emerald-100 border-2 border-[#063826] text-center shadow-lg animate-in fade-in duration-500">
              <div className="w-14 h-14 rounded-full bg-[#063826] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Sparkles size={26} />
              </div>
              <h2 
                className="text-2xl sm:text-3xl font-bold text-[#063826]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Application Approved! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-[#063826]/90 mt-2 leading-relaxed max-w-md mx-auto">
                Congratulations! Your QuickKart partner application has been reviewed and approved by our admin team.
              </p>
              <div className="mt-5">
                <button
                  onClick={() => navigate("/login", { state: { message: "Account Approved! Please login to continue." } })}
                  className="py-3 px-6 rounded-full bg-[#063826] hover:bg-[#042418] text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  Log In to Access Dashboard <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* REJECTED CARD */}
          {isRejected && (
            <div className="p-6 rounded-3xl bg-red-50 border-2 border-red-200 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={26} />
              </div>
              <h2 
                className="text-2xl font-bold text-red-700"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Application Not Approved
              </h2>

              {profile.rejectionReason ? (
                <div className="p-4 my-3 rounded-2xl bg-white border border-red-200 text-left text-xs shadow-xs">
                  <p className="font-bold text-red-800 mb-1 flex items-center gap-1.5">
                    <Info size={14} className="text-red-600" /> Reason from Admin Review Team:
                  </p>
                  <p className="text-red-700 font-medium italic pl-5">"{profile.rejectionReason}"</p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-red-600 mt-2 leading-relaxed max-w-md mx-auto">
                  Regrettably, your application could not be approved at this time. Our team requires updated or clearer document details.
                </p>
              )}

              <p className="text-xs text-red-700 mt-2">
                Please re-register below with clear documents and updated details to submit your fresh application.
              </p>

              <div className="mt-4 pt-4 border-t border-red-200/60 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate(role === "driver" ? "/register/delivery" : "/register/store")}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Re-Apply &amp; Update Application <ArrowRight size={14} />
                </button>
                <a
                  href="mailto:support@quickkart.com"
                  className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
                >
                  <Mail size={14} /> Contact Support
                </a>
                <span className="hidden sm:inline text-red-300">•</span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}

          {/* PENDING HERO HEADER (Only shown while pending) */}
          {!isApproved && !isRejected && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-[#E2EDE7] border-2 border-[#063826] flex items-center justify-center mx-auto mb-3 text-[#063826]">
                {config.heroIcon}
              </div>
              <h2 
                className="text-3xl sm:text-4xl font-bold text-[#063826]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Application Under Review
              </h2>
              <p className="text-xs sm:text-sm text-[#5D6F65] mt-1.5 max-w-md mx-auto">
                We've received your details! Our team is reviewing your documents and will notify you within 24–48 hours.
              </p>
              {profile.name && (
                <span className="inline-block mt-3 px-4 py-1 rounded-full text-xs font-semibold bg-[#E2EDE7]/80 text-[#063826]">
                  Applicant: {profile.name}
                </span>
              )}
            </div>
          )}

          {/* APPLICANT PROFILE DETAILS CARD */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6E7C74] uppercase tracking-wider">
                {config.cardLabel}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E2EDE7] text-[#063826]">
                {profile.role}
              </span>
            </div>

            <p className="text-xl font-bold text-[#1E293B]" style={{ fontFamily: "Fraunces, serif" }}>
              {profile.name}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[#E5E7EB]">
              {[
                { icon: <Phone size={14} />, label: "Phone", value: profile.phone },
                { icon: <AtSign size={14} />, label: "Email", value: profile.email },
                { icon: <Hash size={14} />, label: config.idLabel, value: identity },
                { icon: <Calendar size={14} />, label: "Registered On", value: formatDate(profile.registeredOn) },
                ...extraFields,
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[#063826]">{icon}</span>
                  <div>
                    <p className="text-[11px] text-[#6E7C74] font-medium">{label}</p>
                    <p className="text-xs font-semibold text-[#1E293B] truncate max-w-[200px]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-xs text-[#6E7C74] font-medium">Approval Status</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-[#063826] text-[#063826] bg-[#E2EDE7]/70 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isApproved ? "bg-emerald-600" : isRejected ? "bg-red-600" : "bg-amber-500 animate-pulse"}`} />
                {statusLabel(profile.approvalStatus)}
              </span>
            </div>
          </div>

          {/* SUBMITTED DOCUMENTS CARD */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm">
            <p className="text-xs font-semibold text-[#6E7C74] uppercase tracking-wider mb-3">
              Submitted Documents
            </p>
            <div className="space-y-2.5">
              {profile.documents.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1E293B]">
                    <CheckCircle2 size={16} className="text-[#063826]" />
                    {doc.label}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E2EDE7] text-[#063826]">
                    Verified File
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MAP LOCATION PREVIEW (Store Applicants Only) */}
          {role === "store" && storeCoordinates && (
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-3">
              <p className="text-xs font-semibold text-[#6E7C74] uppercase tracking-wider">
                Store Location Pin
              </p>
              <div className="rounded-2xl overflow-hidden border border-[#E5E7EB]">
                <LocationPreviewMap lat={storeCoordinates.lat} lng={storeCoordinates.lng} height={200} />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-mono text-[#6E7C74]">{storeCoordinates.lat.toFixed(6)}, {storeCoordinates.lng.toFixed(6)}</span>
                <a
                  href={`https://www.google.com/maps?q=${storeCoordinates.lat},${storeCoordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#063826] hover:underline"
                >
                  Open in Maps →
                </a>
              </div>
            </div>
          )}

          {/* WHAT HAPPENS NEXT */}
          {!isApproved && !isRejected && (
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <p className="text-xs font-semibold text-[#6E7C74] uppercase tracking-wider">
                What Happens Next?
              </p>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#063826] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.number}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">{step.title}</p>
                      <p className="text-[11px] text-[#6E7C74] mt-0.5 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3.5 rounded-full bg-[#063826] hover:bg-[#042418] text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
              {checking ? "Refreshing Status..." : "Check Application Status"}
            </button>

            {lastChecked && (
              <p className="text-center text-[10.5px] text-[#6E7C74]">
                Last checked at {lastChecked}
              </p>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-3 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} />
              {isLoggingOut ? "Logging out..." : "Logout Account"}
            </button>
          </div>

          {/* FOOTER NEED HELP */}
          <div className="text-center text-xs text-[#6E7C74] pt-2">
            Need assistance? Reach out to{" "}
            <a href="mailto:support@quickkart.com" className="font-semibold text-[#063826] hover:underline">
              support@quickkart.com
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}