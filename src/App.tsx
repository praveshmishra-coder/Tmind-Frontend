import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Devices from "./pages/Devices";
import AddDeviceForm from "./devices/AddDevice";
import EditDeviceForm from "./devices/EditDevice";
import ConfigureDeviceForm from "./devices/ConfigureDevice";
import Signals from "./pages/Signals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes (Dashboard pages) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/add" element={<AddDeviceForm />} />
          <Route path="/devices/edit" element={<EditDeviceForm />} />
          <Route path="/devices/config" element={<ConfigureDeviceForm/>} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirect unknown routes to login */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </Router>
  );
}
