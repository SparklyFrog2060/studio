import { Lightbulb, Thermometer, Camera, Speaker, Tv, Router } from 'lucide-react';
import type { Product } from '@/app/lib/types';

export const PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Smart Bulb', price: 20, icon: Lightbulb, category: 'Lighting' },
  { id: 'prod2', name: 'Smart Thermostat', price: 150, icon: Thermometer, category: 'Climate' },
  { id: 'prod3', name: 'Security Camera', price: 100, icon: Camera, category: 'Security' },
  { id: 'prod4', name: 'Smart Speaker', price: 99, icon: Speaker, category: 'Entertainment' },
  { id: 'prod5', name: 'Smart TV 55"', price: 500, icon: Tv, category: 'Entertainment' },
  { id: 'prod6', name: 'Wi-Fi Router', price: 120, icon: Router, category: 'Infrastructure' },
];
