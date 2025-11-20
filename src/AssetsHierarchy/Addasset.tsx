import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
//import { createAsset } from "@/api/assetApi";   // ✅ ASSET API

export default function AddAsset() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentAsset: "",
  });

  const [loading, setLoading] = useState(false);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  const validateForm = () => {
    const { name, description } = formData;
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

    if (description && description.length > 255) {
      toast.error("Description must be less than 255 characters.");
      return false;
    }

    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // -------------------------------
  // SUBMIT HANDLER
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        parentAsset: formData.parentAsset || null,
      };

      console.log("Creating asset with:", payload);

      const response = await createAsset(payload); // ✅ FIXED API CALL

      toast.success(`Asset "${payload.name}" created successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });

      setTimeout(() => navigate("/assets"), 800);
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
    <div className="flex justify-center items-center min-h-[80vh] bg-background text-foreground">
      <Card className="w-full max-w-xl shadow-lg border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Add New Asset
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Parent Asset */}
            <div className="grid gap-2">
              <Label htmlFor="parentAsset">Parent Asset</Label>
              <Input
                id="parentAsset"
                name="parentAsset"
                type="text"
                placeholder="Enter Parent Asset ID or Name"
                value={formData.parentAsset}
                onChange={handleChange}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/assets")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Asset"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
