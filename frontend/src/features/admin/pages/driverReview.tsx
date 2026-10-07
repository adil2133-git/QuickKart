import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    CircleDashed,
    FileText,
    Download,
    Eye,
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    MessageSquareText,
    Mail,
    Phone,
    Bike,
    IdCard,
} from "lucide-react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

type DriverDecision = "approve" | "reject" | "more-info";

type ReviewNote = {
    note: string;
    author: string;
    date: string;
};

type DriverDocument = {
    id: string;
    label: string;
    fileUrl: string | null;
    fileName: string | null;
};

type DriverApplication = {
    id: string;
    name: string;
    driverCode: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    status: "pending" | "approved" | "rejected" | "more-info";
    createdAt: string;
    rejectionReason?: string | null;
    reviewNotes?: ReviewNote[];
    documents: DriverDocument[];
    documentsSubmitted: number;
    documentsTotal: number;
};

const DRIVER_STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#FEF3C7] text-[#B47800]" },
    approved: { label: "Approved", className: "bg-[#E8EFEC] text-[#145C43]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#BA1A1A]" },
    "more-info": { label: "More Info", className: "bg-[#E8EFEC] text-[#145C43]" },
};

function getFileKind(fileName?: string | null): "image" | "pdf" | "unknown" {
    if (!fileName) return "unknown";
    const lower = fileName.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    return "unknown";
}

function verificationProgress(driver: DriverApplication) {
    const verified = driver.documentsSubmitted;
    const total = driver.documentsTotal;
    const percent = total > 0 ? Math.round((verified / total) * 100) : 0;
    return { verified, total, percent };
}

function formatDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DriverApplicationReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [driver, setDriver] = useState<DriverApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const [decision, setDecision] = useState<DriverDecision | null>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submittedDecision, setSubmittedDecision] = useState<DriverDecision | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [previewDocId, setPreviewDocId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let active = true;
        const startRequest = () => {
            setLoading(true);
            setLoadError(null);
        };
        queueMicrotask(startRequest);

        api.get(`/admin/driver/applications/${id}`)
            .then((res) => active && setDriver(res.data.application))
            .catch((err) => active && setLoadError(getApiErrorMessage(err, "Failed to load application.")))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [id]);

    const previewDoc = driver?.documents?.find((d) => d.id === previewDocId) ?? null;
    
    if (loading) {
        return (
            <PageShell>
                <p className="text-[13px] text-[#6E7C74]">Loading application...</p>
            </PageShell>
        );
    }

    if (loadError || !driver) {
        return (
            <PageShell>
                <p className="text-[15px] font-semibold text-[#16241D]">
                    {loadError || "Application not found"}
                </p>
                <p className="text-[13px] text-[#6E7C74]">It may have been removed, or the link is out of date.</p>
                <button
                    onClick={() => navigate("/admin/approvals/drivers")}
                    className="mt-2 rounded-xl bg-[#145C43] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#114E39]"
                >
                    Back to Driver Applications
                </button>
            </PageShell>
        );
    }

    const badge = DRIVER_STATUS_BADGE[driver.status] ?? DRIVER_STATUS_BADGE["pending"];
    const progress = verificationProgress(driver);

    const requiresReason = decision === "reject" || decision === "more-info";
    const canSubmit = decision !== null && (!requiresReason || decisionReason.trim().length > 0);

    const handleAddNote = async () => {
        if (!note.trim() || !id) return;
        setSavingNote(true);
        setActionError(null);
        try {
            const res = await api.post(`/admin/driver/applications/${id}/notes`, { note: note.trim() });
            setDriver((prev) => prev ? { ...prev, reviewNotes: res.data.reviewNotes } : prev);
            setNote("");
        } catch (err: unknown) {
            setActionError(getApiErrorMessage(err, "Failed to add note."));
        } finally {
            setSavingNote(false);
        }
    };

    const handleSubmitDecision = async () => {
        if (!canSubmit || !decision || !id) return;
        setSubmitting(true);
        setActionError(null);
        try {
            const res = await api.post(`/admin/driver/applications/${id}/decision`, {
                decision,
                reason: decisionReason.trim() || undefined,
            });
            setSubmittedDecision(decision);
            setDriver((prev) => prev ? { ...prev, status: res.data.status } : prev);
        } catch (err: unknown) {
            setActionError(getApiErrorMessage(err, "Failed to submit decision."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Review Driver Application" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 py-4 sm:py-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <button
                            onClick={() => navigate("/admin/approvals/drivers")}
                            className="flex w-fit items-center gap-2 text-[13px] font-medium text-[#6E7C74] hover:text-[#16241D] cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Back to Driver Applications
                        </button>

                        {submittedDecision && (
                            <DecisionBanner decision={submittedDecision} driverName={driver.name} />
                        )}
                        {actionError && (
                            <div className="rounded-2xl bg-[#FBEAEA] px-5 py-4 text-[13px] text-[#BA1A1A]">
                                {actionError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Left column */}
                            <div className="flex flex-col gap-6 lg:col-span-2">
                                {/* Header card */}
                                <div className="flex flex-col gap-5 sm:gap-6 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                            <DriverAvatar name={driver.name} />
                                            <div className="min-w-0">
                                                <h2 className="truncate text-base sm:text-[18px] font-bold text-[#16241D]">{driver.name}</h2>
                                                <p className="truncate text-[12.5px] sm:text-[13px] text-[#6E7C74]">
                                                    {driver.driverCode} · Submitted {formatDateLabel(driver.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                        <InfoRow icon={Mail} label="Email" value={driver.email} />
                                        <InfoRow icon={Phone} label="Phone" value={driver.phone} />
                                        <InfoRow icon={Bike} label="Vehicle Info" value={`${driver.vehicleType} (${driver.vehicleNumber})`} />
                                        <InfoRow icon={IdCard} label="License Number" value={driver.licenseNumber} />
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-medium uppercase tracking-wide text-[#6E7C74]">
                                                Verification Progress
                                            </span>
                                            <span className="text-[13px] font-semibold text-[#16241D]">
                                                {progress.verified}/{progress.total} · {progress.percent}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-[#E3E7E1]">
                                            <div
                                                className={`h-1.5 rounded-full ${progress.percent === 100
                                                    ? "bg-[#145C43]"
                                                    : progress.percent >= 50
                                                        ? "bg-[#B47800]"
                                                        : "bg-[#BA1A1A]"
                                                    }`}
                                                style={{ width: `${progress.percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {driver.rejectionReason && (
                                        <div className="rounded-xl bg-[#FBEAEA] px-4 py-3.5">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#BA1A1A]">
                                                Rejection Reason
                                            </p>
                                            <p className="mt-1 text-[13px] text-[#16241D]">{driver.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Documents */}
                                <div className="flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-semibold text-[#16241D]">Submitted Documents</p>
                                        <span className="rounded-full bg-[#E8EFEC] px-2.5 py-1 text-[11.5px] font-medium text-[#145C43]">
                                            {driver.documentsSubmitted}/{driver.documentsTotal} Submitted
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {driver.documents.map((doc) => (
                                            <DocumentRow
                                                key={doc.id}
                                                doc={doc}
                                                onPreview={() => setPreviewDocId(doc.id)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Review notes */}
                                <div className="flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#16241D]">Review Notes</p>

                                    {driver.reviewNotes && driver.reviewNotes.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {driver.reviewNotes.map((n, i) => (
                                                <div key={i} className="flex gap-3 rounded-xl bg-[#F5F7F3] px-4 py-3">
                                                    <MessageSquareText size={15} className="mt-0.5 shrink-0 text-[#145C43]" />
                                                    <div>
                                                        <p className="text-[12.5px] text-[#16241D]">{n.note}</p>
                                                        <p className="mt-1 text-[11.5px] text-[#6E7C74]">
                                                            {n.author} · {formatDateLabel(n.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[13px] text-[#6E7C74]">No notes yet.</p>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Add an internal note about this review..."
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-[#E3E7E1] bg-[#F5F7F3] px-3.5 py-2.5 text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                        />
                                        <button
                                            disabled={note.trim().length === 0 || savingNote}
                                            onClick={handleAddNote}
                                            className="self-end rounded-xl bg-[#145C43] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#114E39] disabled:cursor-not-allowed disabled:bg-[#F5F7F3] disabled:text-[#9BAAA1]"
                                        >
                                            {savingNote ? "Saving..." : "Add Note"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right column: decision panel */}
                            <div className="flex flex-col gap-4">
                                <div className="sticky top-0 flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#16241D]">Decision</p>
                                    <p className="text-[12.5px] text-[#6E7C74]">
                                        Choose how to respond to this driver application.
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <DecisionOption
                                            label="Approve Driver"
                                            description="Driver can start accepting deliveries."
                                            icon={CheckCircle2}
                                            active={decision === "approve"}
                                            activeClass="border-[#A9CC3B] bg-[#A9CC3B] text-[#16241D]"
                                            onClick={() => setDecision("approve")}
                                        />
                                        <DecisionOption
                                            label="Request More Info"
                                            description="Notify the driver to resubmit documents."
                                            icon={MessageSquareText}
                                            active={decision === "more-info"}
                                            activeClass="border-[#B47800] bg-[#FEF3C7] text-[#B47800]"
                                            onClick={() => setDecision("more-info")}
                                        />
                                        <DecisionOption
                                            label="Reject Application"
                                            description="Driver will not be onboarded."
                                            icon={XCircle}
                                            active={decision === "reject"}
                                            activeClass="border-[#BA1A1A] bg-[#FBEAEA] text-[#BA1A1A]"
                                            onClick={() => setDecision("reject")}
                                        />
                                    </div>

                                    {requiresReason && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-medium text-[#16241D]">
                                                {decision === "reject"
                                                    ? "Reason for rejection (required)"
                                                    : "What's missing? (required)"}
                                            </label>
                                            <textarea
                                                value={decisionReason}
                                                onChange={(e) => setDecisionReason(e.target.value)}
                                                rows={3}
                                                placeholder={
                                                    decision === "reject"
                                                        ? "e.g. License could not be verified"
                                                        : "e.g. Please re-upload a clear vehicle RC"
                                                }
                                                className="w-full resize-none rounded-xl border border-[#E3E7E1] bg-[#F5F7F3] px-3.5 py-2.5 text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <button
                                        disabled={!canSubmit || submitting}
                                        onClick={handleSubmitDecision}
                                        className="rounded-xl bg-[#145C43] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#114E39] disabled:cursor-not-allowed disabled:bg-[#F5F7F3] disabled:text-[#9BAAA1]"
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : decision === "approve"
                                                ? "Confirm Approval"
                                                : decision === "reject"
                                                    ? "Confirm Rejection"
                                                    : decision === "more-info"
                                                        ? "Send Request"
                                                        : "Select a decision"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {previewDoc && (
                <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDocId(null)} />
            )}
        </div>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />
            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Driver Applications" showSearch={false} />
                <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon size={15} className="mt-0.5 shrink-0 text-[#6E7C74]" />
            <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAA1]">{label}</p>
                <p className="text-[13px] text-[#16241D]">{value}</p>
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
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8EFEC] text-[16px] font-semibold text-[#145C43]">
            {initials}
        </div>
    );
}

function DocumentRow({
    doc,
    onPreview,
}: {
    doc: DriverDocument;
    onPreview: () => void;
}) {
    const hasFile = !!doc.fileUrl;
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-[#E3E7E1] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={hasFile ? onPreview : undefined}
                    disabled={!hasFile}
                    className={`flex flex-1 items-center gap-3 rounded-lg text-left ${hasFile ? "cursor-pointer" : "cursor-default"}`}
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F7F3] text-[#6E7C74]">
                        <FileText size={16} />
                    </span>
                    <div>
                        <p className="text-[13.5px] font-medium text-[#16241D]">{doc.label}</p>
                        <p className="text-[12px] text-[#9BAAA1]">{hasFile ? doc.fileName : "Not uploaded"}</p>
                    </div>
                </button>
                <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${hasFile ? "bg-[#E8EFEC] text-[#145C43]" : "bg-[#F5F7F3] text-[#9BAAA1]"
                        }`}
                >
                    {hasFile ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
                    {hasFile ? "Submitted" : "Missing"}
                </span>
            </div>

            {hasFile && (
                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={onPreview}
                        className="flex items-center gap-1.5 rounded-lg border border-[#E3E7E1] px-3 py-1.5 text-[12px] font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
                    >
                        <Eye size={13} />
                        View
                    </button>
                    <a
                        href={doc.fileUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-1.5 rounded-lg border border-[#E3E7E1] px-3 py-1.5 text-[12px] font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
                    >
                        <Download size={13} />
                        Download
                    </a>
                </div>
            )}
        </div>
    );
}

function DocumentPreviewModal({
    doc,
    onClose,
}: {
    doc: DriverDocument;
    onClose: () => void;
}) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const kind = getFileKind(doc.fileName);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white"
            >
                <div className="flex items-center justify-between gap-3 border-b border-[#E3E7E1] px-5 py-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F7F3] text-[#6E7C74]">
                            <FileText size={16} />
                        </span>
                        <div className="overflow-hidden">
                            <p className="truncate text-[14px] font-semibold text-[#16241D]">{doc.label}</p>
                            <p className="truncate text-[12px] text-[#9BAAA1]">{doc.fileName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close preview"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="flex flex-1 items-center justify-center overflow-auto bg-[#F5F7F3] p-5">
                    {kind === "image" ? (
                        <img
                            src={doc.fileUrl ?? ""}
                            alt={doc.label}
                            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.15s ease" }}
                            className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
                        />
                    ) : kind === "pdf" ? (
                        <iframe
                            src={doc.fileUrl ?? ""}
                            title={doc.label}
                            className="h-[60vh] w-full rounded-lg border border-[#E3E7E1] bg-white"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <FileText size={32} className="text-[#9BAAA1]" />
                            <p className="text-[13px] font-medium text-[#16241D]">Preview isn't available for this file</p>
                            <p className="max-w-xs text-[12px] text-[#6E7C74]">
                                Download the file to view {doc.fileName ?? "it"} on your device.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#E3E7E1] px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                        {kind === "image" && (
                            <>
                                <button
                                    onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                                    aria-label="Zoom out"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                                >
                                    <ZoomOut size={15} />
                                </button>
                                <span className="w-10 text-center text-[12px] text-[#6E7C74]">{Math.round(zoom * 100)}%</span>
                                <button
                                    onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                                    aria-label="Zoom in"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                                >
                                    <ZoomIn size={15} />
                                </button>
                                <button
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    aria-label="Rotate"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]"
                                >
                                    <RotateCw size={15} />
                                </button>
                            </>
                        )}
                    </div>

                    <a
                        href={doc.fileUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-1.5 rounded-lg border border-[#E3E7E1] px-3 py-1.5 text-[12px] font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
                    >
                        <Download size={13} />
                        Download
                    </a>
                </div>
            </div>
        </div>
    );
}

function DecisionOption({
    label,
    description,
    icon: Icon,
    active,
    activeClass,
    onClick,
}: {
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    active: boolean;
    activeClass: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${active ? activeClass : "border-[#E3E7E1] text-[#16241D] hover:bg-[#F5F7F3]"
                }`}
        >
            <Icon size={17} className="mt-0.5 shrink-0" />
            <div>
                <p className="text-[13px] font-medium">{label}</p>
                <p className={`text-[11.5px] ${active ? "opacity-80" : "text-[#6E7C74]"}`}>{description}</p>
            </div>
        </button>
    );
}

function DecisionBanner({ decision, driverName }: { decision: DriverDecision; driverName: string }) {
    if (decision === "approve") {
        return <Banner color="success" title={`${driverName} has been approved`} body="The driver can now start accepting deliveries." />;
    }
    if (decision === "reject") {
        return <Banner color="danger" title={`${driverName}'s application has been rejected`} body="The driver will be notified with your reason." />;
    }
    return <Banner color="warning" title={`Requested more info from ${driverName}`} body="The driver will be notified to resubmit the flagged details." />;
}

function Banner({ color, title, body }: { color: "success" | "danger" | "warning"; title: string; body: string }) {
    const styles = {
        success: "bg-[#E8EFEC] text-[#145C43]",
        danger: "bg-[#FBEAEA] text-[#BA1A1A]",
        warning: "bg-[#FEF3C7] text-[#B47800]",
    }[color];
    const Icon = color === "success" ? CheckCircle2 : color === "danger" ? XCircle : MessageSquareText;

    return (
        <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${styles}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div>
                <p className="text-[13.5px] font-semibold">{title}</p>
                <p className="text-[12.5px] opacity-90">{body}</p>
            </div>
        </div>
    );
}