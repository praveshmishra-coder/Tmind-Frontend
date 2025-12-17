import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarIcon, FileText, FileDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

import { getAssetHierarchy, getAllNotifications } from "@/api/assetApi";
import type { Asset } from "@/api/assetApi";
import { A } from "node_modules/framer-motion/dist/types.d-BJcRxCew";
import { getAssetConfig } from "@/api/assetApi";
import { getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";


export default function Reports() {
  const [selectedDate, setSelectedDate] = useState("");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [allSignalsOnAsset, setSignalOnasset] = useState<any[]>([]);
  const [SelectSignalId, setSelectedSignalID] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [signalDropdownOpen, setSignalDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [assignedDeviceName, setAssignedDeviceName] = useState<string>("None");


  const THRESHOLD = 70; // for highlighting rows

  // ------------------------------------
  // 1. LOAD ALL ASSETS
  // ------------------------------------
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const hierarchy = await getAssetHierarchy();

        const flatten = (nodes: Asset[]): Asset[] => {
          const out: Asset[] = [];
          const stack = [...nodes];
          while (stack.length > 0) {
            const a = stack.shift()!;
            out.push(a);
            if (a.childrens?.length) stack.unshift(...a.childrens);
          }
          return out;
        };

        setAllAssets(flatten(hierarchy));
      } catch (err) {
        console.error(err);
      }
    };
    loadAssets();
  }, []);

  // ------------------------------------
  // HELPER: GET ALL CHILDREN OF AN ASSET
  // ------------------------------------
  const getAllChildAssets = (asset: Asset): Asset[] => {
    const out: Asset[] = [];
    const stack = [asset];
    while (stack.length > 0) {
      const a = stack.shift()!;
      out.push(a);
      if (a.childrens?.length) stack.unshift(...a.childrens);
    }
    return out;
  };


  const GetSignalsonAsset = async (selectedID: any) => {
    try {
      if (selectedID != null) {
        const response = await getAssetConfig(selectedID);
        setSignalOnasset(response);
        console.log(response);
      }
    } catch (error: any) {
      console.log(error);
    }
  }

  const resolveAssignedDevice = async (assetId: string) => {
  try {
    const mappings = await getSignalOnAsset(assetId);

    if (!mappings || mappings.length === 0) {
      setAssignedDeviceName("None");
      return;
    }

    const deviceId = mappings[0].deviceId; // same device for all mappings

    const device = await getDeviceById(deviceId);
    setAssignedDeviceName(device?.name || "None");
  } catch (err) {
    console.error("Failed to resolve device", err);
    setAssignedDeviceName("None");
  }
};




  // ------------------------------------
  // 2. GENERATE REPORT
  // ------------------------------------
  const generateReport = async () => {
    if (!selectedDate) return toast.error("Select a date!");

    try {
      const allNotifs = await getAllNotifications();
      if (!Array.isArray(allNotifs)) {
        console.error("Invalid response from backend", allNotifs);
        return toast.error("Invalid data received");
      }

      // Filter by selected date
      const filteredByDate = allNotifs.filter((n) =>
        n.createdAt.startsWith(selectedDate)
      );

      let finalData = filteredByDate;

      // Filter by asset + children
      if (selectedAssetId) {
        const selectedAsset = allAssets.find(a => a.assetId === selectedAssetId);
        if (selectedAsset) {
          const subtree = getAllChildAssets(selectedAsset);
          const assetNames = subtree.map(a => a.name);

          finalData = finalData.filter((n) => {
            try {
              const parsed = JSON.parse(n.text);
              return assetNames.includes(parsed.asset);
            } catch {
              return false;
            }
          });
        }
      }

      // Convert notification to table-ready format
      const formatted = finalData.map((n) => {
        let parsed: any = {};
        try {
          parsed = JSON.parse(n.text);
        } catch { }

        const fromTime = parsed.from
          ? format(parseISO(parsed.from), "HH:mm:ss.SSSSS")
          : "";
        const toTime = parsed.to
          ? format(parseISO(parsed.to), "HH:mm:ss.SSSSS")
          : "";

        return {
          title: n.title,
          asset: parsed.asset ?? "",
          signal: parsed.signal ?? "",
          minMax: `${parsed.min ?? "-"} → ${parsed.max ?? "-"}`,
          timeRange: `${fromTime} – ${toTime}`,
          duration: parsed.durationSeconds ?? "",
        };
      });

      if (formatted.length === 0) {
  setReportData([]);
  toast.warn("No data found for selected filters");
  return;
}

setReportData(formatted);
toast.success("Report generated successfully!");

    } catch (err) {
      toast.error("Failed to load notifications");
      console.error(err);
    }
  };

  const cleanText = (value: any) => {
    if (!value) return "";

    return String(value)
      .replace(/[^\d.:A-Za-z\s-]/g, "") // remove weird symbols like !’, etc.
      .replace(/\s+/g, " ")             // collapse extra spaces
      .trim();
  };

  const formatMinMax = (str: string) => {
    if (!str) return "";
    const cleaned = cleanText(str).replace(/!/g, "");
    const parts = cleaned.split(/[^0-9.]+/).filter(Boolean);

    if (parts.length === 2) {
      return `${parts[0]} - ${parts[1]}`;
    }
    return cleaned;
  };

  const downloadCSV = (data: any[]) => {
    if (!data.length) return toast.error("No data!");

    const headers = ["title", "asset", "signal", "minMax", "timeRange", "duration"];


    const rows = [
      headers.join(","), // header row
      ...data.map((r) =>
        headers.map((h) => `"${r[h] ?? ""}"`).join(",")
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV report downloaded successfully!");
  };


  // ------------------------------------
  // EXPORT PDF
  // ------------------------------------
  const downloadPDF = (data: any[]) => {
    if (!data.length) return toast.error("No data!");

    const doc = new jsPDF();
    doc.text(`Daily Signal Report for ${selectedDate}`, 14, 16);

    const headers = [["Title", "Asset", "Signal", "Min - Max", "Time Range", "Duration (sec)"]];

    const body = data.map((r) => {
      const safeRow = [
        cleanText(r.title),
        cleanText(r.asset),
        cleanText(r.signal),
        formatMinMax(r.minMax),
        cleanText(r.timeRange),
        cleanText(r.duration),
      ];
      return safeRow;
    });

    autoTable(doc, {
      head: headers,
      body,
      startY: 22,
    });

    doc.save(`daily-report-${selectedDate}.pdf`);
    toast.success("PDF report downloaded successfully!");
  };


  // ------------------------------------
  // UI + TABLE
  // ------------------------------------
  const displayedReport = showOnlyAlerts
    ? reportData.filter((r) => Number(r.max) > THRESHOLD)
    : reportData;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAssetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearAssetSelection = () => {
  setSelectedAssetId("");
  setSelectedSignalID("");
  setSignalOnasset([]);
  setAssignedDeviceName("None");
  setAssetDropdownOpen(false);
};


  return (
    <div className="p-4 bg-background">
      <h2 className="text-3xl font-bold mb-4">Daily Signal Report</h2>

      <div className="grid grid-cols-12 gap-4">
        {/* FILTER CARD */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card border rounded-xl p-4 h-[570px] flex flex-col">

            {/* DATE */}
            <label className="mb-1">Select Date</label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  id="report-date"
                  className="w-full p-2 border rounded-md flex justify-between"
                  onClick={() => setDateOpen(true)}
                >
                  {selectedDate ? format(new Date(selectedDate), "PPP") : "Choose date"}
                  <CalendarIcon />
                </button>
              </PopoverTrigger>

              <PopoverContent className="p-0 border-none shadow-none">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDate(format(d, "yyyy-MM-dd"));
                    setDateOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            {/* Asset */}
            <div className="mt-4" ref={dropdownRef}>
              <label>Asset (Optional)</label>
              <button
                id="report-asset"
                className="w-full border p-2 rounded-md"
                onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
              >
                {selectedAssetId
                  ? allAssets.find((a) => a.assetId === selectedAssetId)?.name
                  : "Select asset"}
              </button>

              {assetDropdownOpen && (
  <ul className="border mt-1 rounded bg-background max-h-40 overflow-auto">

    {/* NONE OPTION */}
    <li
      className="p-2 text-muted-foreground hover:bg-primary/10 cursor-pointer border-b"
      onClick={clearAssetSelection}
    >
      None
    </li>

    {allAssets.map((a) => (
      <li
        key={a.assetId}
        className="p-2 hover:bg-primary/10 cursor-pointer"
        onClick={() => {
          setSelectedAssetId(a.assetId);
          GetSignalsonAsset(a.assetId);
          resolveAssignedDevice(a.assetId);
          setAssetDropdownOpen(false);
        }}
      >
        {a.name}
      </li>
    ))}
  </ul>
)}

            </div>



            {/* signal */}
            <div>
              <label>Signal (Optional)</label>
              <button
                id="report-signal"
                className="w-full border p-2 rounded-md"
                onClick={() => setSignalDropdownOpen(!signalDropdownOpen)}
                disabled={!selectedAssetId} // disable if no asset selected
              >
                {SelectSignalId
                  ? allSignalsOnAsset.find((s) => s.signalTypeID === SelectSignalId)
                    ?.signalName
                  : "Select Signal On Asset"}
              </button>

              {signalDropdownOpen && (
                <ul className="border mt-1 rounded bg-background max-h-40 overflow-auto">
                  {allSignalsOnAsset.map((s) => (
                    <li
                      key={s.signalTypeID}
                      className="p-2 hover:bg-primary/10 cursor-pointer"
                      onClick={() => {
                        setSelectedSignalID(s.signalTypeID);
                        setSignalDropdownOpen(false);
                      }}
                    >
                      {s.signalName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DEVICE */}
            <div id="report-device" className="mt-4 font-medium text-primary">
                Assigned Device: {assignedDeviceName}
            </div>

            {/* ALERT CHECKBOX */}
            <div className="mt-4 flex items-center gap-2">
              <input
                id="report-alerts"
                type="checkbox"
                checked={showOnlyAlerts}
                onChange={(e) => setShowOnlyAlerts(e.target.checked)}
              />
              <label>Show only alerts (max &gt; {THRESHOLD})</label>
            </div>

            {/* GENERATE */}
            <Button
              id="generate-report-btn"
              className="mt-4 bg-primary text-white"
              onClick={generateReport}
            >
              <FileText /> Generate Report
            </Button>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card border rounded-xl h-[570px] flex flex-col">

            {/* HEADER */}
            <div className="p-3 border-b flex justify-between">
              <h3 className="text-xl font-bold">Report</h3>

              <div className="flex gap-2">
                <Button
                  id="download-csv-btn"
                  className="
                  bg-green-500/20 text-green-700 
                  dark:bg-green-500/10 dark:text-green-300 
                  hover:bg-green-500/30 dark:hover:bg-green-500/20"
                  onClick={() => downloadCSV(displayedReport)}>
                  <FileText /> CSV
                </Button>

                <Button
                  id="download-pdf-btn"
                  className="
                  bg-red-500/20 text-red-700 
                  dark:bg-red-500/10 dark:text-red-300 
                  hover:bg-red-500/30 dark:hover:bg-red-500/20"
                  onClick={() => downloadPDF(displayedReport)}>
                  <FileDown /> PDF
                </Button>
              </div>
            </div>

            {/* TABLE */}
            <div id="report-table" className="flex-1 overflow-auto">
              {displayedReport.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No report generated yet.
                </div>
              ) : (
                <table className="w-full border">
                  <thead className="bg-primary text-white sticky top-0">
                    <tr>
                      <th className="p-2 border">Title</th>
                      <th className="p-2 border">Asset</th>
                      <th className="p-2 border">Signal</th>
                      <th className="p-2 border">Min → Max</th>
                      <th className="p-2 border">Time Range</th>
                      <th className="p-2 border">Duration (sec)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedReport.map((row, i) => (
                      <tr
                        key={i}
                        className={`${Number(row.minMax?.split("→")[1]) > THRESHOLD
                          ? "bg-red-100 dark:bg-red-900/40"
                          : ""
                          }`}
                      >
                        <td className="p-2 border">{row.title}</td>
                        <td className="p-2 border">{row.asset}</td>
                        <td className="p-2 border">{row.signal}</td>
                        <td className="p-2 border">{row.minMax}</td>
                        <td className="p-2 border">{row.timeRange}</td>
                        <td className="p-2 border">{row.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
