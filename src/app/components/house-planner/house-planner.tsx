
"use client";

import { useState } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Floor, Room, Sensor, Switch, VoiceAssistant } from "@/app/lib/types";
import { addFloor, deleteFloor } from "@/lib/firebase/floors";
import { addRoom, updateRoom, deleteRoom } from "@/lib/firebase/rooms";
import { useLocale } from "@/app/components/locale-provider";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import AddFloorDialog from "./add-floor-dialog";
import AddRoomDialog from "./add-room-dialog";
import EditRoomDialog from "./edit-room-dialog";
import FloorSection from "./floor-section";

export default function HousePlanner() {
  const { t } = useLocale();
  const db = useFirestore();
  const { toast } = useToast();

  const { data: floors, isLoading: isLoadingFloors } = useCollection<Floor>(db ? "floors" : null, { sort: { field: "createdAt", direction: "asc" } });
  const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(db ? "rooms" : null, { sort: { field: "createdAt", direction: "asc" } });
  const { data: sensors } = useCollection<Sensor>(db ? "sensors" : null);
  const { data: switches } = useCollection<Switch>(db ? "switches" : null);
  const { data: voiceAssistants } = useCollection<VoiceAssistant>(db ? "voice_assistants" : null);

  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddFloor = async (data: Omit<Floor, "id" | "createdAt">) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await addFloor(db, data);
      toast({ title: "Sukces!", description: `Piętro "${data.name}" zostało dodane.` });
      setIsAddFloorDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać piętra." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!db) return;
    // Also delete rooms on that floor
    const roomsToDelete = rooms?.filter(room => room.floorId === floorId) || [];
    try {
      await Promise.all(roomsToDelete.map(room => deleteRoom(db, room.id)));
      await deleteFloor(db, floorId);
      toast({ title: "Sukces!", description: "Piętro zostało usunięte." });
    } catch (error) {
        toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć piętra." });
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
      if (!db) return;
      try {
          await deleteRoom(db, roomId);
          toast({ title: "Sukces!", description: "Pomieszczenie zostało usunięte." });
      } catch (error) {
          toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć pomieszczenia." });
      }
  };

  const handleAddRoom = async (data: Omit<Room, "id" | "createdAt" | "sensorIds" | "switchIds" | "voiceAssistantIds">) => {
    if (!db) return;
    setIsSaving(true);
    const newRoomData = { ...data, sensorIds: [], switchIds: [], voiceAssistantIds: [] };
    try {
      await addRoom(db, newRoomData);
      toast({ title: "Sukces!", description: `Pomieszczenie "${data.name}" zostało dodane.` });
      setIsAddRoomDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać pomieszczenia." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateRoom = async (data: Omit<Room, "id" | "createdAt" | "floorId">) => {
    if (!db || !editingRoom) return;
    setIsSaving(true);
    try {
      await updateRoom(db, editingRoom.id, data);
      toast({ title: "Sukces!", description: `Pomieszczenie "${data.name}" zostało zaktualizowane.` });
      setEditingRoom(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować pomieszczenia." });
    } finally {
        setIsSaving(false);
    }
  };

  const isLoading = isLoadingFloors || isLoadingRooms;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setIsAddFloorDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t.addFloor}
        </Button>
        <Button onClick={() => setIsAddRoomDialogOpen(true)} disabled={!floors || floors.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t.addRoom}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground mt-20">Ładowanie...</div>
      ) : floors && floors.length > 0 ? (
        <div className="space-y-8">
          {floors.map(floor => (
            <FloorSection
              key={floor.id}
              floor={floor}
              rooms={rooms?.filter(room => room.floorId === floor.id) || []}
              onEditRoom={setEditingRoom}
              onDeleteFloor={handleDeleteFloor}
              onDeleteRoom={handleDeleteRoom}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="m9 15 3-3 3 3"></path></svg>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{t.noFloors}</h2>
            <p className="mt-2">Kliknij "Dodaj Piętro", aby rozpocząć.</p>
        </div>
      )}

      <AddFloorDialog
        isOpen={isAddFloorDialogOpen}
        onOpenChange={setIsAddFloorDialogOpen}
        onSubmit={handleAddFloor}
        isSaving={isSaving}
      />
      
      {floors && (
        <AddRoomDialog
          isOpen={isAddRoomDialogOpen}
          onOpenChange={setIsAddRoomDialogOpen}
          onSubmit={handleAddRoom}
          isSaving={isSaving}
          floors={floors}
        />
      )}

      <EditRoomDialog
        isOpen={!!editingRoom}
        onOpenChange={(isOpen) => !isOpen && setEditingRoom(null)}
        onSubmit={handleUpdateRoom}
        isSaving={isSaving}
        room={editingRoom}
        sensors={sensors || []}
        switches={switches || []}
        voiceAssistants={voiceAssistants || []}
      />
    </div>
  );
}
