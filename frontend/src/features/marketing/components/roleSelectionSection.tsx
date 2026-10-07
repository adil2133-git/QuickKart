import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import storePartnerImg from "../../../assets/store1.webp";
import driverPartnerImg from "../../../assets/driver1.webp";
import customerImg from "../../../assets/customer1.webp";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 45 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.16, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function RoleSelectionSection() {
  return (
    <section id="join" className="bg-[#F7F8F5] px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-xl text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Get Started Today</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            One platform, three ways to join
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Customer Card */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -8 }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all duration-300 hover:shadow-2xl"
          >
            <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={customerImg}
                alt="Order Groceries"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-md backdrop-blur-sm">
                For Shoppers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Order Groceries</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Shop from nearby supermarkets with real-time stock verification. Get exact items delivered to your door in 15 minutes.
              </p>
              <Link
                to="/register/customer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] px-5 py-3 text-sm font-bold text-[#16241D] transition-all hover:bg-[#98B933] hover:shadow-md active:scale-98"
              >
                Start Shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Store Partner Card */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -8 }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all duration-300 hover:shadow-2xl"
          >
            <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={storePartnerImg}
                alt="Partner Store"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-md backdrop-blur-sm">
                For Supermarkets
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Partner Your Store</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Bring your supermarket online, sync inventory live via POS integration, and reach thousands of neighborhood customers daily.
              </p>
              <Link
                to="/register/store"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#145C43] px-5 py-3 text-sm font-bold text-[#145C43] transition-all hover:bg-[#145C43] hover:text-white hover:shadow-md active:scale-98"
              >
                Register Store <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Delivery Partner Card */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -8 }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all duration-300 hover:shadow-2xl"
          >
            <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={driverPartnerImg}
                alt="Become a Delivery Partner"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-md backdrop-blur-sm">
                For Drivers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Become a Driver</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Deliver on your own schedule with transparent per-order earnings, performance bonuses, and weekly direct payouts.
              </p>
              <Link
                to="/register/delivery"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#145C43] px-5 py-3 text-sm font-bold text-[#145C43] transition-all hover:bg-[#145C43] hover:text-white hover:shadow-md active:scale-98"
              >
                Start Delivering <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
