import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import levelToType from "./mapBackendAsset";

interface AssetDetailsProps {
  selectedAsset: any | null;
  assignedDevice: any | null;
  onAssignDevice: () => void;
  onRestore: () => void;
}

export default function AssetDetails({
  selectedAsset,
  assignedDevice,
  onAssignDevice,
  onRestore,
}: AssetDetailsProps) {
  const assetType = selectedAsset ? levelToType(selectedAsset.level) : "";
  const subAssetCount = selectedAsset?.childrens?.length || 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {selectedAsset?.name || "No Asset Selected"}
            </CardTitle>

            {/* Sub Assets moved to first line */}
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

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
              {selectedAsset.isDeleted && (
                <Button onClick={onRestore} size="sm" variant="outline">
                  Restore
                </Button>
              )}

              {(selectedAsset.level === 3 || selectedAsset.level === 4) && (
                <Button
                  onClick={onAssignDevice}
                  size="sm"
                  variant={assignedDevice ? "default" : "outline"}
                  className={assignedDevice ? "bg-green-600 text-white" : ""}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {assignedDevice ? "Device Assigned" : "Assign Device"}
                </Button>
              )}
            </div>

            {/* ASSIGNED DEVICE INFO */}
            {assignedDevice && (
              <div className="mt-4 p-3 border rounded-md bg-green-50 text-green-700 text-sm">
                <strong>Assigned Device:</strong> {assignedDevice.name}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
