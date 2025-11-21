import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Settings2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Addroot from "../AssetsHierarchy/Addroot";
import Addasset from "../AssetsHierarchy/Addasset";
import ConfigureAsset from "../AssetsHierarchy/ConfigureAsset";
import Editasset from "../AssetsHierarchy/Editasset";
import DeleteAsset from "@/AssetsHierarchy/DeleteAsset";

import levelToType from "./mapBackendAsset"; // keep this (it uses level)
import { deleteAsset } from "@/api/assetApi";
import { toast } from "react-toastify";

interface BackendAsset {
  assetId: string;
  name: string;
  childrens: BackendAsset[];
  parentId: string | null;
  level: number;
  isDeleted: boolean;
}

// ------------------------------------------------------------------

interface AssetTreeNodeProps {
  asset: BackendAsset;
  selectedId: string | null;
  onSelect: (asset: BackendAsset) => void;
  onDelete?: (asset: BackendAsset) => void;
  searchTerm: string;

  setShowAddAssetModal: (v: boolean) => void;
  setAssetForAdd: (asset: BackendAsset | null) => void;

  setShowConfigureModal: (v: boolean) => void;
  setAssetForConfig: (asset: BackendAsset | null) => void;

  setShowEditModal: (v: boolean) => void;
  setAssetForEdit: (asset: BackendAsset | null) => void;

  setOpenDeleteDialog: (v: boolean) => void;
  setAssetToDelete: (asset: BackendAsset | null) => void;
}

const AssetTreeNode = ({
  asset,
  selectedId,
  onSelect,
  onDelete,
  searchTerm,

  setShowAddAssetModal,
  setAssetForAdd,

  setShowConfigureModal,
  setAssetForConfig,

  setShowEditModal,
  setAssetForEdit,

  setOpenDeleteDialog,
  setAssetToDelete,
}: AssetTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = asset.childrens?.length > 0;
  const isSelected = selectedId === asset.assetId;

  const matchesSearch =
    searchTerm === "" || asset.name.toLowerCase().includes(searchTerm.toLowerCase());
  if (!matchesSearch) return null;

  const assetType = levelToType(asset.level);
  const Icon =
    assetType === "Department"
      ? Building2
      : assetType === "Line"
      ? Layers
      : Wrench;

  const actions = [
    {
      icon: <Edit className="h-4 w-4" />,
      name: "Edit",
      onClick: () => {
        setAssetForEdit(asset);
        setShowEditModal(true);
      },
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
      onClick: () => {
        setAssetToDelete(asset);
        setOpenDeleteDialog(true);
      },
    },
  ];

  return (
    <div>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm ${
          isSelected ? "bg-primary/10 text-primary font-medium" : ""
        } ${asset.isDeleted ? "opacity-50" : ""}`}
      >
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
        </div>

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
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6">
          {asset.childrens.map((child) => (
            <AssetTreeNode
              key={child.assetId}
              asset={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              searchTerm={searchTerm}
              setShowAddAssetModal={setShowAddAssetModal}
              setAssetForAdd={setAssetForAdd}
              setShowConfigureModal={setShowConfigureModal}
              setAssetForConfig={setAssetForConfig}
              setShowEditModal={setShowEditModal}
              setAssetForEdit={setAssetForEdit}
              setOpenDeleteDialog={setOpenDeleteDialog}
              setAssetToDelete={setAssetToDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------

export const AssetTree = ({
  assets,
  selectedId,
  onSelect,
  onDelete,
}: {
  assets: BackendAsset[];
  selectedId: string | null;
  onSelect: (a: BackendAsset) => void;
  onDelete?: (a: BackendAsset) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddRootModal, setShowAddRootModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetForAdd, setAssetForAdd] = useState<BackendAsset | null>(null);

  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [assetForConfig, setAssetForConfig] = useState<BackendAsset | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [assetForEdit, setAssetForEdit] = useState<BackendAsset | null>(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<BackendAsset | null>(null);

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      await deleteAsset(assetToDelete.assetId);
      toast.success("Asset deleted successfully!");
      onDelete?.(assetToDelete);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete asset");
    }

    setOpenDeleteDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Asset Tree</h2>
          <Button size="sm" onClick={() => setShowAddRootModal(true)}>
            <Plus className="h-4 w-4" /> Add Root
          </Button>
        </div>

        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto p-2">
        {assets.map((asset) => (
          <AssetTreeNode
            key={asset.assetId}
            asset={asset}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
            searchTerm={searchTerm}
            setShowAddAssetModal={setShowAddAssetModal}
            setAssetForAdd={setAssetForAdd}
            setShowConfigureModal={setShowConfigureModal}
            setAssetForConfig={setAssetForConfig}
            setShowEditModal={setShowEditModal}
            setAssetForEdit={setAssetForEdit}
            setOpenDeleteDialog={setOpenDeleteDialog}
            setAssetToDelete={setAssetToDelete}
          />
        ))}
      </div>

      {/* Modals */}
      {showAddRootModal && (
        <Addroot onClose={() => setShowAddRootModal(false)} />
      )}

      {showAddAssetModal && assetForAdd && (
        <Addasset parentAsset={assetForAdd} onClose={() => setShowAddAssetModal(false)} />
      )}

      {showConfigureModal && assetForConfig && (
        <ConfigureAsset asset={assetForConfig} onClose={() => setShowConfigureModal(false)} />
      )}

      {showEditModal && assetForEdit && (
        <Editasset asset={assetForEdit} onClose={() => setShowEditModal(false)} />
      )}

      <DeleteAsset
        asset={assetToDelete}
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onDeleted={handleConfirmDelete}
      />
    </div>
  );
};
