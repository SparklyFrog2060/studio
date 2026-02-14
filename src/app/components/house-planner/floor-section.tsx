
"use client";

import { useLocale } from "@/app/components/locale-provider";
import type { Floor, Room, Sensor, Switch, VoiceAssistant } from "@/app/lib/types";
import RoomCard from "./room-card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FloorSectionProps {
  floor: Floor;
  rooms: Room[];
  onEditRoom: (room: Room) => void;
  onDeleteFloor: (floorId: string) => void;
  onDeleteRoom: (roomId: string) => void;
}

export default function FloorSection({ floor, rooms, onEditRoom, onDeleteFloor, onDeleteRoom }: FloorSectionProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{floor.name}</h2>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteConfirmation}</AlertDialogTitle>
                <AlertDialogDescription>Czy na pewno chcesz usunąć to piętro i wszystkie jego pomieszczenia?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteFloor(floor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.confirm}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      {rooms.length > 0 ? (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} onEditRoom={onEditRoom} onDeleteRoom={onDeleteRoom} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t.noRooms}</p>
      )}
    </div>
  );
}
