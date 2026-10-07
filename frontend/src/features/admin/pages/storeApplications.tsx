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
    Store as StoreIcon,
} from "lucide-react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import {
    useStoreApplicationsStore,
    type StoreApplication,
} from "../state/storeApplicationState";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const CITIES = ["All Cities", "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, KA", "Hyderabad, TS"];

// ---------- UI helpers (unchanged) ----------

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#FEF3C7] text-[#B47800]" },
    approved: { label: "Approved", className: "bg-[#E8EFEC] text-[#145C43]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#BA1A1A]" },
    "more-info": { label: "More Info", className: "bg-[#E8EFEC] text-[#145C43]" },
};

const DOC_CHIP: Record<"verified" | "missing", string> = {
    verified: "bg-[#E8EFEC] text-[#145C43]",
    missing: "bg-[#F5F7F3] text-[#9BAAA1]",
};

function DocIcon({ status }: { status: "verified" | "missing" }) {
    if (status === "verified") return <CheckCircle2 size={12} />;
    return <CircleDashed size={12} />;
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

function StoreLogo({ app }: { app: StoreApplication }) {
    if (!app.logoInitial) {
        return (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFEC] text-[#9BAAA1]">
                <StoreIcon size={20} />
            </div>
        );
    }
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#145C43] text-[15px] font-semibold text-white">
            {app.logoInitial}
        </div>
    );
}

function primaryAction(status: StoreApplication["status"]) {
    switch (status) {
        case "pending":
        case "more-info":
            return { label: "Review Application", disabled: false };
        case "approved":
            return { label: "Application Approved", disabled: true };
        case "rejected":
            return { label: "Review Feedback", disabled: false };
    }
}

function ApplicationCard({ app, onReview }: { app: StoreApplication; onReview: (id: string) => void }) {
    const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.pending;
    const primary = primaryAction(app.status);

    return (
        <div className="flex flex-col gap-4 sm:gap-5 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <StoreLogo app={app} />
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#16241D]">{app.name}</p>
                        <p className="truncate text-[12.5px] text-[#6E7C74]">
                            {app.owner} · {app.storeCode}
                        </p>
                    </div>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[13px]">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAA1]">Contact</p>
                    <p className="mt-1 truncate text-[#16241D]">{app.contactEmail}</p>
                    <p className="truncate text-[#16241D]">{app.contactPhone}</p>
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAA1]">Location</p>
                    <p className="mt-1 truncate text-[#16241D]">{app.location}</p>
                    <p className="italic text-[#6E7C74]">{formatDateLabel(app.dateLabel)}</p>
                </div>
            </div>

            <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9BAAA1]">
                    Submitted Documents
                </p>
                <div className="flex flex-wrap gap-2">
                    {app.checklist.map((doc) => (
                        <span
                            key={doc.id}
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${DOC_CHIP[doc.status]}`}
                        >
                            <DocIcon status={doc.status} />
                            {doc.label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex items-stretch divide-x divide-[#E3E7E1] rounded-xl bg-[#F5F7F3] px-2 py-3">
                <div className="flex-1 px-2 sm:px-3 text-center">
                    <p className="text-[10px] sm:text-[10.5px] font-medium uppercase tracking-wide text-[#9BAAA1]">Documents</p>
                    <p className="mt-1 text-xs sm:text-[14px] font-semibold text-[#16241D]">
                        {app.documentsSubmitted}/{app.documentsTotal}
                    </p>
                </div>
                <div className="flex-1 px-2 sm:px-3 text-center">
                    <p className="text-[10px] sm:text-[10.5px] font-medium uppercase tracking-wide text-[#9BAAA1]">Type</p>
                    <p className="mt-1 truncate text-xs sm:text-[14px] font-semibold text-[#16241D]">{app.type}</p>
                </div>
                <div className="flex-1 px-2 sm:px-3 text-center">
                    <p className="text-[10px] sm:text-[10.5px] font-medium uppercase tracking-wide text-[#9BAAA1]">Pincode</p>
                    <p className="mt-1 truncate text-xs sm:text-[14px] font-semibold text-[#16241D]">{app.pincode ?? "—"}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button
                    disabled={primary.disabled}
                    onClick={() => onReview(app.id)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                        primary.disabled
                            ? "cursor-not-allowed bg-[#F5F7F3] text-[#9BAAA1]"
                            : "bg-[#145C43] text-white hover:bg-[#114E39]"
                    }`}
                >
                    {primary.label}
                </button>
                <button
                    onClick={() => onReview(app.id)}
                    className="flex-1 rounded-xl border border-[#E3E7E1] bg-white px-4 py-2.5 text-[13px] font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
                >
                    View Documents
                </button>
            </div>
        </div>
    );
}

export default function StoreApplicationsPage() {
    const navigate = useNavigate();

    const {
        applications,
        pagination,
        stats,
        filters,
        listLoading,
        listError,
        setFilters,
        setPage,
        resetFilters,
        fetchApplications,
        fetchStats,
    } = useStoreApplicationsStore();

    // Local-only input value so typing feels instant; debounced before
    // it's pushed into the store (which triggers a refetch).
    const [searchInput, setSearchInput] = useState(filters.search);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters({ search: searchInput });
            }
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    // Initial load
    useEffect(() => {
        fetchApplications();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResetFilters = () => {
        setSearchInput("");
        resetFilters();
    };

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;
    const rangeStart = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
    const rangeEnd = Math.min(filters.page * filters.limit, total);

    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Store Applications" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 py-4 sm:py-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <p className="text-[13px] sm:text-[14px] text-[#6E7C74]">Review and manage store onboarding requests</p>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-[#E3E7E1] bg-[#F5F7F3] p-4 sm:px-6 sm:py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#145C43] text-white">
                                    <AlertTriangle size={18} />
                                </span>
                                <div>
                                    <p className="text-[13.5px] sm:text-[14px] font-semibold text-[#16241D]">
                                        {stats?.pending ?? "—"} store applications are awaiting review
                                    </p>
                                    <p className="text-xs sm:text-[12.5px] text-[#6E7C74]">
                                        {stats?.requiringAttention ?? "—"} applications have been pending for more than 48 hours
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Pending Applications" value={stats?.pending ?? 0} icon={CircleDashed} bg="bg-[#FEF3C7]" iconColor="text-[#B47800]" />
                            <StatCard label="Approved Stores" value={stats?.approved ?? 0} icon={CheckCircle2} bg="bg-[#E8EFEC]" iconColor="text-[#145C43]" />
                            <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} bg="bg-[#FBEAEA]" iconColor="text-[#BA1A1A]" />
                            <StatCard label="Requiring Attention" value={stats?.requiringAttention ?? 0} icon={AlertTriangle} bg="bg-[#FBEAEA]" iconColor="text-[#BA1A1A]" />
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                            <div className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-xl border border-[#E3E7E1] bg-white px-3.5 py-2.5">
                                <Search size={16} className="shrink-0 text-[#6E7C74]" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search by store name or owner..."
                                    className="w-full bg-transparent text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                />
                            </div>

                            <FilterSelect
                                value={filters.status}
                                onChange={(v) => setFilters({ status: v })}
                                options={STATUS_FILTERS}
                                prefix="Status"
                            />
                            <FilterSelect
                                value={filters.city}
                                onChange={(v) => setFilters({ city: v })}
                                options={CITIES}
                            />

                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters({ date: e.target.value })}
                                className="w-full sm:w-auto rounded-xl border border-[#E3E7E1] bg-white px-3.5 py-2.5 text-[13px] text-[#16241D] focus:outline-none"
                            />

                            <button
                                onClick={handleResetFilters}
                                className="whitespace-nowrap text-left sm:text-center text-[13px] font-medium text-[#145C43] hover:underline cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        </div>

                        {listError ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#BA1A1A] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] font-medium text-[#BA1A1A]">{listError}</p>
                            </div>
                        ) : listLoading ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#E3E7E1] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] text-[#6E7C74]">Loading applications...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                                {applications.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-[#E3E7E1] bg-white px-6 py-12 text-center">
                                        <p className="text-[14px] font-medium text-[#16241D]">No applications match these filters</p>
                                        <p className="mt-1 text-[12.5px] text-[#6E7C74]">Try a different search term or reset the filters above.</p>
                                    </div>
                                ) : (
                                    applications.map((app) => (
                                        <ApplicationCard
                                            key={app.id}
                                            app={app}
                                            onReview={(id) => navigate(`/admin/approvals/store/${id}`)}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E3E7E1] pt-5">
                                <p className="text-xs sm:text-[13px] text-[#6E7C74]">
                                    Showing <span className="font-semibold text-[#16241D]">{rangeStart} – {rangeEnd}</span> of{" "}
                                    <span className="font-semibold text-[#16241D]">{total}</span> applications
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(1, filters.page - 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E7E1] bg-white text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        disabled={filters.page === 1}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="px-2 text-xs sm:text-[13px] text-[#16241D]">
                                        Page {filters.page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, filters.page + 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E7E1] bg-white text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        disabled={filters.page === totalPages}
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
    prefix,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    prefix?: string;
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
                        {prefix && opt !== "All" ? `${prefix}: ${opt}` : opt}
                    </option>
                ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C74]" />
        </div>
    );
}