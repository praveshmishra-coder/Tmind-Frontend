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
  Factory,
  Signal
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Addroot from "../AssetsHierarchy/Addroot";
import Addasset from "../AssetsHierarchy/Addasset";
import Editasset from "../AssetsHierarchy/Editasset";
import DeleteAsset from "@/AssetsHierarchy/DeleteAsset";
import { useAuth } from "@/context/AuthContext";
import levelToType from "./mapBackendAsset";
import { toast } from "react-toastify";
import ConfigureAsset from "@/AssetsHierarchy/ConfigureAsset";
import { Spinner } from "@/components/ui/spinner";

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

// Recursive function to check if asset or any child matches search
const matchesAssetOrChildren = (asset: BackendAsset, searchTerm: string): boolean => {
  if (asset.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
  return asset.childrens.some((child) => matchesAssetOrChildren(child, searchTerm));
};

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
  setAssetForConfig: (a: any) => void;
  setShowConfigureModal: (a: any) => void;
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
  setAssetForConfig,
  setShowConfigureModal
}: AssetTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = asset.childrens?.length > 0;
  const isSelected = selectedId === asset.assetId;

  // Updated search logic: check asset and its children
  const matchesSearch = searchTerm === "" || matchesAssetOrChildren(asset, searchTerm);
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
        className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm ${isSelected ? "bg-primary/10 text-primary font-medium" : ""
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
          <TooltipProvider>
            <div className="flex gap-1">

              {/* ADD */}
              {asset.level !== 5 && (
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent className="bg-white" side="top" align="center">
                    <p>Add Child Asset</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* EDIT */}
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent className="bg-white" side="top" align="center">
                  <p>Edit Asset</p>
                </TooltipContent>
              </Tooltip>

              {/* DELETE */}
              {!hasChildren && (
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent className="bg-white" side="top" align="center">
                    <p>Delete Asset</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* CONFIGURE SIGNALS */}
              {asset.level > 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssetForConfig(asset);
                        setShowConfigureModal(true);
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Signal className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white" side="top" align="center">
                    <p>Configure Signals</p>
                  </TooltipContent>
                </Tooltip>
              )}

            </div>
          </TooltipProvider>
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
              setShowConfigureModal={setShowConfigureModal}
              setAssetForConfig={setAssetForConfig}
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
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [assetForConfig, setAssetForConfig] = useState<any | null>(null);

  const { user, loading } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  if (loading) return <Spinner />;

  const handleConfirmDelete = () => {
    if (!assetToDelete) return;
    onDelete(assetToDelete);
    toast.success(`✅ "${assetToDelete.name}" deleted successfully`);
    setOpenDeleteDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
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
              setAssetForConfig={setAssetForConfig}
              setShowConfigureModal={setShowConfigureModal}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {showConfigureModal && assetForConfig && (
        <ConfigureAsset asset={assetForConfig} onClose={() => setShowConfigureModal(false)} />
      )}
      {showAddRootModal && <Addroot onClose={() => setShowAddRootModal(false)} onAdd={onAdd} />}
      {showAddAssetModal && assetForAdd && (
        <Addasset parentAsset={assetForAdd} onClose={() => setShowAddAssetModal(false)} onAdd={onAdd} />
      )}
      {showEditModal && assetForEdit && (
        <Editasset
        asset={assetForEdit}
        onClose={() => setShowEditModal(false)}
        onUpdated={() => {
        onAdd();           // refresh Asset Tree
        setShowEditModal(false);
        }}
        />
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
