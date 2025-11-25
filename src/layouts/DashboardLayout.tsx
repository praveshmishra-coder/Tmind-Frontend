import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
  
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex flex-col flex-1">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-2 md:p-2 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
