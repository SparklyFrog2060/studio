import { Timestamp } from 'firebase/firestore';

export interface Specification {
  id: string;
  name: string;
  value: string;
  evaluation: 'good' | 'medium' | 'bad';
}

export interface Sensor {
  id: string; // Document ID from firestore
  name: string;
  score: number;
  tags: string[];
  specs: Specification[];
  createdAt?: Timestamp;
}
