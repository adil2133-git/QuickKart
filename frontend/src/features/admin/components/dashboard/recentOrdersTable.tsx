import { useEffect, useState } from "react";
import { Search, Download } from "lucide-react";
import { useDashboardState, type OrderStatusLabel, type PaymentLabel } from "../../state/dashboardState";

// Admin Recent Orders Table displaying live orders slice with debounced search.
// Data sourced from GET /admin/dashboard/recent-orders.

const STATUS_STYLES: Record<OrderStatusLabel, string> = {
  Delivered: "bg-[#E8EFEC] text-[#145C43]",
  Processing: "bg-[#FEF3C7] text-[#B47800]",
  "Out for Delivery": "bg-[#E8EFEC] text-[#145C43]",
  Cancelled: "bg-[#FBEAEA] text-[#BA1A1A]",
};

const PAYMENT_STYLES: Record<PaymentLabel, string> = {
  Online: "bg-[#E8EFEC] text-[#145C43] border-[#E3E7E1]",
  COD: "bg-[#FEF3C7] text-[#B47800] border-[#E3E7E1]",
};

function formatAmount(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function exportCsv(orders: { id: string; customer: string; store: string; amount: number; payment: string; status: string }[]) {
  const header = ["Order ID", "Customer", "Store", "Amount", "Payment", "Status"];
  const rows = orders.map((o) => [o.id, o.customer, o.store, o.amount, o.payment, o.status]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recent-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecentOrdersTable() {
  const [query, setQuery] = useState("");
  const { recentOrders, recentOrdersLoading, recentOrdersError, fetchRecentOrders } = useDashboardState();

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Debounce server-side search so we're not firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => fetchRecentOrders(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E7E1] px-4 sm:px-6 py-4 sm:py-5">
        <h2 className="text-[16px] font-semibold text-[#16241D]">Recent Orders</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#E3E7E1] bg-[#F5F7F3] px-2.5 py-1.5 flex-1 sm:flex-initial">
            <Search size={14} className="text-[#9BAAA1] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full sm:w-28 bg-transparent text-[12.5px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
            />
          </div>
          <button
            onClick={() => exportCsv(recentOrders)}
            disabled={recentOrders.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#145C43] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#114E39] disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-[#9BAAA1]">
              <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Order ID</th>
              <th className="px-3 py-3 whitespace-nowrap">Customer</th>
              <th className="px-3 py-3 whitespace-nowrap">Store</th>
              <th className="px-3 py-3 whitespace-nowrap">Amount</th>
              <th className="px-3 py-3 whitespace-nowrap">Payment</th>
              <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrdersError && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#BA1A1A]">
                  {recentOrdersError}
                </td>
              </tr>
            )}

            {!recentOrdersError && recentOrdersLoading && recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#9BAAA1]">
                  Loading…
                </td>
              </tr>
            )}

            {!recentOrdersError &&
              recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-[#E3E7E1] text-[13.5px] text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
                >
                  <td className="px-4 sm:px-6 py-3.5 font-medium text-[#145C43] whitespace-nowrap">{order.id}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap">{order.customer}</td>
                  <td className="px-3 py-3.5 text-[#6E7C74] whitespace-nowrap">{order.store}</td>
                  <td className="px-3 py-3.5 font-semibold whitespace-nowrap">{formatAmount(order.amount)}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${PAYMENT_STYLES[order.payment]}`}
                    >
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

            {!recentOrdersError && !recentOrdersLoading && recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#9BAAA1]">
                  No orders match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#E3E7E1] px-4 sm:px-6 py-4 text-right">
        <button className="text-[13px] font-semibold text-[#145C43] hover:underline">
          View All Orders →
        </button>
      </div>
    </div>
  );
}