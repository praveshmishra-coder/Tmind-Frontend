import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import type { Asset } from "@/api/assetApi";

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
        value: (Math.random() * 100).toFixed(2), // dummy value
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
  data.forEach((row) => csvRows.push(headers.map((h) => `"${row[h]}"`).join(",")));
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
    alternateRowStyles: { fillColor: [240, 240, 240] },
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

  const THRESHOLD = 70; // dummy alert threshold

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

  const handleGenerateReport = () => {
    if (!selectedDate) return toast.error("Select a date!");
    if (!selectedAssetId) return toast.error("Select an asset!");
    const asset = allAssets.find((a) => a.assetId === selectedAssetId)!;
    setReportData(generateReportData(asset, deviceName, selectedDate));
    toast.success("Report generated!");
  };

  // Filtered report based on alert checkbox
  const displayedReport = showOnlyAlerts
    ? reportData.filter((row) => parseFloat(row.value) > THRESHOLD)
    : reportData;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Signal Report</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
        {/* Left Card: Selection */}
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-4 shadow-md space-y-4" style={{ height: "630px" }}>
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Select Parameters</h3>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Asset</label>
            {loadingAssets ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading assets...</div>
            ) : (
              <select
                className="w-full p-2 border border-border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                <option value="">Select Asset</option>
                {allAssets.map((a) => (
                  <option key={a.assetId} value={a.assetId}>
                    {a.name} (Level {a.level})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Assigned Device</div>
            <div className="font-medium text-gray-800 dark:text-gray-100">{deviceName}</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertsOnly"
              checked={showOnlyAlerts}
              onChange={(e) => setShowOnlyAlerts(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="alertsOnly" className="text-sm text-gray-700 dark:text-gray-200">Show Only Alerts</label>
          </div>

          <Button onClick={handleGenerateReport} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Generate Report
          </Button>
        </div>

        {/* Right Card: Report */}
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-4 shadow-md" style={{ height: "630px", overflowY: "auto" }}>
          {displayedReport.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  onClick={() => downloadCSV(displayedReport)}
                  className="bg-primary/20 text-primary border border-primary hover:bg-primary/30"
                >
                  Download CSV
                </Button>
                <Button
                  onClick={() => downloadPDF(displayedReport)}
                  className="bg-primary/20 text-primary border border-primary hover:bg-primary/30"
                >
                  Download PDF
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-gray-800 dark:text-gray-100 border-collapse">
                  <thead className="bg-primary/20 dark:bg-primary/30 text-primary-foreground dark:text-white">
                    <tr>
                      {Object.keys(displayedReport[0]).map((key) => (
                        <th key={key} className="p-3 border-b border-border text-left font-semibold">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReport.map((row, i) => {
                      const isAlert = parseFloat(row.value) > THRESHOLD;
                      return (
                        <tr key={i} className={`transition-colors ${isAlert ? "bg-red-100 dark:bg-red-700 font-semibold" : "hover:bg-primary/10 dark:hover:bg-primary/20"}`}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-2 border-b border-border">{val}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              No report generated. Select date and asset, then click "Generate Report".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
