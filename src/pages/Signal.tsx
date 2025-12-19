// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
// import { getDeviceById } from "@/api/deviceApi";
// import { getTelemetryData, TimeRange } from "@/api/telemetryApi";
// import type { Asset, SignalType } from "@/api/assetApi";
// import { getMappingById } from "@/api/assetApi";
// import { Button } from "@/components/ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { Calendar as CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";

// /* ------------------------------ Helpers ------------------------------ */
// function mulberry32(a: number) {
//   return function () {
//     let t = (a += 0x6d2b79f5);
//     t = Math.imul(t ^ (t >>> 15), t | 1);
//     t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
//     return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//   };
// }

// function hashStringToInt(s: string) {
//   let h = 2166136261 >>> 0;
//   for (let i = 0; i < s.length; i++) {
//     h = Math.imul(h ^ s.charCodeAt(i), 16777619);
//   }
//   return h >>> 0;
// }

// function colorForAsset(assetId: string) {
//   const seed = hashStringToInt(assetId);
//   const rnd = mulberry32(seed);
//   const r = Math.floor(rnd() * 200) + 20;
//   const g = Math.floor(rnd() * 200) + 20;
//   const b = Math.floor(rnd() * 200) + 20;
//   return `rgb(${r}, ${g}, ${b})`;
// }

// /* ---------------------------- Types & Component ---------------------------- */
// export default function Signals() {
//   const { state } = useLocation();
//   const passedAsset = (state as any)?.asset as Asset | undefined | null;

//   const [mainAsset, setMainAsset] = useState<Asset | null>(passedAsset ?? null);
//   const [deviceName, setDeviceName] = useState<string>("Loading...");
//   const [allAssets, setAllAssets] = useState<Asset[]>([]);
//   const [compareAssetId, setCompareAssetId] = useState<string>("");
//   const [mainSignals, setMainSignals] = useState<any[]>([]);
//   const [compareSignals, setCompareSignals] = useState<SignalType[]>([]);
//   const [compareDeviceName, setCompareDeviceName] = useState<string>("Loading...");
//   const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("today");
//   const [customStart, setCustomStart] = useState<Date | null>(null);
//   const [customEnd, setCustomEnd] = useState<Date | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [telemetryData, setTelemetryData] = useState<any[]>([]);
//   const [fetchingData, setFetchingData] = useState<boolean>(false);
//   const [signalSelected, setSignalSelected] = useState<any | null>(null);
//   const [compareSignalSelected, setCompareSignalSelected] = useState<SignalType | null>(null);


//   const flattenAssets = (assets: Asset[]): Asset[] => {
//     const out: Asset[] = [];
//     const stack = [...assets];
//     while (stack.length) {
//       const a = stack.shift()!;
//       if (a.level > 2) out.push(a);
//       if (a.childrens?.length) stack.unshift(...a.childrens);
//     }
//     return out;
//   };

//   /* ---------------- Load asset hierarchy ---------------- */
//   useEffect(() => {
//     const loadHierarchy = async () => {
//       setLoading(true);
//       try {
//         const hierarchy = await getAssetHierarchy();
//         setAllAssets(flattenAssets(hierarchy || []));
//       } catch (err) {
//         console.error("Failed to load asset hierarchy", err);
//         setAllAssets([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadHierarchy();
//   }, []);

//   /* ---------------- Load main asset signals & device ---------------- */
//   useEffect(() => {
//     const loadMainSignals = async () => {
//       if (!mainAsset) {
//         setDeviceName("Not Assigned");
//         setMainSignals([]);
//         return;
//       }
//       try {
//         const signalOnAsset = await getSignalOnAsset(mainAsset.assetId);
//         if (signalOnAsset?.length > 0) {
//           setMainSignals(signalOnAsset);
//           // console.log("Main signals loaded:", signalOnAsset);
//           const deviceNames = await fetchDevicesForAsset(mainAsset.assetId);
//           setDeviceName(deviceNames.join(", "));
//         } else {
//           setMainSignals([]);
//           setDeviceName("Not Assigned");
//         }
//       } catch (err) {
//         console.error("Failed to fetch main asset signals", err);
//         setMainSignals([]);
//         setDeviceName("Error");
//       }
//     };
//     loadMainSignals();
//   }, [mainAsset]);

//   // reset signal for compare when compare asset changes

// useEffect(() => {
//   setCompareSignalSelected(null);
// }, [compareAssetId]);


//   /* ---------------- Compare asset signals & device ---------------- */
//   useEffect(() => {
//     const loadCompareSignals = async () => {
//       if (!compareAssetId) {
//         setCompareSignals([]);
//         setCompareDeviceName("Not Assigned");
//         return;
//       }
//       try {
//         const mappings = await getSignalOnAsset(compareAssetId);
//         setCompareSignals(mappings);
//         const deviceNames = await fetchDevicesForAsset(compareAssetId);
//         setCompareDeviceName(deviceNames.join(", "));
//       } catch (err) {
//         console.error("Failed to fetch compare asset signals", err);
//         setCompareSignals([]);
//         setCompareDeviceName("Error");
//       }
//     };
//     loadCompareSignals();
//   }, [compareAssetId]);

//   const fetchDevicesForAsset = async (assetId: string): Promise<string[]> => {
//     try {
//       const mappings = await getMappingById(assetId);
//       const uniqueDeviceIds = Array.from(new Set(mappings.map(m => m.deviceId).filter(Boolean)));
//       const deviceNames = await Promise.all(
//         uniqueDeviceIds.map(async (deviceId) => {
//           try {
//             const device = await getDeviceById(deviceId);
//             return device?.name ?? device?.data?.name ?? "Not Assigned";
//           } catch {
//             return "Unknown Device";
//           }
//         })
//       );
//       return deviceNames;
//     } catch (err) {
//       console.error(`Failed to fetch devices for asset ${assetId}`, err);
//       return ["Error"];
//     }
//   };

//   // Reset signal selection when main asset changes
//   useEffect(() => {
//     setSignalSelected(null);
//   }, [mainAsset]);

//   // console.log("Currently selected signal:", signalSelected);

//   /* ---------------- Fetch Telemetry Data ---------------- */
//   useEffect(() => {
//     const fetchTelemetryData = async () => {
//       // CHANGED: Check if signal is selected first
//       if (!signalSelected) {
//         setTelemetryData([]);
//         return;
//       }

//       if (!mainAsset || mainSignals.length === 0) {
//         setTelemetryData([]);
//         return;
//       }

//       setFetchingData(true);
//       try {
//         // Determine time range
//         let apiTimeRange: TimeRange;
//         let startDate: string | undefined;
//         let endDate: string | undefined;

//         if (timeRange === "24h") {
//           apiTimeRange = TimeRange.Last24Hours;
//         } else if (timeRange === "7d") {
//           apiTimeRange = TimeRange.Last7Days;
//         } else if (timeRange === "today") {
//           apiTimeRange = TimeRange.Custom;
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
//           startDate = today.toISOString();
//           endDate = new Date().toISOString();
//         } else if (timeRange === "custom") {
//           apiTimeRange = TimeRange.Custom;
//           startDate = customStart?.toISOString();
//           endDate = customEnd?.toISOString();
//         } else {
//           apiTimeRange = TimeRange.Last24Hours;
//         }

//         // CHANGED: Only fetch data for the selected signal
//        const allSignals = [];
//         if (signalSelected) allSignals.push(signalSelected);
//         if (compareSignalSelected) allSignals.push(compareSignalSelected);


//         const dataPromises = allSignals.map(async (signal) => {
//           try {
//             const response = await getTelemetryData({
//               assetId: signal.assetId,
//               signalTypeId: signal.signalTypeId,
//               timeRange: apiTimeRange,
//               startDate,
//               endDate,
//             });
//             return {
//               ...response,
//               signalKey: `${signal.assetId}-${signal.signalName}`,
//               assetName: allAssets.find(a => a.assetId === signal.assetId)?.name || "Unknown",
//             };
//           } catch (error) {
//             console.error(`Failed to fetch data for signal ${signal.signalName}:`, error);
//             return null;
//           }
//         });

//         const results = await Promise.all(dataPromises);
//         const validResults = results.filter(r => r !== null);

//         // Transform data for recharts
//         if (validResults.length > 0) {
//           const timeMap = new Map();
//           validResults.forEach((result) => {
//             result.values.forEach((point: any) => {
//               const timeKey = new Date(point.time).toLocaleTimeString('en-US', {
//                 hour: '2-digit',
//                 minute: '2-digit'
//               });
//               if (!timeMap.has(timeKey)) {
//                 timeMap.set(timeKey, { timestamp: timeKey });
//               }
//               const dataPoint = timeMap.get(timeKey);
//               const key = `${result.assetName}-${result.signalName}`;
//               dataPoint[key] = point.value;
//             });
//           });

//           const chartData = Array.from(timeMap.values()).sort((a, b) => {
//             return new Date('1970/01/01 ' + a.timestamp).getTime() - 
//                    new Date('1970/01/01 ' + b.timestamp).getTime();
//           });

//           setTelemetryData(chartData);
//         } else {
//           setTelemetryData([]);
//         }
//       } catch (error) {
//         console.error("Failed to fetch telemetry data:", error);
//         setTelemetryData([]);
//       } finally {
//         setFetchingData(false);
//       }
//     };

//     fetchTelemetryData();
//   }, [mainAsset, mainSignals, compareAssetId, compareSignals, timeRange, customStart, customEnd, allAssets, signalSelected,compareSignalSelected]); 
//   // CHANGED: Added signalSelected to dependency array

//   /* ---------------- Chart Keys ---------------- */
//   const mainKeys = useMemo(() => {
//     if (!mainAsset || !signalSelected) return [];
//     // CHANGED: Only return the selected signal's key
//     return [`${mainAsset.name}-${signalSelected.signalName}`];
//   }, [mainAsset, signalSelected]);

//   const compareKeys = useMemo(() => {
//   if (!compareAssetId || !compareSignalSelected) return [];
//   const assetObj = allAssets.find(a => a.assetId === compareAssetId);
//   if (!assetObj) return [];
//   return [`${assetObj.name}-${compareSignalSelected.signalName}`];
// }, [compareAssetId, compareSignalSelected, allAssets]);


//   /* ---------------------- Small Shadcn Single Date Picker ---------------------- */
//   const today = new Date();

//   function SingleDatePicker({
//     value,
//     onChange,
//     placeholder,
//   }: {
//     value: Date | null;
//     onChange: (d: Date | null) => void;
//     placeholder?: string;
//   }) {
//     return (
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline" className="justify-start text-left font-normal">
//             <CalendarIcon className="mr-2 h-4 w-4" />
//             {value ? format(value, "PPP") : placeholder ?? "Pick date"}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0">
//           <Calendar
//             mode="single"
//             selected={value ?? undefined}
//             onSelect={(d) => onChange(d ?? null)}
//             disabled={(date) => date > today}
//             initialFocus
//           />
//         </PopoverContent>
//       </Popover>
//     );
//   }

//   /* ---------------------------- JSX ---------------------------- */
//   return (
//     <div className="container mx-auto p-4 space-y-4">
//       {/* PAGE TITLE */}
//       <h1 className="text-3xl font-bold">Signal Analysis</h1>

//       {/* TIME RANGE SECTION */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Time Range</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <select
//             className="border p-2 rounded w-full"
//             value={timeRange}
//             onChange={(e) => setTimeRange(e.target.value as any)}
//           >
//             <option value="24h">Last 24 Hours</option>
//             <option value="7d">Last 7 Days</option>
//             <option value="today">Today</option>
//             <option value="custom">Custom Range</option>
//           </select>

//           {timeRange === "custom" && (
//             <div className="flex gap-4 mt-4 items-center">
//               {/* Start Date */}
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline">
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {customStart ? format(customStart, "PPP") : "Start Date"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0">
//                   <Calendar
//                     mode="single"
//                     selected={customStart ?? undefined}
//                     onSelect={(date) => setCustomStart(date ?? null)}
//                     disabled={date => date > new Date()}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>

//               <span>to</span>

//               {/* End Date */}
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline">
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {customEnd ? format(customEnd, "PPP") : "End Date"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0">
//                   <Calendar
//                     mode="single"
//                     selected={customEnd ?? undefined}
//                     onSelect={(date) => setCustomEnd(date ?? null)}
//                     disabled={date => date < customStart || date > new Date()}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* 2 CARDS: MAIN + COMPARE */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* MAIN ASSET CARD */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Selected Asset</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {/* Asset Dropdown */}
//             <div>
//               <label className="block mb-1 font-semibold">Select Asset:</label>
//               <select
//                 className="border p-2 rounded w-full"
//                 value={mainAsset?.assetId ?? ""}
//                 onChange={(e) =>
//                   setMainAsset(allAssets.find(a => a.assetId === e.target.value) ?? null)
//                 }
//               >
//                 <option value="">--Select Asset--</option>
//                 {allAssets.map(a => (
//                   <option key={a.assetId} value={a.assetId}>
//                     {a.name} (Level {a.level})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Signal Selection - CHANGED: Added this section */}
//             <div>
//               <label className="block mb-1 font-semibold">Select Signal:</label>
//               <select
//                 className="border p-2 rounded w-full"
//                 value={signalSelected?.signalTypeId ?? ""}
//                 onChange={(e) => {
//                   const selectedSignal = mainSignals.find(a => a.signalTypeId === e.target.value) ?? null;
//                   setSignalSelected(selectedSignal);
//                   // console.log("Signal selected:", selectedSignal);
//                 }}
//                 disabled={!mainSignals.length}
//               >
//                 <option value="">--Select Signal--</option>
//                 {mainSignals.map(a => (
//                   <option key={a.signalTypeId} value={a.signalTypeId}>
//                     {a.signalName}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             {/* Device */}
//           <div>
//             <p className="font-semibold">Assigned Device:</p>
//             {deviceName ? (
//               <div className="flex flex-wrap gap-2 mt-1">
//                 {deviceName.split(",").map((d, idx) => (
//                   <span key={idx} className="px-2 py-1 bg-blue-100 rounded text-sm">
//                     {d}
//                   </span>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">Not Assigned</p>
//             )}
//           </div>
//           </CardContent>
//         </Card>

//         {/* COMPARE ASSET CARD */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Compare Asset</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div>
//               <label className="block mb-1 font-semibold">Select Asset</label>
//               {loading ? (
//                 <p>Loading...</p>
//               ) : (
//                 <select
//                   className="border p-2 rounded w-full"
//                   value={compareAssetId}
//                   onChange={(e) => setCompareAssetId(e.target.value)}
//                   disabled={!mainAsset}
//                 >
//                   <option value="">None</option>
//                   {allAssets
//                     .filter(a => a.assetId !== mainAsset?.assetId)
//                     .map(a => (
//                       <option key={a.assetId} value={a.assetId}>
//                         {a.name} (Level {a.level})
//                       </option>
//                     ))}
//                 </select>
//               )}
//             </div>

//             {compareAssetId && (
//               <div className="mt-4 space-y-4">
//                {/* Compare Signal Selection */}
//             <div className="mt-4">
//               <label className="block mb-1 font-semibold">Select Signal:</label>
//               <select
//                 className="border p-2 rounded w-full"
//                 value={compareSignalSelected?.signalTypeId ?? ""}
//                 onChange={(e) => {
//                   const selected = compareSignals.find(s => s.signalTypeId === e.target.value) ?? null;
//                   setCompareSignalSelected(selected);
//                 }}
//                 disabled={!compareSignals.length}
//               >
//                 <option value="">--Select Signal--</option>
//                 {compareSignals.map(s => (
//                   <option key={s.signalTypeId} value={s.signalTypeId}>
//                     {s.signalName}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             {/* Device */}
//                 <div>
//                   <p className="font-semibold">Assigned Device:</p>
//                   {compareDeviceName ? (
//                     <div className="flex flex-wrap gap-2 mt-1">
//                       {compareDeviceName.split(",").map((d, idx) => (
//                         <span key={idx} className="px-2 py-1 bg-blue-100 rounded text-sm">
//                           {d}
//                         </span>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-gray-500">Not Assigned</p>
//                   )}
//                 </div>

//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* GRAPH CARD */}
//       <Card>
//         <CardHeader>
//           <CardTitle>
//             Signals Graph
//             {fetchingData && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {fetchingData ? (
//             <div className="h-96 flex items-center justify-center">
//               <p className="text-gray-500">Loading telemetry data...</p>
//             </div>
//           ) : telemetryData.length === 0 ? (
//             <div className="h-96 flex items-center justify-center">
//               <p className="text-gray-500">
//                 No data available. Please select an asset and a signal.
//               </p>
//             </div>
//           ) : (
//             <ResponsiveContainer width="100%" height={400}>
//               <LineChart data={telemetryData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="timestamp" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 {mainKeys.map(key => (
//                   <Line
//                     key={key}
//                     type="monotone"
//                     dataKey={key}
//                     stroke={colorForAsset(mainAsset?.assetId ?? "")}
//                     strokeWidth={2}
//                   />
//                 ))}
//                 {compareKeys.map(key => {
//                   const assetObj = allAssets.find(a => a.assetId === compareAssetId);
//                   return (
//                     <Line
//                       key={key}
//                       type="monotone"
//                       dataKey={key}
//                       stroke={colorForAsset(compareAssetId)}
//                       strokeWidth={2}
//                       strokeDasharray="5 5"
//                     />
//                   );
//                 })}
//               </LineChart>
//             </ResponsiveContainer>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
// import { getDeviceById } from "@/api/deviceApi";
// import { getTelemetryData, TimeRange } from "@/api/telemetryApi";
// import type { Asset, SignalType } from "@/api/assetApi";
// import { getMappingById } from "@/api/assetApi";
// import { Button } from "@/components/ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { Calendar as CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   ReferenceArea,
// } from "recharts";

// /* ------------------------------ Helpers ------------------------------ */
// function mulberry32(a: number) {
//   return function () {
//     let t = (a += 0x6d2b79f5);
//     t = Math.imul(t ^ (t >>> 15), t | 1);
//     t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
//     return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//   };
// }

// function hashStringToInt(s: string) {
//   let h = 2166136261 >>> 0;
//   for (let i = 0; i < s.length; i++) {
//     h = Math.imul(h ^ s.charCodeAt(i), 16777619);
//   }
//   return h >>> 0;
// }

// function colorForString(str: string) {
//   const seed = hashStringToInt(str);
//   const rnd = mulberry32(seed);
//   const r = Math.floor(rnd() * 200) + 20;
//   const g = Math.floor(rnd() * 200) + 20;
//   const b = Math.floor(rnd() * 200) + 20;
//   return `rgb(${r}, ${g}, ${b})`;
// }

// /* ---------------------------- Types & Component ---------------------------- */
// export default function Signals() {
//   const { state } = useLocation();
//   const passedAsset = (state as any)?.asset as Asset | undefined | null;
//   const [mainAsset, setMainAsset] = useState<Asset | null>(passedAsset ?? null);
//   const [deviceName, setDeviceName] = useState("Loading...");
//   const [allAssets, setAllAssets] = useState<Asset[]>([]);
//   const [compareAssetId, setCompareAssetId] = useState("");
//   const [mainSignals, setMainSignals] = useState<SignalType[]>([]);
//   const [compareSignals, setCompareSignals] = useState<SignalType[]>([]);
//   const [compareDeviceName, setCompareDeviceName] = useState("Loading...");
//   const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("today");
//   const [customStart, setCustomStart] = useState<Date | null>(null);
//   const [customEnd, setCustomEnd] = useState<Date | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [fullTelemetryData, setFullTelemetryData] = useState<any[]>([]);
//   const [displayedTelemetryData, setDisplayedTelemetryData] = useState<any[]>([]);
//   const [fetchingData, setFetchingData] = useState(false);
//   const [selectedSignals, setSelectedSignals] = useState<SignalType[]>([]);
//   const [compareSelectedSignals, setCompareSelectedSignals] = useState<SignalType[]>([]);
//   const [refAreaLeft, setRefAreaLeft] = useState<number | undefined>(undefined);
//   const [refAreaRight, setRefAreaRight] = useState<number | undefined>(undefined);

//   const flattenAssets = (assets: Asset[]): Asset[] => {
//     const out: Asset[] = [];
//     const stack = [...assets];
//     while (stack.length) {
//       const a = stack.shift()!;
//       if (a.level > 2) out.push(a);
//       if (a.childrens?.length) stack.unshift(...a.childrens);
//     }
//     return out;
//   };

//   /* ---------------- Load asset hierarchy ---------------- */
//   useEffect(() => {
//     const loadHierarchy = async () => {
//       setLoading(true);
//       try {
//         const hierarchy = await getAssetHierarchy();
//         setAllAssets(flattenAssets(hierarchy || []));
//       } catch (err) {
//         console.error("Failed to load asset hierarchy", err);
//         setAllAssets([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadHierarchy();
//   }, []);

//   /* ---------------- Load main asset signals & device ---------------- */
//   useEffect(() => {
//     const loadMainSignals = async () => {
//       if (!mainAsset) {
//         setDeviceName("Not Assigned");
//         setMainSignals([]);
//         return;
//       }
//       try {
//         const signalOnAsset = await getSignalOnAsset(mainAsset.assetId);
//         if (signalOnAsset?.length > 0) {
//           setMainSignals(signalOnAsset);
//           const deviceNames = await fetchDevicesForAsset(mainAsset.assetId);
//           setDeviceName(deviceNames.join(", "));
//         } else {
//           setMainSignals([]);
//           setDeviceName("Not Assigned");
//         }
//       } catch (err) {
//         console.error("Failed to fetch main asset signals", err);
//         setMainSignals([]);
//         setDeviceName("Error");
//       }
//     };
//     loadMainSignals();
//   }, [mainAsset]);

//   // reset signals for main when main asset changes
//   useEffect(() => {
//     setSelectedSignals([]);
//   }, [mainAsset]);

//   // reset signals for compare when compare asset changes
//   useEffect(() => {
//     setCompareSelectedSignals([]);
//   }, [compareAssetId]);

//   /* ---------------- Compare asset signals & device ---------------- */
//   useEffect(() => {
//     const loadCompareSignals = async () => {
//       if (!compareAssetId) {
//         setCompareSignals([]);
//         setCompareDeviceName("Not Assigned");
//         return;
//       }
//       try {
//         const mappings = await getSignalOnAsset(compareAssetId);
//         setCompareSignals(mappings);
//         const deviceNames = await fetchDevicesForAsset(compareAssetId);
//         setCompareDeviceName(deviceNames.join(", "));
//       } catch (err) {
//         console.error("Failed to fetch compare asset signals", err);
//         setCompareSignals([]);
//         setCompareDeviceName("Error");
//       }
//     };
//     loadCompareSignals();
//   }, [compareAssetId]);

//   const fetchDevicesForAsset = async (assetId: string): Promise<string[]> => {
//     try {
//       const mappings = await getMappingById(assetId);
//       const uniqueDeviceIds = Array.from(new Set(mappings.map(m => m.deviceId).filter(Boolean)));
//       const deviceNames = await Promise.all(
//         uniqueDeviceIds.map(async (deviceId) => {
//           try {
//             const device = await getDeviceById(deviceId);
//             return device?.name ?? device?.data?.name ?? "Not Assigned";
//           } catch {
//             return "Unknown Device";
//           }
//         })
//       );
//       return deviceNames;
//     } catch (err) {
//       console.error(`Failed to fetch devices for asset ${assetId}`, err);
//       return ["Error"];
//     }
//   };

//   /* ---------------- Fetch Telemetry Data ---------------- */
//   useEffect(() => {
//     const fetchTelemetryData = async () => {
//       if (selectedSignals.length === 0 && compareSelectedSignals.length === 0) {
//         setFullTelemetryData([]);
//         setDisplayedTelemetryData([]);
//         return;
//       }
//       if (!mainAsset && !compareAssetId) {
//         setFullTelemetryData([]);
//         setDisplayedTelemetryData([]);
//         return;
//       }
//       setFetchingData(true);
//       try {
//         // Determine time range
//         let apiTimeRange: TimeRange;
//         let startDate: string | undefined;
//         let endDate: string | undefined;
//         if (timeRange === "24h") {
//           apiTimeRange = TimeRange.Last24Hours;
//         } else if (timeRange === "7d") {
//           apiTimeRange = TimeRange.Last7Days;
//         } else if (timeRange === "today") {
//           apiTimeRange = TimeRange.Custom;
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
//           startDate = today.toISOString();
//           endDate = new Date().toISOString();
//         } else if (timeRange === "custom") {
//           apiTimeRange = TimeRange.Custom;
//           startDate = customStart?.toISOString();
//           endDate = customEnd?.toISOString();
//         } else {
//           apiTimeRange = TimeRange.Last24Hours;
//         }

//         const allSignals = [...selectedSignals, ...compareSelectedSignals];
//         const dataPromises = allSignals.map(async (signal) => {
//           try {
//             const response = await getTelemetryData({
//               assetId: signal.assetId,
//               signalTypeId: signal.signalTypeId,
//               timeRange: apiTimeRange,
//               startDate,
//               endDate,
//             });
//             return {
//               ...response,
//               signalKey: `${signal.assetId}-${signal.signalName}`,
//               signalName: signal.signalName,
//               assetName: allAssets.find(a => a.assetId === signal.assetId)?.name || "Unknown",
//             };
//           } catch (error) {
//             console.error(`Failed to fetch data for signal ${signal.signalName}:`, error);
//             return null;
//           }
//         });

//         const results = await Promise.all(dataPromises);
//         const validResults = results.filter(r => r !== null);

//         // Transform data for recharts
//         if (validResults.length > 0) {
//           const timeMap = new Map<number, any>();
//           validResults.forEach((result: any) => {
//             result.values.forEach((point: any) => {
//               const timeKey = new Date(point.time).getTime();
//               if (!timeMap.has(timeKey)) {
//                 timeMap.set(timeKey, { time: timeKey });
//               }
//               const dataPoint = timeMap.get(timeKey);
//               const key = `${result.assetName}-${result.signalName}`;
//               dataPoint[key] = point.value;
//             });
//           });
//           const chartData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
//           setFullTelemetryData(chartData);
//           setDisplayedTelemetryData(chartData);
//         } else {
//           setFullTelemetryData([]);
//           setDisplayedTelemetryData([]);
//         }
//       } catch (error) {
//         console.error("Failed to fetch telemetry data:", error);
//         setFullTelemetryData([]);
//         setDisplayedTelemetryData([]);
//       } finally {
//         setFetchingData(false);
//       }
//     };
//     fetchTelemetryData();
//   }, [mainAsset, mainSignals, compareAssetId, compareSignals, timeRange, customStart, customEnd, allAssets, selectedSignals, compareSelectedSignals]);

//   /* ---------------- Chart Keys ---------------- */
//   const mainKeys = useMemo(() => {
//     if (!mainAsset) return [];
//     return selectedSignals.map(s => `${mainAsset.name}-${s.signalName}`);
//   }, [mainAsset, selectedSignals]);

//   const compareKeys = useMemo(() => {
//     if (!compareAssetId) return [];
//     const assetObj = allAssets.find(a => a.assetId === compareAssetId);
//     if (!assetObj) return [];
//     return compareSelectedSignals.map(s => `${assetObj.name}-${s.signalName}`);
//   }, [compareAssetId, compareSelectedSignals, allAssets]);

//   const allKeys = useMemo(() => [...mainKeys, ...compareKeys], [mainKeys, compareKeys]);

//   /* ---------------- Zoom Functionality ---------------- */
//   const zoom = () => {
//     let left = refAreaLeft;
//     let right = refAreaRight;
//     if (left === right || right === undefined || left === undefined) {
//       setRefAreaLeft(undefined);
//       setRefAreaRight(undefined);
//       return;
//     }
//     if (left > right) [left, right] = [right, left];
//     const zoomedData = displayedTelemetryData.filter(d => d.time >= left && d.time <= right);
//     setDisplayedTelemetryData(zoomedData);
//     setRefAreaLeft(undefined);
//     setRefAreaRight(undefined);
//   };

//   const zoomOut = () => {
//     setDisplayedTelemetryData(fullTelemetryData);
//   };

//   /* ---------------------- Small Shadcn Single Date Picker ---------------------- */
//   const today = new Date();
//   function SingleDatePicker({
//     value,
//     onChange,
//     placeholder,
//     disabled = (date: Date) => date > today,
//   }: {
//     value: Date | null;
//     onChange: (d: Date | null) => void;
//     placeholder?: string;
//     disabled?: (date: Date) => boolean;
//   }) {
//     return (
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline">
//             <CalendarIcon className="mr-2 h-4 w-4" />
//             {value ? format(value, "PPP") : placeholder ?? "Pick date"}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0">
//           <Calendar mode="single" selected={value} onSelect={onChange} disabled={disabled} initialFocus />
//         </PopoverContent>
//       </Popover>
//     );
//   }

//   /* ---------------------------- JSX ---------------------------- */
//   return (
//     <div className="p-4 space-y-6">
//       {/* PAGE TITLE */}
//       <h1 className="text-2xl font-bold">Signal Analysis</h1>

//       {/* TIME RANGE SECTION */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Time Range</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <select
//             value={timeRange}
//             onChange={e => setTimeRange(e.target.value as any)}
//             className="border p-2 rounded"
//           >
//             <option value="24h">Last 24 Hours</option>
//             <option value="7d">Last 7 Days</option>
//             <option value="today">Today</option>
//             <option value="custom">Custom Range</option>
//           </select>
//           {timeRange === "custom" && (
//             <div className="flex items-center space-x-2">
//               {/* Start Date */}
//               <SingleDatePicker
//                 value={customStart}
//                 onChange={setCustomStart}
//                 placeholder="Start Date"
//                 disabled={date => date > new Date()}
//               />
//               <span>to</span>
//               {/* End Date */}
//               <SingleDatePicker
//                 value={customEnd}
//                 onChange={setCustomEnd}
//                 placeholder="End Date"
//                 disabled={date => (customStart ? date < customStart : false) || date > new Date()}
//               />
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* 2 CARDS: MAIN + COMPARE */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* MAIN ASSET CARD */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Selected Asset</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {/* Asset Dropdown */}
//             <div>
//               <label>Select Asset:</label>
//               <select
//                 value={mainAsset?.assetId ?? ""}
//                 onChange={e =>
//                   setMainAsset(allAssets.find(a => a.assetId === e.target.value) ?? null)
//                 }
//                 className="border p-2 rounded w-full"
//               >
//                 <option value="">--Select Asset--</option>
//                 {allAssets.map(a => (
//                   <option key={a.assetId} value={a.assetId}>
//                     {a.name} (Level {a.level})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Signal Selection */}
//             <div>
//               <label>Select Signals:</label>
//               <select
//                 multiple
//                 value={selectedSignals.map(s => s.signalTypeId)}
//                 onChange={e => {
//                   const values = Array.from(e.target.selectedOptions, option => option.value);
//                   const selected = values
//                     .map(v => mainSignals.find(s => s.signalTypeId === v))
//                     .filter(Boolean) as SignalType[];
//                   setSelectedSignals(selected);
//                 }}
//                 disabled={!mainSignals.length}
//                 className="border p-2 rounded w-full h-32"
//               >
//                 {mainSignals.map(a => (
//                   <option key={a.signalTypeId} value={a.signalTypeId}>
//                     {a.signalName}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Device */}
//             <div>
//               <label>Assigned Device:</label>
//               <p>{deviceName ? deviceName.split(",").map((d, idx) => <span key={idx}>{d}</span>) : "Not Assigned"}</p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* COMPARE ASSET CARD */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Compare Asset</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div>
//               <label>Select Asset</label>
//               {loading ? (
//                 <p>Loading...</p>
//               ) : (
//                 <select
//                   value={compareAssetId}
//                   onChange={e => setCompareAssetId(e.target.value)}
//                   disabled={!mainAsset}
//                   className="border p-2 rounded w-full"
//                 >
//                   <option value="">None</option>
//                   {allAssets
//                     .filter(a => a.assetId !== mainAsset?.assetId)
//                     .map(a => (
//                       <option key={a.assetId} value={a.assetId}>
//                         {a.name} (Level {a.level})
//                       </option>
//                     ))}
//                 </select>
//               )}
//             </div>

//             {compareAssetId && (
//               <>
//                 {/* Compare Signal Selection */}
//                 <div>
//                   <label>Select Signals:</label>
//                   <select
//                     multiple
//                     value={compareSelectedSignals.map(s => s.signalTypeId)}
//                     onChange={e => {
//                       const values = Array.from(e.target.selectedOptions, option => option.value);
//                       const selected = values
//                         .map(v => compareSignals.find(s => s.signalTypeId === v))
//                         .filter(Boolean) as SignalType[];
//                       setCompareSelectedSignals(selected);
//                     }}
//                     disabled={!compareSignals.length}
//                     className="border p-2 rounded w-full h-32"
//                   >
//                     {compareSignals.map(s => (
//                       <option key={s.signalTypeId} value={s.signalTypeId}>
//                         {s.signalName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Device */}
//                 <div>
//                   <label>Assigned Device:</label>
//                   <p>
//                     {compareDeviceName
//                       ? compareDeviceName.split(",").map((d, idx) => <span key={idx}>{d}</span>)
//                       : "Not Assigned"}
//                   </p>
//                 </div>
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* GRAPH CARD */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Signals Graph</CardTitle>
//           {fetchingData && <p>Loading...</p>}
//         </CardHeader>
//         <CardContent>
//           {fetchingData ? (
//             <p>Loading telemetry data...</p>
//           ) : fullTelemetryData.length === 0 ? (
//             <p>No data available. Please select an asset and signals.</p>
//           ) : (
//             <>
//               <Button onClick={zoomOut} className="mb-4">
//                 Zoom Out
//               </Button>
//               <ResponsiveContainer width="100%" height={400}>
//                 <LineChart
//                   data={displayedTelemetryData}
//                   onMouseDown={e => e && setRefAreaLeft(e.activeLabel as number)}
//                   onMouseMove={e => refAreaLeft && e && setRefAreaRight(e.activeLabel as number)}
//                   onMouseUp={zoom}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis
//                     dataKey="time"
//                     tickFormatter={tick => format(new Date(tick), "MMM dd HH:mm")}
//                   />
//                   <YAxis />
//                   <Tooltip labelFormatter={label => format(new Date(label), "MMM dd HH:mm:ss")} />
//                   <Legend />
//                   {allKeys.map(key => (
//                     <Line
//                       key={key}
//                       type="monotone"
//                       dataKey={key}
//                       stroke={colorForString(key)}
//                       name={key}
//                     />
//                   ))}
//                   {refAreaLeft && refAreaRight ? (
//                     <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
//                   ) : null}
//                 </LineChart>
//               </ResponsiveContainer>
//             </>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

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
import { Calendar as CalendarIcon, Pin, XCircle } from "lucide-react";
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
  ReferenceArea,
  ReferenceLine,
  Dot,
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

function colorForString(str: string) {
  const seed = hashStringToInt(str);
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
  const [deviceName, setDeviceName] = useState("Loading...");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [compareAssetId, setCompareAssetId] = useState("");
  const [mainSignals, setMainSignals] = useState<SignalType[]>([]);
  const [compareSignals, setCompareSignals] = useState<SignalType[]>([]);
  const [compareDeviceName, setCompareDeviceName] = useState("Loading...");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "today" | "custom">("today");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullTelemetryData, setFullTelemetryData] = useState<any[]>([]);
  const [displayedTelemetryData, setDisplayedTelemetryData] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<SignalType[]>([]);
  const [compareSelectedSignals, setCompareSelectedSignals] = useState<SignalType[]>([]);
  const [refAreaLeft, setRefAreaLeft] = useState<number | undefined>(undefined);
  const [refAreaRight, setRefAreaRight] = useState<number | undefined>(undefined);
  
  // Reference Point States
  const [referencePoint, setReferencePoint] = useState<{
    time: number;
    values: { [key: string]: number };
  } | null>(null);
  const [isSelectingReference, setIsSelectingReference] = useState(false);

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

  // reset signals for main when main asset changes
  useEffect(() => {
    setSelectedSignals([]);
  }, [mainAsset]);

  // reset signals for compare when compare asset changes
  useEffect(() => {
    setCompareSelectedSignals([]);
  }, [compareAssetId]);

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

  /* ---------------- Fetch Telemetry Data (uses backend aggregated data) ---------------- */
  useEffect(() => {
    const fetchTelemetryData = async () => {
      if (selectedSignals.length === 0 && compareSelectedSignals.length === 0) {
        setFullTelemetryData([]);
        setDisplayedTelemetryData([]);
        return;
      }
      if (!mainAsset && !compareAssetId) {
        setFullTelemetryData([]);
        setDisplayedTelemetryData([]);
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

        // Combine all selected signals from both assets
        const allSignals = [...selectedSignals, ...compareSelectedSignals];
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
              signalName: signal.signalName,
              assetName: allAssets.find(a => a.assetId === signal.assetId)?.name || "Unknown",
            };
          } catch (error) {
            console.error(`Failed to fetch data for signal ${signal.signalName}:`, error);
            return null;
          }
        });

        const results = await Promise.all(dataPromises);
        const validResults = results.filter(r => r !== null);

        // Transform data for recharts - NO aggregation, just use backend data as-is
        if (validResults.length > 0) {
          const timeMap = new Map<number, any>();
          validResults.forEach((result: any) => {
            result.values.forEach((point: any) => {
              const timeKey = new Date(point.time).getTime();
              if (!timeMap.has(timeKey)) {
                timeMap.set(timeKey, { time: timeKey });
              }
              const dataPoint = timeMap.get(timeKey);
              const key = `${result.assetName}-${result.signalName}`;
              dataPoint[key] = point.value;
            });
          });
          const chartData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
          setFullTelemetryData(chartData);
          setDisplayedTelemetryData(chartData);
        } else {
          setFullTelemetryData([]);
          setDisplayedTelemetryData([]);
        }
      } catch (error) {
        console.error("Failed to fetch telemetry data:", error);
        setFullTelemetryData([]);
        setDisplayedTelemetryData([]);
      } finally {
        setFetchingData(false);
      }
    };
    fetchTelemetryData();
  }, [mainAsset, compareAssetId, timeRange, customStart, customEnd, allAssets, selectedSignals, compareSelectedSignals]);

  /* ---------------- Chart Keys ---------------- */
  const mainKeys = useMemo(() => {
    if (!mainAsset) return [];
    return selectedSignals.map(s => `${mainAsset.name}-${s.signalName}`);
  }, [mainAsset, selectedSignals]);

  const compareKeys = useMemo(() => {
    if (!compareAssetId) return [];
    const assetObj = allAssets.find(a => a.assetId === compareAssetId);
    if (!assetObj) return [];
    return compareSelectedSignals.map(s => `${assetObj.name}-${s.signalName}`);
  }, [compareAssetId, compareSelectedSignals, allAssets]);

  const allKeys = useMemo(() => [...mainKeys, ...compareKeys], [mainKeys, compareKeys]);

  /* ---------------- Reference Point Functions ---------------- */
  const handleChartClick = (e: any) => {
    if (!isSelectingReference || !e || !e.activeLabel) return;
    
    const clickedTime = e.activeLabel;
    const dataPoint = displayedTelemetryData.find(d => d.time === clickedTime);
    
    if (dataPoint) {
      const values: { [key: string]: number } = {};
      allKeys.forEach(key => {
        if (dataPoint[key] != null) {
          values[key] = dataPoint[key];
        }
      });
      
      setReferencePoint({
        time: clickedTime,
        values,
      });
      setIsSelectingReference(false);
    }
  };

  const clearReferencePoint = () => {
    setReferencePoint(null);
    setIsSelectingReference(false);
  };

  const startSelectingReference = () => {
    setIsSelectingReference(true);
  };

  /* ---------------- Zoom Functionality ---------------- */
  const zoom = () => {
    if (isSelectingReference) return;
    
    let left = refAreaLeft;
    let right = refAreaRight;
    if (left === right || right === undefined || left === undefined) {
      setRefAreaLeft(undefined);
      setRefAreaRight(undefined);
      return;
    }
    if (left > right) [left, right] = [right, left];
    const zoomedData = displayedTelemetryData.filter(d => d.time >= left && d.time <= right);
    setDisplayedTelemetryData(zoomedData);
    setRefAreaLeft(undefined);
    setRefAreaRight(undefined);
  };

  const zoomOut = () => {
    setDisplayedTelemetryData(fullTelemetryData);
  };

  /* ---------------- Signal Selection Handlers ---------------- */
  const handleMainSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(opt => opt.value);
    const selected = mainSignals.filter(s => selectedIds.includes(s.signalTypeId));
    setSelectedSignals(selected);
  };

  const handleCompareSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(opt => opt.value);
    const selected = compareSignals.filter(s => selectedIds.includes(s.signalTypeId));
    setCompareSelectedSignals(selected);
  };

  /* ---------------- Custom Tooltip Component ---------------- */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white p-4 border border-gray-300 rounded shadow-lg max-w-md">
        <p className="font-semibold mb-2">{format(new Date(label), "MMM dd HH:mm:ss")}</p>
        
        {payload.map((entry: any, index: number) => {
          const currentValue = entry.value;
          const signalName = entry.name;
          
          let refValue = null;
          let difference = null;
          let percentChange = null;
          
          if (referencePoint && referencePoint.values) {
            refValue = referencePoint.values[signalName];
            if (refValue != null && currentValue != null) {
              difference = currentValue - refValue;
              percentChange = ((difference / refValue) * 100).toFixed(2);
            }
          }

          return (
            <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{signalName}</span>
              </div>
              
              <div className="ml-5 mt-1 space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Current: </span>
                  <span className="font-semibold">{currentValue?.toFixed(2)}</span>
                </div>
                
                {refValue != null && (
                  <>
                    <div>
                      <span className="text-gray-600">Reference: </span>
                      <span className="font-semibold">{refValue.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Difference: </span>
                      <span
                        className={`font-semibold ${
                          difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {difference > 0 ? "+" : ""}
                        {difference?.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Change: </span>
                      <span
                        className={`font-semibold ${
                          parseFloat(percentChange) > 0
                            ? "text-green-600"
                            : parseFloat(percentChange) < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {parseFloat(percentChange) > 0 ? "+" : ""}
                        {percentChange}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        {referencePoint && (
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
            Reference Point: {format(new Date(referencePoint.time), "MMM dd HH:mm:ss")}
          </p>
        )}
      </div>
    );
  };

  /* ---------------- Custom Reference Dot Component ---------------- */
  const ReferencePointDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#ff6b6b" stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </g>
    );
  };

  /* ---------------------- Small Shadcn Single Date Picker ---------------------- */
  const today = new Date();
  function SingleDatePicker({
    value,
    onChange,
    placeholder,
    disabled = (date: Date) => date > today,
  }: {
    value: Date | null;
    onChange: (d: Date | null) => void;
    placeholder?: string;
    disabled?: (date: Date) => boolean;
  }) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder ?? "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} disabled={disabled} initialFocus />
        </PopoverContent>
      </Popover>
    );
  }

  /* ---------------------------- JSX ---------------------------- */
  return (
    <div className="p-4 space-y-6">
      {/* PAGE TITLE */}
      <h1 className="text-2xl font-bold">Signal Analysis</h1>

      {/* TIME RANGE SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Time Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="border p-2 rounded w-full"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="today">Today</option>
            <option value="custom">Custom Range</option>
          </select>
          {timeRange === "custom" && (
            <div className="flex items-center space-x-2">
              {/* Start Date */}
              <SingleDatePicker
                value={customStart}
                onChange={setCustomStart}
                placeholder="Start Date"
                disabled={date => date > new Date()}
              />
              <span>to</span>
              {/* End Date */}
              <SingleDatePicker
                value={customEnd}
                onChange={setCustomEnd}
                placeholder="End Date"
                disabled={date => (customStart ? date < customStart : false) || date > new Date()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2 CARDS: MAIN + COMPARE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAIN ASSET CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asset Dropdown */}
            <div>
              <label className="block mb-2 font-semibold">Select Asset:</label>
              <select
                value={mainAsset?.assetId ?? ""}
                onChange={e =>
                  setMainAsset(allAssets.find(a => a.assetId === e.target.value) ?? null)
                }
                className="border p-2 rounded w-full"
              >
                <option value="">--Select Asset--</option>
                {allAssets.map(a => (
                  <option key={a.assetId} value={a.assetId}>
                    {a.name} (Level {a.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Signal Selection - Multiple Select */}
            <div>
              <label className="block mb-2 font-semibold">
                Select Signals (Hold Ctrl/Cmd for multiple):
              </label>
              <select
                multiple
                value={selectedSignals.map(s => s.signalTypeId)}
                onChange={handleMainSignalChange}
                disabled={!mainSignals.length}
                className="border p-2 rounded w-full h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mainSignals.length === 0 ? (
                  <option disabled>No signals available</option>
                ) : (
                  mainSignals.map(s => (
                    <option key={s.signalTypeId} value={s.signalTypeId}>
                      {s.signalName}
                    </option>
                  ))
                )}
              </select>
              {selectedSignals.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedSignals.map(s => s.signalName).join(", ")}
                </p>
              )}
            </div>

            {/* Device */}
            <div>
              <label className="block mb-2 font-semibold">Assigned Device:</label>
              <p className="text-gray-700">{deviceName ? deviceName.split(",").map((d, idx) => <span key={idx}>{d}</span>) : "Not Assigned"}</p>
            </div>
          </CardContent>
        </Card>

        {/* COMPARE ASSET CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Compare Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Select Asset:</label>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <select
                  value={compareAssetId}
                  onChange={e => setCompareAssetId(e.target.value)}
                  disabled={!mainAsset}
                  className="border p-2 rounded w-full"
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
              <>
                {/* Compare Signal Selection - Multiple Select */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Select Signals (Hold Ctrl/Cmd for multiple):
                  </label>
                  <select
                    multiple
                    value={compareSelectedSignals.map(s => s.signalTypeId)}
                    onChange={handleCompareSignalChange}
                    disabled={!compareSignals.length}
                    className="border p-2 rounded w-full h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {compareSignals.length === 0 ? (
                      <option disabled>No signals available</option>
                    ) : (
                      compareSignals.map(s => (
                        <option key={s.signalTypeId} value={s.signalTypeId}>
                          {s.signalName}
                        </option>
                      ))
                    )}
                  </select>
                  {compareSelectedSignals.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {compareSelectedSignals.map(s => s.signalName).join(", ")}
                    </p>
                  )}
                </div>

                {/* Device */}
                <div>
                  <label className="block mb-2 font-semibold">Assigned Device:</label>
                  <p className="text-gray-700">
                    {compareDeviceName
                      ? compareDeviceName.split(",").map((d, idx) => <span key={idx}>{d}</span>)
                      : "Not Assigned"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAPH CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Signals Graph</CardTitle>
          {fetchingData && <p className="text-sm text-gray-500">Loading data...</p>}
        </CardHeader>
        <CardContent>
          {fetchingData ? (
            <div className="flex justify-center items-center h-96">
              <p className="text-lg">Loading telemetry data...</p>
            </div>
          ) : fullTelemetryData.length === 0 ? (
            <div className="flex justify-center items-center h-96 bg-gray-50 rounded">
              <p className="text-lg text-gray-600">No data available. Please select an asset and signals.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={zoomOut}>Zoom Out</Button>
                  <Button
                    onClick={startSelectingReference}
                    disabled={isSelectingReference}
                    variant={isSelectingReference ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Pin className="w-4 h-4" />
                    {isSelectingReference ? "Click on chart to set..." : "Set Reference Point"}
                  </Button>
                  {referencePoint && (
                    <Button
                      onClick={clearReferencePoint}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear Reference Point
                    </Button>
                  )}
                </div>
                
                {referencePoint && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <p className="font-semibold text-sm">
                      Reference Point: {format(new Date(referencePoint.time), "MMM dd HH:mm:ss")}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(referencePoint.values).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-semibold">{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isSelectingReference && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-semibold text-green-800">
                      🎯 Click on any point in the chart below to set as reference
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-600">
                  {isSelectingReference
                    ? "Click on the chart to set reference point"
                    : "Drag on chart to zoom into a time range"}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={displayedTelemetryData}
                  onClick={handleChartClick}
                  onMouseDown={e => !isSelectingReference && e && setRefAreaLeft(e.activeLabel as number)}
                  onMouseMove={e => !isSelectingReference && refAreaLeft && e && setRefAreaRight(e.activeLabel as number)}
                  onMouseUp={() => !isSelectingReference && zoom()}
                  style={{ cursor: isSelectingReference ? "crosshair" : "default" }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={tick => format(new Date(tick), "MMM dd HH:mm")}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Reference Line */}
                  {referencePoint && (
                    <ReferenceLine
                      x={referencePoint.time}
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: "Reference",
                        position: "top",
                        fill: "#ff6b6b",
                        fontSize: 12,
                      }}
                    />
                  )}
                  
                  {allKeys.map(key => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colorForString(key)}
                      name={key}
                      dot={
                        referencePoint && referencePoint.time
                          ? (props: any) => {
                              if (props.payload.time === referencePoint.time) {
                                return <ReferencePointDot {...props} />;
                              }
                              return <Dot {...props} r={0} />;
                            }
                          : false
                      }
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                  
                  {!isSelectingReference && refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}