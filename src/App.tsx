import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Devices from "./pages/Devices";
import Signals from "./pages/Signals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          {/* Default route redirects to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
