import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Factory,
  Layers,
  Wrench,
  Plus,
} from "lucide-react";
import { type Asset } from "@/types/asset";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssetTreeProps {
  assets: Asset[];
  selectedId: string | null;
  onSelect: (asset: Asset) => void;
  onAddRoot: () => void;
}

const AssetTreeNode = ({
  asset,
  selectedId,
  onSelect,
  searchTerm,
}: {
  asset: Asset;
  selectedId: string | null;
  onSelect: (asset: Asset) => void;
  searchTerm: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = asset.children && asset.children.length > 0;

  const getIcon = () => {
    switch (asset.type) {
      case "Company":
        return Building2;
      case "Plant":
        return Factory;
      case "Line":
        return Layers;
      case "Machine":
        return Wrench;
    }
  };

  const Icon = getIcon();
  const isSelected = selectedId === asset.id;

  const matchesSearch =
    searchTerm === "" ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.children?.some((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (!matchesSearch) return null;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm transition-colors",
          isSelected && "bg-primary/10 text-primary font-medium",
          asset.isDeleted && "opacity-50"
        )}
        onClick={() => onSelect(asset)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <Icon className="h-4 w-4" />
        <span className="text-sm">{asset.name}</span>

        {asset.isDeleted && (
          <span className="text-xs text-muted-foreground">(Deleted)</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6">
          {asset.children?.map((child) => (
            <AssetTreeNode
              key={child.id}
              asset={child}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AssetTree = ({
  assets,
  selectedId,
  onSelect,
  onAddRoot,
}: AssetTreeProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Asset Hierarchy</h2>
          <Button size="sm" className="h-8 gap-1" onClick={onAddRoot}>
            <Plus className="h-4 w-4" />
            Add Root
          </Button>
        </div>

        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Tree Body */}
      <div className="flex-1 overflow-auto p-2">
        {assets.map((asset) => (
          <AssetTreeNode
            key={asset.id}
            asset={asset}
            selectedId={selectedId}
            onSelect={onSelect}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
};
