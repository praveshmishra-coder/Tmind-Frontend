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
import { Calendar as CalendarIcon, X } from "lucide-react";
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
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

/* ---------------------------- Main Component ---------------------------- */
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
  const [compareSignalSelected, setCompareSignalSelected] = useState<SignalType | null>(null);

  // Reference Line State (FUNCTIONALITY 1)
  const [referenceValue, setReferenceValue] = useState<number | null>(null);
  const [referenceTimestamp, setReferenceTimestamp] = useState<string | null>(null);
  const [referenceInfo, setReferenceInfo] = useState<string>("");
  const [manualReferenceInput, setManualReferenceInput] = useState<string>("");

  // Zoom State (FUNCTIONALITY 2 - SEPARATE)
  const [zoomStartIndex, setZoomStartIndex] = useState<number | null>(null);
  const [zoomEndIndex, setZoomEndIndex] = useState<number | null>(null);
  const [isSelectingZoom, setIsSelectingZoom] = useState<boolean>(false);

  // Chart Style State
  const [chartStyle, setChartStyle] = useState<"line" | "area" | "bar">("line");

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

  /* Load asset hierarchy */
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

  /* Load main asset signals & device */
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

  useEffect(() => {
    setCompareSignalSelected(null);
  }, [compareAssetId]);

  /* Load compare asset signals & device */
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

  useEffect(() => {
    setSignalSelected(null);
  }, [mainAsset]);

  /* Fetch Telemetry Data */
  useEffect(() => {
    const fetchTelemetryData = async () => {
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

        const allSignals = [];
        if (signalSelected) allSignals.push(signalSelected);
        if (compareSignalSelected) {
          // FIX: Create normalized signal object for compare signal
          allSignals.push({
            assetId: compareAssetId,
            signalTypeId: compareSignalSelected.signalTypeID || compareSignalSelected.signalTypeId, // Handle both property names
            signalName: compareSignalSelected.signalName
          });
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
          setReferenceValue(null);
          setReferenceTimestamp(null);
          setReferenceInfo("");
          setZoomStartIndex(null);
          setZoomEndIndex(null);
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
  }, [mainAsset, mainSignals, compareAssetId, compareSignals, timeRange, customStart, customEnd, allAssets, signalSelected, compareSignalSelected]);

  /* Chart Keys */
  const mainKeys = useMemo(() => {
    if (!mainAsset || !signalSelected) return [];
    return [`${mainAsset.name}-${signalSelected.signalName}`];
  }, [mainAsset, signalSelected]);

  const compareKeys = useMemo(() => {
    if (!compareAssetId || !compareSignalSelected) return [];
    const assetObj = allAssets.find(a => a.assetId === compareAssetId);
    if (!assetObj) return [];
    return [`${assetObj.name}-${compareSignalSelected.signalName}`];
  }, [compareAssetId, compareSignalSelected, allAssets]);

  /* Get zoomed data - SEPARATE FUNCTIONALITY */
  const displayData = useMemo(() => {
    if (zoomStartIndex !== null && zoomEndIndex !== null && telemetryData.length > 0) {
      const start = Math.min(zoomStartIndex, zoomEndIndex);
      const end = Math.max(zoomStartIndex, zoomEndIndex);
      return telemetryData.slice(start, end + 1);
    }
    return telemetryData;
  }, [zoomStartIndex, zoomEndIndex, telemetryData]);

  /* FUNCTIONALITY 1: Reference Line */
  const handleChartClick = (data: any) => {
    if (data && data.timestamp && !isSelectingZoom) {
      const mainKeyValue = mainKeys.length > 0 ? data[mainKeys[0]] : null;
      if (mainKeyValue !== undefined && mainKeyValue !== null) {
        setReferenceValue(mainKeyValue);
        setReferenceTimestamp(data.timestamp);
        setReferenceInfo(
          `Reference Point: ${data.timestamp} → Value: ${mainKeyValue.toFixed(2)}`
        );
      }
    }
  };

  const clearReference = () => {
    setReferenceValue(null);
    setReferenceTimestamp(null);
    setReferenceInfo("");
    setManualReferenceInput("");
  };

  const setManualReference = () => {
    const value = parseFloat(manualReferenceInput);
    if (!isNaN(value)) {
      setReferenceValue(value);
      setReferenceTimestamp(null);
      setReferenceInfo(`Manual Reference Line: Y-axis value = ${value.toFixed(2)}`);
    }
  };

  /* FUNCTIONALITY 2: Zoom - SEPARATE */
  const handleChartMouseDown = (state: any) => {
    if (state?.activeTooltipIndex !== undefined) {
      setIsSelectingZoom(true);
      setZoomStartIndex(state.activeTooltipIndex);
    }
  };

  const handleChartMouseUp = (state: any) => {
    if (state?.activeTooltipIndex !== undefined && zoomStartIndex !== null) {
      const start = Math.min(zoomStartIndex, state.activeTooltipIndex);
      const end = Math.max(zoomStartIndex, state.activeTooltipIndex);
      if (start !== end) {
        setZoomStartIndex(start);
        setZoomEndIndex(end);
      }
      setIsSelectingZoom(false);
    }
  };

  const resetZoom = () => {
    setZoomStartIndex(null);
    setZoomEndIndex(null);
    setIsSelectingZoom(false);
  };

  /* Custom Tooltip */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg space-y-1 text-sm">
          <p className="font-bold text-gray-800">{payload[0].payload.timestamp}</p>
          {payload.map((entry: any, index: number) => {
            const currentValue = entry.value;
            const difference =
              referenceValue !== null ? (currentValue - referenceValue).toFixed(2) : null;
            const percentage =
              referenceValue !== null && referenceValue !== 0
                ? (((currentValue - referenceValue) / referenceValue) * 100).toFixed(2)
                : null;

            return (
              <div key={index} className="space-y-1">
                <p style={{ color: entry.color }}>
                  <strong>{entry.name}:</strong> {currentValue.toFixed(2)}
                </p>
                {difference !== null && (
                  <p className={parseFloat(difference) >= 0 ? "text-red-600 text-xs" : "text-green-600 text-xs"}>
                    vs Ref: {difference} ({percentage}%)
                  </p>
                )}
              </div>
            );
          })}
          {referenceValue !== null && (
            <>
              <hr className="my-1" />
              <p className="text-green-600 text-xs">
                <strong>Reference Value:</strong> {referenceValue.toFixed(2)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  /* JSX */
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

      {/* REFERENCE LINE INFO - FUNCTIONALITY 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Line Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Manual Reference Input */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-sm">Set Y-Axis Reference Value:</label>
                <input
                  type="number"
                  step="any"
                  className="border p-2 rounded w-full"
                  placeholder="Enter value (e.g., 100)"
                  value={manualReferenceInput}
                  onChange={(e) => setManualReferenceInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setManualReference();
                    }
                  }}
                />
              </div>
              <Button onClick={setManualReference} disabled={!manualReferenceInput}>
                Set Reference
              </Button>
            </div>

            {/* Active Reference Display */}
            {referenceInfo && (
              <div className="border-2 border-green-500 bg-green-50 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-green-700">{referenceInfo}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {referenceTimestamp 
                        ? "Hover over the chart to compare values with this reference point"
                        : "This horizontal line shows the reference value on the Y-axis. All signals will be compared against this value."}
                    </p>
                  </div>
                  <button
                    onClick={clearReference}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              💡 Tip: You can also click on any point in the chart to set it as reference, or enter a custom Y-axis value above for comparing multiple signals.
            </p>
          </div>
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

            <div>
              <label className="block mb-1 font-semibold">Select Signal:</label>
              <select
                className="border p-2 rounded w-full"
                value={signalSelected?.signalTypeId ?? ""}
                onChange={(e) => {
                  const selectedSignal = mainSignals.find(a => a.signalTypeId === e.target.value) ?? null;
                  setSignalSelected(selectedSignal);
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

            <div>
              <p className="font-semibold">Assigned Device:</p>
              {deviceName ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {deviceName.split(",").map((d, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 rounded text-sm">
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not Assigned</p>
              )}
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
                <div>
                  <label className="block mb-1 font-semibold">Select Signal:</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={compareSignalSelected?.signalTypeID || compareSignalSelected?.signalTypeId || ""}
                    onChange={(e) => {
                      const selected = compareSignals.find(s => 
                        (s.signalTypeID === e.target.value) || (s.signalTypeId === e.target.value)
                      ) ?? null;
                      setCompareSignalSelected(selected);
                    }}
                    disabled={!compareSignals.length}
                  >
                    <option value="">--Select Signal--</option>
                    {compareSignals.map((s, idx) => (
                      <option key={s.signalTypeID || s.signalTypeId || idx} value={s.signalTypeID || s.signalTypeId}>
                        {s.signalName}
                      </option>
                    ))}
                  </select>
                </div>

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
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-600 space-y-1">
              <p>📍 Click on any point to set reference line</p>
              <p>🔍 Drag to select a range for zoom (works with 1 or 2 signals)</p>
              {zoomStartIndex !== null && zoomEndIndex !== null && (
                <p className="text-blue-600 font-semibold">Zoomed: {displayData.length} points</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {/* Chart Style Selector */}
              <select
                className="border p-2 rounded text-sm"
                value={chartStyle}
                onChange={(e) => setChartStyle(e.target.value as any)}
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
              {zoomStartIndex !== null && zoomEndIndex !== null && (
                <Button 
                  onClick={resetZoom}
                  variant="outline"
                  size="sm"
                >
                  Reset Zoom
                </Button>
              )}
            </div>
          </div>
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
              {chartStyle === "line" && (
                <LineChart
                  data={displayData}
                  onMouseDown={handleChartMouseDown}
                  onMouseUp={handleChartMouseUp}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined && !isSelectingZoom) {
                      handleChartClick(displayData[state.activeTooltipIndex]);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#ccc" }} />
                  <Legend />

                  {/* Reference Line */}
                  {referenceValue !== null && (
                    <ReferenceLine
                      y={referenceValue}
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: `Ref: ${referenceValue.toFixed(2)}`,
                        position: "right",
                        fill: "#16a34a",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                  )}

                  {/* Main Signal Line */}
                  {mainKeys.map(key => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForAsset(mainAsset?.assetId ?? "")}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}

                  {/* Compare Signal Line */}
                  {compareKeys.map(key => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForAsset(compareAssetId)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              )}

              {chartStyle === "area" && (
                <AreaChart
                  data={displayData}
                  onMouseDown={handleChartMouseDown}
                  onMouseUp={handleChartMouseUp}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined && !isSelectingZoom) {
                      handleChartClick(displayData[state.activeTooltipIndex]);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#ccc" }} />
                  <Legend />

                  {/* Reference Line */}
                  {referenceValue !== null && (
                    <ReferenceLine
                      y={referenceValue}
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: `Ref: ${referenceValue.toFixed(2)}`,
                        position: "right",
                        fill: "#16a34a",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                  )}

                  {/* Main Signal Area */}
                  {mainKeys.map(key => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForAsset(mainAsset?.assetId ?? "")}
                      fill={colorForAsset(mainAsset?.assetId ?? "")}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}

                  {/* Compare Signal Area */}
                  {compareKeys.map(key => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForAsset(compareAssetId)}
                      fill={colorForAsset(compareAssetId)}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              )}

              {chartStyle === "bar" && (
                <BarChart
                  data={displayData}
                  onMouseDown={handleChartMouseDown}
                  onMouseUp={handleChartMouseUp}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined && !isSelectingZoom) {
                      handleChartClick(displayData[state.activeTooltipIndex]);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                  <Legend />

                  {/* Reference Line */}
                  {referenceValue !== null && (
                    <ReferenceLine
                      y={referenceValue}
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: `Ref: ${referenceValue.toFixed(2)}`,
                        position: "right",
                        fill: "#16a34a",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                  )}

                  {/* Main Signal Bar */}
                  {mainKeys.map(key => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={colorForAsset(mainAsset?.assetId ?? "")}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}

                  {/* Compare Signal Bar */}
                  {compareKeys.map(key => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={colorForAsset(compareAssetId)}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}