import React, { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { parseAndValidateAssetFile, ValidationResult } from "@/Services/parseAndValidateAssetFile";

export default function UploadAssetCsv({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Handle drag-and-drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".csv") && !f.name.endsWith(".xlsx")) {
      toast.error("Please upload a CSV or Excel file only!");
      return;
    }

    setFile(f);
    toast.info(`Selected: ${f.name}`);
  };

  // Handle click-to-upload
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const f = e.target.files[0];

    if (!f.name.endsWith(".csv") && !f.name.endsWith(".xlsx")) {
      toast.error("Please upload a CSV or Excel file only!");
      return;
    }

    setFile(f);
    toast.info(`Selected: ${f.name}`);
  };

  // Submit button
  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    try {
      const result: ValidationResult = await parseAndValidateAssetFile(file);

      console.log("Valid Rows:", result.validRows);
      console.log("Invalid Rows:", result.invalidRows);

      // Trigger success if there are valid rows
      if (result.validRows.length > 0) onSuccess(file);

      // TODO: display invalidRows in UI if needed
    } catch (err) {
      console.error("Error reading file:", err);
      toast.error("Error reading file");
    }
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
            Drag & drop a CSV or Excel file or click to select
          </p>
        )}

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="w-1/2" onClick={onClose}>
          Cancel
        </Button>
        <Button className="w-1/2" onClick={handleFileUpload}>
          Submit File
        </Button>
      </div>
    </div>
  );
}
