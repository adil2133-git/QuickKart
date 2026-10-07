// storeShell.tsx
import React, { useState } from "react";
import { useNotificationsSync } from "../../shared/hooks/useNotifications";
import { useStoreOrderSocket } from "../hooks/useStoreOrderSocket";
import Sidebar from "../components/storeSidebar";
import Topbar from "../components/storeTopbar";

export function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Subscribes once (fetches existing notifications + listens for
  // socket "notification:new" events); Topbar reads from the shared
  // notification store directly, so no props need to be threaded here.
  useNotificationsSync();

  // Mounted once here (not per-page) so the live orders list AND whichever
  // order is currently open in the detail/packing pages both stay in sync —
  // previously this only ran on the orders list page, so a store staffer
  // sitting on an order's detail page never saw it flip to CANCELLED without
  // a manual refresh.
  useStoreOrderSocket();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-[#16241D]">
      <Sidebar
        storeName="QuickKart"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}