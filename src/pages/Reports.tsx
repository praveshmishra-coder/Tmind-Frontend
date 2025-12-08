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

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState("");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const [reportData, setReportData] = useState<any[]>([]);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        } catch {}

        // Format time with milliseconds up to 5 decimals
        const fromTime = parsed.from
          ? format(parseISO(parsed.from), "HH:mm:ss.SSSSS")
          : "";
        const toTime = parsed.to
          ? format(parseISO(parsed.to), "HH:mm:ss.SSSSS")
          : "";

        return {
          title: n.title,
          timeFrom: fromTime,
          timeTo: toTime,
          asset: parsed.asset ?? "",
          signal: parsed.signal ?? "",
          min: parsed.min ?? "",
          max: parsed.max ?? "",
          durationSeconds: parsed.durationSeconds ?? "",
        };
      });

      setReportData(formatted);
      toast.success("Report generated!");
    } catch (err) {
      toast.error("Failed to load notifications");
      console.error(err);
    }
  };
  
  const downloadCSV = (data: any[]) => {
    if (!data.length) return toast.error("No data!");

    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(","),
      ...data.map((r) => headers.map((h) => `"${r[h]}"`).join(",")),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ------------------------------------
  // EXPORT PDF
  // ------------------------------------
  const downloadPDF = (data: any[]) => {
    if (!data.length) return toast.error("No data!");

    const doc = new jsPDF();
    doc.text(`Daily Signal Report for ${selectedDate}`, 14, 16);

    autoTable(doc, {
      head: [Object.keys(data[0])],
      body: data.map((row) => Object.values(row)),
      startY: 22,
    });

    doc.save(`daily-report-${selectedDate}.pdf`);
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

  return (
    <div className="p-4 bg-background">
      <h2 className="text-3xl font-bold mb-4">Daily Signal Report</h2>

      <div className="grid grid-cols-12 gap-4">
        {/* FILTER CARD */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card border rounded-xl p-4 h-[570px] flex flex-col">

            {/* DATE */}
            <label className="mb-1">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  id="report-date"
                  className="w-full p-2 border rounded-md flex justify-between"
                >
                  {selectedDate ? format(new Date(selectedDate), "PPP") : "Choose date"}
                  <CalendarIcon />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(d) => d && setSelectedDate(format(d, "yyyy-MM-dd"))}
                />
              </PopoverContent>
            </Popover>

            {/* ASSET */}
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
                  {allAssets.map((a) => (
                    <li
                      key={a.assetId}
                      className="p-2 hover:bg-primary/10 cursor-pointer"
                      onClick={() => {
                        setSelectedAssetId(a.assetId);
                        setAssetDropdownOpen(false);
                      }}
                    >
                      {a.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DEVICE */}
            <div id="report-device" className="mt-4 font-medium text-primary">
              Assigned Device: {selectedAssetId ? "Device Name Here" : "None"}
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
                  className="bg-green-500/20 text-green-700"
                  onClick={() => downloadCSV(displayedReport)}
                >
                  <FileText /> CSV
                </Button>

                <Button
                  id="download-pdf-btn"
                  className="bg-red-500/20 text-red-700"
                  onClick={() => downloadPDF(displayedReport)}
                >
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
                      {Object.keys(displayedReport[0]).map((h) => (
                        <th key={h} className="p-2 border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReport.map((row, i) => (
                      <tr
                        key={i}
                        className={Number(row.max) > THRESHOLD ? "bg-red-100 font-semibold" : ""}
                      >
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="p-2 border">{v}</td>
                        ))}
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
