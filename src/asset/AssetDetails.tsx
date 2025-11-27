import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, Unplug, Activity } from "lucide-react";
import levelToType from "./mapBackendAsset";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getSignalOnAsset } from "@/api/assetApi";
import {getDeviceById} from "@/api/deviceApi"

interface AssetDetailsProps {
  selectedAsset: any | null;
  assignedDevice: any | null;
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
  assignedDevice,
  onAssignDevice,
  onRestore,
}: AssetDetailsProps) {
  const assetType = selectedAsset ? levelToType(selectedAsset.level) : "";
  const subAssetCount = selectedAsset?.childrens?.length || 0;
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  let navigate = useNavigate();
  const [assetConfig, setAssetConfig] = useState<AssetConfig[] | null>(null);
  const [deviceDetails, setDeviceDetails] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAsset?.assetId) {
      setAssetConfig(null);
      return;
    }

    const fetchSignalConfig = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching signals for asset:", selectedAsset.assetId);
        const data = await getSignalOnAsset(selectedAsset.assetId);
        setAssetConfig(data);
      } catch (error) {
        console.error("❌ Failed to fetch signal config", error);
        setAssetConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSignalConfig();
  }, [selectedAsset]);

  useEffect(() => {
  if (!selectedAsset?.assetId) {
    setAssetConfig(null);
    setDeviceDetails(null);
    return;
  }

  const fetchSignalAndDevice = async () => {
    try {
      setLoading(true);
      const data = await getSignalOnAsset(selectedAsset.assetId); // mapping table data
      setAssetConfig(data);

      if (data && data.length > 0) {
        const deviceId = data[0].deviceId;     // first item deviceId
        const device = await getDeviceById(deviceId);
        setDeviceDetails(device);
      } else {
        setDeviceDetails(null);
      }
    } catch (err) {
      console.error("Error fetching data", err);
      setDeviceDetails(null);
      setAssetConfig(null);
    } finally {
      setLoading(false);
    }
  };

  fetchSignalAndDevice();
}, [selectedAsset]);


  // Check if device is assigned (assetConfig has data)
  const hasDeviceAssigned = assetConfig && assetConfig.length > 0;
  
  // Check if user can see device buttons
  const canShowDeviceButton =
    isAdmin &&
    (selectedAsset?.level === 3 ||
      selectedAsset?.level === 4 ||
      selectedAsset?.level === 5);
console.log(deviceDetails)

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {selectedAsset?.name || "No Asset Selected"}
            </CardTitle>

            {selectedAsset && (
              <p className="text-muted-foreground text-sm mt-1">
                Sub Assets: <span className="font-medium">{subAssetCount}</span>
              </p>
            )}

            {selectedAsset && selectedAsset.isDeleted && (
              <Badge variant="destructive" className="mt-1">
                Deleted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!selectedAsset ? (
          <div className="text-muted-foreground font-semibold text-lg py-6 text-center">
            Select an asset from the tree.
          </div>
        ) : (
          <>
            {/* DETAILS */}
            <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Type</p>
                <p className="font-medium">{assetType}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Level</p>
                <p className="font-medium">{selectedAsset.level}</p>
              </div>
            </div>
              
              {deviceDetails && (
  <div className="mt-4 p-4 border rounded-lg bg-green-50">
    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
      <Link2 className="h-4 w-4" /> Connected Device
    </h3>

    <div className="space-y-1 text-sm">
      <p><strong>Name:</strong> {deviceDetails.name}</p>
    </div>
  </div>
)}
            {/* SIGNAL CONFIGURATION - Only show if data exists */}
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading signal configuration...
              </div>
            ) : (
              hasDeviceAssigned && (
                <div className="mt-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Signal Configuration
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {assetConfig.map((signal) => (
                      <div
                        key={signal.mappingId}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {signal.signalName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Register Address: {signal.registerAdress}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
                        >
                          {signal.signalUnit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
              {selectedAsset.isDeleted && (
                <Button onClick={onRestore} size="sm" variant="outline">
                  Restore
                </Button>
              )}

              {/* Conditional Button Logic */}
              {canShowDeviceButton &&
                (hasDeviceAssigned ? (
                  // Show "Detach Device" if assetConfig has data
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Detach Device
                  </Button>
                ) : (
                  // Show "Assign Device" if assetConfig is empty
                  <Button
                    onClick={() =>
                      navigate(`/map-device-to-asset/${selectedAsset.assetId}`)
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Assign Device
                  </Button>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}