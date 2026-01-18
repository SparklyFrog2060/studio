"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Room, RoomProduct } from '@/app/lib/types';
import Header from '@/app/components/smart-space-planner/header';
import RoomList from '@/app/components/smart-space-planner/room-list';
import { useLocale } from '@/app/components/locale-provider';

export default function SmartSpacePlannerApp() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { t } = useLocale();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalCost = useMemo(() => {
    return rooms.reduce((total, room) => {
      return total + room.products.reduce((roomTotal, product) => roomTotal + product.price, 0);
    }, 0);
  }, [rooms]);

  const handleAddRoom = (name: string) => {
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name,
      products: [],
    };
    setRooms(prevRooms => [...prevRooms, newRoom]);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
  };

  const handleAddProductToRoom = (roomId: string, product: RoomProduct) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            products: [...room.products, { ...product, instanceId: crypto.randomUUID() }],
          };
        }
        return room;
      })
    );
  };

  const handleRemoveProductFromRoom = (roomId: string, instanceId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            products: room.products.filter(p => p.instanceId !== instanceId),
          };
        }
        return room;
      })
    );
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        totalCost={totalCost} 
        onAddRoom={handleAddRoom}
      />
      <main className="flex-grow p-4 md:p-8">
        <RoomList
          rooms={rooms}
          onDeleteRoom={handleDeleteRoom}
          onAddProductToRoom={handleAddProductToRoom}
          onRemoveProductFromRoom={handleRemoveProductFromRoom}
        />
        {rooms.length === 0 && (
          <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
             </div>
            <h2 className="text-2xl font-semibold text-foreground">{t.noRooms}</h2>
            <p className="mt-2">{t.clickToBegin}</p>
          </div>
        )}
      </main>
    </div>
  );
}
