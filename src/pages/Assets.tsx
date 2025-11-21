import React, { useEffect, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssetTree } from "@/asset/AssetTree";
import { type Asset } from "@/types/asset";
import { Button } from "@/components/ui/button";
import AssetDetails from "@/asset/AssetDetails";
import { getAssetHierarchy } from "@/api/assetApi";
import { transformHierarchy } from "@/asset/mapBackendToFrontend";

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const backendData = await getAssetHierarchy();
      const mapped = transformHierarchy(backendData);
      setAssets(mapped);
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

  // CSV Upload Handlers
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv") {
        setCsvFile(droppedFile);
      } else {
        alert("Please upload a CSV file only.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv") {
        setCsvFile(selectedFile);
      } else {
        alert("Please upload a CSV file only.");
      }
    }
  };

  const handleCsvSubmit = () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }
    console.log("CSV file submitted:", csvFile.name);
    alert(`CSV file "${csvFile.name}" submitted!`);
    setCsvFile(null);
    setShowUploadModal(false);
    loadAssets(); // refresh tree if needed
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
          onClick={() => setShowUploadModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Import Bulk
        </Button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-12 lg:col-span-5">
          <Card className="glass-card h-[600px] flex flex-col">
            <CardContent className="p-2 flex-1 overflow-auto">
              {loading ? (
                <p className="text-muted-foreground p-2">Loading...</p>
              ) : (
                <AssetTree
                  assets={assets}
                  selectedId={selectedAsset?.id || null}
                  onSelect={setSelectedAsset}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7">
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

      {/* Upload CSV Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md border border-border shadow-2xl rounded-2xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle>Upload CSV</DialogTitle>
          </DialogHeader>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full h-48 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition-colors relative ${
              dragOver ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            {csvFile ? (
              <p className="text-center font-medium">{csvFile.name}</p>
            ) : (
              <p className="text-center text-muted-foreground">
                Drag & drop a CSV file here or click to select
              </p>
            )}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <DialogFooter className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadModal(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button onClick={handleCsvSubmit}>Submit CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
