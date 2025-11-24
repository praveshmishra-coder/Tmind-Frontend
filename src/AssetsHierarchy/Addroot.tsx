import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

// Backend API
import { insertAsset } from "@/api/assetApi";

interface AddRootProps {
  onClose: () => void;
  onAdd?: () => void;

}

export default function AddRoot({ onClose, onAdd }: AddRootProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const validateName = (value: string) => {
    const trimmed = value.trim();
    const regex = /^[A-Za-z][A-Za-z0-9_\- ]{2,99}$/;

    if (!trimmed) {
      toast.error("Asset name is required.");
      return false;
    }
    if (!regex.test(trimmed)) {
      toast.error(
        "Asset name must start with a letter, 3–100 chars, and may include letters, numbers, spaces, underscores, or hyphens."
      );
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateName(name)) return;

    setLoading(true);

    try {
      const payload = {
        parentId: null, // root has no parent
        name: name.trim(),
        level: 0, // root level always 0
      };

      console.log("API Payload:", payload);

      // Call backend API
      const response = await insertAsset(payload);

      toast.success(`Root asset "${payload.name}" added successfully!`);
      console.log("Insert API Response:", response);

      // Notify parent to update AssetTree
      if (onAdd) onAdd();

      setName("");
      setTimeout(() => onClose(), 700);
    } catch (err) {
      console.error("Error adding root asset:", err);
      toast.error("Failed to add root asset. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/30 backdrop-blur-sm">
      <div className="w-[400px] max-h-[80vh] overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              Add Root Asset
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter root asset name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>

                <Button onClick={handleAdd} disabled={loading}>
                  {loading ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}
