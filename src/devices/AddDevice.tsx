import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createDevice } from "@/api/deviceApi";
import { toast } from "react-toastify";

export default function AddDeviceForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    protocol: "ModbusTCP",
  });

  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });

  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- Validation ---------------- */

  const validate = () => {
    const newErrors = { name: "", description: "" };
    let valid = true;

    const trimmedName = formData.name.trim();
    const nameRegex = /^[A-Za-z][A-Za-z0-9_\- ]{2,99}$/;

    if (!trimmedName) {
      newErrors.name = "Device name is required.";
      valid = false;
    } else if (!nameRegex.test(trimmedName)) {
      newErrors.name =
        "Must start with a letter, 3–100 chars, allowed: letters, numbers, space, _ , -";
      valid = false;
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = "Description must be less than 255 characters.";
      valid = false;
    }

    setErrors(newErrors);
    setIsValid(valid);
  };

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  /* ---------------- Handlers ---------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        protocol: formData.protocol,
      };

      await createDevice(payload);

      toast.success(`Device "${payload.name}" created successfully!`);
      setTimeout(() => navigate("/devices"), 800);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        "Failed to create device.";

      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Add New Device
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Device Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter device name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/devices")}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={!isValid || loading}>
                {loading ? "Saving..." : "Save Device"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
