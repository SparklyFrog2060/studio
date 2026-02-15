import { Timestamp } from 'firebase/firestore';

export interface Specification {
  id: string;
  name: string;
  value: string;
  evaluation: 'good' | 'medium' | 'bad';
}

export type Connectivity = 'matter' | 'zigbee' | 'tuya' | 'other_app' | 'bluetooth' | 'wifi';
export type GatewayConnectivity = 'matter' | 'zigbee' | 'bluetooth' | 'tuya';

export interface BaseDevice {
  id: string; // Document ID from firestore
  name: string;
  brand: string;
  link?: string;
  price: number;
  quantity?: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface Sensor extends BaseDevice {
  connectivity: Connectivity;
}

export interface Switch extends BaseDevice {
  type: 'wall' | 'in-wall';
  connectivity: Connectivity;
}

export interface Lighting extends BaseDevice {
  type: 'bulb' | 'lamp' | 'led_strip' | 'other';
  connectivity: Connectivity;
}

export interface OtherDevice extends BaseDevice {
  type: 'washing_machine' | 'dishwasher' | 'tv' | 'speaker' | 'robot_vacuum' | 'air_purifier' | 'other';
  connectivity: Connectivity;
}

export interface VoiceAssistant extends BaseDevice {
  isGateway?: boolean;
  gatewayProtocols?: GatewayConnectivity[];
}

export interface Gateway extends BaseDevice {
  connectivity: GatewayConnectivity[];
}

export interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface RoomDevice {
  instanceId: string;
  deviceId: string;
  customName: string;
  isOwned: boolean;
  x?: number;
  y?: number;
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
  devices: RoomDevice[];
  createdAt?: Timestamp;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FloorLayout {
  walls: Wall[];
}

export interface Floor {
  id: string;
  name: string;
  createdAt?: Timestamp;
  layout?: FloorLayout;
}

export interface RoomTemplate {
  id: string;
  name: string;
  devices: Omit<RoomDevice, 'x' | 'y'>[];
  createdAt?: Timestamp;
}

export interface HouseConfig {
  gatewayIds: string[];
}
