import * as XLSX from "xlsx";

 export interface AssetUploadRow {
  Name: string;
  ParentName?: string;
  Level: number;
}

export interface ValidationResult {
  validRows: AssetUploadRow[];
  invalidRows: { row: AssetUploadRow; errors: string[] }[];
}

export const parseAndValidateAssetFile = (file: File): Promise<ValidationResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows: AssetUploadRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const validRows: AssetUploadRow[] = [];
        const invalidRows: { row: AssetUploadRow; errors: string[] }[] = [];

        // Row-wise validation
        rows.forEach((row, index) => {
          const errors: string[] = [];

          if (!row.Name || row.Name.trim() === "") {
            errors.push("Name is required");
          } else if (!/^[A-Za-z0-9 _.-]+$/.test(row.Name)) {
            errors.push("Name contains invalid characters");
          }

          if (row.Level === undefined || row.Level === null) {
            errors.push("Level is required");
          } else if (row.Level < 0 || row.Level > 5) {
            errors.push("Level must be between 0 and 5");
          }

          // Optional: parent name validation
          if (row.ParentName && row.ParentName.trim() === "") {
            errors.push("ParentName cannot be empty string");
          }

          if (errors.length > 0) {
            invalidRows.push({ row, errors });
          } else {
            validRows.push(row);
          }
        });

        resolve({ validRows, invalidRows });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);

    // Read file as ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};
