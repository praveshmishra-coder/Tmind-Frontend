import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { insertAsset } from "@/api/assetApi";

interface AddAssetProps {
  parentAsset?: any; // { assetId, name }
  onClose: () => void;
}

export default function AddAsset({ parentAsset, onClose }: AddAssetProps) {
  const [formData, setFormData] = useState({
    name: "",
  });

  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // ⭐ FINAL PAYLOAD (EXACTLY AS YOUR BACKEND WANTS)
      const payload = {
        name: formData.name.trim(),
        parentId: parentAsset ? parentAsset.assetId : null,
      };

      console.log("Insert Asset Payload:", payload);

      await insertAsset(payload);

      toast.success(`Asset "${payload.name}" created successfully!`);

      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error("Error creating asset:", err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create asset. Try again.";

      toast.error(message, { autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/30 backdrop-blur-sm">
      <div className="w-[400px] max-h-[80vh] overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center font-semibold">
              {parentAsset ? "Add Sub-Asset" : "Add Root Asset"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div className="grid gap-2">
                <Label>Asset Name *</Label>
                <Input
                  name="name"
                  placeholder="Enter Asset Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Parent (readonly) */}
              {parentAsset && (
                <div className="grid gap-2">
                  <Label>Parent Asset</Label>
                  <Input value={parentAsset.name} disabled />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>

                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ToastContainer />
      </div>
    </div>
  );
}
