import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {toast} from "react-toastify";


import { updateAsset } from "@/api/assetApi";

interface EditAssetProps {
  asset: any;      
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditAsset({ asset, onClose, onUpdated }: EditAssetProps) {
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  // load existing asset
  useEffect(() => {
    if (asset) {
      setFormData({ name: asset.name || "" });
    }
  }, [asset]);

  // validate
  const validateForm = () => {
    const trimmed = formData.name.trim();
    const regex = /^[A-Za-z][A-Za-z0-9_\- ]{2,99}$/;

    if (!trimmed) {
      toast.error("Asset Name is required.");
      return false;
    }

    if (!regex.test(trimmed)) {
      toast.error(
        "Asset Name must start with a letter, be 3–100 chars, and may contain letters, numbers, spaces, underscores, or hyphens."
      );
      return false;
    }

    return true;
  };

  // input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        assetId: asset.assetId,
        newName: formData.name.trim(),
      };

      console.log("Update Asset payload:", payload);

      await updateAsset(payload);

      toast.success("Asset updated successfully!");

      if (onUpdated) onUpdated();  
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      console.error("Error updating asset:", err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update Asset. Try again.";

      toast.error(message, { autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/30">
      <div className="w-[400px] max-h-[80vh] overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-left font-semibold">
              Edit Asset
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Name */}
              <div className="grid gap-2">
                <Label>Asset Name *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter new name"
                />
              </div>

              {/* Parent */}
              {asset?.parentName && (
                <div className="grid gap-2">
                  <Label>Parent Asset</Label>
                  <Input value={asset.parentName} disabled />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>

                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
