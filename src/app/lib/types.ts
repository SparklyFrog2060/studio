import type { LucideIcon } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  icon: LucideIcon;
  category: string;
}

export interface RoomProduct extends Product {
  instanceId: string;
}

export interface Room {
  id: string;
  name: string;
  products: RoomProduct[];
}
