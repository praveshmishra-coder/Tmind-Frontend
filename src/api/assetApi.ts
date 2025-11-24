import apiAsset from "./axiosAsset";

/* --------------------------------------------------------
    ASSET TYPES
-------------------------------------------------------- */

export interface Asset {
  assetId: string;
  name: string;
  level: number;
  isDeleted: boolean;
  childrens: Asset[];
}

export interface InsertAssetRequest {
  parentId: string | null;
  name: string;
  level: number;
}

export interface UpdateAssetRequest {
  assetId: string;
  name: string;
}

export interface UpdateAssetConfigPayload {
  signalName: string;
  signalAddress: string;
  signalType: string;
}

/* --------------------------------------------------------
    ASSET HIERARCHY APIS
-------------------------------------------------------- */

// GET ALL ASSET HIERARCHY
export const getAssetHierarchy = async () => {
  const res = await apiAsset.get("/AssetHierarchy/GetAssetHierarchy");
  return res.data;
};

// INSERT NEW ASSET
export const insertAsset = async (payload: InsertAssetRequest) => {
  const res = await apiAsset.post("/AssetHierarchy/InsertAsset", payload);
  return res.data;
};

// GET CHILDREN ASSETS BY PARENT ID
export const getAssetsByParentId = async (parentId: string) => {
  const res = await apiAsset.get(`/AssetHierarchy/GetByParentId/${parentId}`);
  return res.data;
};

// DELETE ASSET
export const deleteAsset = async (assetId: string) => {
  const res = await apiAsset.delete(`/AssetHierarchy/DeleteAsset/${assetId}`);
  return res.data;
};

// ⭐⭐⭐ UPDATE ASSET NAME (NEW) ⭐⭐⭐
export const updateAsset = async (payload: UpdateAssetRequest) => {
  const res = await apiAsset.put(`/AssetHierarchy/UpdateAsset`, payload);
  return res.data;
};

/* --------------------------------------------------------
    ASSET CONFIG APIS
-------------------------------------------------------- */

// ADD ASSET CONFIG
export const addAssetConfig = async (payload: any) => {
  const res = await apiAsset.post("/AssetConfig", payload);
  return res.data;
};

// GET SIGNALS + CONFIG FOR AN ASSET
export const getAssetConfig = async (assetId: string) => {
  const res = await apiAsset.get(`/AssetConfig/${assetId}`);
  return res.data;
};

// UPDATE SIGNAL CONFIG FOR AN ASSET
export const updateAssetConfig = async (
  assetId: string,
  payload: UpdateAssetConfigPayload
) => {
  const res = await apiAsset.put(`/AssetConfig/${assetId}`, payload);
  return res.data;
};
