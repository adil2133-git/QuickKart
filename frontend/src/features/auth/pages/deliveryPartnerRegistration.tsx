import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { Bike, Scooter, ArrowRight, Info, Upload, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerDriver } from "../../driver/driverAuthService";
import { getApiErrorMessage } from "../../../api/apiError";
import OtpVerificationModal from "../components/otpVerificationModal";
import PasswordStrengthBar from "../components/shared/passwordStrengthBar";
import { driverRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

import driverRegBg from "../../../assets/driver_reg_bg.webp";

type VehicleType = "Bike" | "Scooter";

interface UploadState {
  file: File | null;
  name: string | null;
  size: string | null;
  uploaded: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DocumentUploadZone({
  label,
  sub,
  upload,
  onUpload,
}: {
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
      className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
        uploaded 
          ? "border-[#063826] bg-[#E2EDE7]/70 text-[#063826]" 
          : "border-[#E5E7EB] bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#6E7C74]"
      }`}
    >
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf"
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
      
      {uploaded ? (
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 size={24} className="text-[#063826] mb-1" />
          <span className="text-xs font-bold text-[#063826]">{label}</span>
          <span className="text-[11px] text-[#2C4E3F] truncate max-w-[130px] font-medium">{name}</span>
          <span className="text-[9.5px] text-[#6E7C74] mt-0.5">{size} • Click to change</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Upload size={20} className="text-[#8AA094] mb-1.5" />
          <span className="text-xs font-semibold text-[#1A3326]">{label}</span>
          <span className="text-[10px] text-[#7A8C82] mt-0.5">{sub}</span>
          <span className="text-[9px] text-[#94A3B8] mt-1 font-medium">JPG, PNG or PDF (Max 5MB)</span>
        </div>
      )}
    </div>
  );
}

export default function DeliveryPartnerRegistration() {
  const navigate = useNavigate();

  const [drivingLicense, setDrivingLicense] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });
  const [vehicleRC, setVehicleRC] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });
  const [profilePhoto, setProfilePhoto] = useState<UploadState>({ file: null, name: null, size: null, uploaded: false });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [apiError, setApiError] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const inputPillClass =
    "w-full px-5 py-3 text-xs sm:text-sm rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#063826] focus:bg-white outline-none transition-all shadow-sm";

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      vehicleType: "Bike" as VehicleType,
      vehicleNumber: "",
      licenseNumber: "",
    },
    validationSchema: driverRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError("");

      if (!drivingLicense.file || !vehicleRC.file || !profilePhoto.file) {
        const docErr = "Driving License, Vehicle RC, and Profile Photo are all required.";
        setApiError(docErr);
        showErrorToast("Documents Missing", { subtitle: docErr });
        setSubmitting(false);
        return;
      }

      try {
        const lowerEmail = values.email.trim().toLowerCase();
        await registerDriver({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: lowerEmail,
          password: values.password,
          confirmPassword: values.confirmPassword,
          vehicleType: values.vehicleType,
          vehicleNumber: values.vehicleNumber.trim(),
          licenseNumber: values.licenseNumber.trim(),
          drivingLicense: drivingLicense.file,
          vehicleRC: vehicleRC.file,
          profilePhoto: profilePhoto.file,
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtp(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setApiError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full overflow-hidden font-sans bg-[#F9F8F6] select-none">
      
      {/* Left Panel: Hero Image & Branding */}
      <aside className="hidden md:flex flex-col justify-between w-[360px] lg:w-[440px] xl:w-[480px] h-full p-8 lg:p-12 relative overflow-hidden bg-[#063826] text-white flex-shrink-0">
        
        {/* Full Left Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={driverRegBg} 
            alt="QuickKart Delivery Partner" 
            className="w-full h-full object-cover object-[50%_35%]"
          />
          {/* Bottom vignette gradient matching reference design */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        </div>

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Bottom Hero Typography & Statement */}
        <div className="relative z-10 mt-auto">
          <h1 
            className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QuickKart
          </h1>
          <p className="text-sm lg:text-base text-white/95 font-normal leading-relaxed max-w-sm">
            Join our community of logistics champions and start your journey today.
          </p>
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
              Join as a Delivery Partner
            </h2>
            <p className="text-xs sm:text-sm text-[#5D6F65] mt-1.5">
              Fill in your details to start your journey with QuickKart.
            </p>
          </div>

          {/* Admin Review Notice Pill */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 mb-6 rounded-2xl sm:rounded-3xl bg-[#E2EDE7]/70 border border-[#C5DCD0] text-xs text-[#063826]">
            <Info size={18} className="shrink-0 text-[#063826]" />
            <p className="leading-tight italic">
              Your account will be reviewed by our admin team once submitted. We'll notify you via phone once approved.
            </p>
          </div>

          {/* API Error Alert Banner */}
          {apiError && (
            <div className="p-3.5 mb-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600">
              <p>{apiError}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
            
            {/* Section 1: Personal Info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider">
                  ── Personal Info
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Julian Henderson"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="julian@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputPillClass}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.email}</p>
                )}
              </div>

              {/* Phone Number (Indian Format Placeholder) */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                  Phone Number
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

              {/* Grid: Password & Confirm Password side-by-side with Eye Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                    Password
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
                    Confirm Password
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

            {/* Section 2: Vehicle & License */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider">
                  ── Vehicle & License
                </span>
              </div>

              {/* Vehicle Type Pills */}
              <div>
                <label className="block text-left text-[11px] font-medium text-[#374151] mb-1.5 pl-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("vehicleType", "Bike")}
                    className={`py-3 px-5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formik.values.vehicleType === "Bike"
                        ? "border-2 border-[#063826] bg-[#EFECE6]/80 text-[#063826] shadow-sm font-semibold"
                        : "border border-[#E5E7EB] bg-[#FAF9F6] text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Bike size={16} />
                    Bike
                  </button>

                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("vehicleType", "Scooter")}
                    className={`py-3 px-5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formik.values.vehicleType === "Scooter"
                        ? "border-2 border-[#063826] bg-[#EFECE6]/80 text-[#063826] shadow-sm font-semibold"
                        : "border border-[#E5E7EB] bg-[#FAF9F6] text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Scooter size={16} />
                    Scooter
                  </button>
                </div>
              </div>

              {/* Grid: Vehicle Reg & License Number (Indian Format Placeholders) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                    Vehicle Registration Number
                  </label>
                  <input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    type="text"
                    placeholder="e.g. KL-07-AB-1234"
                    value={formik.values.vehicleNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={inputPillClass}
                  />
                  {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.vehicleNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-[11px] font-medium text-[#374151] mb-1 pl-1">
                    Driving License Number
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="e.g. KL07 20230012345"
                    value={formik.values.licenseNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={inputPillClass}
                  />
                  {formik.touched.licenseNumber && formik.errors.licenseNumber && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.licenseNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Document Upload */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#6E7C74] tracking-wider">
                  ── Document Upload
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <DocumentUploadZone
                  label="Driving License"
                  sub="Front DL photo"
                  upload={drivingLicense}
                  onUpload={(f) => setDrivingLicense({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />

                <DocumentUploadZone
                  label="Vehicle RC"
                  sub="RC Certificate"
                  upload={vehicleRC}
                  onUpload={(f) => setVehicleRC({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />

                <DocumentUploadZone
                  label="Profile Photo"
                  sub="Clear headshot"
                  upload={profilePhoto}
                  onUpload={(f) => setProfilePhoto({ file: f, name: f.name, size: formatFileSize(f.size), uploaded: true })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#063826] hover:bg-[#042418] active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#063826]/20 cursor-pointer disabled:opacity-60"
              >
                {formik.isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    Uploading Documents & Registering...
                  </>
                ) : (
                  <>
                    Submit Driver Application <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtp && (
        <OtpVerificationModal
          email={targetEmail}
          onVerified={() => {
            setShowOtp(false);
            showSuccessToast("Application Submitted", { subtitle: "We will review your application soon." });
            navigate("/driver/pending");
          }}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
}