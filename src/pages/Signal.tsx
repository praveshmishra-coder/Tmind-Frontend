import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { getAssetHierarchy, getSignalOnAsset } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function Signal() {
  const { state } = useLocation();
  const asset = state?.asset;

  const [signalData, setSignalData] = useState<any[]>([]);
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [selectedCompareAsset, setSelectedCompareAsset] = useState<any>(null);
  const [compareSignal, setCompareSignal] = useState<any[]>([]);

  // Fetch all data for main asset
  const fetchSignalAndDevice = async (assetId: string) => {
    try {
      const data = await getSignalOnAsset(assetId);
      setSignalData(data);

      if (data && data.length > 0) {
        const deviceId = data[0].deviceId;
        const device = await getDeviceById(deviceId);
        setDeviceDetails(device);
      } else {
        setDeviceDetails(null);
      }
    } catch (err) {
      console.error("Error fetching data", err);
      setDeviceDetails(null);
      setSignalData([]);
    }
  };

  // Fetch compare asset signal
  const fetchCompareSignal = async (assetId: string) => {
    try {
      const data = await getSignalOnAsset(assetId);
      setCompareSignal(data);
    } catch (err) {
      console.error("Compare fetch failed", err);
      setCompareSignal([]);
    }
  };

  // Load all hierarchy assets for dropdown
  const loadAllAssets = async () => {
    const all = await getAssetHierarchy();
    setCompareList(all);
  };

  useEffect(() => {
    if (asset?.assetId) {
      fetchSignalAndDevice(asset.assetId);
      loadAllAssets();
    }
  }, [asset]);

  if (!asset) {
    return <h1 className="text-red-500 p-6">No asset data received</h1>;
  }

  // Convert signal array to Y-values for graph
  const mainValues = signalData.map((s) => s.value);
  const compareValues = compareSignal.map((s) => s.value);

  // Labels – generate based on signal timestamps
  const labels =
    signalData.length > 0
      ? signalData.map((s) => new Date(s.timestamp).toLocaleTimeString())
      : ["1", "2", "3"];

  const chartData = {
    labels,
    datasets: [
      {
        label: `${asset.name} – Signal`,
        data: mainValues,
        borderColor: "rgb(75,192,192)",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
      selectedCompareAsset &&
        compareValues.length > 0 && {
          label: `${selectedCompareAsset.name} – Signal`,
          data: compareValues,
          borderColor: "rgb(255,99,132)",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
        },
    ].filter(Boolean),
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Signal Dashboard</h1>

      {/* Selected Asset */}
      <div className="p-4 border rounded-lg bg-card shadow">
        <h2 className="text-xl font-semibold">Selected Asset</h2>
        <p><strong>Name:</strong> {asset.name}</p>
        <p><strong>Level:</strong> {asset.level}</p>
      </div>

      {/* Device Details */}
      {deviceDetails ? (
        <div className="p-4 border rounded-lg bg-green-50">
          <h2 className="text-lg font-semibold text-green-900">
            Connected Device
          </h2>
          <p><strong>Name:</strong> {deviceDetails.name}</p>
          <p><strong>ID:</strong> {deviceDetails.deviceId}</p>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-900">
            No Device Linked
          </h2>
        </div>
      )}

      {/* Compare Dropdown */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium">Compare With Another Asset</label>

        <select
          className="mt-2 w-full border p-2 rounded-md"
          onChange={async (e) => {
            const selected = compareList.find(
              (a: any) => a.assetId === e.target.value
            );
            setSelectedCompareAsset(selected);
            if (selected) fetchCompareSignal(selected.assetId);
          }}
        >
          <option value="">-- Select Asset --</option>
          {compareList.map((a: any) => (
            <option key={a.assetId} value={a.assetId}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Signal Graph */}
      <div className="p-6 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-4">Live Signal Chart</h2>
        <Line data={chartData} height={100} />
      </div>

      {/* Child Assets */}
      {asset.childrens?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold">Child Assets</h2>
          <ul className="mt-2 space-y-2">
            {asset.childrens.map((child: any) => (
              <li
                key={child.assetId}
                className="border p-3 rounded-md bg-muted/10"
              >
                <strong>{child.name}</strong> (ID: {child.assetId})
                <br />
                Level: {child.level}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
