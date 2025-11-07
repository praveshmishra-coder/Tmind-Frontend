import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface DeviceConfiguration {
  BaudRate: number;
  Parity: string;
  StopBits: number;
  DataBits: number;
  SlaveId: number;
  ComPort: string;
  IpAddress: string;
  PortNumber: number;
  RetryCount: number;
  PollingInterval: number;
}

interface PortConfig {
  PortNumber: number;
  SignalType: string;
  RegisterAddress: string;
  IsActive: boolean;
  IsFaulty: boolean;
}

export default function ConfigureDevice() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<DeviceConfiguration>({
    BaudRate: 9600,
    Parity: "None",
    StopBits: 1,
    DataBits: 8,
    SlaveId: 1,
    ComPort: "COM3",
    IpAddress: "192.168.1.10",
    PortNumber: 502,
    RetryCount: 3,
    PollingInterval: 1000,
  });

  const [ports, setPorts] = useState<PortConfig[]>([
    { PortNumber: 0, SignalType: "Voltage", RegisterAddress: "40001", IsActive: true, IsFaulty: false },
    { PortNumber: 1, SignalType: "Temperature", RegisterAddress: "40002", IsActive: true, IsFaulty: false },
  ]);

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: e.target.type === "number" ? Number(value) : value });
  };

  const handleSelectChange = (field: keyof DeviceConfiguration, value: string | number) => {
    setConfig({ ...config, [field]: value });
  };

  const handlePortChange = (
    index: number,
    field: keyof PortConfig,
    value: string | boolean
  ) => {
    const updatedPorts = [...ports];
    (updatedPorts[index] as any)[field] = value;
    setPorts(updatedPorts);
  };

  const addPort = () => {
    setPorts([
      ...ports,
      {
        PortNumber: ports.length,
        SignalType: "",
        RegisterAddress: "",
        IsActive: false,
        IsFaulty: false,
      },
    ]);
  };

  const handleSave = () => {
    console.log("Configuration Saved:", config);
    console.log("Ports Saved:", ports);
    navigate("/devices");
  };

  return (
    <div className="p-6 bg-background text-foreground min-h-screen flex flex-col items-center space-y-10">
      <Card className="w-full max-w-4xl shadow-lg border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Configure Device {deviceId}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ====================== Communication Settings ====================== */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              Communication Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Baud Rate</Label>
                <Input
                  type="number"
                  name="BaudRate"
                  value={config.BaudRate}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Parity</Label>
                <Select
                  defaultValue={config.Parity}
                  onValueChange={(val) => handleSelectChange("Parity", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parity" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border shadow-md">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Even">Even</SelectItem>
                    <SelectItem value="Odd">Odd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Stop Bits</Label>
                <Select
                  defaultValue={config.StopBits.toString()}
                  onValueChange={(val) => handleSelectChange("StopBits", Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Stop Bits" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border shadow-md">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Bits</Label>
                <Input
                  type="number"
                  name="DataBits"
                  value={config.DataBits}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Slave ID</Label>
                <Input
                  type="number"
                  name="SlaveId"
                  value={config.SlaveId}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Com Port</Label>
                <Input
                  type="text"
                  name="ComPort"
                  value={config.ComPort}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>IP Address</Label>
                <Input
                  type="text"
                  name="IpAddress"
                  value={config.IpAddress}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Port Number</Label>
                <Input
                  type="number"
                  name="PortNumber"
                  value={config.PortNumber}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Retry Count</Label>
                <Input
                  type="number"
                  name="RetryCount"
                  value={config.RetryCount}
                  onChange={handleConfigChange}
                />
              </div>

              <div>
                <Label>Polling Interval (ms)</Label>
                <Input
                  type="number"
                  name="PollingInterval"
                  value={config.PollingInterval}
                  onChange={handleConfigChange}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave}>Save Configuration</Button>
            </div>
          </div>

          {/* ====================== Port Configuration ====================== */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              Port Configuration
            </h2>

            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Port</th>
                    <th className="p-3 text-left">Signal Type</th>
                    <th className="p-3 text-left">Register Address</th>
                    <th className="p-3 text-center">Active</th>
                    <th className="p-3 text-center">Faulty</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-3 font-medium">{port.PortNumber}</td>
                      <td className="p-3">
                        <Input
                          type="text"
                          value={port.SignalType}
                          onChange={(e) =>
                            handlePortChange(index, "SignalType", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          value={port.RegisterAddress}
                          onChange={(e) =>
                            handlePortChange(index, "RegisterAddress", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={port.IsActive}
                          onCheckedChange={(val) =>
                            handlePortChange(index, "IsActive", Boolean(val))
                          }
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={port.IsFaulty}
                          onCheckedChange={(val) =>
                            handlePortChange(index, "IsFaulty", Boolean(val))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={addPort}>
                + Add New Port
              </Button>
              <Button onClick={handleSave}>Save Ports</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
