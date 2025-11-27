import { useEffect, useState } from "react";
import { Building2, Cpu, Network, AlertTriangle, TrendingUp, Activity, CheckCircle2, Clock } from "lucide-react";
import { getDevices, getDeletedDeviced } from "@/api/deviceApi";
import { getAssetHierarchy } from "@/api/assetApi";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const KPICard = ({ title, value, icon, trend, trendUp, status } : any) => (
  <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-4xl font-bold text-foreground mb-3">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className={`text-xs font-semibold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend}
            </p>
          </div>
        )}
        {status && (
          <p className="text-xs text-muted-foreground mt-2">{status}</p>
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
          <div className="text-primary group-hover:text-primary/80 transition-colors">
            {icon}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value, icon, colorClass }:any) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [totalDevices, setTotalDevices] = useState(0);
  const [deletedDevices, setDeletedDevices] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [plantCount, setPlantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Active devices
        const deviceRes = await getDevices(1, 100);
        setTotalDevices(deviceRes.totalCount || deviceRes.items?.length || 0);

        // Deleted devices
        if (isAdmin) {
          const deletedRes = await getDeletedDeviced();
          setDeletedDevices(deletedRes?.length || 0);
        }

        // Assets
        const assets = await getAssetHierarchy();

        // Recursive function to count all assets
        const countAssets = (nodes:any) => {
          let count = 0;
          nodes.forEach((node:any) => {
            count += 1;
            if (node.childrens && node.childrens.length > 0) {
              count += countAssets(node.childrens);
            }
          });
          return count;
        };

        setTotalAssets(countAssets(assets || []));

        // Count departments (level 2 assets)
        const countDepartments = (nodes:any) => {
          let count = 0;
          nodes.forEach((node:any) => {
            if (node.level === 2) count += 1;
            if (node.childrens && node.childrens.length > 0) {
              count += countDepartments(node.childrens);
            }
          });
          return count;
        };
        setDepartmentCount(countDepartments(assets || []));

        // Count plants (level 1 assets)
        const countPlants = (nodes:any) => {
          let count = 0;
          nodes.forEach((node:any) => {
            if (node.level === 1) count += 1;
          });
          return count;
        };
        setPlantCount(countPlants(assets || []));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        toast.error("Failed to fetch dashboard data!");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  if (loading) {
 return (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
    <p className="text-blue-600 font-semibold tracking-wide">
      Loading dashboard data...
    </p>
  </div>
);

  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  const activeDevices = totalDevices - deletedDevices;
  const uptime = 99.8;
  const alertsToday = Math.floor(totalDevices * 0.05);
  const efficiency = 94.2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-border/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-1">Manufacturing Dashboard</h1>
                <p className="text-muted-foreground">Tmind - Real-time Plant Monitoring System</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-500">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Primary KPIs - 5 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Plants"
              value={plantCount}
              icon={<Building2 className="w-8 h-8" />}
              trend="+0 this year"
              trendUp={true}
            />
            <KPICard
              title="Departments"
              value={departmentCount}
              icon={<Building2 className="w-8 h-8" />}
              trend="+1 this month"
              trendUp={true}
            />
            <KPICard
              title="Total Assets"
              value={totalAssets}
              icon={<Network className="w-8 h-8" />}
              trend="+12 this week"
              trendUp={true}
            />
            {isAdmin ? (
              <KPICard
                title="Active Devices"
                value={activeDevices}
                icon={<Cpu className="w-8 h-8" />}
                status={`${deletedDevices} offline`}
                trendUp={true}
              />
            ) : (
              <KPICard
                title="Active Devices"
                value={totalDevices}
                icon={<Cpu className="w-8 h-8" />}
              />
            )}
            <KPICard
              title="Alerts Today"
              value={alertsToday}
              icon={<AlertTriangle className="w-8 h-8" />}
              trend="-3 from yesterday"
              trendUp={true}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              label="System Uptime"
              value={`${uptime}%`}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              colorClass="bg-emerald-500/20 border border-emerald-500/30"
            />
            <StatBox
              label="Plant Efficiency"
              value={`${efficiency}%`}
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
              colorClass="bg-primary/20 border border-primary/30"
            />
            <StatBox
              label="Avg Response Time"
              value="245ms"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              colorClass="bg-amber-500/20 border border-amber-500/30"
            />
            <StatBox
              label="Critical Issues"
              value="0"
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              colorClass="bg-red-500/20 border border-red-500/30"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Status Overview */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Device Status Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Devices</span>
                    <span className="text-sm font-semibold text-emerald-500">{activeDevices}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full transition-all duration-500" 
                      style={{width: totalDevices > 0 ? `${(activeDevices/totalDevices)*100}%` : '0%'}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Offline Devices</span>
                    <span className="text-sm font-semibold text-red-500">{deletedDevices}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-red-500 h-full transition-all duration-500" 
                      style={{width: totalDevices > 0 ? `${(deletedDevices/totalDevices)*100}%` : '0%'}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  {[75, 82, 88, 92, 95, 94, 89, 91].map((val, i) => (
                    <div key={i} className="flex-1 bg-white/10 rounded-t-lg overflow-hidden" style={{height: `${val}%`, minHeight: '20px'}}>
                      <div className="w-full h-full bg-gradient-to-t from-primary to-primary/60"></div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">Last 8 Hours Performance</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-muted-foreground text-sm py-4">
            <p>Last updated: {new Date().toLocaleTimeString()} | Tmind Manufacturing Intelligence Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}