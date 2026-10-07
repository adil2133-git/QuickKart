import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Printer } from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import { useFetchOrderDetail } from "../hooks/useStoreOrders";

// ─── Confetti particle ────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
  shape: "square" | "diamond";
  opacity: number;
}

const CONFETTI_COLORS = ["#1F4D3D", "#A9CC3B", "#E7EFEA", "#6E7C74", "#F5F7F3", "#16241D"];

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rotation: Math.random() * 360,
      vr: (Math.random() - 0.5) * 6,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: Math.random() > 0.5 ? "square" : "diamond",
      opacity: 0.7 + Math.random() * 0.3,
    }));

    let animId: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, 0);
          ctx.lineTo(0, p.size / 2);
          ctx.lineTo(-p.size / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackingCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchDetail = useFetchOrderDetail();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useConfetti(canvasRef as React.RefObject<HTMLCanvasElement>);

  const { selectedOrder, packingItems } = useStoreOrdersStore();

  useEffect(() => {
    if (id && !selectedOrder) fetchDetail(id);
  }, [id, selectedOrder, fetchDetail]);

  const order = selectedOrder;
  const totalItemsPacked = packingItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#F7F8F5] font-['Inter',sans-serif]">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* ── Completion card ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-4 sm:px-6 py-6 overflow-y-auto">
        {/* Badge chip at top */}
        {order && (
          <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#E3E7E1] bg-white px-3.5 sm:px-4 py-2 shadow-sm text-center">
            <span className="text-xs sm:text-sm font-semibold text-[#16241D]">
              Order #{order.orderNumber}
            </span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-[#1F4D3D]" />
            <span className="rounded-full bg-[#E7EFEA] px-2 py-0.5 text-xs font-semibold text-[#1F4D3D]">
              Packing Completed
            </span>
          </div>
        )}

        {/* Check icon */}
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#1F4D3D] shadow-lg">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
        </div>

        <h2 className="mt-4 sm:mt-5 text-xl sm:text-2xl font-bold text-[#16241D] text-center">Order Ready for Pickup</h2>
        <p className="mt-2 max-w-sm text-center text-xs sm:text-sm text-[#6E7C74]">
          Excellent work! Order #{order?.orderNumber ?? "—"} has been meticulously packed and
          verified for quality.
        </p>

        {/* Confirmation details card */}
        <div className="mt-5 sm:mt-6 w-full rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7EFEA]">
              <span className="text-sm">ℹ️</span>
            </div>
            <span className="text-sm font-bold text-[#16241D]">Confirmation Details</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-[#6E7C74]">
            Order #{order?.orderNumber ?? "—"} has been marked as ready. The customer and the
            courier service have been automatically notified via SMS and App alert.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F5F7F3] p-3.5 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">
                Customer
              </p>
              <p className="mt-1 text-sm font-semibold text-[#16241D]">
                {order?.recipientName ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F7F3] p-3.5 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6E7C74]">
                Items Packed
              </p>
              <p className="mt-1 text-sm font-semibold text-[#16241D]">
                {totalItemsPacked > 0 ? `${totalItemsPacked} Products` : `${order?.itemCount ?? 0} Products`}
              </p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate("/store/orders")}
            className="w-full sm:w-auto rounded-full bg-[#1F4D3D] px-6 sm:px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#163D30] cursor-pointer text-center"
          >
            Back to Orders
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-[#E3E7E1] bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#1F4D3D] shadow-sm transition-colors hover:bg-[#F5F7F3] cursor-pointer text-center">
            <Printer className="h-4 w-4" />
            Print Shipping Label
          </button>
        </div>

        {/* Pickup time */}
        <div className="mt-4 sm:mt-5 flex items-center gap-2 rounded-full border border-[#E3E7E1] bg-white/80 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-[#6E7C74] shadow-sm backdrop-blur-sm text-center">
          <Clock className="h-4 w-4 text-[#1F4D3D] shrink-0" />
          <span>Scheduled for pickup at 4:30 PM Today</span>
        </div>
      </div>
    </div>
  );
}