
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ToggleRight, Mic, Pencil, Trash2, Coins } from "lucide-react";
import type { Room, Sensor, Switch, VoiceAssistant } from "@/app/lib/types";
import { useLocale } from "../locale-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RoomCardProps {
  room: Room;
  sensors: Sensor[];
  switches: Switch[];
  voiceAssistants: VoiceAssistant[];
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

export default function RoomCard({ room, sensors, switches, voiceAssistants, onEditRoom, onDeleteRoom }: RoomCardProps) {
  const { t } = useLocale();
  const hasSensors = room.sensorIds && room.sensorIds.length > 0;
  const hasSwitches = room.switchIds && room.switchIds.length > 0;
  const hasAssistants = room.voiceAssistantIds && room.voiceAssistantIds.length > 0;

  const roomPrice = useMemo(() => {
    const sensorPrice = room.sensorIds.reduce((sum, id) => {
        const device = sensors.find(s => s.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const switchPrice = room.switchIds.reduce((sum, id) => {
        const device = switches.find(s => s.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const assistantPrice = room.voiceAssistantIds.reduce((sum, id) => {
        const device = voiceAssistants.find(v => v.id === id);
        return sum + (device?.price || 0);
    }, 0);
    return sensorPrice + switchPrice + assistantPrice;
  }, [room, sensors, switches, voiceAssistants]);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => onEditRoom(room)}>
      <CardHeader className="flex-grow pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{room.name}</CardTitle>
          {roomPrice > 0 && (
              <div className="flex items-center gap-1 font-semibold text-md text-primary">
                  <Coins className="h-4 w-4" />
                  <span>{roomPrice.toFixed(2)} zł</span>
              </div>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between items-center pt-4">
        <div className="flex gap-3">
          <Lightbulb className={hasSensors ? "text-yellow-400" : "text-gray-300"} />
          <ToggleRight className={hasSwitches ? "text-green-500" : "text-gray-300"} />
          <Mic className={hasAssistants ? "text-blue-500" : "text-gray-300"} />
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
