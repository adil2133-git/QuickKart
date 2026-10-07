import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import KpiStrip from "../components/dashboard/kpistrip";
import OperationsIntelligence from "../components/dashboard/operationsIntelligence";
import RecentOrdersTable from "../components/dashboard/recentOrdersTable";
import ActionRail from "../components/dashboard/actionRail";

export default function Dashboard() {
    return (
        <div className="flex h-screen w-full bg-white text-[#16241D]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden min-w-0">
                <TopBar pageTitle="Dashboard" />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 py-4 sm:py-6">
                    <div className="flex flex-col xl:flex-row items-start gap-6">
                        {/* Left: monitoring feed */}
                        <div className="flex min-w-0 w-full xl:flex-1 flex-col gap-4 sm:gap-6">
                            <KpiStrip />
                            <OperationsIntelligence />
                            <RecentOrdersTable />
                        </div>

                        {/* Right: action rail */}
                        <div className="w-full xl:w-[340px] xl:sticky xl:top-0 shrink-0 self-start">
                            <ActionRail />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}