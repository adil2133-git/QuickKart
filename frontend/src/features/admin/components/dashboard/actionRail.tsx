import { useEffect } from "react";
import {
  AlertCircle,
  Clock,
  TimerReset,
  ArrowRight,
  Store,
  Bike,
  UserPlus2,
  ClipboardList,
  Download,
} from "lucide-react";
import { useDashboardState, type AttentionItem, type ApprovalCard } from "../../state/dashboardState";
import { useState } from "react";

// Admin Action Rail displaying attention items and application review queue.
// Fetches live dashboard signals from GET /admin/dashboard/action-rail.

const ICON_MAP: Record<AttentionItem["type"], typeof AlertCircle> = {
  orders: AlertCircle,
  stores: Clock,
  drivers: TimerReset,
};

const SEVERITY_STYLES: Record<AttentionItem["severity"], { border: string; iconBg: string; iconColor: string }> = {
  critical: { border: "border-l-[#BA1A1A]", iconBg: "bg-[#FBEAEA]", iconColor: "text-[#BA1A1A]" },
  warning: { border: "border-l-[#B47800]", iconBg: "bg-[#FEF3C7]", iconColor: "text-[#B47800]" },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function NeedsAttentionFeed({ items }: { items: AttentionItem[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#16241D]">Needs Attention</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-[#BA1A1A] px-2.5 py-1 text-[10.5px] font-bold text-white">
            {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-[#E3E7E1] bg-white p-4 text-[12.5px] text-[#9BAAA1]">
          Nothing needs attention right now.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = ICON_MAP[item.type];
            const styles = SEVERITY_STYLES[item.severity];
            return (
              <div
                key={item.id}
                className={`rounded-xl border border-[#E3E7E1] border-l-4 bg-white p-4 ${styles.border}`}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold text-[#16241D]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[#6E7C74]">
                      {item.description}
                    </p>
                    <button className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-[#145C43] hover:underline">
                      {item.actionLabel}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApprovalQueue({ stores, drivers }: { stores: ApprovalCard[]; drivers: ApprovalCard[] }) {
  const [tab, setTab] = useState<"stores" | "drivers">("stores");
  const applications = tab === "stores" ? stores : drivers;

  return (
    <div>
      <div className="mb-3 flex rounded-xl bg-[#F5F7F3] p-1">
        <button
          onClick={() => setTab("stores")}
          className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition-colors ${
            tab === "stores"
              ? "bg-white text-[#16241D] shadow-sm"
              : "text-[#6E7C74] hover:text-[#16241D]"
          }`}
        >
          Stores ({stores.length})
        </button>
        <button
          onClick={() => setTab("drivers")}
          className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition-colors ${
            tab === "drivers"
              ? "bg-white text-[#16241D] shadow-sm"
              : "text-[#6E7C74] hover:text-[#16241D]"
          }`}
        >
          Drivers ({drivers.length})
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {applications.length === 0 && (
          <p className="rounded-xl border border-[#E3E7E1] bg-white p-3 text-center text-[12px] text-[#9BAAA1]">
            No pending {tab} applications.
          </p>
        )}
        {applications.map((app) => (
  <a
    key={app.id}
    href={
      tab === "stores"
        ? `/admin/stores/applications/${app.id}`
        : `/admin/drivers/applications/${app.id}`
    }
    className="flex items-center gap-3 rounded-xl border border-[#E3E7E1] bg-white p-3 transition-colors hover:bg-[#F5F7F3]"
  >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EFEC] text-[#145C43]">
              {tab === "stores" ? <Store size={16} /> : <Bike size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#16241D]">{app.name}</p>
              <p className="truncate text-[11.5px] text-[#6E7C74]">
                {app.category} · {formatDate(app.submittedDate)}
              </p>
            </div>
          </a>
        ))}
      </div>

      
        <a
  href={
    tab === "stores"
      ? "/admin/stores/applications"
      : "/admin/drivers/applications"
  }
  className="mt-3 block w-full text-center text-[12.5px] font-semibold text-[#145C43] hover:underline"
>
  View All Applications →
</a>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Approve Stores", icon: Store, href: "/admin/stores/applications" },
    { label: "Approve Drivers", icon: UserPlus2, href: "/admin/drivers/applications" },
    { label: "View Orders", icon: ClipboardList, href: "/admin/orders" },
    { label: "Export Reports", icon: Download, href: "/admin/reports" },
  ];

  return (
    <div>
      <h2 className="mb-3 text-[15px] font-semibold text-[#16241D]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
  const Icon = action.icon;

  return (
    <a
      key={action.label}
      href={action.href}
      className="flex flex-col items-center gap-2 rounded-xl bg-[#E8EFEC] px-3 py-4 text-center text-[12.5px] font-semibold text-[#145C43] transition-colors hover:bg-[#F5F7F3]"
    >
      <Icon size={18} />
      {action.label}
    </a>
  );
})}
      </div>
    </div>
  );
}

export default function ActionRail() {
  const { attentionItems, approvalQueue, actionRailLoading, actionRailError, fetchActionRail } = useDashboardState();

  useEffect(() => {
    fetchActionRail();
  }, [fetchActionRail]);

  return (
    <aside className="flex w-full xl:w-[340px] shrink-0 flex-col gap-5 sm:gap-7 rounded-2xl bg-white border border-[#E3E7E1] p-4 sm:p-5">
      {actionRailError ? (
        <p className="text-[13px] text-[#BA1A1A]">{actionRailError}</p>
      ) : actionRailLoading && attentionItems.length === 0 ? (
        <p className="text-[13px] text-[#6E7C74]">Loading…</p>
      ) : (
        <>
          <NeedsAttentionFeed items={attentionItems} />
          <div className="h-px bg-[#E3E7E1]" />
          <ApprovalQueue stores={approvalQueue.stores} drivers={approvalQueue.drivers} />
        </>
      )}
      <div className="h-px bg-[#E3E7E1]" />
      <QuickActions />
    </aside>
  );
}