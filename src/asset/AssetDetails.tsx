import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, RotateCcw, Link2 } from "lucide-react";
import { type Asset } from "@/types/asset";
import levelToType from "./mapBackendAsset"; // ✅ default mapping

interface AssetDetailsProps {
  selectedAsset: Asset | null;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onAssignDevice: () => void;
}

export default function AssetDetails({
  selectedAsset,
  onEdit,
  onAddChild,
  onDelete,
  onRestore,
  onAssignDevice,
}: AssetDetailsProps) {
  const assetType = selectedAsset ? levelToType(selectedAsset.depth) : "";

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {selectedAsset?.name || "No Asset Selected"}
            </CardTitle>

            {selectedAsset && selectedAsset.isDeleted && (
              <div className="flex items-center mt-1">
                <Badge variant="destructive" className="ml-2">
                  Deleted
                </Badge>
              </div>
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
            <p className="text-sm text-muted-foreground mb-4">{selectedAsset.path}</p>

            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Type</p>
                <p className="font-medium">{assetType}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Depth</p>
                <p className="font-medium">{selectedAsset.depth}</p>
              </div>

              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="font-medium">{selectedAsset.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
              {/* {assetType !== "SubMachine" && (
                <Button onClick={onAddChild} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Sub-Asset
                </Button>
              )}

              <Button onClick={onEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" /> Edit Asset
              </Button> */}

              {/* {selectedAsset.isDeleted ? (
                <Button onClick={onRestore} size="sm" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" /> Restore
                </Button>
              ) : (
                <Button onClick={onDelete} size="sm" variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )} */}

              {assetType === "SubMachine" && (
                <Button onClick={onAssignDevice} size="sm" variant="outline">
                  <Link2 className="h-4 w-4 mr-2" /> Assign Device
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
