import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, Unplug, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMappingById } from "@/api/assetApi";
import { getDeviceById } from "@/api/deviceApi";
import axios from "axios";
import { toast } from "sonner";
import levelToType from "./mapBackendAsset";

interface AssetDetailsProps {
  selectedAsset: any | null;
  onAssignDevice: () => void;
  onRestore: () => void;
}

export interface AssetConfig {
  mappingId: string;
  assetId: string;
  signalTypeId: string;
  deviceId: string;
  devicePortId: string;
  signalUnit: string;
  signalName: string;
  registerAdress: number;
  createdAt: Date;
}

export default function AssetDetails({
  selectedAsset,
  onAssignDevice,
  onRestore,
}: AssetDetailsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const navigate = useNavigate();
  const [assetConfig, setAssetConfig] = useState<AssetConfig[] | null>(null);
  const [deviceDetails, setDeviceDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detaching, setDetaching] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 5000;

  const fetchSignalsAndDevices = async (assetId: string) => {
    try {
      const data = await getMappingById(assetId); // returns IMapping[]

      // Convert 'createdAt' string → Date
      const mappedData: AssetConfig[] = data.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt),
      }));
      setAssetConfig(mappedData);

      // Fetch unique connected devices
      const uniqueDeviceIds = Array.from(new Set(mappedData.map(d => d.deviceId)));
      const devices = await Promise.all(
        uniqueDeviceIds.map(async (id) => {
          try {
            const res = await getDeviceById(id);
            return res?.name ?? res?.data?.name ?? "Unknown Device";
          } catch {
            return "Unknown Device";
          }
        })
      );
      setDeviceDetails(devices);

    } catch (err) {
      console.error("Error fetching asset mappings:", err);
      setAssetConfig(null);
      setDeviceDetails([]);
    }
  };

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!selectedAsset?.assetId) {
      setAssetConfig(null);
      setDeviceDetails([]);
      return;
    }

    const initialFetch = async () => {
      setLoading(true);
      await fetchSignalsAndDevices(selectedAsset.assetId);
      setLoading(false);
    };

    initialFetch();

    intervalRef.current = setInterval(() => {
      fetchSignalsAndDevices(selectedAsset.assetId);
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedAsset?.assetId]);

  const handleDetachDevice = async () => {
    if (!selectedAsset?.assetId) return;
    try {
      setDetaching(true);
      await axios.delete(`https://localhost:7208/api/Mapping/${selectedAsset.assetId}`);
      toast.success("Device detached successfully!");
      setAssetConfig(null);
      setDeviceDetails([]);
      await fetchSignalsAndDevices(selectedAsset.assetId);
    } catch (err) {
      console.error("Failed to detach device:", err);
      toast.error("Failed to detach device. Try again.");
    } finally {
      setDetaching(false);
    }
  };

  const hasDeviceAssigned = assetConfig && assetConfig.length > 0;
  const canShowDeviceButton = isAdmin && [3, 4, 5].includes(selectedAsset?.level);

  const assetType = selectedAsset ? levelToType(selectedAsset.level) : "";
  const subAssetCount = selectedAsset?.childrens?.length || 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {selectedAsset?.name || "No Asset Selected"}
              {selectedAsset && (
                <Badge variant="outline" className="text-xs font-normal">Live</Badge>
              )}
            </CardTitle>
            {selectedAsset && <p className="text-muted-foreground text-sm mt-1">Sub Assets: <span className="font-medium">{subAssetCount}</span></p>}
            {selectedAsset?.isDeleted && <Badge variant="destructive" className="mt-1">Deleted</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!selectedAsset ? (
          <div className="text-muted-foreground font-semibold text-lg py-6 text-center">Select an asset from the tree.</div>
        ) : (
          <>
            {/* DETAILS */}
            <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
              <div><p className="text-muted-foreground text-sm mb-1">Type</p><p className="font-medium">{assetType}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Level</p><p className="font-medium">{selectedAsset.level}</p></div>
            </div>

            {/* CONNECTED DEVICES */}
            {/* CONNECTED DEVICES */}
{deviceDetails.length > 0 && (
  <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
      <Link2 className="h-4 w-4" /> Connected Device(s)
    </h3>

    <div className="flex flex-wrap gap-2">
      {deviceDetails.map((d, idx) => (
        <span
          key={idx}
          className="px-3 py-1 text-sm font-medium text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-800 rounded-full shadow"
        >
          {d}
        </span>
      ))}
    </div>
  </div>
)}


            {/* SIGNAL CONFIGURATION */}
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading signal configuration...</div>
            ) : (
              hasDeviceAssigned && (
                <div className="mt-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Signal Configuration</h3>
                  </div>

                  <div className="space-y-2">
                    {assetConfig.map(signal => (
                      <div key={signal.mappingId} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{signal.signalName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Register Address: {signal.registerAdress}</p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100">{signal.signalUnit}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
              {selectedAsset.isDeleted && (
                <Button onClick={onRestore} size="sm" variant="outline">Restore</Button>
              )}
              {canShowDeviceButton && (
                hasDeviceAssigned ? (
                  <Button onClick={handleDetachDevice} disabled={detaching} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Unplug className="h-4 w-4 mr-2" /> {detaching ? "Detaching..." : "Detach Device"}
                  </Button>
                ) : (
                  <Button onClick={() => navigate(`/map-device-to-asset/${selectedAsset.assetId}`)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link2 className="h-4 w-4 mr-2" /> Manage Connection
                  </Button>
                )
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
