import { motion, type Variants } from "framer-motion";
import { ArrowRight, MapPin, Clock3, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { scrollTo } from "../utils/scroll";
import heroBgImg from "../../../assets/hero-bg1.webp";

/* ─── Motion Variants for Fluid Staggered Entrance ────────────────────────── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const heroImageVariants: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 0.85,
    scale: 1,
    transition: {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#F7F8F5]">
      {/* Animated Parallax Background Hero Image */}
      <div className="absolute inset-0 z-0 min-h-full w-full overflow-hidden">
        <motion.img
          src={heroBgImg}
          alt="Fresh Organic Produce Background"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          initial="hidden"
          animate="visible"
          variants={heroImageVariants}
          className="h-full w-full object-cover object-center"
        />
        {/* Soft Radial & Linear Gradient Overlay for perfect text contrast & full produce image visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/50 to-[#F7F8F5]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/50 via-transparent to-transparent" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center md:pb-28 md:pt-24"
      >
        {/* Top Floating Pill Badge with Smooth Gentle Float Animation */}
        <motion.div
          variants={itemVariants}
          animate={{ y: [0, -6, 0] }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            },
          }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#145C43]/20 bg-white/85 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#145C43] shadow-md backdrop-blur-md transition-shadow hover:shadow-lg"
        >
          <span className="h-2 w-2 rounded-full bg-[#145C43] animate-pulse" />
          Hyperlocal Neighborhood Inventory
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="max-w-4xl text-3xl leading-[1.12] tracking-tight text-[#0D2B21] sm:text-4xl md:text-6xl"
          style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
        >
          Your neighborhood grocery, <br />
          <motion.span
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="inline-block italic font-serif text-[#145C43]"
          >
            delivered fresh.
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-5 max-w-2xl text-sm leading-relaxed text-[#16241D]/80 sm:mt-6 sm:text-base md:text-lg"
        >
          Real-time stock tracking from your local supermarkets. No more missing items—just the freshest harvest from your community, delivered in 15 minutes.
        </motion.p>

        {/* Action Buttons Row */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Link
              to="/register/customer"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0D2B21] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#145C43] hover:shadow-xl hover:shadow-[#0D2B21]/20 sm:w-auto sm:px-8 sm:py-4"
            >
              Start Shopping Now <ArrowRight size={17} className="transition-transform group-hover:translate-x-1.5" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <button
              onClick={() => scrollTo("how-it-works")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-7 py-3.5 text-sm font-semibold text-[#16241D] shadow-md backdrop-blur-md transition-all hover:bg-white hover:shadow-lg sm:w-auto sm:px-8 sm:py-4 cursor-pointer"
            >
              How it Works
            </button>
          </motion.div>
        </motion.div>

        {/* 3 Feature Badges at Bottom of Hero with Micro Hover Elevations */}
        <motion.div
          variants={itemVariants}
          className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-8 border-t border-[#E3E7E1]/60 pt-10 sm:grid-cols-3"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="flex flex-col items-center text-center cursor-default p-2 rounded-2xl transition-colors hover:bg-white/40"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <MapPin size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">Hyperlocal Stores</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">500+ Partner Supermarkets</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="flex flex-col items-center text-center cursor-default p-2 rounded-2xl transition-colors hover:bg-white/40"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <Clock3 size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">99.4% Accuracy</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">Live POS Stock Sync</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="flex flex-col items-center text-center cursor-default p-2 rounded-2xl transition-colors hover:bg-white/40"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <Zap size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">Express Delivery</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">Avg 15 Min Delivery</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
