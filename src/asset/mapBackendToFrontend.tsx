import { type Asset } from "@/types/asset";

interface BackendAsset {
  assetId: string;
  name: string;
  childrens: BackendAsset[];
  parentId: string | null;
  level: number;
  isDeleted: boolean;
}

export function transformHierarchy(data: BackendAsset[]): Asset[] {
  const mapNode = (node: BackendAsset): Asset => {
    return {
      id: node.assetId,
      name: node.name,
      level: node.level,
      isDeleted: node.isDeleted,
      parentId: node.parentId,
      children: node.childrens?.map(mapNode) || [],   // FIX
    };
  };

  return data.map(mapNode);
}
