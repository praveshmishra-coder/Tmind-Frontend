export type AssetType = 'Company' | 'Plant' | 'Line' | 'Machine';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  parentId: string | null;
  depth: number;
  path: string;
  description: string;
  createdAt: string;
  isDeleted: boolean;
  deviceId?: string;
  children?: Asset[];
}

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  protocol: 'Modbus TCP' | 'Modbus RTU';
  port: number;
  description: string;
}

export interface Port {
  id: string;
  deviceId: string;
  portNumber: number;
  name: string;
}

export interface Register {
  id: string;
  portId: string;
  address: number;
  name: string;
  dataType: string;
}

export interface Signal {
  id: string;
  registerId: string;
  name: string;
  unit: string;
  scaleFactor: number;
  offset: number;
  portNumber: number;
  registerAddress: number;
  thresholds?: {
    min?: number;
    max?: number;
    enabled: boolean;
  };
}

export interface LiveSignalData {
  signalId: string;
  signalName: string;
  portNumber: number;
  registerAddress: number;
  rawValue: number;
  scaledValue: number;
  unit: string;
  timestamp: string;
}
