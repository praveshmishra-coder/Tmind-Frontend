import React, { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { type Asset } from "@/types/asset";
import { AssetTree } from "@/asset/AssetTree";
import { type Asset } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Link2 } from "lucide-react";

export default function Assets() {
const [assets, setAssets] = useState<Asset[]>([
  {
    id: "p1",
    name: "Tata Motors Mumbai Plant",
    type: "Plant",
    description: "Main manufacturing plant",
    path: "Tata Motors Mumbai Plant",
    depth: 0,
    isDeleted: false,
    children: [
      // ------------------------------
      // Department: Manufacturing
      // ------------------------------
      {
        id: "d1",
        name: "Manufacturing Department",
        type: "Department",
        description: "Handles automobile manufacturing operations",
        path: "Tata Motors Mumbai Plant / Manufacturing",
        depth: 1,
        isDeleted: false,
        children: [
          {
            id: "l1",
            name: "Assembly Line 1",
            type: "Line",
            description: "Primary assembly line",
            path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1",
            depth: 2,
            isDeleted: false,
            children: [
              {
                id: "m1",
                name: "Machine 1",
                type: "Machine",
                description: "Sample machine",
                path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1 / Machine 1",
                depth: 3,
                isDeleted: false,
                children: [
                  {
                    id: "sm1",
                    name: "Sub Machine 1",
                    type: "SubMachine",
                    description: "Sample sub machine",
                    path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1 / Machine 1 / Sub Machine 1",
                    depth: 4,
                    isDeleted: false,
                    children: [],
                  },
                ],
              },
            ],
          },

          {
            id: "l2",
            name: "Assembly Line 2",
            type: "Line",
            description: "Secondary assembly line",
            path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 2",
            depth: 2,
            isDeleted: false,
            children: [],
          },

          {
            id: "l3",
            name: "Assembly Line 3",
            type: "Line",
            description: "Tertiary assembly line",
            path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 3",
            depth: 2,
            isDeleted: false,
            children: [],
          },
        ],
      },

      // ------------------------------
      // Department: Painting
      // ------------------------------
      {
        id: "d2",
        name: "Painting Department",
        type: "Department",
        description: "Paint shop operations",
        path: "Tata Motors Mumbai Plant / Painting",
        depth: 1,
        isDeleted: false,
        children: [
          {
            id: "pl1",
            name: "Paint Line 1",
            type: "Line",
            description: "Base coat paint line",
            path: "Tata Motors Mumbai Plant / Painting / Paint Line 1",
            depth: 2,
            isDeleted: false,
            children: [
              {
                id: "pm1",
                name: "Paint Machine 1",
                type: "Machine",
                description: "Sample paint machine",
                path: "Tata Motors Mumbai Plant / Painting / Paint Line 1 / Paint Machine 1",
                depth: 3,
                isDeleted: false,
                children: [
                  {
                    id: "psm1",
                    name: "Paint Sub Machine 1",
                    type: "SubMachine",
                    description: "Sample paint sub machine",
                    path: "Tata Motors Mumbai Plant / Painting / Paint Line 1 / Paint Machine 1 / Paint Sub Machine 1",
                    depth: 4,
                    isDeleted: false,
                    children: [],
                  },
                ],
              },
            ],
          },

          {
            id: "pl2",
            name: "Paint Line 2",
            type: "Line",
            description: "Color coating line",
            path: "Tata Motors Mumbai Plant / Painting / Paint Line 2",
            depth: 2,
            isDeleted: false,
            children: [],
          },

          {
            id: "pl3",
            name: "Paint Line 3",
            type: "Line",
            description: "Finishing paint line",
            path: "Tata Motors Mumbai Plant / Painting / Paint Line 3",
            depth: 2,
            isDeleted: false,
            children: [],
          },
        ],
      },
    ],
  },
]);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await getAssetHierarchy();
      setAssets(res.map(mapBackendAsset));
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Added all missing functions so React stops crashing
  const onEdit = () => {
    if (!selectedAsset) return;
    console.log("Edit Asset:", selectedAsset);
    navigate(`/assets/edit/${selectedAsset.id}`);
  };

  const onAddChild = () => {
    if (!selectedAsset) return;
    console.log("Add child under:", selectedAsset);
    navigate(`/assets/add?parentId=${selectedAsset.id}`);
  };

  const onDelete = () => {
    if (!selectedAsset) return;
    console.log("Delete asset:", selectedAsset);
    alert("Soft delete triggered (dummy)");
  };

  const onRestore = () => {
    if (!selectedAsset) return;
    console.log("Restore asset:", selectedAsset);
    alert("Restore triggered (dummy)");
  };

  const onAssignDevice = () => {
    if (!selectedAsset) return;
    console.log("Assign device to:", selectedAsset);
    navigate(`/assets/assign-device/${selectedAsset.id}`);
  };

  return (
    <div className="p-3">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Asset Hierarchy</h1>
          <p className="text-muted-foreground">
            Explore Departments → Lines → Machines → SubMachines
          </p>
        </div>

        <Button
          onClick={() => navigate("/assets/add")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Import Bulk
        </Button> 
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* LEFT : Asset Tree */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Hierarchy Tree</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {loading ? (
              <p className="text-muted-foreground p-2">Loading...</p>
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

        {/* RIGHT DETAILS */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {selectedAsset?.name}
</CardTitle>

                

                {selectedAsset && (
                  <div className="flex items-center mt-1">
                    {selectedAsset.isDeleted && (
                      <Badge variant="destructive" className="ml-2">Deleted</Badge>
                    )}
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

                <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t"></div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Type</p>
                    <p className="font-medium">{selectedAsset.type}</p>
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
                  <Button onClick={onEdit} size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" /> Edit Asset
                  </Button>

                  <Button onClick={onAddChild} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Sub-Asset
                  </Button>

                  {selectedAsset.isDeleted ? (
                    <Button onClick={onRestore} size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" /> Restore
                    </Button>
                  ) : (
                    <Button onClick={onDelete} size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  )}

                  {selectedAsset.type === "Machine" && (
                    <Button onClick={onAssignDevice} size="sm" variant="outline">
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
