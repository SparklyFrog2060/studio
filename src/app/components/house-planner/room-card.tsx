
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer, ToggleRight, Mic, Pencil, Trash2, Coins, Lightbulb, Box, AlertTriangle as WarningIcon } from "lucide-react";
import type { Room, Sensor, Switch, VoiceAssistant, Lighting, OtherDevice, Connectivity, GatewayConnectivity } from "@/app/lib/types";
import { useLocale } from "../locale-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


interface RoomCardProps {
  room: Room;
  sensors: Sensor[];
  switches: Switch[];
  voiceAssistants: VoiceAssistant[];
  lighting: Lighting[];
  otherDevices: OtherDevice[];
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  houseGatewayProtocols: Set<GatewayConnectivity>;
}

const PROTOCOLS_NEEDING_GATEWAY: Connectivity[] = ['zigbee', 'tuya'];

export default function RoomCard({ room, sensors, switches, voiceAssistants, lighting, otherDevices, onEditRoom, onDeleteRoom, houseGatewayProtocols }: RoomCardProps) {
  const { t } = useLocale();
  const hasSensors = room.sensorIds && room.sensorIds.length > 0;
  const hasSwitches = room.switchIds && room.switchIds.length > 0;
  const hasAssistants = room.voiceAssistantIds && room.voiceAssistantIds.length > 0;
  const hasLighting = room.lightingIds && room.lightingIds.length > 0;
  const hasOtherDevices = room.otherDeviceIds && room.otherDeviceIds.length > 0;

  const checkMissingGateways = (deviceIds: string[] | undefined, allDevices: {id: string, connectivity: Connectivity}[]) => {
    if (!deviceIds || deviceIds.length === 0) return { hasMissing: false, missingProtocols: new Set<string>() };

    const devicesInRoom = allDevices.filter(d => deviceIds.includes(d.id));
    const neededProtocols = new Set<Connectivity>(
      devicesInRoom
        .map(d => d.connectivity)
        .filter(p => PROTOCOLS_NEEDING_GATEWAY.includes(p))
    );
    
    const missingProtocols = new Set<string>();
    neededProtocols.forEach(p => {
      if (!houseGatewayProtocols.has(p as GatewayConnectivity)) {
         missingProtocols.add(p);
      }
    });

    return { hasMissing: missingProtocols.size > 0, missingProtocols };
  };

  const { hasMissing: missingSensorGateway, missingProtocols: missingSensorProtocols } = useMemo(() => checkMissingGateways(room.sensorIds, sensors), [room.sensorIds, sensors, houseGatewayProtocols]);
  const { hasMissing: missingSwitchGateway, missingProtocols: missingSwitchProtocols } = useMemo(() => checkMissingGateways(room.switchIds, switches), [room.switchIds, switches, houseGatewayProtocols]);
  const { hasMissing: missingLightingGateway, missingProtocols: missingLightingProtocols } = useMemo(() => checkMissingGateways(room.lightingIds, lighting), [room.lightingIds, lighting, houseGatewayProtocols]);
  const { hasMissing: missingOtherDeviceGateway, missingProtocols: missingOtherDeviceProtocols } = useMemo(() => checkMissingGateways(room.otherDeviceIds, otherDevices), [room.otherDeviceIds, otherDevices, houseGatewayProtocols]);

  const formatMissingProtocols = (protocols: Set<string>): string => {
    if (protocols.size === 0) return '';
    const protocolList = Array.from(protocols).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    return `Wymagana bramka: ${protocolList}`;
  };

  const roomPrice = useMemo(() => {
    const sensorPrice = (room.sensorIds || []).reduce((sum, id) => {
        const device = sensors.find(s => s.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const switchPrice = (room.switchIds || []).reduce((sum, id) => {
        const device = switches.find(s => s.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const assistantPrice = (room.voiceAssistantIds || []).reduce((sum, id) => {
        const device = voiceAssistants.find(v => v.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const lightingPrice = (room.lightingIds || []).reduce((sum, id) => {
        const device = lighting.find(l => l.id === id);
        return sum + (device?.price || 0);
    }, 0);
    const otherDevicePrice = (room.otherDeviceIds || []).reduce((sum, id) => {
        const device = otherDevices.find(d => d.id === id);
        return sum + (device?.price || 0);
    }, 0);
    return sensorPrice + switchPrice + assistantPrice + lightingPrice + otherDevicePrice;
  }, [room, sensors, switches, voiceAssistants, lighting, otherDevices]);
  
  const DeviceIconWithWarning = ({ hasDevice, isMissingGateway, missingProtocols, IconComponent, color, tooltipText }: any) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <IconComponent className={cn(
            'text-gray-300',
            hasDevice && color,
            isMissingGateway && '!text-red-500'
          )} />
          {isMissingGateway && (
              <div className="absolute -top-1 -right-1 rounded-full bg-card p-0.5">
                <WarningIcon className="h-3 w-3 text-red-500" />
              </div>
          )}
        </div>
      </TooltipTrigger>
      {isMissingGateway && (
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );

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
          <DeviceIconWithWarning
            hasDevice={hasSensors}
            isMissingGateway={missingSensorGateway}
            IconComponent={Thermometer}
            color="text-yellow-400"
            tooltipText={formatMissingProtocols(missingSensorProtocols)}
          />
          <DeviceIconWithWarning
            hasDevice={hasSwitches}
            isMissingGateway={missingSwitchGateway}
            IconComponent={ToggleRight}
            color="text-green-500"
            tooltipText={formatMissingProtocols(missingSwitchProtocols)}
          />
          <Mic className={hasAssistants ? "text-blue-500" : "text-gray-300"} />
          <DeviceIconWithWarning
            hasDevice={hasLighting}
            isMissingGateway={missingLightingGateway}
            IconComponent={Lightbulb}
            color="text-orange-400"
            tooltipText={formatMissingProtocols(missingLightingProtocols)}
          />
          <DeviceIconWithWarning
            hasDevice={hasOtherDevices}
            isMissingGateway={missingOtherDeviceGateway}
            IconComponent={Box}
            color="text-purple-400"
            tooltipText={formatMissingProtocols(missingOtherDeviceProtocols)}
          />
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

    