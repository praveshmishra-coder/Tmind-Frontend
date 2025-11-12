import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { Building2, Cpu, Network, AlertTriangle } from "lucide-react";
import { getDevices, getDeletedDeviced } from "@/api/deviceApi";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [totalDevices, setTotalDevices] = useState(0);
  const [deletedDevices, setDeletedDevices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch active devices
        const deviceRes = await getDevices(1, 100);
        const activeDevices = deviceRes.items || [];
        setTotalDevices(deviceRes.totalCount || activeDevices.length);

        // Fetch deleted devices
        const deletedRes = await getDeletedDeviced();
        setDeletedDevices(deletedRes?.length || 0);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        toast.error("Failed to fetch dashboard data!");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // Example logic for other KPIs (you can modify based on your backend)
  const departmentCount = 2; // Replace with API logic if available
  const totalAssets = totalDevices + 50; // Example derived metric
  const alertsToday = Math.floor(totalDevices * 0.05); // Simulated alerts = 5% of devices

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of manufacturing assets and devices
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Departments"
          value={departmentCount.toString()}
          icon={<Building2 className="h-8 w-8" />}
          trend="+2 this month"
          trendUp
        />
        <KPICard
          title="Active Devices"
          value={totalDevices.toString()}
          icon={<Cpu className="h-8 w-8" />}
          trend={`${deletedDevices} deleted`}
          trendUp={deletedDevices === 0}
        />
        <KPICard
          title="Total Assets"
          value={totalAssets.toString()}
          icon={<Network className="h-8 w-8" />}
          trend="+12 this week"
          trendUp
        />
        <KPICard
          title="Alerts Today"
          value={alertsToday.toString()}
          icon={<AlertTriangle className="h-8 w-8" />}
          trend="-3 from yesterday"
          trendUp={false}
        />
      </div>
    </div>
  );
}
