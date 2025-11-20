import React, { useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";

interface UploadCsvModalProps {
  onClose: () => void;
}

export default function UploadCsvModal({ onClose }: UploadCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv") setFile(droppedFile);
      else alert("Please upload a valid CSV file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selected = e.target.files[0];
      if (selected.type === "text/csv") setFile(selected);
      else alert("Please upload a CSV file.");
    }
  };

  const handleSubmit = () => {
    if (!file) return alert("Please select a CSV first.");
    alert(`CSV "${file.name}" uploaded successfully!`);
    setFile(null);
    onClose();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl w-[450px]">
      <h2 className="text-xl font-semibold mb-4">Upload Asset CSV</h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full h-40 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer relative transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-border bg-card"
        }`}
      >
        {file ? (
          <p className="font-medium">{file.name}</p>
        ) : (
          <p className="text-muted-foreground text-center">
            Drag & drop CSV here or click to browse
          </p>
        )}

        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>Upload</Button>
      </div>
    </div>
  );
}
