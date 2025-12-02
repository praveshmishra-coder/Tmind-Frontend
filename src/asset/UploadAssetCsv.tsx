import React, { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function UploadAssetCsv({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file only!");
      return;
    }

    setFile(f);
    toast.info(`Selected: ${f.name}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file only!");
      return;
    }

    setFile(f);
    toast.info(`Selected: ${f.name}`);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.warning("Please select a CSV file first!");
      return;
    }

    toast.success(`CSV submitted: ${file.name}`);

    // Pass selected file back to Assets.tsx
    onSuccess(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative w-full h-48 border-2 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer
        ${dragOver ? "border-primary bg-primary/10" : "border-border bg-card"}
      `}
    >
            {file ? (
          <p className="font-medium">{file.name}</p>
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

      <div className="flex gap-3">
        <Button variant="outline" className="w-1/2" onClick={onClose}>
          Cancel
        </Button>
        <Button className="w-1/2" onClick={handleSubmit}>
          Submit CSV
        </Button>
      </div>
    </div>
  );
}
