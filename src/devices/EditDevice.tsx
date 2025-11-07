import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function EditDeviceForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // DeviceId from route param

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    protocol: "ModbusRTU",
    connectionType: "Serial",
    status: "Inactive",
  });

  const [loading, setLoading] = useState(false);

  // Simulate loading existing device data (no backend for now)
  useEffect(() => {
    // You can replace this with a real fetch later
    const mockDevice = {
      name: "Device A",
      description: "Demo Modbus device",
      protocol: "ModbusTCP",
      connectionType: "Ethernet",
      status: "Active",
    };
    setFormData(mockDevice);
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // placeholder for update logic
    console.log("Updated Device:", formData);

    setTimeout(() => {
      setLoading(false);
      navigate("/devices"); // go back to device list
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background text-foreground transition-colors duration-300">
      <Card className="w-full max-w-xl shadow-lg border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Edit Device
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Device Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter device name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Protocol */}
            <div className="grid gap-2">
              <Label>Protocol</Label>
              <Select
                defaultValue={formData.protocol}
                onValueChange={(val) => handleSelectChange("protocol", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border border-border shadow-md">
                  <SelectItem value="ModbusRTU">ModbusRTU</SelectItem>
                  <SelectItem value="ModbusTCP">ModbusTCP</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* Status */}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                defaultValue={formData.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border border-border shadow-md">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/devices")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Device"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
