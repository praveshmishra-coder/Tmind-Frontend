import React, { useEffect, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { AssetTree } from "@/asset/AssetTree";
import AssetDetails from "@/asset/AssetDetails";
import AssignDevice from "@/asset/AssignDevice";

import { type Asset } from "@/types/asset";
import { getAssetHierarchy } from "@/api/assetApi";
import { transformHierarchy } from "@/asset/mapBackendToFrontend";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [assignedDevice, setAssignedDevice] = useState<any>(null);
  const [showAssignDevice, setShowAssignDevice] = useState(false);

  const [loading, setLoading] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  /* ----------------------------------------------------------
    LOAD ASSET HIERARCHY
  ----------------------------------------------------------- */
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);

      const backend = await getAssetHierarchy();

      // Convert backend → frontend format
      const formatted = transformHierarchy(backend);
      setAssets(formatted);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
    BUTTON ACTIONS
  ----------------------------------------------------------- */

  const onEdit = () => {
    if (!selectedAsset) return;
    navigate(`/assets/edit/${selectedAsset.assetId}`);
  };

  const onAddChild = () => {
    if (!selectedAsset) return;
    navigate(`/assets/add?parentId=${selectedAsset.assetId}`);
  };

  const onDelete = () => {
    if (!selectedAsset) return;
    alert(`Delete asset → ${selectedAsset.name}`);
  };

  const onRestore = () => {
    if (!selectedAsset) return;
    alert(`Restore asset → ${selectedAsset.name}`);
  };

  const onAssignDevice = () => {
    if (!selectedAsset) return;
    setShowAssignDevice(true);
  };

  /* ----------------------------------------------------------
    CSV UPLOAD
  ----------------------------------------------------------- */

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
      alert("Please select a CSV file first.");
      return;
    }

    alert(`CSV file uploaded: ${csvFile.name}`);
    setShowUploadModal(false);
    setCsvFile(null);
    loadAssets();
  };

  /* ----------------------------------------------------------
    UI RENDER
  ----------------------------------------------------------- */

  return (
    <div className="p-3">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Asset Hierarchy
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore structure of plants, departments, machines & sub-machines.
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary text-primary-foreground"
        >
          + Import Bulk
        </Button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6 mt-6">

        {/* LEFT: Tree */}
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
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Asset Details */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Asset Details</CardTitle>
            </CardHeader>

            <CardContent className="p-2 flex-1 overflow-auto">
              <AssetDetails
                selectedAsset={selectedAsset}
                assignedDevice={assignedDevice}
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

      {/* Assign Device Popup */}
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
              Drag & drop a CSV file here or click to select.
            </DialogDescription>
          </DialogHeader>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full h-48 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition ${
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
