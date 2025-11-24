import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search } from "lucide-react";
import { getDeletedDeviced, retriveDeviceById } from "@/api/deviceApi";
import { toast } from "react-toastify";
import {useAuth} from "@/context/AuthContext";

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

export default function DeletedDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {user} = useAuth();

  // Fetch deleted devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const data = await getDeletedDeviced();
        setDevices(data);
      } catch (err: any) {
        console.error("Error fetching deleted devices:", err);
        setError("Failed to fetch deleted devices.");
        toast.error("Failed to load deleted devices.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Retrieve a deleted device
  const retriveDevice = async (deviceId: string) => {
    try {
      await retriveDeviceById(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      toast.success("Device retrieved successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });
    } catch (err) {
      console.error("Error retrieving device:", err);
      toast.error("Failed to retrieve device.", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });
    }
  };

  // Filtered devices by search
  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Deleted Devices</h1>
        <p className="text-muted-foreground">Manage all deleted devices</p>
      </div>

      {/* Search Bar */}
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
      {loading && (
        <div className="text-center text-muted-foreground">
          Loading devices...
        </div>
      )}
      {error && <div className="text-center text-destructive">{error}</div>}

      {/* Device Table */}
      {!loading && !error && (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-foreground">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-4 font-semibold">Device Name</th>
                <th className="p-4 font-semibold">Description</th>
                {isAdmin && <th className="p-4 font-semibold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.length > 0 ? (
                filteredDevices.map((d) => (
                  <tr
                    key={d.deviceId}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-medium">{d.name}</td>
                    <td className="p-4">{d.description}</td>
                    {isAdmin && <td className="p-4 flex justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => retriveDevice(d.deviceId)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-4 w-4" /> Retrieve
                      </Button>
                    </td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center p-6 text-muted-foreground"
                  >
                    No deleted devices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
