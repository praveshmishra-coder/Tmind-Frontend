import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssetTree } from "@/asset/AssetTree";
import { type Asset } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, RotateCcw, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mapBackendAsset } from "@/asset/mapBackendAsset";
import { getAssetHierarchy } from "@/api/assetApi";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssetHierarchy();
      setAssets(data.map(mapBackendAsset));
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = () => {
    if (selectedAsset) navigate(`/assets/edit/${selectedAsset.id}`);
  };

  const onAddChild = () => {
    if (selectedAsset)
      navigate(`/assets/add?parentId=${selectedAsset.id}`);
  };

  const onDelete = () => {
    if (selectedAsset) alert("Soft delete triggered");
  };

  const onRestore = () => {
    if (selectedAsset) alert("Restore triggered");
  };

  const onAssignDevice = () => {
    if (selectedAsset?.type === "Machine")
      navigate(`/assets/assign-device/${selectedAsset.id}`);
  };

  return (
    <div className="p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Asset Hierarchy</h1>
          <p className="text-sm text-muted-foreground">
            Explore departments, lines, machines & sub-machines.
          </p>
        </div>

        <Button onClick={() => navigate("/assets/add")}>
          + Import Bulk
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          {/* <CardHeader>
            <CardTitle>Asset Hierarchy Tree</CardTitle>
          </CardHeader> */}

          <CardContent className="p-2">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <AssetTree
                assets={assets}
                selectedId={selectedAsset?.id || null}
                onSelect={setSelectedAsset}
                onAddRoot={() => navigate("/assets/add")}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAsset ? selectedAsset.name : "No Asset Selected"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!selectedAsset ? (
              <div className="text-center text-muted-foreground py-6">
                Select an asset from the tree.
              </div>
            ) : (
              <>
                {selectedAsset.isDeleted && (
                  <Badge variant="destructive" className="mb-3">
                    Deleted
                  </Badge>
                )}

                <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedAsset.type}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Level</p>
                    <p className="font-medium">{selectedAsset.depth}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>

                  <Button size="sm" variant="outline" onClick={onAddChild}>
                    <Plus className="h-4 w-4 mr-2" /> Add Sub-Asset
                  </Button>

                  {selectedAsset.isDeleted ? (
                    <Button size="sm" variant="outline" onClick={onRestore}>
                      <RotateCcw className="h-4 w-4 mr-2" /> Restore
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={onDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  )}

                  {selectedAsset.type === "Machine" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onAssignDevice}
                    >
                      <Link2 className="h-4 w-4 mr-2" /> Assign Device
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
