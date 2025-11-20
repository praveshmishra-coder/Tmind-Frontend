import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddrootProps {
  onClose: () => void;
}

export default function Addroot({ onClose }: AddrootProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      setMessage("Please enter a valid asset name.");
      return;
    }

    // --- API call will come here ---
    // await createRootAsset({ name });

    setMessage(`Root asset "${name}" added successfully!`);
    setName("");

    // optional: auto-close popup after 1 sec
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Add Root Asset</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">Asset Name</label>
        <Input
          placeholder="Enter root asset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {message && (
        <p className="text-sm text-green-600 font-medium">{message}</p>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd}>Add</Button>
      </div>
    </div>
  );
}
