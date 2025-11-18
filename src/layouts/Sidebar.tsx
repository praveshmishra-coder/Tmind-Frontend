import { NavLink } from "react-router-dom";
import {
  Home,
  Network,
  Cpu,
  Activity,
  FileText,
  Settings,
  Trash 
} from "lucide-react";

const menuItems = [
  { icon: <Home size={18} />, label: "Dashboard", path: "/dashboard" },
  { icon: <Network size={18} />, label: "Assets", path: "/assets" },
  { icon: <Cpu size={18} />, label: "Devices", path: "/devices" },
  { icon: <Activity size={18} />, label: "Signals", path: "/signals" },
  // { icon: <FileText size={18} />, label: "Reports", path: "/reports" },
  // { icon: <Settings size={18} />, label: "Settings", path: "/settings" },
  { icon: <Trash size={18} />, label: "Deleted Devices", path: "/deleted-devices" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-4">
      
     
      <div className="h-12 flex items-center justify-center border-b border-sidebar-border px-4 mb-6">
      <div className="flex items-center gap-2">
            <div className="w-12 h-12 mb-2  bg-primary rounded flex items-center justify-center font-bold text-primary-foreground">
              <img className="mb-2 rounded" src="https://www.purppledesigns.com/wp-content/uploads/2023/11/download-4.png" alt="" />
            </div>
            <span className="font-bold text-2xl mb-2 text-sidebar-foreground">Tmind</span>
      </div>
      </div>

      
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
