import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { type Asset } from "@/types/asset";

interface ConfigureAssetProps {
  asset: Asset;
  onClose: () => void;
}

const signalsList = [
  "Voltage - V",
  "Current - A",
  "Temperature - °C",
  "Frequency - Hz",
  "Vibration - mm/s",
  "FlowRate - L/min",
  "RPM - rpm",
  "Torque - N·m",
];

export default function ConfigureAsset({ asset, onClose }: ConfigureAssetProps) {
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);

  const handleSelect = (signal: string) => {
    if (selectedSignals.includes(signal)) {
      setSelectedSignals(selectedSignals.filter(s => s !== signal));
    } else {
      if (selectedSignals.length < 3) {
        setSelectedSignals([...selectedSignals, signal]);
      } else {
        alert("You can select only 3 signals.");
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{asset.name} - Configure</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
        </div>

        <div className="mt-4">
          <p className="mb-2 font-medium">Select up to 3 signals:</p>
          <div className="flex flex-col gap-2">
            {signalsList.map((signal) => (
              <Button
                key={signal}
                variant={selectedSignals.includes(signal) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(signal)}
              >
                {signal}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => alert(`Configured signals: ${selectedSignals.join(", ")}`)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> main
