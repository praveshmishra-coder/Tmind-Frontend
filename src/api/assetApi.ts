import apiAsset from "./axiosAsset";

/* --------------------------------------------------------
    TYPES
-------------------------------------------------------- */

// Asset Hierarchy
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

// Asset Config
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

// Mapping / Signals
export interface IMapping {
  mappingId: string;
  assetId: string;
  signalTypeId: string;
  deviceId: string;
  devicePortId: string;
  signalUnit: string;
  signalName: string;
  registerAdress: number;
  registerId: string;
  createdAt: string;
}

// Notifications
export interface Notification {
  notificationId: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

/* --------------------------------------------------------
    HELPER FOR API ERRORS
-------------------------------------------------------- */
const handleApiError = (err: any, defaultMsg: string) => {
  return err?.response?.data || err?.message || defaultMsg;
};

/* --------------------------------------------------------
    ASSET HIERARCHY APIS
-------------------------------------------------------- */
export const getAssetHierarchy = async (): Promise<Asset[]> => {
  try {
    const res = await apiAsset.get("/AssetHierarchy/GetAssetHierarchy");
    return res.data as Asset[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch asset hierarchy");
  }
};

export const insertAsset = async (payload: InsertAssetRequest) => {
  try {
    const res = await apiAsset.post("/AssetHierarchy/InsertAsset", payload);
    return res.data;
  } catch (err) {
    throw handleApiError(err, "Failed to insert asset");
  }
};

export const getAssetsByParentId = async (parentId: string): Promise<Asset[]> => {
  try {
    const res = await apiAsset.get(`/AssetHierarchy/GetByParentId/${parentId}`);
    return res.data as Asset[];
  } catch (err) {
    throw handleApiError(err, `Failed to fetch children for parent ${parentId}`);
  }
};

export const deleteAsset = async (assetId: string) => {
  try {
    const res = await apiAsset.delete(`/AssetHierarchy/DeleteAsset/${assetId}`);
    return res.data;
  } catch (err) {
    throw handleApiError(err, `Failed to delete asset ${assetId}`);
  }
};

export const updateAsset = async (payload: UpdateAssetRequest) => {
  try {
    const res = await apiAsset.put("/AssetHierarchy/UpdateAsset", payload);
    return res.data;
  } catch (err) {
    throw handleApiError(err, "Failed to update asset");
  }
};

export const getDeletedAssets = async (): Promise<Asset[]> => {
  try {
    const res = await apiAsset.get("/AssetHierarchy/Deleted");
    return res.data as Asset[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch deleted assets");
  }
};

export const restoreAssetById = async (assetId: string) => {
  try {
    const res = await apiAsset.post(`/AssetHierarchy/Restore/${assetId}`);
    return res.data;
  } catch (err) {
    throw handleApiError(err, `Failed to restore asset ${assetId}`);
  }
};

/* --------------------------------------------------------
    ASSET CONFIG APIS
-------------------------------------------------------- */
export const addAssetConfig = async (payload: any) => {
  try {
    const res = await apiAsset.post("/AssetConfig", payload);
    return res.data;
  } catch (err) {
    throw handleApiError(err, "Failed to add asset config");
  }
};

export const getAssetConfig = async (assetId: string) => {
  try {
    const res = await apiAsset.get(`/AssetConfig/${assetId}`);
    return res.data;
  } catch (err) {
    throw handleApiError(err, `Failed to fetch asset config for ${assetId}`);
  }
};

export const updateAssetConfig = async (
  assetId: string,
  payload: UpdateAssetConfigPayload
) => {
  try {
    const res = await apiAsset.put(`/AssetConfig/${assetId}`, payload);
    return res.data;
  } catch (err) {
    throw handleApiError(err, `Failed to update asset config for ${assetId}`);
  }
};

export const getSignalTypes = async (): Promise<SignalType[]> => {
  try {
    const res = await apiAsset.get("/AssetConfig/SiganlTypes");
    return res.data as SignalType[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch signal types");
  }
};

/* --------------------------------------------------------
    MAPPING / SIGNAL APIS
-------------------------------------------------------- */
export const getSignalOnAsset = async (assetId: string): Promise<IMapping[]> => {
  try {
    const res = await apiAsset.get(`/Mapping/${assetId}`);
    return res.data as IMapping[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch signals for asset");
  }
};

export const getMappingById = async (id: string): Promise<IMapping[]> => {
  try {
    const res = await apiAsset.get(`/Mapping/${id}`);
    return res.data as IMapping[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch mapping by ID");
  }
};

/* --------------------------------------------------------
    NOTIFICATIONS APIS
-------------------------------------------------------- */
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const res = await apiAsset.get("/Notifications/all");
    return res.data.data as Notification[];
  } catch (err) {
    throw handleApiError(err, "Failed to fetch notifications");
  }
};
