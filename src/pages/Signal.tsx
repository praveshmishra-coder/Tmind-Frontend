import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import type { Asset } from "@/api/assetApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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

/* ---------------------------- Component ---------------------------- */
export default function Signals() {
  const { state } = useLocation();
  const passedAsset = (state as any)?.asset as Asset | undefined | null;

  const [mainAsset, setMainAsset] = useState<Asset | null>(passedAsset ?? null);
  const [deviceName, setDeviceName] = useState<string>("Loading...");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [compareAssetId, setCompareAssetId] = useState<string>("");

  const [mainSignals, setMainSignals] = useState<string[]>([]);
  const [compareSignals, setCompareSignals] = useState<string[]>([]);
  const [compareDeviceName, setCompareDeviceName] = useState<string>("Loading...");

  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("24h");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

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
          const uniqueSignals = Array.from(
            new Set(mappings.map((m: any) => (m.signalName ?? "").toString()))
          ).map((s) => s.trim());
          setMainSignals(uniqueSignals);

          const deviceId = mappings[0].deviceId;
          if (deviceId) {
            try {
              const device = await getDeviceById(deviceId);
              setDeviceName(device?.name ?? device?.data?.name ?? "Unknown Device");
            } catch {
              setDeviceName("Unknown Device");
            }
          } else {
            setDeviceName("Not Assigned");
          }
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
        const uniqueSignals = Array.from(
          new Set(mappings.map((m: any) => (m.signalName ?? "").toString()))
        ).map((s) => s.trim());
        setCompareSignals(uniqueSignals);

        const deviceId = mappings[0]?.deviceId;
        if (deviceId) {
          try {
            const device = await getDeviceById(deviceId);
            setCompareDeviceName(device?.name ?? device?.data?.name ?? "Unknown Device");
          } catch {
            setCompareDeviceName("Unknown Device");
          }
        } else {
          setCompareDeviceName("Not Assigned");
        }
      } catch (err) {
        console.error("Failed to fetch compare asset signals", err);
        setCompareSignals([]);
        setCompareDeviceName("Error");
      }
    };
    loadCompareSignals();
  }, [compareAssetId]);

  /* ---------------- Data & Chart Helpers ---------------- */
  const pointsCount = useMemo(() => {
    if (timeRange === "today") return 12;
    if (timeRange === "7d") return 24;
    if (timeRange === "custom") return 12;
    return 10;
  }, [timeRange]);

  const generateSeries = (assetId: string, assetName: string, signal: string) => {
    const seed = `${assetId}:${signal}`;
    const rnd = mulberry32(hashStringToInt(seed));
    const series: number[] = [];
    for (let i = 0; i < pointsCount; i++) {
      const base = Math.floor(rnd() * 60 + 10);
      const variance = Math.floor(Math.sin(i / (pointsCount / 2)) * 10 + rnd() * 8);
      series.push(Number(Math.max(0, base + variance).toFixed(2)));
    }
    return series;
  };

  const timestamps = useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 1000);
      arr.push(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
    }
    return arr;
  }, [pointsCount]);

  const chartData = useMemo(() => {
    if (!mainAsset) return [];
    const mainSeriesMap: Record<string, number[]> = {};
    mainSignals.forEach(sig => {
      mainSeriesMap[`${mainAsset.name}-${sig}`] = generateSeries(mainAsset.assetId, mainAsset.name, sig);
    });

    const compareAssetObj = allAssets.find(a => a.assetId === compareAssetId) ?? null;
    const compareSeriesMap: Record<string, number[]> = {};
    if (compareAssetObj) {
      compareSignals.forEach(sig => {
        compareSeriesMap[`${compareAssetObj.name}-${sig}`] = generateSeries(compareAssetObj.assetId, compareAssetObj.name, sig);
      });
    }

    return timestamps.map((ts, idx) => {
      const row: any = { timestamp: ts };
      Object.keys(mainSeriesMap).forEach(k => row[k] = mainSeriesMap[k][idx] ?? null);
      Object.keys(compareSeriesMap).forEach(k => row[k] = compareSeriesMap[k][idx] ?? null);
      return row;
    });
  }, [mainAsset, mainSignals, compareAssetId, compareSignals, timestamps, allAssets, pointsCount]);

  const mainKeys = useMemo(() => mainSignals.map(s => `${mainAsset?.name}-${s}`), [mainAsset, mainSignals]);
  const compareKeys = useMemo(() => {
    const obj = allAssets.find(a => a.assetId === compareAssetId) ?? null;
    if (!obj) return [];
    return compareSignals.map(s => `${obj.name}-${s}`);
  }, [compareAssetId, compareSignals, allAssets]);

  /* ---------------------------- JSX ---------------------------- */
  return (
  <div className="p-4 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* PAGE TITLE */}
    <h2 className="tour-signal-title text-2xl font-semibold text-gray-800 dark:text-gray-200">
      Signals
    </h2>

    {/* TIME RANGE SECTION */}
    <div className="flex flex-col md:flex-row md:items-center gap-4 mt-1">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Range</span>
        <select
          className="tour-time-range w-40 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="today">Today</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {timeRange === "custom" && (
        <div className="tour-custom-range flex flex-row items-center gap-2 mt-1">
          <DatePicker
            selected={customStart}
            onChange={setCustomStart}
            placeholderText="Start"
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-600 dark:text-gray-300">to</span>
          <DatePicker
            selected={customEnd}
            onChange={setCustomEnd}
            placeholderText="End"
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>

    {/* 2 CARDS: MAIN + COMPARE */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* MAIN ASSET CARD */}
      <Card className="tour-main-asset-card shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Selected Asset</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Asset Dropdown */}
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Select Asset:</span>
            <select
              className="tour-main-asset-dropdown w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={mainAsset?.assetId ?? ""}
              onChange={e => {
                const selected = allAssets.find(a => a.assetId === e.target.value) ?? null;
                setMainAsset(selected);
              }}
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
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {deviceName}
              </span>
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
                      key={s}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-600 text-indigo-800 dark:text-white font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* COMPARE ASSET CARD */}
      <Card className="tour-compare-card shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Compare Asset</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">

          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Select Asset</span>
            {loading ? (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Loading...</span>
            ) : (
              <select
                className="tour-compare-dropdown w-full p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Assigned Device:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{compareDeviceName}</span>
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
                        key={s}
                        className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-600 text-purple-800 dark:text-white font-medium"
                      >
                        {s}
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
    <Card className="tour-graph-card shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-200">Signals Graph</CardTitle>
      </CardHeader>

      <CardContent style={{ height: 360 }}>
        {chartData.length === 0 ? (
          <span className="text-gray-500 dark:text-gray-400 text-sm">No data to plot</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
              <XAxis dataKey="timestamp" stroke="#4b5563" />
              <YAxis stroke="#4b5563" />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", borderRadius: 6, borderColor: "#d1d5db" }}
                labelStyle={{ color: "#111827" }}
                itemStyle={{ color: "#111827" }}
              />

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
