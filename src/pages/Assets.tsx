import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssetTree } from "@/asset/AssetTree";
import { type Asset } from "@/types/asset";
import { Button } from "@/components/ui/button";
import AssetDetails from "@/asset/AssetDetails";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "p1",
      name: "Tata Motors Mumbai Plant",
      type: "Plant",
      description: "Main manufacturing plant",
      path: "Tata Motors Mumbai Plant",
      depth: 1,
      isDeleted: false,
      children: [
        {
          id: "d1",
          name: "Manufacturing Department",
          type: "Department",
          description: "Handles automobile manufacturing operations",
          path: "Tata Motors Mumbai Plant / Manufacturing",
          depth: 2,
          isDeleted: false,
          children: [
            {
              id: "l1",
              name: "Assembly Line 1",
              type: "Line",
              description: "Primary assembly line",
              path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1",
              depth: 3,
              isDeleted: false,
              children: [
                {
                  id: "m1",
                  name: "Machine 1",
                  type: "Machine",
                  description: "Sample machine",
                  path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1 / Machine 1",
                  depth: 4,
                  isDeleted: false,
                  children: [
                    {
                      id: "sm1",
                      name: "Sub Machine 1",
                      type: "SubMachine",
                      description: "Sample sub machine",
                      path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 1 / Machine 1 / Sub Machine 1",
                      depth: 5,
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
              depth: 3,
              isDeleted: false,
              children: [],
            },
            {
              id: "l3",
              name: "Assembly Line 3",
              type: "Line",
              description: "Tertiary assembly line",
              path: "Tata Motors Mumbai Plant / Manufacturing / Assembly Line 3",
              depth: 3,
              isDeleted: false,
              children: [],
            },
          ],
        },
        {
          id: "d2",
          name: "Painting Department",
          type: "Department",
          description: "Paint shop operations",
          path: "Tata Motors Mumbai Plant / Painting",
          depth: 2,
          isDeleted: false,
          children: [
            {
              id: "pl1",
              name: "Paint Line 1",
              type: "Line",
              description: "Base coat paint line",
              path: "Tata Motors Mumbai Plant / Painting / Paint Line 1",
              depth: 3,
              isDeleted: false,
              children: [
                {
                  id: "pm1",
                  name: "Paint Machine 1",
                  type: "Machine",
                  description: "Sample paint machine",
                  path: "Tata Motors Mumbai Plant / Painting / Paint Line 1 / Paint Machine 1",
                  depth: 4,
                  isDeleted: false,
                  children: [
                    {
                      id: "psm1",
                      name: "Paint Sub Machine 1",
                      type: "SubMachine",
                      description: "Sample paint sub machine",
                      path: "Tata Motors Mumbai Plant / Painting / Paint Line 1 / Paint Machine 1 / Paint Sub Machine 1",
                      depth: 5,
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
              depth: 3,
              isDeleted: false,
              children: [],
            },
            {
              id: "pl3",
              name: "Paint Line 3",
              type: "Line",
              description: "Finishing paint line",
              path: "Tata Motors Mumbai Plant / Painting / Paint Line 3",
              depth: 3,
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
      // fetch assets here if needed
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = () => {
    if (!selectedAsset) return;
    navigate(`/assets/edit/${selectedAsset.id}`);
  };
  const onAddChild = () => {
    if (!selectedAsset) return;
    navigate(`/assets/add?parentId=${selectedAsset.id}`);
  };
  const onDelete = () => {
    if (!selectedAsset) return;
    alert("Soft delete triggered (dummy)");
  };
  const onRestore = () => {
    if (!selectedAsset) return;
    alert("Restore triggered (dummy)");
  };
  const onAssignDevice = () => {
    if (!selectedAsset) return;
    navigate(`/assets/assign-device/${selectedAsset.id}`);
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Asset Hierarchy</h1>
          <p className="text-sm text-muted-foreground">
            Explore structure of plants, departments, machines & sub-machines.
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
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* LEFT: Asset Tree */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="glass-card h-[600px] flex flex-col">
            <CardContent className="p-2 flex-1 overflow-auto">
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
        </div>

        {/* RIGHT: Asset Details */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="glass-card h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-auto">
              <AssetDetails
                selectedAsset={selectedAsset}
                onEdit={onEdit}
                onAddChild={onAddChild}
                onDelete={onDelete}
                onRestore={onRestore}
                onAssignDevice={onAssignDevice}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  );
}