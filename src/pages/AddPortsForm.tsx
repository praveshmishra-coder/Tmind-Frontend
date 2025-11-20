import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Save, X, Edit2, Trash2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Types
export type RegisterPayload = {
  registerId?: string;
  registerAddress: number;
  registerLength: number;
  dataType: string;
  scale: number;
  unit?: string | null;
  isHealthy: boolean;
  byteOrder?: "Big" | "Little" | null;
  wordSwap?: boolean;
};

export type PortData = {
  devicePortId?: string;
  portIndex: number;
  registers: RegisterPayload[];
  isHealthy: boolean;
};

const defaultRegister: RegisterPayload = {
  registerAddress: 40001,
  registerLength: 2,
  dataType: "float32",
  scale: 1.0,
  unit: null,
  isHealthy: true,
  byteOrder: "Big",
  wordSwap: false,
};

export default function ModbusPortManager() {
  const [ports, setPorts] = useState<PortData[]>([]);
  const [selectedPortIndex, setSelectedPortIndex] = useState<number | null>(null);
  const [editingRegisterIdx, setEditingRegisterIdx] = useState<number | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({ ...defaultRegister });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const params = useParams<{ id?: string }>();
  const deviceId = params.id;

  const selectedPort = ports.find(p => p.portIndex === selectedPortIndex) ?? null;

  const updateRegisterForm = <K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) => {
    setRegisterForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const loadPorts = async () => {
    if (!deviceId) return;
    try {
      const res = await api.get(`/devices/${deviceId}/ports`);
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const mapped: PortData[] = (arr || []).map((p: any) => ({
        devicePortId: p.devicePortId ?? p.devicePortId ?? undefined,
        portIndex: p.portIndex,
        isHealthy: p.isHealthy ?? true,
        registers: (p.registers || []).map((r: any) => ({
          registerId: r.registerId ?? undefined,
          registerAddress: r.registerAddress,
          registerLength: r.registerLength,
          dataType: r.dataType,
          scale: r.scale,
          unit: r.unit ?? null,
          isHealthy: r.isHealthy ?? true,
          byteOrder: r.byteOrder ?? null,
          wordSwap: !!r.wordSwap
        }))
      }));
      setPorts(mapped);
      if (mapped.length > 0 && selectedPortIndex === null) {
        setSelectedPortIndex(mapped[0].portIndex);
      }
    } catch (err) {
      console.error("Failed to load ports", err);
    }
  };

  useEffect(() => {
    loadPorts();
  }, [deviceId]);

  const validateRegister = (reg: RegisterPayload, currentRegisters: RegisterPayload[]) => {
    if (!Number.isInteger(reg.registerAddress) || reg.registerAddress < 0 || reg.registerAddress > 65535)
      return "Address must be between 0-65535";
    if (!Number.isInteger(reg.registerLength) || reg.registerLength < 1 || reg.registerLength > 10)
      return "Length must be between 1-10";
    if (!reg.dataType?.trim()) return "Data type is required";
    if (!(reg.scale > 0)) return "Scale must be greater than 0";

    const duplicate = currentRegisters.some((r, idx) =>
      idx !== editingRegisterIdx && r.registerAddress === reg.registerAddress
    );
    if (duplicate) return "Register address already exists in this port";

    return null;
  };

  const handleSaveRegister = () => {
    if (!selectedPort) return;
    const validationError = validateRegister(registerForm, selectedPort.registers);
    if (validationError) {
        toast.error(validationError);
    //   setError(validationError);
      return;
    }

    setPorts(prev =>
      prev.map(port => {
        if (port.portIndex !== selectedPort.portIndex) return port;

        let updatedRegisters: RegisterPayload[];
        if (editingRegisterIdx !== null) {
          updatedRegisters = port.registers.map((r, idx) =>
            idx === editingRegisterIdx ? { ...registerForm } : r
          );
          toast.success("Register updated locally, please save to persist");
          //   setSuccess("Register updated locally");
        } else {
            updatedRegisters = [...port.registers, { ...registerForm }];
            toast.success("Register added locally, please save to persist");
        //   setSuccess("Register added locally");
        }

        return { ...port, registers: updatedRegisters };
      })
    );

    setRegisterForm({ ...defaultRegister });
    setEditingRegisterIdx(null);
    setShowRegisterForm(false);
    setError(null);
  };

  const handleDeleteRegister = async (idx: number) => {
    if (!selectedPort) return;
    const updated = ports.map(port =>
      port.portIndex === selectedPort.portIndex
        ? { ...port, registers: port.registers.filter((_, i) => i !== idx) }
        : port
    );
    setPorts(updated);
    toast.success("Register deleted locally, please edit and save to persist");
    // setSuccess("Register deleted locally");
  };

  const handleEditRegister = (idx: number) => {
    if (!selectedPort) return;
    setRegisterForm({ ...selectedPort.registers[idx] });
    setEditingRegisterIdx(idx);
    setShowRegisterForm(true);
  };

  const handleAddNewPort = () => {
    const newPortIndex = ports.length > 0 ? Math.max(...ports.map(p => p.portIndex)) + 1 : 0;
    const newPort: PortData = { portIndex: newPortIndex, registers: [], isHealthy: true };
    setPorts(prev => [...prev, newPort]);
    setSelectedPortIndex(newPortIndex);
    setShowRegisterForm(false);
    toast.success("New port created locally, please add registers now");
    // setSuccess("New port created locally");
  };

  const buildPayload = (port: PortData) => {
    return {
      portIndex: port.portIndex,
      isHealthy: port.isHealthy,
      registers: port.registers.map(r => ({
        registerAddress: r.registerAddress,
        registerLength: r.registerLength,
        dataType: r.dataType,
        scale: r.scale,
        unit: r.unit,
        isHealthy: r.isHealthy,
        byteOrder: r.byteOrder,
        wordSwap: r.wordSwap
      }))
    };
  };

  const saveCurrentPort = async () => {
    if (!selectedPort || !deviceId) return;

    const payload = buildPayload(selectedPort);

    try {
      if (selectedPort.devicePortId) {
        await api.put(`/devices/${deviceId}/ports/${selectedPort.portIndex}`, payload);
        toast.success("Port updated on server");
        // setSuccess("Port updated on server");
    } else {
        await api.post(`/devices/${deviceId}/ports`, payload);
        // setSuccess("Port created on server");
        toast.success("Port created on server");
      }

      await loadPorts();
    } catch (err: any) {
      console.error("Failed to save port", err);
      toast.error(err?.response?.data?.error || err?.message || "Failed to save port")
    //   setError(err?.response?.data?.error || err?.message || "Failed to save port");
    }
  };

  const cancelRegisterForm = () => {
    setRegisterForm({ ...defaultRegister });
    setEditingRegisterIdx(null);
    setShowRegisterForm(false);
    setError(null);
  };

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 2000);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Modbus Port Manager
            </h1>
            <p className="text-slate-600 mt-1">Configure and manage device communication ports</p>
          </div>
        </div>

       
        {/* Ports Section */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Communication Ports</CardTitle>
              <Button onClick={handleAddNewPort} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Port
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {ports.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Database className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No ports configured</p>
                <p className="text-sm mt-1">Create your first port to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ports.map(port => (
                  <button
                    key={port.portIndex}
                    onClick={() => {
                      setSelectedPortIndex(port.portIndex);
                      setShowRegisterForm(false);
                      setEditingRegisterIdx(null);
                      setRegisterForm({ ...defaultRegister });
                      setError(null);
                    }}
                    className={`group relative p-5 rounded-xl border-2 transition-all duration-200 ${
                      selectedPortIndex === port.portIndex
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedPortIndex === port.portIndex
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}>
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${
                          selectedPortIndex === port.portIndex ? "text-blue-700" : "text-slate-900"
                        }`}>
                          Port {port.portIndex}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {port.registers.length} register{port.registers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {port.isHealthy ? (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
                      ) : (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registers Section */}
        {selectedPort ? (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Port {selectedPort.portIndex} Configuration
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage registers and communication parameters
                  </p>
                </div>
                <div className="flex gap-2">
                  {!showRegisterForm && (
                    <Button onClick={() => setShowRegisterForm(true)} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Register
                    </Button>
                  )}
                  <Button onClick={saveCurrentPort} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Port
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {showRegisterForm && (
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {editingRegisterIdx !== null ? "Edit Register" : "New Register"}
                    </h3>
                    <Button size="sm" variant="ghost" onClick={cancelRegisterForm} className="hover:bg-white/50">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Register Address</Label>
                      <Input 
                        type="number" 
                        value={registerForm.registerAddress} 
                        min={0} 
                        max={65535}
                        onChange={(e) => updateRegisterForm("registerAddress", Number(e.target.value))}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Register Length</Label>
                      <Input 
                        type="number" 
                        value={registerForm.registerLength} 
                        min={1} 
                        max={10}
                        onChange={(e) => updateRegisterForm("registerLength", Number(e.target.value))}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Data Type</Label>
                      <Select value={registerForm.dataType} onValueChange={(v) => updateRegisterForm("dataType", v)}>
                        <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="int16">int16</SelectItem>
                          <SelectItem value="uint16">uint16</SelectItem>
                          <SelectItem value="int32">int32</SelectItem>
                          <SelectItem value="uint32">uint32</SelectItem>
                          <SelectItem value="float32">float32</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Scale Factor</Label>
                      <Input 
                        type="number" 
                        step={0.01} 
                        value={registerForm.scale} 
                        onChange={(e) => updateRegisterForm("scale", Number(e.target.value))}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Unit</Label>
                      <Select value={registerForm.unit ?? "__none"} onValueChange={(v) => updateRegisterForm("unit", v === "__none" ? null : v)}>
                        <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          <SelectItem value="V">V (Volts)</SelectItem>
                          <SelectItem value="A">A (Amperes)</SelectItem>
                          <SelectItem value="°C">°C (Celsius)</SelectItem>
                          <SelectItem value="Hz">Hz (Hertz)</SelectItem>
                          <SelectItem value="rpm">rpm (RPM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Byte Order</Label>
                      <Select value={registerForm.byteOrder ?? "Big"} onValueChange={(v) => updateRegisterForm("byteOrder", v as any)}>
                        <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Big">Big Endian</SelectItem>
                          <SelectItem value="Little">Little Endian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Options</Label>
                      <div className="flex items-center gap-6 h-10">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="wordSwap"
                            checked={!!registerForm.wordSwap} 
                            onCheckedChange={(c) => updateRegisterForm("wordSwap", !!c)}
                            className="border-slate-400"
                          />
                          <Label htmlFor="wordSwap" className="text-sm cursor-pointer">Word Swap</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="isHealthy"
                            checked={registerForm.isHealthy} 
                            onCheckedChange={(c) => updateRegisterForm("isHealthy", !!c)}
                            className="border-slate-400"
                          />
                          <Label htmlFor="isHealthy" className="text-sm cursor-pointer">Healthy</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveRegister} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      {editingRegisterIdx !== null ? "Update Register" : "Add Register"}
                    </Button>
                    <Button variant="outline" onClick={cancelRegisterForm} className="border-slate-300">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedPort.registers.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <Database className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700">No registers configured</p>
                  <p className="text-sm text-slate-500 mt-1">Click "Add Register" to create your first register</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Length</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Data Type</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Scale</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Byte Order</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Word Swap</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {selectedPort.registers.map((reg, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">{reg.registerAddress}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{reg.registerLength}</td>
                            <td className="px-6 py-4 text-sm font-mono text-slate-700">{reg.dataType}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{reg.scale}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{reg.unit || "—"}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{reg.byteOrder || "—"}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{reg.wordSwap ? "Yes" : "No"}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                reg.isHealthy 
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}>
                                {reg.isHealthy ? "Healthy" : "Unhealthy"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleEditRegister(idx)}
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteRegister(idx)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-lg">
            <CardContent className="py-16">
              <div className="text-center text-slate-500">
                <Database className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                <p className="text-xl font-medium text-slate-700">No Port Selected</p>
                <p className="text-sm mt-2">Select a port from above to view and manage its registers</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}