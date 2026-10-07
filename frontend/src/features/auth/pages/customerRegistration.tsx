import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { User, Mail, Phone, Lock, KeyRound, ArrowRight } from "lucide-react";
import OtpVerificationModal from "../components/otpVerificationModal";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import { useAuthStore } from "../state/authState";
import { customerRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";
import customerRegBg from "../../../assets/customer_reg_bg.webp";

export default function CustomerRegistration() {
  const [showOtp, setShowOtp] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);

  const navigate = useNavigate();
  const hydrate = useAuthStore((state) => state.hydrate);

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: customerRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError("");
      if (!agreedTerms) {
        setServerError("You must agree to the Terms of Service and Privacy Policy.");
        return;
      }
      try {
        const lowerEmail = values.email.trim().toLowerCase();
        await api.post("/auth/register/customer", {
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: lowerEmail,
          password: values.password,
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtp(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setServerError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleVerified = async () => {
    setShowOtp(false);
    await hydrate();
    showSuccessToast("Account Created", { subtitle: "Welcome to QuickKart!" });
    navigate("/customer/home");
  };

  return (
    <div 
      className="relative flex min-h-screen min-h-[100dvh] w-full items-center justify-center px-4 py-8 sm:py-12 overflow-y-auto font-sans bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: `url(${customerRegBg})` }}
    >
      {/* Soft dark vignette overlay for focus */}
      <div className="absolute inset-0 bg-black/15 backdrop-brightness-[0.96]" />

      {/* Centered Glassmorphic Registration Card */}
      <div className="relative z-10 w-full max-w-[420px] my-auto rounded-[32px] border border-white/90 bg-gradient-to-b from-white/90 via-white/85 to-white/75 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all">
        
        {/* Top Branding Header */}
        <div className="text-center mb-3">
          <h1 
            className="text-2xl sm:text-3xl font-bold text-[#063826] tracking-tight mb-0.5" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QuickKart
          </h1>
          <p className="text-[8.5px] font-extrabold tracking-[0.24em] text-[#42594D] uppercase mb-2">
            JOIN THE FRESHNESS REVOLUTION
          </p>
          <h2 
            className="text-lg sm:text-xl font-semibold text-[#0F1E17]" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Create Your Account
          </h2>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2 mb-2 bg-red-50/90 border border-red-200 text-xs font-medium text-red-600 text-left">
            <p>{serverError}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-2.5">
          
          {/* Full Name */}
          <div>
            <label className="block text-left text-[11px] font-semibold text-[#1A3326] mb-1 pl-1">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F75]">
                <User size={15} />
              </span>
              <input
                id="name"
                name="name"
                type="text"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#FAFAF7]/90 border ${
                  formik.touched.name && formik.errors.name 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-white/80 focus:border-[#063826]/40 focus:bg-white"
                } text-[#0B2016] placeholder-[#94A39A] shadow-sm transition-all outline-none`}
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="mt-0.5 text-[9.5px] font-medium text-red-600 pl-3 text-left">{formik.errors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-left text-[11px] font-semibold text-[#1A3326] mb-1 pl-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F75]">
                <Mail size={15} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="john@example.com"
                className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#FAFAF7]/90 border ${
                  formik.touched.email && formik.errors.email 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-white/80 focus:border-[#063826]/40 focus:bg-white"
                } text-[#0B2016] placeholder-[#94A39A] shadow-sm transition-all outline-none`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="mt-0.5 text-[9.5px] font-medium text-red-600 pl-3 text-left">{formik.errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-left text-[11px] font-semibold text-[#1A3326] mb-1 pl-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F75]">
                <Phone size={15} />
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="10-digit mobile number"
                className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#FAFAF7]/90 border ${
                  formik.touched.phone && formik.errors.phone 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-white/80 focus:border-[#063826]/40 focus:bg-white"
                } text-[#0B2016] placeholder-[#94A39A] shadow-sm transition-all outline-none`}
              />
            </div>
            {formik.touched.phone && formik.errors.phone && (
              <p className="mt-0.5 text-[9.5px] font-medium text-red-600 pl-3 text-left">{formik.errors.phone}</p>
            )}
          </div>

          {/* Password & Confirm Side-by-Side Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
            {/* Password */}
            <div>
              <label className="block text-left text-[11px] font-semibold text-[#1A3326] mb-1 pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7F75]">
                  <Lock size={14} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-full bg-[#FAFAF7]/90 border ${
                    formik.touched.password && formik.errors.password 
                      ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                      : "border-white/80 focus:border-[#063826]/40 focus:bg-white"
                  } text-[#0B2016] placeholder-[#94A39A] shadow-sm transition-all outline-none`}
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-0.5 text-[9px] font-medium text-red-600 pl-2 text-left">{formik.errors.password}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-left text-[11px] font-semibold text-[#1A3326] mb-1 pl-1">
                Confirm
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7F75]">
                  <KeyRound size={14} />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-full bg-[#FAFAF7]/90 border ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword 
                      ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                      : "border-white/80 focus:border-[#063826]/40 focus:bg-white"
                  } text-[#0B2016] placeholder-[#94A39A] shadow-sm transition-all outline-none`}
                />
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-0.5 text-[9px] font-medium text-red-600 pl-2 text-left">{formik.errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="pt-0.5">
            <label className="flex items-center gap-2 text-[10.5px] text-[#4A5D54] cursor-pointer text-left pl-1 select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="h-3.5 w-3.5 rounded-full accent-[#063826] cursor-pointer"
              />
              <span>
                I agree to the <span className="font-semibold underline">Terms of Service</span> and <span className="font-semibold underline">Privacy Policy</span>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-2.5 sm:py-3 rounded-full bg-[#063826] hover:bg-[#042418] active:scale-[0.99] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#063826]/20 cursor-pointer disabled:opacity-70"
            >
              {formik.isSubmitting ? "Sending OTP..." : "Create Account"}
              {!formik.isSubmitting && <ArrowRight size={15} />}
            </button>
          </div>

          {/* Already have an account link */}
          <div className="pt-1.5 text-center text-[11px] text-[#5D6F66]">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-[#063826] hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Bottom Decorative Tagline */}
        <div className="mt-3 border-t border-black/5 pt-2 text-center">
          <span className="text-[8.5px] tracking-[0.2em] font-semibold text-[#829489] uppercase">
            ─── PREMIUM FARM-TO-TABLE LOGISTICS ───
          </span>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtp && (
        <OtpVerificationModal
          email={targetEmail}
          onVerified={handleVerified}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
}