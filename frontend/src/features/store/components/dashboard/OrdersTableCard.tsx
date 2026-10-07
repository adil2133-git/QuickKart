import { ChevronRight, MoreVertical } from "lucide-react";
import type { Order } from "../../types/dashboard";
import { formatCurrency, getAvatarColor, getInitials, getOrderStatusBadge } from "../../lib/dashboardUtils";

interface OrdersTableCardProps {
  orders: Order[];
  onViewAll?: () => void;
  onOrderMenuClick?: (order: Order) => void;
}

export default function OrdersTableCard({ orders, onViewAll, onOrderMenuClick }: OrdersTableCardProps) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-[#E3E7E1] bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#16241D]">Incoming Orders</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#1F4D3D] transition-colors hover:underline cursor-pointer"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 text-center">
          <p className="text-sm font-medium text-[#16241D]">No incoming orders right now</p>
          <p className="mt-1 text-sm text-[#6E7C74]">New orders will show up here as customers check out.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-[#E3E7E1] bg-[#F5F7F3] text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Order ID</th>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Customer</th>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Total</th>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const badge = getOrderStatusBadge(order.orderStatus);
                return (
                  <tr key={order._id} className="border-b border-[#E3E7E1] last:border-b-0">
                    <td className="whitespace-nowrap px-4 sm:px-6 py-3.5 text-sm font-semibold text-[#16241D]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            getAvatarColor(order.customerName),
                          ].join(" ")}
                        >
                          {getInitials(order.customerName)}
                        </span>
                        <span className="text-sm font-medium text-[#16241D]">{order.customerName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 sm:px-6 py-3.5 text-sm font-semibold text-[#16241D]">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 sm:px-6 py-3.5">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                          badge.className,
                        ].join(" ")}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 sm:px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOrderMenuClick?.(order)}
                        aria-label={`More actions for order ${order.orderNumber}`}
                        className="rounded-full p-1.5 text-[#6E7C74] transition-colors hover:bg-[#F5F7F3] hover:text-[#16241D] cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
