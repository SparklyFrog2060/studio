import {
  Router,
  Thermometer,
  Tv2,
  Plug,
  PersonStanding,
  Wind,
  RectangleHorizontal,
  Waves,
  ToggleRight,
  Radio,
  Power,
  Speaker
} from 'lucide-react';
import type { Product } from '@/app/lib/types';

export const PRODUCTS: Product[] = [
  { id: 'ikea1', name: 'DIRIGERA Inteligentna bramka', price: 249, icon: Router, category: 'Bramki i Koncentratory' },
  { id: 'ikea2', name: 'TIMMERFLOTTE Czujnik temperatury/wilgotności', price: 39.99, icon: Thermometer, category: 'Czujniki' },
  { id: 'ikea3', name: 'BILRESA Pilot zdalnego sterowania', price: 29.99, icon: Tv2, category: 'Piloty i Przyciski' },
  { id: 'ikea4', name: 'TRETAKT Wtyczka, smart', price: 20, icon: Plug, category: 'Inteligentne Wtyczki' },
  { id: 'ikea5', name: 'MYGGSPRAY Bezprzewodowy czujnik ruchu', price: 39.99, icon: PersonStanding, category: 'Czujniki' },
  { id: 'ikea6', name: 'BILRESA Pilot (podwójny przycisk)', price: 24.99, icon: Tv2, category: 'Piloty i Przyciski' },
  { id: 'ikea7', name: 'ALPSTUGA Czujnik jakości powietrza', price: 149, icon: Wind, category: 'Czujniki' },
  { id: 'ikea8', name: 'MYGGBETT Czujnik do drzwi/okna', price: 39.99, icon: RectangleHorizontal, category: 'Czujniki' },
  { id: 'ikea9', name: 'KLIPPBOK Czujnik wycieku wody', price: 39.99, icon: Waves, category: 'Czujniki' },
  { id: 'ikea10', name: 'TRETAKT Wtyczka z pilotem', price: 39.99, icon: Plug, category: 'Zestawy' },
  { id: 'ikea11', name: 'STYRBAR Pilot zdalnego sterowania', price: 44.99, icon: Tv2, category: 'Piloty i Przyciski' },
  { id: 'ikea12', name: 'TRÅDFRI Zasilacz do sterowania (30W)', price: 130, icon: Power, category: 'Sterowniki' },
  { id: 'ikea13', name: 'RODRET Bezprzewodowy przyciemniacz', price: 29.99, icon: ToggleRight, category: 'Piloty i Przyciski' },
  { id: 'ikea14', name: 'PARASOLL Czujnik do drzwi/okna', price: 29.99, icon: RectangleHorizontal, category: 'Czujniki' },
  { id: 'ikea15', name: 'BADRING Czujnik wycieku wody', price: 26.99, icon: Waves, category: 'Czujniki' },
  { id: 'ikea16', name: 'SOMRIG Klawisz skrótu', price: 29.99, icon: Radio, category: 'Piloty i Przyciski' },
  { id: 'ikea17', name: 'TRÅDFRI Zasilacz do sterowania (10W)', price: 90, icon: Power, category: 'Sterowniki' },
  { id: 'ikea18', name: 'INSPELNING Wtyczka z monitorem energii', price: 29.99, icon: Plug, category: 'Inteligentne Wtyczki' },
  { id: 'ikea19', name: 'VINDSTYRKA Czujnik jakości powietrza', price: 119, icon: Wind, category: 'Czujniki' },
  { id: 'ikea20', name: 'SYMFONISK / DIRIGERA Pilot + bramka', price: 288.99, icon: Speaker, category: 'Zestawy' },
];