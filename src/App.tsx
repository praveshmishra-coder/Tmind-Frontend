import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Devices from "./pages/Devices";
import AddDeviceForm from "./devices/AddDevice";
import EditDeviceForm from "./devices/EditDevice";
import ConfigureDeviceForm from "./devices/ConfigureDevice";
import PortSettings from "./devices/PortSettings";
import UploadCsvModal from "./devices/UploadDeviceCsv";
import Signals from "./pages/Signals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DeletedDevices from "./devices/DeletedDevices";
import Profile from "./pages/Profile";
import AddPortForm from "./pages/AddPortsForm";
import { TooltipProvider } from "@/components/ui/tooltip"; // from your shadcn tooltip file

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>

          <Route path="/" element={<Login />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/add" element={<AddDeviceForm />} />
            <Route path="/devices/edit/:deviceId" element={<EditDeviceForm />} />
            <Route path="/devices/config/:deviceId" element={<ConfigureDeviceForm />} />
            <Route path="/devices/ports" element={<PortSettings />} />
            <Route path="/devices/ports/:id" element={<AddPortForm />} />
            <Route path="/devices/upload" element={<UploadCsvModal />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/deleted-devices" element={<DeletedDevices />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Redirect unknown routes to login */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </Router>
    </TooltipProvider>
  );
}