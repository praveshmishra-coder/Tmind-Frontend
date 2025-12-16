import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import { getTelemetryData, TimeRange } from "@/api/telemetryApi";
import type { Asset, SignalType } from "@/api/assetApi";
import { getMappingById } from "@/api/assetApi";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ------------------------------ Helpers ------------------------------ */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function colorForAsset(assetId: string) {
  const seed = hashStringToInt(assetId);
  const rnd = mulberry32(seed);
  const r = Math.floor(rnd() * 200) + 20;
  const g = Math.floor(rnd() * 200) + 20;
  const b = Math.floor(rnd() * 200) + 20;
  return `rgb(${r}, ${g}, ${b})`;
}

/* ---------------------------- Types & Component ---------------------------- */
export default function Signals() {
  const { state } = useLocation();
  const passedAsset = (state as any)?.asset as Asset | undefined | null;

  const [mainAsset, setMainAsset] = useState<Asset | null>(passedAsset ?? null);
  const [deviceName, setDeviceName] = useState<string>("Loading...");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [compareAssetId, setCompareAssetId] = useState<string>("");
  const [mainSignals, setMainSignals] = useState<any[]>([]);
  const [compareSignals, setCompareSignals] = useState<SignalType[]>([]);
  const [compareDeviceName, setCompareDeviceName] = useState<string>("Loading...");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("today");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [signalSelected, setSignalSelected] = useState<any | null>(null);

  const flattenAssets = (assets: Asset[]): Asset[] => {
    const out: Asset[] = [];
    const stack = [...assets];
    while (stack.length) {
      const a = stack.shift()!;
      if (a.level > 2) out.push(a);
      if (a.childrens?.length) stack.unshift(...a.childrens);
    }
    return out;
  };

  /* ---------------- Load asset hierarchy ---------------- */
  useEffect(() => {
    const loadHierarchy = async () => {
      setLoading(true);
      try {
        const hierarchy = await getAssetHierarchy();
        setAllAssets(flattenAssets(hierarchy || []));
      } catch (err) {
        console.error("Failed to load asset hierarchy", err);
        setAllAssets([]);
      } finally {
        setLoading(false);
      }
    };
    loadHierarchy();
  }, []);

  /* ---------------- Load main asset signals & device ---------------- */
  useEffect(() => {
    const loadMainSignals = async () => {
      if (!mainAsset) {
        setDeviceName("Not Assigned");
        setMainSignals([]);
        return;
      }
      try {
        const signalOnAsset = await getSignalOnAsset(mainAsset.assetId);
        if (signalOnAsset?.length > 0) {
          setMainSignals(signalOnAsset);
          // console.log("Main signals loaded:", signalOnAsset);
          const deviceNames = await fetchDevicesForAsset(mainAsset.assetId);
          setDeviceName(deviceNames.join(", "));
        } else {
          setMainSignals([]);
          setDeviceName("Not Assigned");
        }
      } catch (err) {
        console.error("Failed to fetch main asset signals", err);
        setMainSignals([]);
        setDeviceName("Error");
      }
    };
    loadMainSignals();
  }, [mainAsset]);

  /* ---------------- Compare asset signals & device ---------------- */
  useEffect(() => {
    const loadCompareSignals = async () => {
      if (!compareAssetId) {
        setCompareSignals([]);
        setCompareDeviceName("Not Assigned");
        return;
      }
      try {
        const mappings = await getSignalOnAsset(compareAssetId);
        setCompareSignals(mappings);
        const deviceNames = await fetchDevicesForAsset(compareAssetId);
        setCompareDeviceName(deviceNames.join(", "));
      } catch (err) {
        console.error("Failed to fetch compare asset signals", err);
        setCompareSignals([]);
        setCompareDeviceName("Error");
      }
    };
    loadCompareSignals();
  }, [compareAssetId]);

  const fetchDevicesForAsset = async (assetId: string): Promise<string[]> => {
    try {
      const mappings = await getMappingById(assetId);
      const uniqueDeviceIds = Array.from(new Set(mappings.map(m => m.deviceId).filter(Boolean)));
      const deviceNames = await Promise.all(
        uniqueDeviceIds.map(async (deviceId) => {
          try {
            const device = await getDeviceById(deviceId);
            return device?.name ?? device?.data?.name ?? "Not Assigned";
          } catch {
            return "Unknown Device";
          }
        })
      );
      return deviceNames;
    } catch (err) {
      console.error(`Failed to fetch devices for asset ${assetId}`, err);
      return ["Error"];
    }
  };

  // Reset signal selection when main asset changes
  useEffect(() => {
    setSignalSelected(null);
  }, [mainAsset]);

  // console.log("Currently selected signal:", signalSelected);

  /* ---------------- Fetch Telemetry Data ---------------- */
  useEffect(() => {
    const fetchTelemetryData = async () => {
      // CHANGED: Check if signal is selected first
      if (!signalSelected) {
        setTelemetryData([]);
        return;
      }

      if (!mainAsset || mainSignals.length === 0) {
        setTelemetryData([]);
        return;
      }

      setFetchingData(true);
      try {
        // Determine time range
        let apiTimeRange: TimeRange;
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (timeRange === "24h") {
          apiTimeRange = TimeRange.Last24Hours;
        } else if (timeRange === "7d") {
          apiTimeRange = TimeRange.Last7Days;
        } else if (timeRange === "today") {
          apiTimeRange = TimeRange.Custom;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate = today.toISOString();
          endDate = new Date().toISOString();
        } else if (timeRange === "custom") {
          apiTimeRange = TimeRange.Custom;
          startDate = customStart?.toISOString();
          endDate = customEnd?.toISOString();
        } else {
          apiTimeRange = TimeRange.Last24Hours;
        }

        // CHANGED: Only fetch data for the selected signal
        const allSignals = [signalSelected];
        // console.log("Fetching telemetry for signals:", allSignals);

        if (compareAssetId && compareSignals.length > 0) {
          allSignals.push(...compareSignals);
        }

        const dataPromises = allSignals.map(async (signal) => {
          try {
            const response = await getTelemetryData({
              assetId: signal.assetId,
              signalTypeId: signal.signalTypeId,
              timeRange: apiTimeRange,
              startDate,
              endDate,
            });
            return {
              ...response,
              signalKey: `${signal.assetId}-${signal.signalName}`,
              assetName: allAssets.find(a => a.assetId === signal.assetId)?.name || "Unknown",
            };
          } catch (error) {
            console.error(`Failed to fetch data for signal ${signal.signalName}:`, error);
            return null;
          }
        });

        const results = await Promise.all(dataPromises);
        const validResults = results.filter(r => r !== null);

        // Transform data for recharts
        if (validResults.length > 0) {
          const timeMap = new Map();
          validResults.forEach((result) => {
            result.values.forEach((point: any) => {
              const timeKey = new Date(point.time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });
              if (!timeMap.has(timeKey)) {
                timeMap.set(timeKey, { timestamp: timeKey });
              }
              const dataPoint = timeMap.get(timeKey);
              const key = `${result.assetName}-${result.signalName}`;
              dataPoint[key] = point.value;
            });
          });

          const chartData = Array.from(timeMap.values()).sort((a, b) => {
            return new Date('1970/01/01 ' + a.timestamp).getTime() - 
                   new Date('1970/01/01 ' + b.timestamp).getTime();
          });

          setTelemetryData(chartData);
        } else {
          setTelemetryData([]);
        }
      } catch (error) {
        console.error("Failed to fetch telemetry data:", error);
        setTelemetryData([]);
      } finally {
        setFetchingData(false);
      }
    };

    fetchTelemetryData();
  }, [mainAsset, mainSignals, compareAssetId, compareSignals, timeRange, customStart, customEnd, allAssets, signalSelected]); 
  // CHANGED: Added signalSelected to dependency array

  /* ---------------- Chart Keys ---------------- */
  const mainKeys = useMemo(() => {
    if (!mainAsset || !signalSelected) return [];
    // CHANGED: Only return the selected signal's key
    return [`${mainAsset.name}-${signalSelected.signalName}`];
  }, [mainAsset, signalSelected]);

  const compareKeys = useMemo(() => {
    const obj = allAssets.find(a => a.assetId === compareAssetId) ?? null;
    if (!obj) return [];
    return compareSignals.map(s => `${obj.name}-${s.signalName}`);
  }, [compareAssetId, compareSignals, allAssets]);

  /* ---------------------- Small Shadcn Single Date Picker ---------------------- */
  const today = new Date();

  function SingleDatePicker({
    value,
    onChange,
    placeholder,
  }: {
    value: Date | null;
    onChange: (d: Date | null) => void;
    placeholder?: string;
  }) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder ?? "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => onChange(d ?? null)}
            disabled={(date) => date > today}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  /* ---------------------------- JSX ---------------------------- */
  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* PAGE TITLE */}
      <h1 className="text-3xl font-bold">Signal Analysis</h1>

      {/* TIME RANGE SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Time Range</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="border p-2 rounded w-full"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="today">Today</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === "custom" && (
            <div className="flex gap-4 mt-4 items-center">
              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, "PPP") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStart ?? undefined}
                    onSelect={(date) => setCustomStart(date ?? null)}
                    disabled={date => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span>to</span>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, "PPP") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEnd ?? undefined}
                    onSelect={(date) => setCustomEnd(date ?? null)}
                    disabled={date => date < customStart || date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2 CARDS: MAIN + COMPARE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MAIN ASSET CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asset Dropdown */}
            <div>
              <label className="block mb-1 font-semibold">Select Asset:</label>
              <select
                className="border p-2 rounded w-full"
                value={mainAsset?.assetId ?? ""}
                onChange={(e) =>
                  setMainAsset(allAssets.find(a => a.assetId === e.target.value) ?? null)
                }
              >
                <option value="">--Select Asset--</option>
                {allAssets.map(a => (
                  <option key={a.assetId} value={a.assetId}>
                    {a.name} (Level {a.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Signal Selection - CHANGED: Added this section */}
            <div>
              <label className="block mb-1 font-semibold">Select Signal:</label>
              <select
                className="border p-2 rounded w-full"
                value={signalSelected?.signalTypeId ?? ""}
                onChange={(e) => {
                  const selectedSignal = mainSignals.find(a => a.signalTypeId === e.target.value) ?? null;
                  setSignalSelected(selectedSignal);
                  // console.log("Signal selected:", selectedSignal);
                }}
                disabled={!mainSignals.length}
              >
                <option value="">--Select Signal--</option>
                {mainSignals.map(a => (
                  <option key={a.signalTypeId} value={a.signalTypeId}>
                    {a.signalName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* COMPARE ASSET CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Compare Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block mb-1 font-semibold">Select Asset</label>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <select
                  className="border p-2 rounded w-full"
                  value={compareAssetId}
                  onChange={(e) => setCompareAssetId(e.target.value)}
                  disabled={!mainAsset}
                >
                  <option value="">None</option>
                  {allAssets
                    .filter(a => a.assetId !== mainAsset?.assetId)
                    .map(a => (
                      <option key={a.assetId} value={a.assetId}>
                        {a.name} (Level {a.level})
                      </option>
                    ))}
                </select>
              )}
            </div>

            {compareAssetId && (
              <div className="mt-4 space-y-4">
                {/* Device */}
                <div>
                  <p className="font-semibold">Assigned Device:</p>
                  {compareDeviceName ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {compareDeviceName.split(",").map((d, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 rounded text-sm">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Not Assigned</p>
                  )}
                </div>

                {/* Signals */}
                <div>
                  <p className="font-semibold">Signals:</p>
                  {compareSignals.length === 0 ? (
                    <p className="text-gray-500">No signals</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {compareSignals.map(s => (
                        <span key={s.signalTypeId} className="px-2 py-1 bg-green-100 rounded text-sm">
                          {s.signalName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAPH CARD */}
      <Card>
        <CardHeader>
          <CardTitle>
            Signals Graph
            {fetchingData && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingData ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading telemetry data...</p>
            </div>
          ) : telemetryData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">
                No data available. Please select an asset and a signal.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                {mainKeys.map(key => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colorForAsset(mainAsset?.assetId ?? "")}
                    strokeWidth={2}
                  />
                ))}
                {compareKeys.map(key => {
                  const assetObj = allAssets.find(a => a.assetId === compareAssetId);
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForAsset(compareAssetId)}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}