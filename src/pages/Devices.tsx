import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Wrench, Search, HdmiPort, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDevices, deleteDevice } from "@/api/deviceApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Device {
  deviceId: string;
  name: string;
  description: string;
  protocol: string;
  deviceConfiguration?: {
    configurationId: string;
    name: string;
    pollIntervalMs: number;
    protocolSettingsJson: string;
  };
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const navigate = useNavigate();

  // Fetch all devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const data = await getDevices();
        setDevices(data);
      } catch (err: any) {
        console.error("Error fetching devices:", err);
        setError("Failed to fetch devices.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Delete device API call
  const handleDelete = async () => {
    if (!selectedDevice) return;
    try {
      await deleteDevice(selectedDevice.deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== selectedDevice.deviceId));
      toast.success(`Device "${selectedDevice.name}" deleted successfully!`);
    } catch (err) {
      console.error("Error deleting device:", err);
      toast.error("Failed to delete device. Please try again.");
    } finally {
      setOpenDialog(false);
      setSelectedDevice(null);
    }
  };

  // Filter devices by search term
  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devices</h1>
          <p className="text-muted-foreground">Manage all connected devices</p>
        </div>
        <Button
          onClick={() => navigate("/devices/add")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add Device
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <div className="text-center text-muted-foreground">Loading devices...</div>}
      {error && <div className="text-center text-destructive">{error}</div>}

      {/* Device Table */}
      {!loading && !error && (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-foreground">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-4 font-semibold">Device Name</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((d) => (
                <tr
                  key={d.deviceId}
                  className="border-t border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4">{d.description}</td>
                  <td className="p-4 flex justify-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/devices/edit/${d.deviceId}`)}
                      className="flex items-center gap-1"
                    >
                      <Settings className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/devices/config/${d.deviceId}`)}
                      className="flex items-center gap-1"
                    >
                      <Wrench className="h-4 w-4" /> Config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/devices/ports`)}
                      className="flex items-center gap-1"
                    >
                      <HdmiPort className="h-4 w-4" /> Ports
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSelectedDevice(d);
                        setOpenDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-6 text-muted-foreground">
                    No devices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md border border-border shadow-2xl rounded-2xl p-6 bg-card
               animate-in fade-in-0 zoom-in-95 duration-200
               flex flex-col items-center justify-center text-center mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 w-full ">
            {/* Warning Icon */}
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>

            {/* Message */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{selectedDevice?.name}"
              </span>
              ?
            </p>

            {/* Buttons */}
            <DialogFooter className="flex w-full justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                className="w-[45%] hover:bg-muted"
              >
                No,Keep it
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-[45%] bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Delete it
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
