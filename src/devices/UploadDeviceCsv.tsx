import React, { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function UploadDeviceCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  // Handle file drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv") {
        setFile(droppedFile);
      } else {
        alert("Please upload a CSV file only.");
      }
    }
  };

  // Handle file select via input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv") {
        setFile(selectedFile);
      } else {
        alert("Please upload a CSV file only.");
      }
    }
  };

  // Handle submit (frontend only)
  const handleSubmit = () => {
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    console.log("CSV file submitted:", file.name);
    alert(`CSV file "${file.name}" submitted!`);

    // Reset and navigate
    setFile(null);
    navigate("/devices");
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