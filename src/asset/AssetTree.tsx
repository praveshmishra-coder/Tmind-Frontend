import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Wrench,
  Settings2,
  Plus,
  Factory,
} from "lucide-react";
import { type Asset } from "@/types/asset";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ✅ Correct import (matches your file name exactly)
import Addroot from "../AssetsHierarchy/Addroot";
import Addasset from "../AssetsHierarchy/Addasset";
import levelToType from "./mapBackendAsset"; // ✅ default import mapping

interface AssetTreeProps {
  assets: Asset[];
  selectedId: string | null;
  onSelect: (asset: Asset) => void;
  onConfig?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

const AssetTreeNode = ({
  asset,
  selectedId,
  onSelect,
  onConfig,
  onEdit,
  onDelete,
  setShowAddAssetModal,
  setAssetForAdd,
  searchTerm,
}: {
  asset: Asset;
  selectedId: string | null;
  onSelect: (asset: Asset) => void;
  onConfig?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  setShowAddAssetModal: (v: boolean) => void;
  setAssetForAdd: (a: Asset | null) => void;
  searchTerm: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = asset.children?.length > 0; // ✅ safe check

  const getIcon = () => {
    switch (asset.type) {
      case "Company":
        return Building2;
      case "Plant":
        return Factory;
      case "Department":
        return Building2;
      case "Line":
        return Layers;
      case "Machine":
        return Wrench;
      case "SubMachine":
        return Settings2;
      default:
        return Layers;
    }
  };

  const Icon = getIcon();
  const isSelected = selectedId === asset.id;

  const matchesSearch =
    searchTerm === "" ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase());

  if (!matchesSearch) return null;

  // Action buttons: depth-based
  const actions = asset.depth === 4
    ? [
        {
          icon: <Settings2 className="h-4 w-4" />,
          name: "Config",
          onClick: () => onConfig && onConfig(asset),
        },
        {
          icon: <Edit className="h-4 w-4" />,
          name: "Edit",
          onClick: () => onEdit && onEdit(asset),
        },
        {
          icon: <Trash2 className="h-4 w-4" />,
          name: "Delete",
          onClick: () => onDelete && onDelete(asset),
        },
      ]
    : [
        {
          icon: <Edit className="h-4 w-4" />,
          name: "Edit",
          onClick: () => onEdit && onEdit(asset),
        },
        {
          icon: <Plus className="h-4 w-4" />,
          name: "Add Sub-Asset",
          onClick: () => {
            setAssetForAdd(asset);
            setShowAddAssetModal(true);
          },
        },
        {
          icon: <Trash2 className="h-4 w-4" />,
          name: "Delete",
          onClick: () => onDelete && onDelete(asset),
        },
      ];

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm",
          isSelected && "bg-primary/10 text-primary font-medium",
          asset.isDeleted && "opacity-50"
        )}
      >
        {/* Left: expand icon + asset name */}
        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => onSelect(asset)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <div className="w-4" />}

          <Icon className="h-4 w-4" />
          <span className="text-sm">{asset.name}</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex gap-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="relative p-1 rounded hover:bg-gray-200"
            >
              {action.icon}
              <span
                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap 
                           bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 
                           pointer-events-none transition-opacity"
              >
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6">
          {asset.children.map((child) => (
            <AssetTreeNode
              key={child.id}
              asset={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onConfig={onConfig}
              onEdit={onEdit}
              onDelete={onDelete}
              setShowAddAssetModal={setShowAddAssetModal}
              setAssetForAdd={setAssetForAdd}
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
  onConfig,
  onEdit,
  onDelete,
}: AssetTreeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRootModal, setShowAddRootModal] = useState(false); // popup state

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Asset Hierarchy</h2>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setShowAddRootModal(true)}
          >
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

      <div className="flex-1 overflow-auto p-2">
        {assets.map((asset) => (
          <AssetTreeNode
            key={asset.id}
            asset={asset}
            selectedId={selectedId}
            onSelect={onSelect}
            onConfig={onConfig}
            onEdit={onEdit}
            onDelete={onDelete}
            setShowAddAssetModal={setShowAddAssetModal}
            setAssetForAdd={setAssetForAdd}
            searchTerm={searchTerm}
          />
        ))}
      </div>

      {showAddRootModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <Addroot onClose={() => setShowAddRootModal(false)} />
          </div>
        </div>
      )}

      {showAddAssetModal && assetForAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <Addasset
              parentAsset={assetForAdd}
              onClose={() => setShowAddAssetModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
