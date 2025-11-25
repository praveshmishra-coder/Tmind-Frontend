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
  Factory
} from "lucide-react";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Addroot from "../AssetsHierarchy/Addroot";
import Addasset from "../AssetsHierarchy/Addasset";
import Editasset from "../AssetsHierarchy/Editasset";
import DeleteAsset from "@/AssetsHierarchy/DeleteAsset";
import { useAuth } from "@/context/AuthContext";
import levelToType from "./mapBackendAsset";
import { toast } from "react-toastify";


export interface BackendAsset {
  assetId: string;
  name: string;
  childrens: BackendAsset[];
  parentId: string | null;
  level: number;
  isDeleted: boolean;
}


export const addAssetToTree = (
  list: BackendAsset[],
  parentId: string | null,
  newAsset: BackendAsset
): BackendAsset[] => {
  if (parentId === null) return [...list, newAsset];

  return list.map((asset) =>
    asset.assetId === parentId
      ? { ...asset, childrens: [...asset.childrens, newAsset] }
      : { ...asset, childrens: addAssetToTree(asset.childrens, parentId, newAsset) }
  );
};

export const removeAssetById = (assets: BackendAsset[], id: string): BackendAsset[] =>
  assets
    .filter((a) => a.assetId !== id)
    .map((a) => ({ ...a, childrens: removeAssetById(a.childrens, id) }));


interface AssetTreeNodeProps {
  asset: BackendAsset;
  selectedId: string | null;
  onSelect: (a: BackendAsset) => void;
  searchTerm: string;
  setShowAddAssetModal: (v: boolean) => void;
  setAssetForAdd: (a: BackendAsset) => void;
  setShowEditModal: (v: boolean) => void;
  setAssetForEdit: (a: BackendAsset) => void;
  setOpenDeleteDialog: (v: boolean) => void;
  setAssetToDelete: (a: BackendAsset) => void;
  isAdmin: boolean;
}

const AssetTreeNode = ({
  asset,
  selectedId,
  onSelect,
  searchTerm,
  setShowAddAssetModal,
  setAssetForAdd,
  setShowEditModal,
  setAssetForEdit,
  setOpenDeleteDialog,
  setAssetToDelete,
  isAdmin,
}: AssetTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = asset.childrens?.length > 0;
  const isSelected = selectedId === asset.assetId;

  const matchesSearch =
    searchTerm === "" || asset.name.toLowerCase().includes(searchTerm.toLowerCase());
  if (!matchesSearch) return null;

  const assetType = levelToType(asset.level);
  const Icon =
    assetType === "Plant"
      ? Factory
      : assetType === "Department"
      ? Building2
      : assetType === "Line"
      ? Layers
      : Wrench;

  return (
    <div>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm ${
          isSelected ? "bg-primary/10 text-primary font-medium" : ""
        } ${asset.isDeleted ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-2 flex-1" onClick={() => onSelect(asset)}>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <Icon className="h-4 w-4" />
          <span className="text-sm">{asset.name}</span>
        </div>

        {isAdmin && (
          <div className="flex gap-1">
            {asset.level !== 5 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssetForAdd(asset);
                  setShowAddAssetModal(true);
                }}
                className="p-1 rounded hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setAssetForEdit(asset);
                setShowEditModal(true);
              }}
              className="p-1 rounded hover:bg-gray-200"
            >
              <Edit className="h-4 w-4" />
            </button>

            {!hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssetToDelete(asset);
                  setOpenDeleteDialog(true);
                }}
                className="p-1 rounded hover:bg-red-200 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6">
          {asset.childrens.map((child) => (
            <AssetTreeNode
              key={child.assetId}
              asset={child}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
              setShowAddAssetModal={setShowAddAssetModal}
              setAssetForAdd={setAssetForAdd}
              setShowEditModal={setShowEditModal}
              setAssetForEdit={setAssetForEdit}
              setOpenDeleteDialog={setOpenDeleteDialog}
              setAssetToDelete={setAssetToDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------------
// Main Tree Component
// -------------------------
interface AssetTreeProps {
  assets: BackendAsset[];
  selectedId: string | null;
  onSelect: (a: BackendAsset) => void;
  onAdd: (newAsset: BackendAsset) => void;
  onDelete: (a: BackendAsset) => void;
}

export const AssetTree = ({ assets, selectedId, onSelect, onAdd, onDelete }: AssetTreeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRootModal, setShowAddRootModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetForAdd, setAssetForAdd] = useState<BackendAsset | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assetForEdit, setAssetForEdit] = useState<BackendAsset | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<BackendAsset | null>(null);

  const { user, loading } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Prevent rendering until auth is loaded
  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  // -------------------------
  // Handle Delete
  // -------------------------
  const handleConfirmDelete = () => {
    if (!assetToDelete) return;
    onDelete(assetToDelete);
    toast.success(`✅ "${assetToDelete.name}" deleted successfully`);
    setOpenDeleteDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header + Search */}
      <div className="p-4 border-b flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Asset Tree</h2>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAddRootModal(true)}>
              <Plus className="h-4 w-4" /> Add Root
            </Button>
          )}
        </div>
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {assets.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No assets found</p>
        ) : (
          assets.map((asset) => (
            <AssetTreeNode
              key={asset.assetId}
              asset={asset}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
              setShowAddAssetModal={setShowAddAssetModal}
              setAssetForAdd={setAssetForAdd}
              setShowEditModal={setShowEditModal}
              setAssetForEdit={setAssetForEdit}
              setOpenDeleteDialog={setOpenDeleteDialog}
              setAssetToDelete={setAssetToDelete}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showAddRootModal && <Addroot onClose={() => setShowAddRootModal(false)} onAdd={onAdd} />}
      {showAddAssetModal && assetForAdd && (
        <Addasset parentAsset={assetForAdd} onClose={() => setShowAddAssetModal(false)} onAdd={onAdd} />
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
