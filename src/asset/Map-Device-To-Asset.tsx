// src/pages/MapDeviceToAsset.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import apiAsset from "@/api/axiosAsset";
import { match_by_regAddress } from "@/api/deviceApi";

// ---------------------- Types ----------------------
interface AssetConfig {
  assetConfigID: string;
  signalTypeID: string;
  signalName: string;
  signalUnit: string;
  regsiterAdress: number | string;
}

interface MatchedRegister {
  registerId: string;
  registerAddress: number;
  registerLength: number;
  dataType: string;
  isHealthy: boolean;
  scale: number;
  unit?: string | null;
}

interface MatchedSlave {
  deviceSlaveId: string;
  slaveIndex: number;
  isHealthy: boolean;
  matchedRegisters: MatchedRegister[];
}

interface MatchedDevice {
  deviceId: string;
  name?: string | null;
  description?: string | null;
  protocol?: string | null;
  matchedSlaves: MatchedSlave[];
}

interface MatchResponse {
  success: boolean;
  data: MatchedDevice[];
  error?: any;
}

interface MappingRequest {
  assetId: string;
  deviceId: string;
  devicePortId: string;
}

// type returned from GET /Mapping (only fields we need)
interface ExistingMapping {
  mappingId: string;
  assetId: string;
  signalTypeId: string;
  deviceId: string;
  devicePortId: string;
  signalUnit: string;
  signalName: string;
  registerAdress: number;
  createdAt: string;
}

type Params = { assetid?: string };

// ---------------------- Component ----------------------
export default function MapDeviceToAsset() {
  const { assetid } = useParams<Params>();
  const navigate = useNavigate();

  const [assetConfigs, setAssetConfigs] = useState<AssetConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingSuccess, setMappingSuccess] = useState<boolean | null>(null);

  // store existing mappings so we can disable map buttons for already-mapped triples
  const [existingMappings, setExistingMappings] = useState<ExistingMapping[]>([]);

  // UI: when true, only show devices that have at least one available (not-fully-mapped) slave
  const [showOnlyAvailableDevices, setShowOnlyAvailableDevices] = useState(false);

  useEffect(() => {
    if (!assetid) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetid]);

  async function loadAll(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      // 1) Fetch asset config for this asset id
      const assetResp = await apiAsset.get<AssetConfig[]>(`/AssetConfig/${assetid}`);
      const assetData = Array.isArray(assetResp.data) ? assetResp.data : [];
      setAssetConfigs(assetData);

      // 1.5) Fetch existing mappings (so we can determine disabled state)
      const mappingsResp = await apiAsset.get<ExistingMapping[]>(`/Mapping`);
      const mappingsData = Array.isArray(mappingsResp.data) ? mappingsResp.data : [];
      setExistingMappings(mappingsData);

      // 2) Build register addresses and call match service
      const registerAddresses = assetData
        .map((c) => Number(c.regsiterAdress))
        .filter((v) => !Number.isNaN(v));

      if (registerAddresses.length === 0) {
        setMatchResult({ success: true, data: [] });
        setLoading(false);
        return;
      }

      const matchBody = { registerAddresses };

      // match_by_regAddress should be an API helper returning AxiosResponse<MatchResponse>
      const matchResp = await match_by_regAddress(matchBody);

      // IMPORTANT: do NOT remove already-mapped entries here. Instead we show them but disable Map button.
      setMatchResult(matchResp.data ?? { success: true, data: [] });

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message || "Unexpected error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Create a fast lookup set for existing mappings: `${deviceId}|${devicePortId}|${registerAdress}`
  const mappingsSet = useMemo(() => {
    const s = new Set<string>();
    for (const m of existingMappings) {
      s.add(`${m.deviceId}|${m.devicePortId}|${Number(m.registerAdress)}`);
    }
    return s;
  }, [existingMappings]);

  // compute a view model for rendering that includes whether a slave is fully mapped (to disable Map button)
  const devicesForRender = useMemo(() => {
    if (!matchResult?.data) return [] as MatchedDevice[];

    // map devices -> include slaves as-is. We will compute disabled state in render using mappingsSet.
    // but also support filtering: if showOnlyAvailableDevices is true, exclude devices where every slave is fully mapped
    const devices = matchResult.data.map((d) => ({ ...d }));

    if (!showOnlyAvailableDevices) return devices;

    // filter devices to only those that have at least one slave with a register that is NOT mapped
    return devices.filter((dev) => {
      for (const slave of dev.matchedSlaves ?? []) {
        for (const r of slave.matchedRegisters ?? []) {
          const key = `${dev.deviceId}|${slave.deviceSlaveId}|${Number(r.registerAddress)}`;
          if (!mappingsSet.has(key)) return true; // this slave/register is available -> keep device
        }
      }
      return false; // all registers across slaves are already mapped -> exclude device
    });
  }, [matchResult, mappingsSet, showOnlyAvailableDevices]);

  const registerToAssetMap = useMemo(() => {
    const map = new Map<number, AssetConfig>();
    for (const a of assetConfigs || []) {
      const key = Number(a.regsiterAdress);
      if (!Number.isNaN(key)) map.set(key, a);
    }
    return map;
  }, [assetConfigs]);

  async function createMapping({ assetId, deviceId, devicePortId }: MappingRequest): Promise<void> {
    setMappingLoading(true);
    setMappingSuccess(null);
    setError(null);

    try {
      // sends payload { assetId, deviceId, devicePortId } as required
      await apiAsset.post("/Mapping", { assetId, deviceId, devicePortId });
      setMappingSuccess(true);
      // refresh so newly created mapping disables the appropriate items
      await loadAll();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message || "Mapping failed";
      setError(msg);
      setMappingSuccess(false);
    } finally {
      setMappingLoading(false);
    }
  }

  function prettyUnit(u?: string | null): string {
    return u ? ` ${u}` : "";
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Mapper</h1>
          <p className="text-sm text-slate-600 mt-1">
            Map assets to device slaves/ports for asset <span className="font-mono">{assetid}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadAll()}>
            Refresh
          </Button>

          <Button variant={!showOnlyAvailableDevices ? "default" : "outline"} size="sm" onClick={() => setShowOnlyAvailableDevices((s) => !s)}>
            {!showOnlyAvailableDevices ? "Showing available only" : "Show all (including mapped)"}
          </Button>

          <Button size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent>Loading data…</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="text-red-600">{error}</CardContent>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Asset Configs */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Asset Configs</CardTitle>
              <CardDescription>Registers defined for this asset.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Register</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetConfigs && assetConfigs.length > 0 ? (
                      assetConfigs.map((c) => (
                        <TableRow key={c.assetConfigID}>
                          <TableCell className="font-mono">{c.regsiterAdress}</TableCell>
                          <TableCell>{c.signalName}</TableCell>
                          <TableCell>{c.signalUnit}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-slate-500">
                          No asset configs found for this asset.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Matched Devices / Slaves */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Matched Devices / Slaves</CardTitle>
              <CardDescription>Matches returned from the device matching service (by register address).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4">
                {devicesForRender && devicesForRender.length > 0 ? (
                  devicesForRender.map((device) => (
                    <div key={device.deviceId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{device.name}</div>
                          <div className="text-xs text-slate-500">Protocol: {device.protocol}</div>
                        </div>
                        <div className="text-sm text-slate-600">Slaves: {device.matchedSlaves?.length ?? 0}</div>
                      </div>

                      <div className="mt-3 border-t pt-3 space-y-2">
                        {device.matchedSlaves?.map((slave) => {
                          // determine if the slave is fully mapped for all registers returned by matcher
                          const slaveFullyMapped = (slave.matchedRegisters ?? []).every((r) =>
                            mappingsSet.has(`${device.deviceId}|${slave.deviceSlaveId}|${Number(r.registerAddress)}`)
                          );

                          return (
                            <div key={slave.deviceSlaveId} className="p-2 rounded-md bg-slate-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium">Slave #{slave.slaveIndex}</div>
                                  <Badge variant={slave.isHealthy ? "outline" : "destructive"}>
                                    {slave.isHealthy ? "Healthy" : "Unhealthy"}
                                  </Badge>
                                  {slaveFullyMapped && (
                                    <Badge variant="secondary">Already mapped</Badge>
                                  )}
                                </div>

                                <div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      void createMapping({
                                        assetId: assetid!,
                                        deviceId: device.deviceId,
                                        devicePortId: slave.deviceSlaveId,
                                      })
                                    }
                                    disabled={mappingLoading || slaveFullyMapped}
                                  >
                                    Map
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-2 overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Register</TableHead>
                                      <TableHead>Length</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Scale / Unit</TableHead>
                                      <TableHead>Asset Signal</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {slave.matchedRegisters?.map((r) => {
                                      const matchingAsset = registerToAssetMap.get(Number(r.registerAddress));
                                      const alreadyMapped = mappingsSet.has(`${device.deviceId}|${slave.deviceSlaveId}|${Number(r.registerAddress)}`);
                                      return (
                                        <TableRow key={r.registerId} className={alreadyMapped ? "opacity-70" : ""}>
                                          <TableCell className="font-mono">{r.registerAddress}</TableCell>
                                          <TableCell>{r.registerLength}</TableCell>
                                          <TableCell>{r.dataType}</TableCell>
                                          <TableCell>
                                            {r.scale}
                                            {prettyUnit(r.unit)}
                                          </TableCell>
                                          <TableCell>
                                            {matchingAsset ? (
                                              <div>
                                                <div className="font-medium">{matchingAsset.signalName}</div>
                                                <div className="text-xs text-slate-500">{matchingAsset.signalUnit}</div>
                                              </div>
                                            ) : (
                                              <div className="text-slate-500">No asset configured for this register</div>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">
                    No matches found. .
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {mappingLoading && (
        <Card>
          <CardContent>Creating mapping…</CardContent>
        </Card>
      )}

      {mappingSuccess === true && (
        <Card>
          <CardContent className="text-green-700">Mapping created successfully.</CardContent>
        </Card>
      )}

      {mappingSuccess === false && (
        <Card>
          <CardContent className="text-red-700">Mapping failed. Check console / server response.</CardContent>
        </Card>
      )}

      <div className="text-xs text-slate-500">
        Tip: Click <span className="font-medium">Map</span> to create a mapping. The body posted is{" "}
        <span className="font-mono">{`{ assetId, deviceId, devicePortId }`}</span>. You can copy the body using the Copy button.
      </div>
    </div>
  );
}
