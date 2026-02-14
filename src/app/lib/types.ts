import { Timestamp } from 'firebase/firestore';

export interface Specification {
  id: string;
  name: string;
  value: string;
  evaluation: 'good' | 'medium' | 'bad';
}

export type Connectivity = 'matter' | 'zigbee' | 'tuya' | 'other_app' | 'bluetooth';

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
  createdAt?: Timestamp;
}
