import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import type { Asset } from "@/api/assetApi";
import { Download, FileText, FileDown } from "lucide-react";

// Dummy report generator
const generateReportData = (asset: Asset, deviceName: string, date: string) => {
  const signals = ["Temperature", "Voltage", "Current", "RPM"];
  const data: any[] = [];
  for (let i = 0; i < 10; i++) {
    const timestamp = `${date} ${9 + i}:00`;
    signals.forEach((sig) => {
      data.push({
        device: deviceName,
        asset: asset.name,
        signal: sig,
        value: (Math.random() * 100).toFixed(2),
        timestamp,
      });
    });
  }
  return data;
};

// CSV helper
const downloadCSV = (data: any[], filename = "signal-report.csv") => {
  if (!data.length) return toast.error("No data to download!");
  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));
  data.forEach((row) =>
    csvRows.push(headers.map((h) => `"${row[h]}"`).join(","))
  );
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// PDF helper
const downloadPDF = (data: any[], filename = "signal-report.pdf") => {
  if (!data.length) return toast.error("No data to download!");
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Daily Signal Report", 14, 16);
  const headers = [Object.keys(data[0])];
  const rows = data.map((row) => Object.values(row));
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 22,
    theme: "grid",
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    showHead: "everyPage",
  });
  doc.save(filename);
};

export default function DailySignalReport() {
  const [selectedDate, setSelectedDate] = useState("");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [deviceName, setDeviceName] = useState("Unknown Device");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70;

  // Fetch assets
  useEffect(() => {
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const hierarchy = await getAssetHierarchy();
        const flatten = (assets: Asset[]): Asset[] => {
          const out: Asset[] = [];
          const stack = [...assets];
          while (stack.length) {
            const a = stack.shift()!;
            out.push(a);
            if (a.childrens?.length) stack.unshift(...a.childrens);
          }
          return out;
        };
        setAllAssets(flatten(hierarchy || []));
      } catch (err) {
        console.error("Failed to fetch assets", err);
      } finally {
        setLoadingAssets(false);
      }
    };
    loadAssets();
  }, []);

  // Fetch device for selected asset
  useEffect(() => {
    const loadDevice = async () => {
      if (!selectedAssetId) {
        setDeviceName("Unknown Device");
        return;
      }
      try {
        const mappings = await getSignalOnAsset(selectedAssetId);
        if (mappings.length > 0) {
          const deviceId = mappings[0].deviceId;
          const dev = await getDeviceById(deviceId);
          const name = dev?.name ?? dev?.data?.name ?? "Unknown Device";
          setDeviceName(name);
        } else setDeviceName("Not Assigned");
      } catch {
        setDeviceName("Error");
      }
    };
    loadDevice();
  }, [selectedAssetId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAssetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateReport = () => {
    if (!selectedDate) return toast.error("Select a date!");
    if (!selectedAssetId) return toast.error("Select an asset!");
    const asset = allAssets.find((a) => a.assetId === selectedAssetId)!;
    setReportData(generateReportData(asset, deviceName, selectedDate));
    toast.success("Report generated!");
  };

  const displayedReport = showOnlyAlerts
    ? reportData.filter((row) => parseFloat(row.value) > THRESHOLD)
    : reportData;

  const today = new Date().toISOString().split("T")[0]; // disable future dates

  return (
    <div className="p-4 bg-background">
      <h2 className="text-3xl font-bold text-foreground mb-4">Daily Signal Report</h2>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Card */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl flex flex-col h-[570px] shadow-lg">
            <div className="p-4 border-b border-border font-semibold text-lg bg-primary/10">Select Parameters</div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Date */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-border rounded-md p-2"
                />
              </div>

              {/* Asset Dropdown */}
              <div ref={dropdownRef} className="relative">
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Asset</label>
                <button
                  type="button"
                  className="w-full p-2 border border-border rounded-md bg-background text-left hover:border-primary transition"
                  onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
                >
                  {selectedAssetId
                    ? allAssets.find((a) => a.assetId === selectedAssetId)?.name + ` (Level ${allAssets.find((a) => a.assetId === selectedAssetId)?.level})`
                    : "Select Asset"}
                </button>
                {assetDropdownOpen && (
                  <ul className="absolute z-50 mt-1 w-full max-h-44 overflow-auto border border-border rounded-md bg-background shadow-lg">
                    {allAssets.map((a) => (
                      <li
                        key={a.assetId}
                        className={`p-2 cursor-pointer hover:bg-primary/20 ${
                          selectedAssetId === a.assetId ? "bg-primary/10 font-semibold" : ""
                        }`}
                        onClick={() => {
                          setSelectedAssetId(a.assetId);
                          setAssetDropdownOpen(false);
                        }}
                      >
                        {a.name} (Level {a.level})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Device */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Assigned Device</label>
                <div className="font-medium text-primary">{deviceName}</div>
              </div>

              {/* Alerts Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyAlerts}
                  onChange={(e) => setShowOnlyAlerts(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label className="text-sm">Show Only Alerts</label>
              </div>

              <Button
                className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                onClick={handleGenerateReport}
              >
                <FileText size={16} /> Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Right Card */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card text-card-foreground border border-border rounded-xl flex flex-col h-[570px] shadow-lg">

            {/* Top Buttons */}
            <div className="p-3 border-b border-border flex gap-2 flex-shrink-0 bg-primary/10 rounded-t-xl">
              <h1 className="px-2 font-semibold flex-1 text-xl text-foreground">View Report</h1>
              <Button
                className="bg-green-500/20 text-green-700 border border-green-400 hover:bg-green-500/30 flex items-center gap-1"
                onClick={() => downloadCSV(displayedReport)}
              >
                <FileText size={16} /> CSV
              </Button>
              <Button
                className="bg-red-500/20 text-red-700 border border-red-400 hover:bg-red-500/30 flex items-center gap-1"
                onClick={() => downloadPDF(displayedReport)}
              >
                <FileDown size={16} /> PDF
              </Button>
            </div>

        {/* Table */}
        {displayedReport.length > 0 ? (
          <div className="flex-1 overflow-auto rounded-b-xl">
            <table className="w-full text-foreground border border-border border-t-0">
              {/* Sticky header */}
              <thead className="bg-primary text-primary-foreground sticky top-0 z-20">
                <tr>
                  {Object.keys(displayedReport[0]).map((key) => (
                    <th
                      key={key}
                      className="p-2 border-b border-border text-left font-semibold"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayedReport.map((row, i) => {
                  const isAlert = parseFloat(row.value) > THRESHOLD;
                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        isAlert
                          ? "bg-red-100 dark:bg-red-700 font-semibold"
                          : "hover:bg-primary/10 dark:hover:bg-primary/20"
                      }`}
                    >
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="p-2 border-b border-border">
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12">
            No report generated. Select date and asset, then click "Generate Report".
          </div>
        )}
      </div>

        </div>
      </div>
    </div>
  );
}
