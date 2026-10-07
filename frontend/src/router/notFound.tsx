import { useNavigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "../features/auth/state/authState";

const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/customer/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

export default function NotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const destination = isAuthenticated && user ? ROLE_HOME[user.role] ?? "/login" : "/login";
  const buttonLabel = isAuthenticated && user ? "Go to your dashboard" : "Go to login";

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#F7F8F5] px-4 py-8 sm:p-6 font-sans">
      <div className="w-full max-w-[440px] text-center bg-white border border-[#E3E7E1] rounded-3xl p-6 sm:p-10 shadow-lg shadow-[#16241D]/[0.04]">
        <div className="text-5xl sm:text-6xl font-extrabold text-[#145C43] leading-none mb-3 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
          404
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#16241D] mb-2" style={{ fontFamily: "Fraunces, serif" }}>
          This page doesn't exist
        </h1>

        <p className="text-sm text-[#6E7C74] mb-8 leading-relaxed">
          Check the URL, or head back to somewhere that does.
        </p>

        <button
          onClick={() => navigate(destination, { replace: true })}
          className="w-full py-3.5 px-6 bg-[#145C43] hover:bg-[#114E39] text-white rounded-full text-sm font-semibold transition-all shadow-md shadow-[#145C43]/20 cursor-pointer"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}