"use client";

import type { Room, RoomProduct } from '@/app/lib/types';
import RoomCard from './room-card';

interface RoomListProps {
  rooms: Room[];
  onDeleteRoom: (roomId: string) => void;
  onAddProductToRoom: (roomId: string, product: RoomProduct) => void;
  onRemoveProductFromRoom: (roomId: string, instanceId: string) => void;
}

export default function RoomList({ rooms, ...props }: RoomListProps) {
  if (rooms.length === 0) {
    return null;
  }
  
  return (
    <div className="grid gap-4 md:gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rooms.map(room => (
        <div key={room.id} className="animate-in fade-in-0 zoom-in-95 duration-300">
            <RoomCard room={room} {...props} />
        </div>
      ))}
    </div>
  );
}
