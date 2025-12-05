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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

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
    setValidationResult(null); // reset previous validation
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
    setValidationResult(null); // reset previous validation
  };

  // Validate file and show errors
  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    try {
      const result: ValidationResult = await parseAndValidateAssetFile(file);

      console.log("Valid Rows:", result.validRows);
      console.log("Invalid Rows:", result.invalidRows);

      // Save validation result in state to show errors
      setValidationResult(result);

      // Trigger success only if there are valid rows
      if (result.validRows.length > 0) onSuccess(file);
    } catch (err) {
      console.error("Error reading file:", err);
      toast.error("Error reading file");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File drop area */}
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

      {/* Submit / Cancel buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="w-1/2" onClick={onClose}>
          Cancel
        </Button>
        <Button className="w-1/2" onClick={handleFileUpload}>
          Submit File
        </Button>
      </div>

      {/* Show validation errors */}
      {validationResult?.invalidRows.length ? (
        <div className="mt-4 p-4 border border-red-300 rounded bg-red-50">
          <h3 className="font-medium text-red-700 mb-2">Invalid Rows:</h3>
          <ul className="list-disc list-inside">
            {validationResult.invalidRows.map((item, idx) => (
              <li key={idx} className="mb-1">
                Row {item.row.__rowNum__ || idx + 1}: {item.errors.join(", ")}
                <br />
                Data: {JSON.stringify(item.row)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
