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
  newName: string;
}


export interface UpdateAssetConfigPayload {
  signalName: string;
  signalAddress: string;
  signalType: string;
}

export interface SignalType {
  signalTypeID: string;
  signalName: string;
  signalUnit: string;
  defaultRegisterAdress: number;
  assetConfigurations: any[];
}


/* --------------------------------------------------------
    ASSET HIERARCHY APIS
-------------------------------------------------------- */

// GET ALL ASSET HIERARCHY
export const getAssetHierarchy = async () => {
  try {
    const res = await apiAsset.get("/AssetHierarchy/GetAssetHierarchy");
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to fetch asset hierarchy";
  }
};

// INSERT NEW ASSET
export const insertAsset = async (payload: InsertAssetRequest) => {
  try {
    const res = await apiAsset.post("/AssetHierarchy/InsertAsset", payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to insert asset";
  }
};

// GET CHILDREN ASSETS BY PARENT ID
export const getAssetsByParentId = async (parentId: string) => {
  try {
    const res = await apiAsset.get(`/AssetHierarchy/GetByParentId/${parentId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || `Failed to fetch children for parent ${parentId}`;
  }
};

// DELETE ASSET
export const deleteAsset = async (assetId: string) => {
  try {
    const res = await apiAsset.delete(`/AssetHierarchy/DeleteAsset/${assetId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data?.message || err.response?.data || `Failed to delete asset ${assetId}`;
  }
};

// UPDATE ASSET NAME
export const updateAsset = async (payload: UpdateAssetRequest) => {
  try {
    const res = await apiAsset.put(`/AssetHierarchy/UpdateAsset`, payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to update asset";
  }
};

// GET DELETED ASSETS
export const getDeletedAssets = async () => {
  try {
    const res = await apiAsset.get("/AssetHierarchy/Deleted");
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to fetch deleted assets";
  }
};

// RESTORE DELETED ASSET
export const restoreAssetById = async (assetId: string) => {
  try {
    const res = await apiAsset.post(`/AssetHierarchy/Restore/${assetId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || `Failed to restore asset ${assetId}`;
  }
};

/* --------------------------------------------------------
    ASSET CONFIG APIS
-------------------------------------------------------- */

// ADD ASSET CONFIG
export const addAssetConfig = async (payload: any) => {
  try {
    const res = await apiAsset.post("/AssetConfig", payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to add asset config";
  }
};

// GET SIGNALS + CONFIG FOR AN ASSET
export const getAssetConfig = async (assetId: string) => {
  try {
    const res = await apiAsset.get(`/AssetConfig/${assetId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || `Failed to fetch asset config for ${assetId}`;
  }
};

// UPDATE SIGNAL CONFIG FOR AN ASSET
export const updateAssetConfig = async (
  assetId: string,
  payload: UpdateAssetConfigPayload
) => {
  try {
    const res = await apiAsset.put(`/AssetConfig/${assetId}`, payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || `Failed to update asset config for ${assetId}`;
  }
};


export const getSignalTypes = async () => {
  try {
    const res = await apiAsset.get("/AssetConfig/SiganlTypes");
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err.message || "Failed to fetch signal types";
  }
};

export const getSignalOnAsset=async (assetID:string)=>{
  try{
    const res=await apiAsset.get(`/Mapping/${assetID}`);
    return res.data;
  }catch (err: any) {
    throw err.response?.data || err.message || "Failed to fetch signal types";
  }
}