
"use client";

import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ToggleRight, Mic, Pencil, Trash2 } from "lucide-react";
import type { Room } from "@/app/lib/types";
import { useLocale } from "../locale-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RoomCardProps {
  room: Room;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

export default function RoomCard({ room, onEditRoom, onDeleteRoom }: RoomCardProps) {
  const { t } = useLocale();
  const hasSensors = room.sensorIds && room.sensorIds.length > 0;
  const hasSwitches = room.switchIds && room.switchIds.length > 0;
  const hasAssistants = room.voiceAssistantIds && room.voiceAssistantIds.length > 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => onEditRoom(room)}>
      <CardHeader className="flex-grow">
        <CardTitle>{room.name}</CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-between items-center">
        <div className="flex gap-3">
          <Lightbulb className={hasSensors ? "text-yellow-400" : "text-muted-foreground"} />
          <ToggleRight className={hasSwitches ? "text-green-500" : "text-muted-foreground"} />
          <Mic className={hasAssistants ? "text-blue-500" : "text-muted-foreground"} />
        </div>
        <div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); onEditRoom(room); }}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t.edit}</span>
            </Button>
            <AlertDialog onOpenChange={(e) => e.valueOf() === false && e.preventDefault()}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t.delete}</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.deleteConfirmation}</AlertDialogTitle>
                    <AlertDialogDescription>Czy na pewno chcesz usunąć to pomieszczenie?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteRoom(room.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.confirm}</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
