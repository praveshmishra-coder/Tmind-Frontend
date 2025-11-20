import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { createAsset } from "@/api/assetApi";

interface AddAssetProps {
  parentAsset?: any;
  onClose: () => void;
}

export default function AddAsset({ parentAsset, onClose }: AddAssetProps) {
  const [formData, setFormData] = useState({
    name: "",
    parentAsset: parentAsset?.id || "",
  });

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const { name } = formData;
    const trimmedName = name.trim();
    const nameRegex = /^[A-Za-z][A-Za-z0-9_\- ]{2,99}$/;

    if (!trimmedName) {
      toast.error("Asset Name is required.");
      return false;
    }

    if (!nameRegex.test(trimmedName)) {
      toast.error(
        "Asset Name must start with a letter, be 3–100 chars, and may contain letters, numbers, spaces, underscores, or hyphens."
      );
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        parentAsset: formData.parentAsset || null,
      };

      console.log("Creating asset with:", payload);

      // const response = await createAsset(payload);

      toast.success(`Asset "${payload.name}" created successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });

      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error("Error creating asset:", err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create Asset. Try again.";

      toast.error(message, { autoClose: 4000, theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999]">
      <div className="w-[400px] max-h-[80vh] overflow-auto">
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              Add {parentAsset ? "Sub-Asset" : "Root Asset"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
              {/* Asset Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter Asset name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Parent Asset */}
              {parentAsset && (
                <div className="grid gap-2">
                  <Label htmlFor="parentAsset">Parent Asset</Label>
                  <Input
                    id="parentAsset"
                    name="parentAsset"
                    type="text"
                    value={parentAsset.name}
                    disabled
                  />
                </div>
              )}

              {/* Buttons */}
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

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </div>
  );
}
  