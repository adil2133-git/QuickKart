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
    Store as StoreIcon,
    Mail,
    Phone,
    MapPin,
    Building2,
    Navigation,
} from "lucide-react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import LocationPreviewMap from "../components/locationPreview";
import { useStoreApplicationsStore, type StoreDecision, type ChecklistDoc } from "../state/storeApplicationState";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#FEF3C7] text-[#B47800]" },
    approved: { label: "Approved", className: "bg-[#E8EFEC] text-[#145C43]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#BA1A1A]" },
    "more-info": { label: "More Info", className: "bg-[#FEF3C7] text-[#B47800]" },
};

const DOC_CHIP: Record<ChecklistDoc["status"], string> = {
    verified: "bg-[#E8EFEC] text-[#145C43]",
    missing: "bg-[#F5F7F3] text-[#9BAAA1]",
};

function getFileKind(fileName?: string | null): "image" | "pdf" | "unknown" {
    if (!fileName) return "unknown";
    const lower = fileName.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    return "unknown";
}

function formatDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StoreApplicationReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        currentApplication: application,
        detailLoading,
        detailError,
        fetchApplicationById,
        clearCurrentApplication,
        noteDraft,
        setNoteDraft,
        savingNote,
        noteError,
        addNote,
        decision,
        decisionReason,
        submitting,
        submittedDecision,
        decisionError,
        setDecision,
        setDecisionReason,
        submitDecision,
    } = useStoreApplicationsStore();

    const [previewDocId, setPreviewDocId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchApplicationById(id);
        return () => clearCurrentApplication();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const previewDoc = application?.checklist?.find((d) => d.id === previewDocId) ?? null;

    if (detailLoading) {
        return (
            <PageShell>
                <p className="text-[13px] text-[#6E7C74]">Loading application...</p>
            </PageShell>
        );
    }

    if (detailError || !application) {
        return (
            <PageShell>
                <p className="text-[15px] font-semibold text-[#16241D]">{detailError || "Application not found"}</p>
                <p className="text-[13px] text-[#6E7C74]">It may have been removed, or the link is out of date.</p>
                <button
                    onClick={() => navigate("/admin/approvals/store")}
                    className="mt-2 rounded-xl bg-[#145C43] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#114E39]"
                >
                    Back to Store Applications
                </button>
            </PageShell>
        );
    }

    const badge = STATUS_BADGE[application.status] ?? STATUS_BADGE.pending;
    const progressPct =
        application.documentsTotal > 0
            ? Math.round((application.documentsSubmitted / application.documentsTotal) * 100)
            : 0;

    const requiresReason = decision === "reject" || decision === "more-info";
    const canSubmit = decision !== null && (!requiresReason || decisionReason.trim().length > 0);

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !noteDraft.trim()) return;
        addNote(id);
    };

    const handleSubmitDecision = () => {
        if (!id || !decision || !canSubmit) return;
        submitDecision(id);
    };

    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle={`Review: ${application.name}`} showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 py-4 sm:py-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <button
                                onClick={() => navigate("/admin/approvals/store")}
                                className="flex w-fit items-center gap-2 text-[13px] font-medium text-[#6E7C74] transition-colors hover:text-[#16241D] cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                Back to Store Applications
                            </button>
                            {submittedDecision && (
                                <DecisionBanner decision={submittedDecision} storeName={application.name} />
                            )}
                        </div>

                        {decisionError && (
                            <div className="rounded-2xl border border-dashed border-[#BA1A1A] bg-white px-5 py-3 text-[13px] text-[#BA1A1A]">
                                {decisionError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="flex flex-col gap-6 lg:col-span-2">
                                <div className="flex flex-col gap-5 rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                            <StoreLogo app={application} />
                                            <div className="min-w-0">
                                                <p className="truncate text-base sm:text-[18px] font-semibold text-[#16241D]">{application.name}</p>
                                                <p className="truncate text-[13px] text-[#6E7C74]">Owner — {application.owner}</p>
                                                <p className="mt-1 text-[11px] sm:text-[12px] text-[#9BAAA1]">
                                                    Code: {application.storeCode} · Type: {application.type} · Submitted{" "}
                                                    {formatDateLabel(application.dateLabel)}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:gap-4 border-t border-[#E3E7E1] pt-4 sm:grid-cols-2">
                                        <InfoRow icon={Mail} label="Email Address" value={application.contactEmail} />
                                        <InfoRow icon={Phone} label="Phone Number" value={application.contactPhone} />
                                        <InfoRow icon={MapPin} label="Location" value={application.location} />
                                        <InfoRow icon={Building2} label="Pincode" value={application.pincode ?? "Not provided"} />
                                    </div>

                                    <div className="rounded-xl bg-[#F5F7F3] px-4 py-3.5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAA1]">
                                                Document Checklist Completion
                                            </p>
                                            <span className="text-[13px] font-semibold text-[#16241D]">
                                                {application.documentsSubmitted}/{application.documentsTotal} verified ({progressPct}%)
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-[#E3E7E1]">
                                            <div
                                                className="h-full rounded-full bg-[#145C43] transition-all duration-300"
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {application.rejectionReason && (
                                        <div className="rounded-xl border border-[#BA1A1A]/30 bg-[#FBEAEA] p-4 text-[13px] text-[#BA1A1A]">
                                            <p className="font-semibold">Rejection / Information Notice:</p>
                                            <p className="mt-1 text-[13px] text-[#16241D]">{application.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-semibold text-[#16241D]">Store Location</p>
                                        {application.coordinates && (
                                            <a
                                                href={`https://www.google.com/maps?q=${application.coordinates.lat},${application.coordinates.lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 text-[12px] font-medium text-[#145C43] hover:underline"
                                            >
                                                <Navigation size={13} />
                                                Open in Google Maps
                                            </a>
                                        )}
                                    </div>

                                    {application.coordinates ? (
                                        <div>
                                            <LocationPreviewMap
                                                lat={application.coordinates.lat}
                                                lng={application.coordinates.lng}
                                                height={260}
                                            />
                                            <p className="mt-2 text-[12px] font-mono text-[#6E7C74]">
                                                GPS Coordinates: {application.coordinates.lat.toFixed(6)}, {application.coordinates.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-[#E3E7E1] bg-[#F5F7F3] px-4 py-8 text-center">
                                            <p className="text-[13px] font-medium text-[#16241D]">No pin on file for this store</p>
                                            <p className="mt-1 text-[12px] text-[#6E7C74]">
                                                The owner registered without dropping a map pin. Address string: "{application.location}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-semibold text-[#16241D]">Submitted Documents</p>
                                        <span className="rounded-full bg-[#F5F7F3] px-2.5 py-1 text-[11.5px] font-medium text-[#145C43]">
                                            {application.checklist.length} Document(s)
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {application.checklist.map((doc) => (
                                            <DocumentRow key={doc.id} doc={doc} onPreview={() => setPreviewDocId(doc.id)} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#16241D]">Review Notes</p>

                                    {application.reviewNotes && application.reviewNotes.length > 0 ? (
                                        <div className="flex flex-col gap-2.5">
                                            {application.reviewNotes.map((n, i) => (
                                                <div key={i} className="flex gap-3 rounded-xl bg-[#F5F7F3] px-4 py-3">
                                                    <MessageSquareText size={15} className="mt-0.5 shrink-0 text-[#145C43]" />
                                                    <div>
                                                        <p className="text-[12.5px] text-[#16241D]">{n.note}</p>
                                                        <p className="mt-1 text-[11.5px] text-[#9BAAA1]">
                                                            {n.author ? `${n.author} · ` : ""}
                                                            {formatDateLabel(n.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[13px] text-[#6E7C74]">No notes yet.</p>
                                    )}

                                    <form onSubmit={handleAddNote} className="mt-2 flex flex-col gap-2.5">
                                        {noteError && <p className="text-[12px] text-[#BA1A1A]">{noteError}</p>}
                                        <textarea
                                            value={noteDraft}
                                            onChange={(e) => setNoteDraft(e.target.value)}
                                            rows={2}
                                            placeholder="Add an internal reviewer note..."
                                            className="w-full resize-none rounded-xl border border-[#E3E7E1] bg-[#F5F7F3] px-3.5 py-2.5 text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={savingNote || !noteDraft.trim()}
                                            className="self-end rounded-xl bg-[#145C43] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#114E39] disabled:cursor-not-allowed disabled:bg-[#F5F7F3] disabled:text-[#9BAAA1]"
                                        >
                                            {savingNote ? "Saving..." : "Add Note"}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="sticky top-0 flex flex-col gap-4 rounded-2xl border border-[#E3E7E1] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#16241D]">Decision</p>
                                    <p className="text-[12.5px] text-[#6E7C74]">Choose how to respond to this application.</p>

                                    <div className="flex flex-col gap-2">
                                        <DecisionOption
                                            label="Approve Application"
                                            description="Store goes live immediately."
                                            icon={CheckCircle2}
                                            active={decision === "approve"}
                                            activeClass="border-[#A9CC3B] bg-[#E8EFEC] text-[#145C43]"
                                            onClick={() => setDecision("approve")}
                                        />
                                        <DecisionOption
                                            label="Request More Info"
                                            description="Notify the owner to resubmit documents."
                                            icon={MessageSquareText}
                                            active={decision === "more-info"}
                                            activeClass="border-[#B47800] bg-[#FEF3C7] text-[#B47800]"
                                            onClick={() => setDecision("more-info")}
                                        />
                                        <DecisionOption
                                            label="Reject Application"
                                            description="Store will not be onboarded."
                                            icon={XCircle}
                                            active={decision === "reject"}
                                            activeClass="border-[#BA1A1A] bg-[#FBEAEA] text-[#BA1A1A]"
                                            onClick={() => setDecision("reject")}
                                        />
                                    </div>

                                    {requiresReason && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-medium text-[#16241D]">
                                                {decision === "reject" ? "Reason for rejection (required)" : "What's missing? (required)"}
                                            </label>
                                            <textarea
                                                value={decisionReason}
                                                onChange={(e) => setDecisionReason(e.target.value)}
                                                rows={3}
                                                placeholder={
                                                    decision === "reject"
                                                        ? "e.g. Duplicate license number on file"
                                                        : "e.g. Please re-upload a valid address proof"
                                                }
                                                className="w-full resize-none rounded-xl border border-[#E3E7E1] bg-[#F5F7F3] px-3.5 py-2.5 text-[13px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <button
                                        disabled={!canSubmit || submitting}
                                        onClick={handleSubmitDecision}
                                        className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-[#E3E7E1] disabled:text-[#9BAAA1] ${
                                            decision === "approve"
                                                ? "bg-[#145C43] text-white hover:bg-[#114E39]"
                                                : decision === "reject"
                                                    ? "bg-[#BA1A1A] text-white hover:bg-[#991B1B]"
                                                    : decision === "more-info"
                                                        ? "bg-[#B47800] text-white hover:bg-[#92400E]"
                                                        : "bg-[#16241D] text-white hover:bg-[#2E3C36]"
                                        }`}
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

            {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDocId(null)} />}
        </div>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-[#F7F8F5]">
            <Sidebar />
            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Store Applications" showSearch={false} />
                <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 py-6">{children}</main>
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

function StoreLogo({ app }: { app: { logoInitial: string | null } }) {
    if (!app.logoInitial) {
        return (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8EFEC] text-[#9BAAA1]">
                <StoreIcon size={22} />
            </div>
        );
    }
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#145C43] text-[17px] font-semibold text-white">
            {app.logoInitial}
        </div>
    );
}

function DocumentRow({ doc, onPreview }: { doc: ChecklistDoc; onPreview: () => void }) {
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
                <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${DOC_CHIP[doc.status]}`}>
                    {doc.status === "verified" ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
                    {doc.status === "verified" ? "Submitted" : "Missing"}
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

function DocumentPreviewModal({ doc, onClose }: { doc: ChecklistDoc; onClose: () => void }) {
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
            <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white">
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
                    <button onClick={onClose} aria-label="Close preview" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]">
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
                        <iframe src={doc.fileUrl ?? ""} title={doc.label} className="h-[60vh] w-full rounded-lg border border-[#E3E7E1] bg-white" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <FileText size={32} className="text-[#9BAAA1]" />
                            <p className="text-[13px] font-medium text-[#16241D]">Preview isn't available for this file</p>
                            <p className="max-w-xs text-[12px] text-[#6E7C74]">Download the file to view {doc.fileName ?? "it"} on your device.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#E3E7E1] px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                        {kind === "image" && (
                            <>
                                <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]">
                                    <ZoomOut size={15} />
                                </button>
                                <span className="w-10 text-center text-[12px] text-[#6E7C74]">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]">
                                    <ZoomIn size={15} />
                                </button>
                                <button onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D]">
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
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${active ? activeClass : "border-[#E3E7E1] text-[#16241D] hover:bg-[#F5F7F3]"}`}
        >
            <Icon size={17} className="mt-0.5 shrink-0" />
            <div>
                <p className="text-[13px] font-medium">{label}</p>
                <p className={`text-[11.5px] ${active ? "opacity-80" : "text-[#6E7C74]"}`}>{description}</p>
            </div>
        </button>
    );
}

function DecisionBanner({ decision, storeName }: { decision: StoreDecision; storeName: string }) {
    if (decision === "approve") {
        return <Banner color="success" title={`${storeName} has been approved`} body="The store can now go live on the platform." />;
    }
    if (decision === "reject") {
        return <Banner color="danger" title={`${storeName}'s application has been rejected`} body="The owner will be notified with your reason." />;
    }
    return <Banner color="warning" title={`Requested more info from ${storeName}`} body="The owner will be notified to resubmit the flagged details." />;
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