import React, { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UploadAssetCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (droppedFile.type !== "text/csv") {
      toast.error("Please upload a CSV file only!");
      return;
    }

    setFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv") {
      toast.error("Please upload a CSV file only!");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Please select a CSV file first!");
      return;
    }

    toast.success(`CSV file "${file.name}" submitted successfully!`);

    setFile(null);

    // Navigate after short delay to let toast show
    setTimeout(() => navigate("/assets"), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload CSV</h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-md h-48 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition-colors relative ${
          dragOver ? "border-primary bg-primary/10" : "border-border bg-card"
        }`}
      >
        {file ? (
          <p className="text-center font-medium">{file.name}</p>
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

      <Button
        onClick={handleSubmit}
        className="mt-4 w-full max-w-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Submit CSV
      </Button>
    </div>
  );
}
