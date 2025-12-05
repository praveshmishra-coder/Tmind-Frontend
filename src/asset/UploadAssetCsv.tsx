import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import apiAsset from "@/api/axiosAsset";

type ParsedRow = Record<string, unknown> & { __rowNum?: number };

type Asset = {
  assetName: string;
  parentName?: string | null;
  level: number;
  sourceRows: number[];
};

type FieldError = {
  assetIndex: number;
  field: "assetName" | "parentName" | "level";
  messages: string[];
  rowInfo?: string;
};
type ApiResposne={
  addedAssets:[],
  skippedAssets:[]
}

const ASSET_NAME_RE = /^[A-Za-z0-9 _-]+$/;

export default function AssetBulkUpload() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiResposne,setApiResponse]=useState<ApiResposne>();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeKey = (k: string | undefined) => String(k || "").replace(/\s+/g, "").toLowerCase();

  function dedupAndMap(parsedRows: ParsedRow[]): Asset[] {
    const map = new Map<string, Asset>();

    for (const r of parsedRows) {
      const normalized: Record<string, unknown> = {};
      for (const k of Object.keys(r)) normalized[normalizeKey(k)] = r[k];

      const assetName = String(normalized["assetname"] ?? "").trim();
      const parentName = String(normalized["parentname"] ?? "").trim();
      const level = Number(normalized["level"] ?? 0);
      const rowNum = r.__rowNum ?? null;

      if (!assetName) continue;

      const key = assetName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          assetName,
          parentName: parentName || null,
          level: isNaN(level) ? 0 : level,
          sourceRows: rowNum ? [rowNum] : [],
        });
      } else map.get(key)!.sourceRows.push(rowNum!);
    }

    return Array.from(map.values());
  }

  function validate(astList: Asset[]) {
    const global: string[] = [];
    const flatFieldErrors: FieldError[] = [];
    const seen = new Map<string, number>();

    if (astList.length > 20) global.push(`Maximum 20 assets allowed (found ${astList.length})`);

    astList.forEach((a, i) => {
      const rowInfo = a.sourceRows.length ? ` (rows: ${a.sourceRows.join(",")})` : "";

      if (!a.assetName.trim())
        flatFieldErrors.push({ assetIndex: i, field: "assetName", messages: ["AssetName is required"], rowInfo });

      if (a.assetName.trim().length < 3 || a.assetName.trim().length > 100)
        flatFieldErrors.push({ assetIndex: i, field: "assetName", messages: ["3-100 characters allowed"], rowInfo });

      if (!ASSET_NAME_RE.test(a.assetName))
        flatFieldErrors.push({ assetIndex: i, field: "assetName", messages: ["Invalid characters"], rowInfo });

      if (a.level <= 0)
        flatFieldErrors.push({ assetIndex: i, field: "level", messages: ["Level must be greater than 0"], rowInfo });

      if (!Number.isInteger(a.level))
        flatFieldErrors.push({ assetIndex: i, field: "level", messages: ["Level must be an integer"], rowInfo });

      const key = a.assetName.toLowerCase();
      if (seen.has(key)) {
        flatFieldErrors.push({
          assetIndex: i,
          field: "assetName",
          messages: [`Duplicate asset name (row ${seen.get(key)! + 2})`],
          rowInfo
        });
      } else seen.set(key, i);
    });

    return { global, fieldErrors: flatFieldErrors };
  }

  useEffect(() => {
    const { global, fieldErrors } = validate(assets);
    setGlobalErrors(global);
    setFieldErrors(fieldErrors);
  }, [assets]);

  const openFilePicker = () => fileInputRef.current?.click();

  function handleFile(file: File) {
    const fileName = file.name.toLowerCase();

    const processRows = (data: Record<string, unknown>[]) => {
      const annotated = data.map((r, i) => ({ __rowNum: i + 2, ...r }));
      
      setRows(annotated);
      console.log(rows)
      setAssets(dedupAndMap(annotated));
    };

    if (fileName.endsWith(".csv")) {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: (res) => processRows(res.data as Record<string, unknown>[]) });
      return;
    }

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = e => {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        processRows(json);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    setGlobalErrors(["Unsupported file type. Please upload CSV or Excel"]);
  }

  async function handleSave() {
    const { global, fieldErrors } = validate(assets);
    setGlobalErrors(global);
    setFieldErrors(fieldErrors);
    if (global.length || fieldErrors.length) return;

    setSaving(true);

    try {
    const response=  await apiAsset.post("/AssetHierarchy/bulk-upload", {
         assets : assets.map(a => ({ AssetName: a.assetName.trim(), ParentName: a.parentName?.trim() ?? null, Level: a.level }))
      });
     setApiResponse(response.data);
     
      setRows([]);
      setAssets([]);
      setGlobalErrors([]);
      setFieldErrors([]);
    } catch (err: any) {
      setGlobalErrors([err.message || "Error saving assets"]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-sm">Asset Bulk Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; f && handleFile(f); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={
            "rounded-lg p-4 flex items-center justify-between transition-shadow border cursor-pointer " +
            (dragOver ? "shadow-lg border-indigo-300 bg-indigo-50" : "bg-white")
          }

        >
          <div className="leading-tight">
            <div className="text-sm font-medium">Upload CSV / Excel</div>
            <div className="text-xs text-muted-foreground mt-1">
              Columns: <span className="font-semibold">AssetName</span>, <span className="font-semibold">ParentName</span>, <span className="font-semibold">Level</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Drag & drop or click “Choose file”</div>
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; f && handleFile(f); if (fileInputRef.current) fileInputRef.current.value = ""; }} />
            <Button size="sm" onClick={openFilePicker}>Choose file</Button>
            <Button variant="ghost" size="sm" onClick={() => { setRows([]); setAssets([]); setGlobalErrors([]); setFieldErrors([]); }}>Clear</Button>
          </div>
        </div>

        <Separator />

        {globalErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            <ul className="list-disc ml-5">
              {globalErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div>
          {fieldErrors.length > 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="font-medium mb-2">Validation issues</div>
              <ScrollArea className="h-auto overflow-auto">
                <ul className="space-y-2">
                  {fieldErrors.map((fe, i) => (
                    <li key={i} className="p-2 bg-white border rounded shadow-sm">
                      <div className="text-xs text-muted-foreground">
                        {fe.rowInfo || assets[fe.assetIndex]?.sourceRows?.join(",") || "?"}
                      </div>
                      <div className="font-medium">Field: {fe.field}</div>
                      <div className="text-xs text-red-700 mt-1">
                        {fe.messages.map((m, i2) => <div key={i2}>• {m}</div>)}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
              {assets.length > 0 ? "🎉 CSV is ready to upload." : "Upload a CSV/XLSX to validate."}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} disabled={assets.length === 0 || saving}>
            {saving ? "Saving..." : "Save Assets"}
          </Button>
        </div>

         {apiResposne && (
          <div className="space-y-3 mt-4">
            {apiResposne.addedAssets?.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-sm">
                <div className="font-medium text-emerald-700 mb-1">
                  ✅ Successfully Added ({apiResposne.addedAssets.length})
                </div>
                <ScrollArea className="max-h-40">
                  <ul className="list-disc ml-5 text-emerald-800">
                    {apiResposne.addedAssets.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {apiResposne.skippedAssets?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                <div className="font-medium text-red-700 mb-1">
                  ⚠️ Skipped ({apiResposne.skippedAssets.length})
                </div>
                <ScrollArea className="max-h-40">
                  <ul className="list-disc ml-5 text-red-800">
                    {apiResposne.skippedAssets.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
