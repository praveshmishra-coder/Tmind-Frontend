import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
// import { toast } from "@/components/ui/use-toast"; // if using shadcn toast
// import axios from "axios";

export default function AddDeviceForm() {
  const navigate = useNavigate();

  // local form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    protocol: "ModbusRTU",
    connectionType: "Serial",
    status: "Inactive",
  });

  const [loading, setLoading] = useState(false);

  // handle change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle dropdown change
  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // try {
    //   const response = await axios.post("/api/devices", formData);
    //   const { deviceId, configId } = response.data;

    //   toast({
    //     title: "Device Added",
    //     description: `Device created successfully!`,
    //   });

    //   navigate(`/devices/configure/${deviceId}`);
    // } catch (error) {
    //   console.error(error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to add device. Please try again.",
    //     variant: "destructive",
    //   });
    // } finally {
    //   setLoading(false);
    // }
    navigate("/devices");
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background text-foreground transition-colors duration-300">
      <Card className="w-full max-w-xl shadow-lg border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Add New Device
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
                <SelectContent className="bg-background text-foreground">
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
                <SelectContent className="bg-background text-foreground">
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
                {loading ? "Saving..." : "Save Device"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
