// pages/About.tsx
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  ShoppingCart, ArrowRight, MapPin, Boxes, Sparkles, Radar,
  Store, Bike, Users, Zap, Clock3,
} from "lucide-react";
import {Navbar} from '../components/navbar';
import {Footer} from '../components/footer';

/* ─── motion presets ─────────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-[#0D2B21] px-6 pb-24 pt-20 text-white">
      {/* dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      {/* decorative arc */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full border border-[#8FCDB0]/10" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-[320px] w-[320px] rounded-full border border-[#8FCDB0]/[0.07]" />

      <div className="relative mx-auto max-w-4xl">
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.span
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8FCDB0]/30 bg-[#8FCDB0]/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#8FCDB0]"
          >
            <MapPin size={13} /> Hyperlocal · Built for neighbourhoods
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-[4rem] leading-[1.1] tracking-tight"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Grocery delivery that
            <br />
            <span className="italic text-[#8FCDB0]">actually works.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-white/65">
            QuickKart was built around one honest insight: the nearest store isn't always the right store. We connect customers with the nearby supermarket that genuinely has what they need — checked in real time, delivered fast.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">
            <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-[#8FCDB0]" /> Real-time inventory</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-[#8FCDB0]" /> Hyperlocal delivery</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-[#8FCDB0]" /> Four-stakeholder ecosystem</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Problem → Solution ─────────────────────────────────────────────────── */

const problems = [
  { title: "Products marked available, then out of stock", body: "Traditional platforms rely on warehouse estimates. Customers discover the shortage only after ordering — too late." },
  { title: "Local stores left behind", body: "Neighbourhood supermarkets have the stock, the proximity, and loyal customers. But they lack the digital infrastructure to compete online." },
  { title: "Deliveries from far away", body: "Centralised fulfilment centres add distance and cost to every order. The answer — literally around the corner — goes unused." },
];

function ProblemSolution() {
  return (
    <section className="bg-[#F7F8F5] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Problem */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#145C43]">The problem we saw</p>
          <h2 className="mb-10 max-w-xl text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Grocery delivery was broken in three ways
          </h2>

          <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 md:grid-cols-3">
            {problems.map((p, i) => (
              <motion.div key={p.title} custom={i} variants={fadeUp} className="rounded-2xl border border-[#16241D]/[0.07] bg-white p-7">
                <span className="mb-4 block h-1 w-8 rounded-full bg-[#145C43]" />
                <h3 className="mb-2 text-[1rem] font-semibold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>{p.title}</h3>
                <p className="text-sm leading-relaxed text-[#16241D]/60">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Solution */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="overflow-hidden rounded-3xl bg-[#0D2B21] p-10 text-white md:p-14"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8FCDB0]">Our answer</p>
          <h2 className="mb-6 max-w-2xl text-3xl md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Find the nearest store that <span className="italic text-[#8FCDB0]">actually has it.</span>
          </h2>
          <p className="max-w-2xl text-[1.02rem] leading-relaxed text-white/65">
            QuickKart syncs inventory with partner supermarkets in real time and ranks them by availability, distance, delivery speed, rating, and price. Customers see only stores that can genuinely fulfil their order — before they place it.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How the platform works ─────────────────────────────────────────────── */

const platformFeatures = [
  {
    icon: Boxes,
    title: "Real-time inventory sync",
    body: "Stores update their product catalogue live. Availability data is never more than a minute stale, so customers see accurate stock before clicking order.",
  },
  {
    icon: Sparkles,
    title: "Smart store ranking",
    body: "Our ranking algorithm weighs five factors — availability, distance, delivery speed, store rating, and price — to surface the best match automatically.",
  },
  {
    icon: Radar,
    title: "Automated driver assignment",
    body: "When a store marks an order ready, the system finds the nearest available driver and sends the request. No manual dispatch, no idle wait.",
  },
  {
    icon: MapPin,
    title: "Live delivery tracking",
    body: "Customers follow their order from store shelf to front door in real time. Stores and drivers get status updates throughout.",
  },
];

function HowItWorks() {
  return (
    <section className="bg-[#F5F7F3] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#145C43]">Under the hood</p>
          <h2 className="max-w-xl text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            How the platform works
          </h2>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2">
          {platformFeatures.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={fadeUp} className="flex gap-5 rounded-2xl border border-[#16241D]/[0.07] bg-white p-7">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#145C43]/15 text-[#145C43]">
                <f.icon size={19} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="mb-1.5 text-[1rem] font-semibold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#16241D]/60">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Ecosystem / Stakeholders ───────────────────────────────────────────── */

const stakeholders = [
  {
    icon: ShoppingCart,
    role: "Customers",
    body: "Search for groceries, compare live availability across nearby stores, add to cart, choose online payment or cash on delivery, and track the delivery in real time.",
    cta: "Start shopping",
    route: "/register/customer",
  },
  {
    icon: Store,
    role: "Store partners",
    body: "List your supermarket, keep inventory live, accept or reject orders, manage packing, and access analytics on revenue and best-selling products.",
    cta: "Register your store",
    route: "/register/store",
  },
  {
    icon: Bike,
    role: "Delivery partners",
    body: "Go online when you're ready, accept delivery requests, earn per delivery plus distance pay, daily bonuses, and level-based incentives.",
    cta: "Start delivering",
    route: "/register/delivery",
  },
  {
    icon: Users,
    role: "Administrators",
    body: "Approve stores and drivers, monitor platform-wide performance, manage settlements, handle complaints, and access full operational analytics.",
    cta: null,
    route: null,
  },
];

function Ecosystem() {
  return (
    <section className="bg-[#F7F8F5] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#145C43]">The ecosystem</p>
          <h2 className="max-w-xl text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Four participants, one platform
          </h2>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2">
          {stakeholders.map((s, i) => (
            <motion.div
              key={s.role} custom={i} variants={fadeUp}
              className="group flex flex-col rounded-3xl border border-[#16241D]/[0.07] bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#16241D]/[0.05]"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#145C43]/15 text-[#145C43] transition-colors group-hover:bg-[#145C43] group-hover:text-white">
                <s.icon size={20} strokeWidth={2} />
              </span>
              <h3 className="mb-2 text-xl text-[#16241D]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>{s.role}</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#16241D]/60">{s.body}</p>
              {s.cta && s.route && (
                <Link
                  to={s.route}
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#145C43] transition-colors hover:text-[#16241D]"
                >
                  {s.cta} <ArrowRight size={14} />
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Mission / Vision ───────────────────────────────────────────────────── */

function Mission() {
  return (
    <section className="bg-[#0D2B21] px-6 py-24 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.p variants={fadeUp} className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8FCDB0]">
            What we're building toward
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mb-8 text-3xl leading-snug md:text-[2.6rem]"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Bridging local retail and <br className="hidden md:block" />
            <span className="italic text-[#8FCDB0]">modern digital commerce.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-[1.02rem] leading-relaxed text-white/65">
            Neighbourhood supermarkets already have the stock, the knowledge, and the community trust. QuickKart gives them the digital infrastructure — real-time inventory, intelligent routing, automated logistics — so they can compete and thrive alongside large chains. We believe faster, more transparent grocery delivery should be built on the stores already in your neighbourhood, not warehouses built to replace them.
          </motion.p>

          <motion.div variants={container} className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 grid-cols-1 sm:grid-cols-3">
            {[
              { stat: "40+",     label: "Neighbourhoods served" },
              { stat: "3 roles", label: "One unified platform" },
              { stat: "< 1 min", label: "Inventory sync interval" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="bg-[#0D2B21] px-8 py-10">
                <p className="text-3xl font-semibold text-[#8FCDB0]" style={{ fontFamily: "Fraunces, serif" }}>{s.stat}</p>
                <p className="mt-1 text-sm text-white/55">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */

function AboutCTA() {
  return (
    <section className="bg-[#F7F8F5] px-6 py-24">
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="mb-4 text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
          Ready to join QuickKart?
        </h2>
        <p className="mb-8 text-[1rem] leading-relaxed text-[#16241D]/60">
          Whether you want faster groceries, a bigger customer base for your store, or flexible delivery earnings — there's a place for you.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Link to="/register/customer" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#145C43] px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#114E39]">
            Order groceries <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/register/store" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#16241D]/15 px-6 py-3.5 text-sm font-semibold text-[#16241D] transition-colors hover:bg-[#16241D]/[0.04]">
            Partner your store
          </Link>
          <Link to="/register/delivery" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#16241D]/15 px-6 py-3.5 text-sm font-semibold text-[#16241D] transition-colors hover:bg-[#16241D]/[0.04]">
            Become a driver
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function QuickKartAbout() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] font-[Inter] text-[#16241D] antialiased">
      <Navbar />
      <AboutHero />
      <ProblemSolution />
      <HowItWorks />
      <Ecosystem />
      <Mission />
      <AboutCTA />
      <Footer />
    </div>
  );
}