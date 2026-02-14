import { Timestamp } from 'firebase/firestore';

export interface Specification {
  id: string;
  name: string;
  value: string;
  evaluation: 'good' | 'medium' | 'bad';
}

export type Connectivity = 'matter' | 'zigbee' | 'tuya' | 'other_app' | 'bluetooth';
export type GatewayConnectivity = 'matter' | 'zigbee' | 'bluetooth' | 'tuya';

export interface Sensor {
  id: string; // Document ID from firestore
  name: string;
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  connectivity: Connectivity;
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface Switch {
  id: string; // Document ID from firestore
  name: string;
  type: 'wall' | 'in-wall';
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  connectivity: Connectivity;
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface Lighting {
  id: string; // Document ID from firestore
  name: string;
  type: 'bulb' | 'lamp' | 'led_strip' | 'other';
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  connectivity: Connectivity;
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface OtherDevice {
  id: string; // Document ID from firestore
  name: string;
  type: 'washing_machine' | 'dishwasher' | 'tv' | 'speaker' | 'robot_vacuum' | 'air_purifier' | 'other';
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  connectivity: Connectivity;
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface VoiceAssistant {
  id: string; // Document ID from firestore
  name: string;
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  isGateway?: boolean;
  gatewayProtocols?: GatewayConnectivity[];
  createdAt?: Timestamp;
}

export interface Gateway {
  id: string; // Document ID from firestore
  name: string;
  brand: string;
  link?: string;
  price: number;
  priceEvaluation: 'good' | 'medium' | 'bad';
  connectivity: GatewayConnectivity[];
  homeAssistantCompatibility: number;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}

export interface Floor {
  id: string;
  name: string;
  createdAt?: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
  sensorIds: string[];
  switchIds: string[];
  voiceAssistantIds: string[];
  lightingIds: string[];
  otherDeviceIds: string[];
  createdAt?: Timestamp;
}

    