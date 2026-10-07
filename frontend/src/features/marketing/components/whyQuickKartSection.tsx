import { motion, type Variants } from "framer-motion";
import { Boxes, Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { scrollTo } from "../utils/scroll";

// Uploaded store imagery asset
import qualityControlBgImg from "../../../assets/quality-control-bg.webp";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.85,
      delay: i * 0.14,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const pillars = [
  {
    icon: Boxes,
    title: "Real Stock, Not Estimates",
    copy: "Inventory updates from partner store POS systems continuously. If an item is listed, it is physically on the supermarket shelf.",
  },
  {
    icon: Sparkles,
    title: "Smart Store Matching",
    copy: "Our engine automatically evaluates item availability, store distance, and delivery speed to match your order with the optimal store.",
  },
  {
    icon: ShieldCheck,
    title: "Store-Direct Prices",
    copy: "No arbitrary app markups. You pay the exact same shelf prices as walking directly into your local supermarket.",
  },
  {
    icon: Zap,
    title: "Dedicated Neighborhood Drivers",
    copy: "Local delivery partners assigned to specific neighborhood zones for fast 15-minute doorstep fulfillment.",
  },
];

export function WhyQuickKartSection() {
  return (
    <section className="bg-[#F7F8F5] px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        
        {/* ─── SECTION 1: FEATURE GRID ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          {/* Eyebrow Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#145C43]/20 bg-[#E8EFEC] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#145C43]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#145C43]" />
            BUILT FOR RELIABILITY
          </div>

          {/* Headline */}
          <h2 className="text-3xl leading-tight text-[#16241D] sm:text-4xl md:text-5xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Why QuickKart is faster & <br className="hidden sm:inline" /> more accurate
          </h2>

          {/* Subtext */}
          <p className="mt-4 text-sm text-[#6E7C74] leading-relaxed">
            We've redesigned grocery logistics from the ground up to ensure what you see is what you get, delivered in record time.
          </p>
        </motion.div>

        {/* 4-Column Feature Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between rounded-3xl bg-white p-7 transition-all duration-300 hover:shadow-xl"
            >
              <div>
                {/* 44px Circular Icon Badge */}
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[#145C43] text-white transition-transform duration-300 group-hover:scale-110">
                  <p.icon size={20} />
                </div>

                {/* Card Title */}
                <h3 className="mb-2 text-lg text-[#16241D]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>
                  {p.title}
                </h3>

                {/* Card Copy */}
                <p className="text-sm leading-relaxed text-[#6E7C74]">{p.copy}</p>
              </div>

              {/* Pinned Bottom Link */}
              <button
                onClick={() => scrollTo("how-it-works")}
                className="mt-6 text-xs font-bold text-[#145C43] inline-flex items-center gap-1.5 transition-all group-hover:gap-2 hover:underline text-left"
              >
                Learn more <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* ─── SECTION 2: QUALITY CONTROL SPLIT PANEL ───────────────────────── */}
        <div className="mt-24 md:mt-32 grid items-center gap-12 lg:grid-cols-12">
          
          {/* Left Column: Store Photo & Live Inventory Badge Overlay */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-6"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#E8EFEC] border border-[#E3E7E1]">
              <img
                src={qualityControlBgImg}
                alt="Organic Supermarket Inventory"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />

              {/* Overlaid Floating Card (Bottom-Left) */}
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:bottom-5 sm:left-5 max-w-full sm:max-w-xs rounded-2xl border border-white/80 bg-white/75 p-3.5 sm:p-4 backdrop-blur-md shadow-lg text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#145C43] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#145C43] animate-pulse" />
                  LIVE INVENTORY
                </p>
                <p className="mt-1 text-xs text-[#16241D] font-medium leading-relaxed">
                  Sourcing from Whole Foods, Downtown Market...
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Quality Control Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center lg:col-span-6 text-left"
          >
            {/* Serif Headline */}
            <h2
              className="text-3xl text-[#16241D] md:text-4xl lg:text-5xl leading-tight"
              style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
            >
              Uncompromising Quality <br /> Control
            </h2>

            {/* Paragraph Body Copy */}
            <p className="mt-5 text-sm text-[#6E7C74] leading-relaxed max-w-lg">
              Every item picked by our dedicated shoppers undergoes a strict 5-point quality check. We don't just deliver groceries; we deliver peace of mind.
            </p>

            {/* Checklist of 2 Items */}
            <div className="mt-8 space-y-5">
              {/* Item 1 */}
              <div className="flex items-start gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8EFEC] text-[#145C43] mt-0.5">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#16241D]">Freshness Verification</h4>
                  <p className="text-xs text-[#6E7C74] mt-0.5">We check expiry dates and produce ripeness manually.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8EFEC] text-[#145C43] mt-0.5">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#16241D]">Temperature Control</h4>
                  <p className="text-xs text-[#6E7C74] mt-0.5">Insulated bags used for all perishables and frozen goods.</p>
                </div>
              </div>
            </div>

            {/* Solid Deep Green Pill Action Button */}
            <div className="mt-9">
              <Link
                to="/register/customer"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-[#0A1F17] px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#145C43] hover:shadow-xl active:scale-98"
              >
                Experience the Difference <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
