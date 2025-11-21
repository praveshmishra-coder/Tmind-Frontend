import React, { useEffect, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { AssetTree } from "@/asset/AssetTree";
import AssetDetails from "@/asset/AssetDetails";
import AssignDevice from "@/asset/AssignDevice";

import { getAssetHierarchy } from "@/api/assetApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// -------------------- Types --------------------
export type BackendAsset = {
  assetId: string;
  name: string;
  childrens: BackendAsset[];
  parentId: string | null;
  level: number;
  isDeleted: boolean;
};

// -------------------- Helper Functions --------------------
const removeAssetById = (assets: BackendAsset[], id: string): BackendAsset[] => {
  return assets
    .filter(a => a.assetId !== id)
    .map(a => ({
      ...a,
      childrens: removeAssetById(a.childrens || [], id),
    }));
};

// -------------------- Component --------------------
export default function Assets() {
  // State
  const [assets, setAssets] = useState<BackendAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<BackendAsset | null>(null);

  const [assignedDevice, setAssignedDevice] = useState<any>(null);
  const [showAssignDevice, setShowAssignDevice] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  // -------------------- Load Assets --------------------
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const backendData: BackendAsset[] = await getAssetHierarchy();
      setAssets(backendData);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Assign Device --------------------
  const onAssignDevice = () => {
    if (!selectedAsset) return;
    setShowAssignDevice(true);
  };

  // -------------------- CSV Handlers --------------------
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      alert("Please upload a CSV file only.");
      return;
    }

    setCsvFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      alert("Please upload a CSV file only.");
      return;
    }

    setCsvFile(file);
  };

  const handleCsvSubmit = () => {
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }

    alert(`CSV uploaded: ${csvFile.name}`);
    setShowUploadModal(false);
    setCsvFile(null);
    loadAssets();
  };

  // -------------------- Render --------------------
  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Asset Hierarchy
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore structure of plants, departments, machines & sub-machines.
          </p>
        </div>

        <Button onClick={() => setShowUploadModal(true)}>+ Import Bulk</Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Asset Tree */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="h-[600px] flex flex-col">
            <CardContent className="p-2 flex-1 overflow-auto">
              {loading ? (
                <p className="text-muted-foreground p-2">Loading assets...</p>
              ) : (
                <AssetTree
                  assets={assets}
                  selectedId={selectedAsset?.assetId || null}
                  onSelect={setSelectedAsset}
                  onDelete={(deletedAsset) =>
                    setAssets((prev) => removeAssetById(prev, deletedAsset.assetId))
                  }
                  onAdd={(newAsset) => setAssets((prev) => [...prev, newAsset])}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset Details */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Asset Details</CardTitle>
            </CardHeader>

            <CardContent className="p-2 flex-1 overflow-auto">
              <AssetDetails
                selectedAsset={selectedAsset}
                assignedDevice={assignedDevice}
                onRestore={() => {}}
                onAssignDevice={onAssignDevice}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Device Modal */}
      {showAssignDevice && selectedAsset && (
        <AssignDevice
          open={showAssignDevice}
          asset={selectedAsset}
          onClose={() => setShowAssignDevice(false)}
          onAssign={(device) => {
            setAssignedDevice(device);
            setShowAssignDevice(false);
          }}
        />
      )}

      {/* CSV Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md p-6 bg-card rounded-2xl border shadow-xl">
          <DialogHeader>
            <DialogTitle>Upload CSV</DialogTitle>
            <DialogDescription>
              Drag & drop a CSV file or click to select.
            </DialogDescription>
          </DialogHeader>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full h-48 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer ${
              dragOver ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            {csvFile ? (
              <p className="font-medium">{csvFile.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Drag & drop a CSV file or click to select
              </p>
            )}

            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCsvSubmit}>Submit CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
