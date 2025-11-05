import { NavLink } from "react-router-dom";
import {
  Home,
  Network,
  Cpu,
  Activity,
  FileText,
  Settings,
} from "lucide-react";

const menuItems = [
  { icon: <Home size={18} />, label: "Dashboard", path: "/dashboard" },
  { icon: <Network size={18} />, label: "Assets", path: "/assets" },
  { icon: <Cpu size={18} />, label: "Devices", path: "/devices" },
  { icon: <Activity size={18} />, label: "Signals", path: "/signals" },
  { icon: <FileText size={18} />, label: "Reports", path: "/reports" },
  { icon: <Settings size={18} />, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-4">
      {/* Brand / Logo */}
      <div className="text-2xl font-bold mb-6 text-sidebar-primary tracking-wide">
        Tmind
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-lg transition cursor-pointer ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
