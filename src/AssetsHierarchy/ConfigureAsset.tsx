// src/components/ConfigureAsset.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, RefreshCw } from "lucide-react";
import { type Asset } from "@/types/asset";
import apiAsset from "@/api/axiosAsset";
import { toast } from "react-toastify";

interface ConfigureAssetProps {
  asset: Asset;
  onClose: () => void;
}

interface AssetConfig {
  assetConfigID: string;
  signalTypeID: string;
  signalName: string;
  signalUnit: string;
  regsiterAdress: number;
}

const SIGNALS = [
  { id: "6b32d08c-f0ff-4d3a-b357-0ba8be47b939", name: "Temperature", unit: "°C", register: 40001 },
  { id: "0b1a070d-61d6-46b2-a2b0-480a28d7c3f9", name: "Pressure", unit: "kPa", register: 40003 },
  { id: "8a8aeeff-ccc1-4777-ab0a-b5bbad72431c", name: "Voltage", unit: "V", register: 40005 },
  { id: "916a0a0a-ebb2-424a-9905-bcff737c8c62", name: "Current", unit: "A", register: 40007 },
  { id: "808df995-8b31-48a9-9086-1f5d6691c4f9", name: "RPM", unit: "rpm", register: 40013 },
  { id: "835cbb32-9b02-4122-8533-05f6ace3a6d4", name: "Flow", unit: "L/min", register: 40009 },
  { id: "99bfe26d-1691-441f-aa8f-036aa415b0a8", name: "Vibration", unit: "mm/s", register: 40011 },
];

type StagedConfig = AssetConfig & {
  status: "unchanged" | "toDelete";
};

export default function ConfigureAsset({ asset, onClose }: ConfigureAssetProps) {
  const [stagedNewSignals, setStagedNewSignals] = useState<string[]>([]);
  const [stagedConfigs, setStagedConfigs] = useState<StagedConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfigs = async () => {
    setConfigsLoading(true);
    setLoadingInitial(true);
    try {
      const res = await apiAsset.get<AssetConfig[]>(`/AssetConfig/${asset.assetId}`);
      const data = res.data || [];
      const staged = data.map((c) => ({
        ...c,
        status: "unchanged" as const,
      }));
      setStagedConfigs(staged);
    } catch (err: any) {
      console.error("Failed to load configs", err);
      toast.error("Failed to load existing configurations.");
    } finally {
      setConfigsLoading(false);
      setLoadingInitial(false);
    }
  };

  const findSignal = (id?: string) => SIGNALS.find((s) => s.id === id);

  // active count = existing not marked deleted + staged new
  const activeCount = useMemo(() => {
    const existingActive = stagedConfigs.filter((c) => c.status !== "toDelete").length;
    return existingActive + stagedNewSignals.length;
  }, [stagedConfigs, stagedNewSignals]);

  // Add staged new signal (ensure uniqueness & max 3)
  // NEW simplified behavior:
  // - If signal already configured (active), show error and do nothing.
  // - Else add to stagedNewSignals (will be POSTed on Save).
  const addNewSignal = (id: string) => {
    // already staged as new
    if (stagedNewSignals.includes(id)) {
      toast.info("Signal already staged for add.");
      return;
    }

    // If active config already uses this signal (and not marked deleted), do nothing (no dupes)
    const alreadyActive = stagedConfigs.some((c) => c.status !== "toDelete" && c.signalTypeID === id);
    if (alreadyActive) {
      toast.error("Signal already configured for this asset.");
      return;
    }

    // Enforce max 3 across existing(not-deleted) + staged new
    if (activeCount >= 3) {
      toast.error("You can have up to 3 signals total (existing + new).");
      return;
    }

    setStagedNewSignals((p) => [...p, id]);
    toast.success(`Staged add ${findSignal(id)?.name ?? id}`);
  };

  const removeStagedNewSignal = (id: string) => {
    setStagedNewSignals((p) => p.filter((x) => x !== id));
  };

  // toggle mark for deletion of an existing config (staged)
  const toggleMarkDelete = (assetConfigID: string) => {
    setStagedConfigs((prev) =>
      prev.map((c) =>
        c.assetConfigID === assetConfigID ? { ...c, status: c.status === "toDelete" ? "unchanged" : "toDelete" } : c
      )
    );
  };

  // Delete config immediately (server)
  const deleteConfigImmediate = async (assetConfigID: string) => {
    if (!confirm("Delete this configuration?")) return;
    try {
      await apiAsset.delete(`/AssetConfig/${assetConfigID}`);
      toast.success("Configuration deleted.");
      await fetchConfigs();
    } catch (err: any) {
      console.error("Failed to delete config", err);
      toast.error("Failed to delete configuration.");
    }
  };

  // Final save: Deletes -> POST new signals array (no PUT)
  const handleSaveAll = async () => {
    if (activeCount === 0) {
      if (!confirm("You are about to remove all signals. Are you sure?")) return;
    }
    setSaving(true);

    const deletes = stagedConfigs.filter((c) => c.status === "toDelete");
    const creates = stagedNewSignals.slice();

    try {
      // 1) DELETE marked configs
      for (const d of deletes) {
        try {
          const res = await apiAsset.delete(`/AssetConfig/${d.assetConfigID}`);
          if (res.status < 200 || res.status >= 300) {
            throw new Error(`Delete HTTP ${res.status}`);
          }
        } catch (errDel: any) {
          console.error("Failed to delete", d, errDel);
          toast.error(`Failed to delete ${d.signalName}`);
        }
      }

      // 2) POST new signals (if any) as an array: { assetId, signals: [...] }
      if (creates.length > 0) {
        try {
          const payload = { assetId: asset.assetId, signals: creates };
          const res = await apiAsset.post("/AssetConfig", payload);
          if (res.status < 200 || res.status >= 300) {
            throw new Error(`POST HTTP ${res.status}`);
          }
        } catch (errPost: any) {
          console.error("Failed to create new configs", errPost);
          toast.error("Failed to create new signal(s).");
        }
      }

      toast.success("Saved changes.");
      await fetchConfigs();
      setStagedNewSignals([]);
      onClose();
    } catch (err: any) {
      console.error("Save all failed", err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[1000px] max-w-[98%]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-3">
            {asset.name} <span className="text-sm text-slate-500 font-normal">Configure</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchConfigs} title="Reload" disabled={loadingInitial}>
              <RefreshCw size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
          </div>
        </div>

       

        <div className="grid grid-cols-3 gap-4">
          {/* left: available signals table */}
          <div className="col-span-1">
            <p className="mb-2 font-medium">Available signals (click to add)</p>
            <div className="overflow-auto max-h-[320px] border rounded p-2">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Unit</th>
                    <th className="pb-2">Reg</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {SIGNALS.map((s) => {
                    // disabled prevents adding a signal that's already active (to avoid duplicates)
                    const disabled =
                      stagedNewSignals.includes(s.id) ||
                      stagedConfigs.some((c) => c.signalTypeID === s.id && c.status !== "toDelete") ||
                      activeCount >= 3;
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="py-2">{s.name}</td>
                        <td className="py-2">{s.unit}</td>
                        <td className="py-2">{s.register}</td>
                        <td className="py-2">
                          <button
                            onClick={() => addNewSignal(s.id)}
                            className={`px-2 py-1 rounded text-sm border ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100"}`}
                            disabled={disabled}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-slate-500">Total active (existing + staged): {activeCount}/3</div>
          </div>

          {/* middle: existing staged configs (editable) */}
          <div className="col-span-1">
            <p className="mb-2 font-medium">Existing configurations</p>
            <div className="overflow-auto max-h-[320px] space-y-2">
              {configsLoading ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : stagedConfigs.length === 0 ? (
                <div className="text-sm text-slate-500">No configurations yet.</div>
              ) : (
                stagedConfigs.map((c) => {
                  const isDeleted = c.status === "toDelete";
                  return (
                    <div key={c.assetConfigID} className={`flex items-center justify-between p-2 rounded border ${isDeleted ? "opacity-50 bg-red-50" : ""}`}>
                      <div>
                        <div className={`font-medium ${isDeleted ? "line-through" : ""}`}>{c.signalName}</div>
                        <div className="text-xs text-slate-500">{c.signalUnit} — Reg: {c.regsiterAdress}</div>
                        <div className="text-xs text-slate-400">ID: {c.assetConfigID.slice(0, 8)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMarkDelete(c.assetConfigID)}
                          className="px-2 py-1 border rounded text-sm flex items-center gap-1"
                          title={isDeleted ? "Undo remove" : "Remove"}
                        >
                          <Trash2 size={14} />
                          {isDeleted ? "Undo" : "Remove"}
                        </button>

                        {/* immediate delete (server) option */}
                        <button
                          onClick={() => deleteConfigImmediate(c.assetConfigID)}
                          className="px-2 py-1 text-sm underline text-rose-600"
                          title="Delete from server immediately"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* right: staged new signals + save */}
          <div className="col-span-1">
            <p className="mb-2 font-medium">Added signals (staged)</p>
            <div className="space-y-2 mb-4 max-h-[220px] overflow-auto">
              {stagedNewSignals.length === 0 ? (
                <div className="text-sm text-slate-500">No new signals staged.</div>
              ) : (
                stagedNewSignals.map((id) => {
                  const s = findSignal(id)!;
                  return (
                    <div key={id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.unit} — Reg: {s.register}</div>
                      </div>
                      <div>
                        <button onClick={() => removeStagedNewSignal(id)} className="text-sm underline">Remove</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => { setStagedNewSignals([]); setStagedConfigs((p) => p.map(c => ({ ...c, status: "unchanged" }))); }}>
                Reset Staging
              </Button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                {saving ? "Saving..." : "Save all changes"}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
