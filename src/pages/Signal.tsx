import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import { getTelemetryData, TimeRange } from "@/api/telemetryApi";
import type { Asset } from "@/api/assetApi";
import { getMappingById } from "@/api/assetApi";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  const [compareSignals, setCompareSignals] = useState<any[]>([]);
  const [compareDeviceName, setCompareDeviceName] = useState<string>("Loading...");

  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("today");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState<boolean>(false);

  const flattenAssets = (assets: Asset[]): Asset[] => {
    const out: Asset[] = [];
    const stack = [...assets];
    while (stack.length) {
      const a = stack.shift()!;
      out.push(a);
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
        const mappings = await getSignalOnAsset(mainAsset.assetId);
        if (mappings?.length > 0) {
          setMainSignals(mappings);

          const deviceNames = await fetchDevicesForAsset(mainAsset.assetId);
          setDeviceName(deviceNames.join(", ")); // Join multiple device names with comma

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
    // 1. Get all mappings for this asset
    const mappings = await getMappingById(assetId);

    // 2. Extract unique deviceIds
    const uniqueDeviceIds = Array.from(new Set(mappings.map(m => m.deviceId).filter(Boolean)));

    // 3. Fetch device names for each deviceId
    const deviceNames = await Promise.all(
      uniqueDeviceIds.map(async (deviceId) => {
        try {
          const device = await getDeviceById(deviceId);
          return device?.name ?? device?.data?.name ?? "Unknown Device";
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


  /* ---------------- Fetch Telemetry Data ---------------- */
  useEffect(() => {
    const fetchTelemetryData = async () => {
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

        // Fetch data for all signals
        const allSignals = [...mainSignals];
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
          const timeMap = new Map<string, any>();

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
  }, [mainAsset, mainSignals, compareAssetId, compareSignals, timeRange, customStart, customEnd, allAssets]);

  /* ---------------- Chart Keys ---------------- */
  const mainKeys = useMemo(() => {
    if (!mainAsset) return [];
    return mainSignals.map(s => `${mainAsset.name}-${s.signalName}`);
  }, [mainAsset, mainSignals]);

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
          <Button variant="outline" className="w-56 justify-start text-left">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{value ? format(value, "PPP") : placeholder ?? "Pick date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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
  <div className="p-3 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* PAGE TITLE */}
    

    {/* TIME RANGE SECTION */}
    <div className="flex flex-col md:flex-row md:items-center gap-4 mt-2">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Range</span>
        <select
          className="tour-time-range w-44 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={timeRange}
          onChange={e => setTimeRange(e.target.value as any)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="today">Today</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {timeRange === "custom" && (
        <div className="tour-custom-range flex flex-row items-center gap-3 mt-1">
          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-start text-left rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 flex items-center gap-2 hover:ring-1 hover:ring-indigo-500 transition"
              >
                <CalendarIcon className="h-4 w-4" />
                {customStart ? format(customStart, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStart ?? undefined}
                onSelect={date => setCustomStart(date ?? null)}
                disabled={date => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-600 dark:text-gray-300 mt-1">to</span>

          {/* End Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-start text-left rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 flex items-center gap-2 hover:ring-1 hover:ring-indigo-500 transition"
              >
                <CalendarIcon className="h-4 w-4" />
                {customEnd ? format(customEnd, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEnd ?? undefined}
                onSelect={date => setCustomEnd(date ?? null)}
                disabled={date => date < customStart || date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>

    {/* 2 CARDS: MAIN + COMPARE */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* MAIN ASSET CARD */}
      <Card className="tour-main-asset-card shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Selected Asset
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Asset Dropdown */}
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Select Asset:</span>
            <select
              className="tour-main-asset-dropdown w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={mainAsset?.assetId ?? ""}
              onChange={e => setMainAsset(allAssets.find(a => a.assetId === e.target.value) ?? null)}
            >
              <option value="">--Select Asset--</option>
              {allAssets.map(a => (
                <option key={a.assetId} value={a.assetId}>
                  {a.name} (Level {a.level})
                </option>
              ))}
            </select>
          </div>

          {/* Device & Signals */}
          <div className="flex flex-wrap items-start gap-6 mt-2">
            {/* Device */}
            <div className="tour-main-device flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Assigned Device:</span>
              {deviceName ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {deviceName.split(",").map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm font-medium text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-800 rounded-full shadow"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="font-medium text-gray-800 dark:text-gray-200">Not Assigned</span>
              )}
            </div>

            {/* Signals */}
            <div className="tour-main-signals flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Signals:</span>
              {mainSignals.length === 0 ? (
                <span className="text-sm text-gray-400">No signals</span>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {mainSignals.map(s => (
                    <span
                      key={s.signalTypeId}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-600 text-indigo-800 dark:text-white font-medium"
                    >
                      {s.signalName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COMPARE ASSET CARD */}
      <Card className="tour-compare-card shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Compare Asset
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Select Asset</span>
            {loading ? (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Loading...</span>
            ) : (
              <select
                className="tour-compare-dropdown w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={compareAssetId}
                onChange={e => setCompareAssetId(e.target.value)}
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
            <div className="flex flex-wrap items-start gap-6 mt-2">
              {/* Device */}
              <div className="tour-main-device flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Assigned Device:</span>
              {deviceName ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {deviceName.split(",").map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm font-medium text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-800 rounded-full shadow"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="font-medium text-gray-800 dark:text-gray-200">Not Assigned</span>
              )}
            </div>

              {/* Signals */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Signals:</span>
                {compareSignals.length === 0 ? (
                  <span className="text-sm text-gray-400">No signals</span>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {compareSignals.map(s => (
                      <span
                        key={s.signalTypeId}
                        className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-600 text-purple-800 dark:text-white font-medium"
                      >
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
    <Card className="tour-graph-card shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Signals Graph
          {fetchingData && (
            <span className="text-sm font-normal text-gray-500 ml-2">(Loading...)</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent style={{ height: 360 }}>
        {fetchingData ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 dark:text-gray-400">Loading telemetry data...</span>
          </div>
        ) : telemetryData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              No data available. Please select an asset with signals.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryData}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
              <XAxis dataKey="timestamp" stroke="#4b5563" />
              <YAxis stroke="#4b5563" />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", borderRadius: 6, borderColor: "#d1d5db" }}
                labelStyle={{ color: "#111827" }}
                itemStyle={{ color: "#111827" }}
              />
              <Legend />

              {mainKeys.map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={mainAsset ? colorForAsset(mainAsset.assetId) : "#3b82f6"}
                  strokeWidth={2}
                  dot={false}
                />
              ))}

              {compareKeys.map(key => {
                const assetObj = allAssets.find(a => a.assetId === compareAssetId);
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={assetObj ? colorForAsset(assetObj.assetId) : "#a855f7"}
                    strokeWidth={2}
                    dot={false}
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
