import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Trophy,
  Medal,
  Star,
  Award,
  Crown,
  Lock,
  CheckCircle2,
  Truck,
  Calendar,
} from "lucide-react";
import { useDriverRewardsStore } from "../state/driverRewardsState";
import { useDriverRewardsActions } from "../hooks/useDriverRewards";
import type { DriverTierKey, TierLadderEntry } from "../types/driverRewards";

// ── Motion helpers (matches driverDashboard.tsx / driverEarningsPage.tsx) ──────
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};

// ── Tier presentation ────────────────────────────────────────────────────────────
const TIER_META: Record<
  DriverTierKey,
  { icon: React.ComponentType<{ className?: string }>; gradient: string; textColor: string; ringColor: string }
> = {
  BRONZE: {
    icon: Medal,
    gradient: "from-[#6E7C74] to-[#16241D]",
    textColor: "text-[#6E7C74]",
    ringColor: "ring-[#6E7C74]/30",
  },
  SILVER: {
    icon: Award,
    gradient: "from-slate-400 to-slate-600",
    textColor: "text-slate-500",
    ringColor: "ring-slate-400/30",
  },
  GOLD: {
    icon: Trophy,
    gradient: "from-[#A9CC3B] to-emerald-600",
    textColor: "text-emerald-700",
    ringColor: "ring-[#A9CC3B]/40",
  },
  PLATINUM: {
    icon: Crown,
    gradient: "from-[#1F4D3D] to-[#163D30]",
    textColor: "text-[#1F4D3D]",
    ringColor: "ring-[#1F4D3D]/30",
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

// ── Hero tier card ────────────────────────────────────────────────────────────
function TierHeroCard() {
  const summary = useDriverRewardsStore((s) => s.summary);
  if (!summary) return null;

  const meta = TIER_META[summary.currentLevel];

  return (
    <motion.div
      variants={card}
      className="relative overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white p-4 sm:p-6"
    >
      <div className={`absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br ${meta.gradient} opacity-10 pointer-events-none`} />

      <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5 sm:gap-6">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-sm shrink-0`}>
              <meta.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6E7C74]">Current Tier</p>
              <h2 className={`text-xl sm:text-2xl font-bold ${meta.textColor}`}>{summary.currentLevelLabel} Partner</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {summary.currentPerks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-[#E7EFEA] px-2.5 sm:px-3 py-1 text-xs font-semibold text-[#1F4D3D]"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap sm:flex-nowrap sm:flex-shrink-0 gap-4 sm:gap-5 text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E3E7E1]">
          <div>
            <div className="flex items-center sm:justify-end gap-1 text-[#6E7C74]">
              <Truck className="h-3 w-3 text-[#1F4D3D]" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Deliveries</p>
            </div>
            <p className="mt-0.5 text-lg sm:text-xl font-bold text-[#16241D]">{summary.totalDeliveries}</p>
          </div>
          <div>
            <div className="flex items-center sm:justify-end gap-1 text-[#6E7C74]">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Rating</p>
            </div>
            <p className="mt-0.5 text-lg sm:text-xl font-bold text-[#16241D]">
              {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center sm:justify-end gap-1 text-[#6E7C74]">
              <Calendar className="h-3 w-3 text-[#1F4D3D]" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Since</p>
            </div>
            <p className="mt-0.5 text-lg sm:text-xl font-bold text-[#16241D]">{formatDate(summary.memberSince)}</p>
          </div>
        </div>
      </div>

      {/* Progress to next tier */}
      <div className="relative mt-6">
        {summary.nextLevel ? (
          <>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#6E7C74]">
                {summary.nextLevel.deliveriesRemaining} more deliveries to reach {summary.nextLevel.label}
              </span>
              <span className="font-bold text-[#16241D]">{summary.progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F5F7F3]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-[#E7EFEA] px-4 py-2.5 text-sm font-semibold text-[#1F4D3D]">
            <Crown className="h-4 w-4" />
            You've reached the highest tier — Platinum Partner!
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Tier ladder ───────────────────────────────────────────────────────────────
function TierLadderCard({ tier }: { tier: TierLadderEntry }) {
  const meta = TIER_META[tier.key];
  const locked = !tier.achieved;

  return (
    <motion.div
      variants={card}
      className={[
        "relative rounded-2xl border bg-white p-5 transition-all",
        tier.isCurrent
          ? `border-transparent ring-2 ${meta.ringColor} shadow-md`
          : "border-[#E3E7E1]",
        locked ? "opacity-60" : "",
      ].join(" ")}
    >
      {tier.isCurrent && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-[#1F4D3D] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Current
        </span>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient}`}>
          <meta.icon className="h-5 w-5 text-white" />
        </div>
        {tier.achieved ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Lock className="h-4 w-4 text-[#9BAAA1]" />
        )}
      </div>

      <p className={`text-base font-bold ${meta.textColor}`}>{tier.label}</p>
      <p className="mb-3 text-xs text-[#6E7C74]">{tier.minDeliveries}+ deliveries</p>

      <ul className="space-y-1.5">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-1.5 text-xs text-[#6E7C74]">
            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#1F4D3D]" />
            {perk}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ── Milestone badges ─────────────────────────────────────────────────────────────
function MilestonesCard() {
  const summary = useDriverRewardsStore((s) => s.summary);
  if (!summary) return null;

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6">
      <p className="mb-1 text-base font-bold text-[#16241D]">Delivery Milestones</p>
      <p className="mb-5 text-xs text-[#6E7C74]">Badges you unlock as you complete more deliveries</p>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {summary.milestones.map((m) => (
          <div key={m.deliveries} className="flex flex-col items-center gap-2 text-center">
            <div
              className={[
                "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2",
                m.achieved
                  ? "border-[#1F4D3D] bg-gradient-to-br from-[#1F4D3D] to-[#163D30]"
                  : "border-dashed border-[#E3E7E1] bg-[#F5F7F3]",
              ].join(" ")}
            >
              {m.achieved ? (
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[#9BAAA1]" />
              )}
            </div>
            <p className={`text-xs font-bold ${m.achieved ? "text-[#16241D]" : "text-[#9BAAA1]"}`}>
              {m.deliveries}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverRewardsPage() {
  const summary = useDriverRewardsStore((s) => s.summary);
  const isLoading = useDriverRewardsStore((s) => s.isLoading);
  const { fetchRewardsSummary } = useDriverRewardsActions();

  useEffect(() => {
    void fetchRewardsSummary();
  }, [fetchRewardsSummary]);

  if (isLoading && !summary) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="h-48 animate-pulse rounded-3xl bg-[#F5F7F3]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-[#F5F7F3]" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-4"
    >
      <TierHeroCard />

      <div>
        <p className="mb-3 text-base font-bold text-[#16241D]">Tier Ladder</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {summary.ladder.map((tier) => (
            <TierLadderCard key={tier.key} tier={tier} />
          ))}
        </div>
      </div>

      <MilestonesCard />
    </motion.div>
  );
}
