import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    CircleDashed,
    Bike,
    Mail,
    Phone,
} from "lucide-react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";

const STATUS_FILTERS = ["All Statuses", "Pending Review", "Approved", "Rejected"];
const VEHICLE_FILTERS = ["All Types", "Bike", "Scooter"];
const PAGE_SIZE = 4;

// ---------- Types ----------

type DriverStatus = "pending" | "approved" | "rejected";

interface DriverApplication {
    id: string;
    driverCode: string;
    name: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    status: DriverStatus;
    documentsSubmitted: number;
    documentsTotal: number;
    createdAt: string;
}

interface DriverApplicationStats {
    pending: number;
    approved: number;
    rejected: number;
    requiringAttention: number;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ---------- UI helpers ----------

const DRIVER_STATUS_BADGE: Record<DriverStatus, { label: string; className: string }> = {
    pending: { label: "Pending Review", className: "bg-[#FEF3C7] text-[#B47800]" },
    approved: { label: "Approved", className: "bg-[#E8EFEC] text-[#145C43]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#BA1A1A]" },
};

function verificationProgress(app: { documentsSubmitted: number; documentsTotal: number }) {
    const total = app.documentsTotal || 0;
    const verified = app.documentsSubmitted || 0;
    const percent = total === 0 ? 0 : Math.round((verified / total) * 100);
    return { verified, total, percent };
}

function formatDateLabel(createdAt: string) {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatCard({
    label,
    value,
    icon: Icon,
    bg,
    iconColor,
}: {
    label: string;
    value: number;
    icon: typeof CircleDashed;
    bg: string;
    iconColor: string;
}) {
    return (
        <div className={`flex flex-col gap-3 rounded-2xl ${bg} p-5`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ${iconColor}`}>
                <Icon size={16} strokeWidth={2} />
            </span>
            <div>
                <p className="text-[13px] text-[#6E7C74]">{label}</p>
                <p className="text-[28px] font-semibold leading-tight text-[#16241D]">{value}</p>
            </div>
        </div>
    );
}

function DriverAvatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8EFEC] text-[13px] font-semibold text-[#145C43]">
            {initials}
        </div>
    );
}

function primaryAction(status: DriverApplication["status"]) {
    switch (status) {
        case "pending":
            return { label: "Review Application", disabled: false };
        case "approved":
            return { label: "Application Approved", disabled: true };
        case "rejected":
            return { label: "Review Feedback", disabled: false };
    }
}

function DriverCard({ driver, onReview }: { driver: DriverApplication; onReview: (id: string) => void }) {
    const badge = DRIVER_STATUS_BADGE[driver.status];
    const primary = primaryAction(driver.status);
    const progress = verificationProgress(driver);
    const barColor =
        progress.percent === 100 ? "bg-[#145C43]" : progress.percent >= 50 ? "bg-[#B47800]" : "bg-[#BA1A1A]";

    return (
        <div className="flex flex-col gap-4 sm:gap-5 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <DriverAvatar name={driver.name} />
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#16241D]">{driver.name}</p>
                        <p className="truncate text-[12.5px] text-[#6E7C74]">
                            {driver.driverCode} · {formatDateLabel(driver.createdAt)}
                        </p>
                    </div>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-[#6E7C74]">
                <span className="flex items-center gap-1.5 min-w-0">
                    <Mail size={13} className="text-[#9BAAA1] shrink-0" />
                    <span className="truncate">{driver.email}</span>
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                    <Phone size={13} className="text-[#9BAAA1] shrink-0" />
                    <span className="truncate">{driver.phone}</span>
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl bg-[#F5F7F3] p-3.5">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-[#9BAAA1]">
                        <Bike size={12} />
                        Vehicle Info
                    </p>
                    <p className="text-[13px] font-medium text-[#16241D] truncate">{driver.vehicleType}</p>
                    <p className="text-[12px] text-[#6E7C74] truncate">{driver.vehicleNumber}</p>
                </div>
                <div className="rounded-xl bg-[#F5F7F3] p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#9BAAA1]">
                            Verification
                        </p>
                        <span className="text-[12px] font-semibold text-[#16241D]">{progress.percent}%</span>
                    </div>
                    <p className="mb-2 text-[12px] text-[#6E7C74]">
                        {progress.verified}/{progress.total} Submitted
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-[#E3E7E1]">
                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${progress.percent}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button
                    disabled={primary.disabled}
                    onClick={() => onReview(driver.id)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                        primary.disabled
                            ? "cursor-not-allowed bg-[#F5F7F3] text-[#9BAAA1]"
                            : "bg-[#145C43] text-white hover:bg-[#114E39]"
                    }`}
                >
                    {primary.label}
                </button>
                <button
                    onClick={() => onReview(driver.id)}
                    className="flex-1 rounded-xl border border-[#E3E7E1] bg-white px-4 py-2.5 text-[13px] font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
                >
                    View Docs
                </button>
            </div>
        </div>
    );
}

export default function DriverApplicationsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [vehicleFilter, setVehicleFilter] = useState("All Types");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);

    const [applications, setApplications] = useState<DriverApplication[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [stats, setStats] = useState<DriverApplicationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce search so we don't fire a request on every keystroke.
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        let active = true;
        const startRequest = () => {
            setLoading(true);
            setError(null);
        };
        queueMicrotask(startRequest);

        api
            .get("/admin/driver/applications", {
                params: {
                    search: debouncedSearch,
                    status: statusFilter,
                    vehicleType: vehicleFilter,
                    date: dateFilter || undefined,
                    page,
                    limit: PAGE_SIZE,
                },
            })
            .then((res) => {
                if (!active) return;
                setApplications(res.data.applications);
                setPagination(res.data.pagination);
            })
            .catch((err) => {
                if (!active) return;
                setError(getApiErrorMessage(err, "Failed to load applications."));
            })
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [debouncedSearch, statusFilter, vehicleFilter, dateFilter, page]);

    useEffect(() => {
        api
            .get("/admin/driver/applications/stats")
            .then((res) => setStats(res.data.stats))
            .catch(() => setStats(null));
    }, []);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All Statuses");
        setVehicleFilter("All Types");
        setDateFilter("");
        setPage(1);
    };

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;
    const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Driver Applications" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 py-4 sm:py-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <p className="text-[13px] sm:text-[14px] text-[#6E7C74]">
                            Manage and review delivery partner onboarding requests
                        </p>

                        {/* Alert banner */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-[#E3E7E1] bg-[#F5F7F3] p-4 sm:px-6 sm:py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#145C43] text-white">
                                    <AlertTriangle size={18} />
                                </span>
                                <div>
                                    <p className="text-[13.5px] sm:text-[14px] font-semibold text-[#16241D]">
                                        {stats?.pending ?? "—"} driver applications are awaiting review
                                    </p>
                                    <p className="text-xs sm:text-[12.5px] text-[#6E7C74]">
                                        {stats?.requiringAttention ?? "—"} applications have been pending for more than 48 hours
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                label="Pending Applications"
                                value={stats?.pending ?? 0}
                                icon={CircleDashed}
                                bg="bg-[#FEF3C7]"
                                iconColor="text-[#B47800]"
                            />
                            <StatCard
                                label="Approved Drivers"
                                value={stats?.approved ?? 0}
                                icon={CheckCircle2}
                                bg="bg-[#E8EFEC]"
                                iconColor="text-[#145C43]"
                            />
                            <StatCard
                                label="Rejected"
                                value={stats?.rejected ?? 0}
                                icon={XCircle}
                                bg="bg-[#FBEAEA]"
                                iconColor="text-[#BA1A1A]"
                            />
                            <StatCard
                                label="Requiring Attention"
                                value={stats?.requiringAttention ?? 0}
                                icon={AlertTriangle}
                                bg="bg-[#FBEAEA]"
                                iconColor="text-[#BA1A1A]"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                            <div className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-xl border border-[#E3E7E1] bg-white px-3.5 py-2.5">
                                <Search size={16} className="shrink-0 text-[#6E7C74]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Name, Email, Vehicle Number"
                                    className="w-full bg-transparent text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                />
                            </div>

                            <FilterSelect
                                value={statusFilter}
                                onChange={(value) => {
                                    setStatusFilter(value);
                                    setPage(1);
                                }}
                                options={STATUS_FILTERS}
                            />
                            <FilterSelect
                                value={vehicleFilter}
                                onChange={(value) => {
                                    setVehicleFilter(value);
                                    setPage(1);
                                }}
                                options={VEHICLE_FILTERS}
                            />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full sm:w-auto rounded-xl border border-[#E3E7E1] bg-white px-3.5 py-2.5 text-[13px] text-[#16241D] focus:outline-none"
                            />

                            <button
                                onClick={resetFilters}
                                className="whitespace-nowrap text-left sm:text-center text-[13px] font-medium text-[#145C43] hover:underline cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        </div>

                        {/* Driver cards */}
                        {error ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#BA1A1A] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] font-medium text-[#BA1A1A]">{error}</p>
                            </div>
                        ) : loading ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#E3E7E1] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] text-[#6E7C74]">Loading applications...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                                {applications.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-[#E3E7E1] bg-white px-6 py-12 text-center">
                                        <p className="text-[14px] font-medium text-[#16241D]">
                                            No applications match these filters
                                        </p>
                                        <p className="mt-1 text-[12.5px] text-[#6E7C74]">
                                            Try a different search term or reset the filters above.
                                        </p>
                                    </div>
                                ) : (
                                    applications.map((driver) => (
                                        <DriverCard
                                            key={driver.id}
                                            driver={driver}
                                            onReview={(id) => navigate(`/admin/approvals/driver/${id}`)}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E3E7E1] pt-5">
                                <p className="text-xs sm:text-[13px] text-[#6E7C74]">
                                    Showing <span className="font-semibold text-[#16241D]">{rangeStart} – {rangeEnd}</span> of{" "}
                                    <span className="font-semibold text-[#16241D]">{total}</span> applications
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E7E1] bg-white text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="px-2 text-xs sm:text-[13px] text-[#16241D]">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E7E1] bg-white text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function FilterSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none rounded-xl border border-[#E3E7E1] bg-white px-3.5 py-2.5 pr-9 text-[13px] text-[#16241D] focus:outline-none"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C74]"
            />
        </div>
    );
}