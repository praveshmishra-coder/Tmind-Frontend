import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { type Asset } from "@/types/asset";
import { AssetTree } from "@/asset/AssetTree";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([
  {
    id: "c1",
    name: "ABC Industries Pvt Ltd",
    type: "Company",
    description: "Head manufacturing company",
    path: "ABC Industries Pvt Ltd",
    depth: 0,
    isDeleted: false,
    children: [
      {
        id: "p1",
        name: "Pune Plant",
        type: "Plant",
        description: "Automobile manufacturing plant",
        path: "ABC Industries Pvt Ltd / Pune Plant",
        depth: 1,
        isDeleted: false,
        children: [
          {
            id: "l1",
            name: "Assembly Line A",
            type: "Line",
            description: "Main car assembly line",
            path: "ABC Industries Pvt Ltd / Pune Plant / Assembly Line A",
            depth: 2,
            isDeleted: false,
            children: [
              {
                id: "m1",
                name: "Robot Arm A1",
                type: "Machine",
                description: "Welding robot",
                path: "ABC Industries Pvt Ltd / Pune Plant / Assembly Line A / Robot Arm A1",
                depth: 3,
                isDeleted: false,
                children: [],
              },
              {
                id: "m2",
                name: "Conveyor A2",
                type: "Machine",
                description: "Main conveyor system",
                path: "ABC Industries Pvt Ltd / Pune Plant / Assembly Line A / Conveyor A2",
                depth: 3,
                isDeleted: false,
                children: [],
              },
            ],
          },
          {
            id: "l2",
            name: "Paint Line B",
            type: "Line",
            description: "Car painting line",
            path: "ABC Industries Pvt Ltd / Pune Plant / Paint Line B",
            depth: 2,
            isDeleted: false,
            children: [
              {
                id: "m3",
                name: "Paint Robot B1",
                type: "Machine",
                description: "Automated painting machine",
                path: "ABC Industries Pvt Ltd / Pune Plant / Paint Line B / Paint Robot B1",
                depth: 3,
                isDeleted: false,
                children: [],
              },
            ],
          },
        ],
      },

      {
        id: "p2",
        name: "Mumbai Plant",
        type: "Plant",
        description: "Electronics manufacturing plant",
        path: "ABC Industries Pvt Ltd / Mumbai Plant",
        depth: 1,
        isDeleted: false,
        children: [
          {
            id: "l3",
            name: "PCB Line X",
            type: "Line",
            description: "PCB assembly line",
            path: "ABC Industries Pvt Ltd / Mumbai Plant / PCB Line X",
            depth: 2,
            isDeleted: false,
            children: [
              {
                id: "m4",
                name: "Soldering Machine X1",
                type: "Machine",
                description: "PCB soldering machine",
                path: "ABC Industries Pvt Ltd / Mumbai Plant / PCB Line X / Soldering Machine X1",
                depth: 3,
                isDeleted: false,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      // const data = await getAssetHierarchy();
      // setAssets(data);
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Asset Hierarchy
          </h1>
          <p className="text-muted-foreground">
            Explore structure of plants, departments, machines & sub-machines.
          </p>
        </div>

        {/* <Button
          onClick={() => navigate("/assets/add")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add Root
        </Button> */}
      </div>

      {/* Search
      <div className="flex items-center gap-3 mt-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md"
          />
        </div>
      </div> */}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* LEFT : Asset Tree */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Hierarchy Tree
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <p className="text-muted-foreground p-4">Loading...</p>
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

        {/* RIGHT : Asset Details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Asset Details</CardTitle>
          </CardHeader>

          <CardContent>
            {!selectedAsset ? (
              <p className="text-muted-foreground">
                Select an asset from the tree.
              </p>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">{selectedAsset.name}</h2>
                <p>
                  <strong>Type:</strong> {selectedAsset.type}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedAsset.description || "No description"}
                </p>
                <p>
                  <strong>Path:</strong> {selectedAsset.path}
                </p>
                <p>
                  <strong>Depth:</strong> {selectedAsset.depth}
                </p>

                {selectedAsset.deviceId && (
                  <p>
                    <strong>Assigned Device:</strong>{" "}
                    {selectedAsset.deviceId}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
