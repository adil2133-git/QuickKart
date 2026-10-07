import { useNavigate } from "react-router-dom";
import type { UserRole } from "../features/auth/state/authState";

interface AccessDeniedProps {
  homePath: string;
  role: UserRole;
}

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  DRIVER: "driver",
  STORE: "store",
};

export default function AccessDenied({ homePath, role }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#F7F8F5] px-4 py-8 sm:p-6 font-sans">
      <div className="w-full max-w-[440px] text-center bg-white border border-[#E3E7E1] rounded-3xl p-6 sm:p-10 shadow-lg shadow-[#16241D]/[0.04]">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#E8EFEC] flex items-center justify-center text-[#145C43]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="#145C43"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#16241D] mb-2" style={{ fontFamily: "Fraunces, serif" }}>
          You don't have access to this page
        </h1>

        <p className="text-sm text-[#6E7C74] mb-8 leading-relaxed">
          This page is only available to {ROLE_LABEL[role] === "admin" ? "an" : "a"}{" "}
          {ROLE_LABEL[role]} account. You're signed in with a different role.
        </p>

        <button
          onClick={() => navigate(homePath, { replace: true })}
          className="w-full py-3.5 px-6 bg-[#145C43] hover:bg-[#114E39] text-white rounded-full text-sm font-semibold transition-all shadow-md shadow-[#145C43]/20 cursor-pointer"
        >
          Go to your dashboard
        </button>
      </div>
    </div>
  );
}