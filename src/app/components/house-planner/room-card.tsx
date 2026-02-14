
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer, ToggleRight, Mic, Pencil, Trash2, Coins, Lightbulb, Box, AlertTriangle as WarningIcon } from "lucide-react";
import type { Room, Sensor, Switch, VoiceAssistant, Lighting, OtherDevice, Connectivity, GatewayConnectivity } from "@/app/lib/types";
import { useLocale } from "../locale-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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

const PROTOCOLS_NEEDING_GATEWAY: Connectivity[] = ['zigbee', 'matter'];

interface MissingGatewayDetails {
  protocol: string;
  devices: { name: string }[];
}

export default function RoomCard({ room, sensors, switches, voiceAssistants, lighting, otherDevices, onEditRoom, onDeleteRoom, houseGatewayProtocols }: RoomCardProps) {
  const { t } = useLocale();
  const hasSensors = room.sensorIds && room.sensorIds.length > 0;
  const hasSwitches = room.switchIds && room.switchIds.length > 0;
  const hasAssistants = room.voiceAssistantIds && room.voiceAssistantIds.length > 0;
  const hasLighting = room.lightingIds && room.lightingIds.length > 0;
  const hasOtherDevices = room.otherDeviceIds && room.otherDeviceIds.length > 0;

  const checkMissingGateways = (deviceIds: string[] | undefined, allDevices: {id: string, name: string, connectivity: Connectivity}[]) => {
    if (!deviceIds || deviceIds.length === 0) return { hasMissing: false, missingDetails: [] };
    
    const devicesInRoom = allDevices.filter(d => deviceIds.includes(d.id));
    const missingGatewayInfo: { [protocol: string]: { name: string }[] } = {};

    devicesInRoom.forEach(device => {
        const protocol = device.connectivity;
        if (PROTOCOLS_NEEDING_GATEWAY.includes(protocol) && !houseGatewayProtocols.has(protocol as GatewayConnectivity)) {
            if (!missingGatewayInfo[protocol]) {
                missingGatewayInfo[protocol] = [];
            }
            missingGatewayInfo[protocol].push({ name: device.name });
        }
    });

    const detailsArray = Object.entries(missingGatewayInfo).map(([protocol, devices]) => ({
        protocol,
        devices,
    }));

    return { hasMissing: detailsArray.length > 0, missingDetails: detailsArray };
  };

  const { hasMissing: missingSensorGateway, missingDetails: missingSensorDetails } = useMemo(() => checkMissingGateways(room.sensorIds, sensors), [room.sensorIds, sensors, houseGatewayProtocols]);
  const { hasMissing: missingSwitchGateway, missingDetails: missingSwitchDetails } = useMemo(() => checkMissingGateways(room.switchIds, switches), [room.switchIds, switches, houseGatewayProtocols]);
  const { hasMissing: missingLightingGateway, missingDetails: missingLightingDetails } = useMemo(() => checkMissingGateways(room.lightingIds, lighting), [room.lightingIds, lighting, houseGatewayProtocols]);
  const { hasMissing: missingOtherDeviceGateway, missingDetails: missingOtherDeviceDetails } = useMemo(() => checkMissingGateways(room.otherDeviceIds, otherDevices), [room.otherDeviceIds, otherDevices, houseGatewayProtocols]);

  const allMissingDetails = useMemo(() => {
    const combined: { [protocol: string]: { name: string }[] } = {};

    const processDetails = (details: MissingGatewayDetails[]) => {
        details.forEach(({ protocol, devices }) => {
            if (!combined[protocol]) {
                combined[protocol] = [];
            }
            combined[protocol].push(...devices);
        });
    };

    processDetails(missingSensorDetails);
    processDetails(missingSwitchDetails);
    processDetails(missingLightingDetails);
    processDetails(missingOtherDeviceDetails);

    return Object.entries(combined).map(([protocol, devices]) => ({
        protocol,
        devices,
    }));
  }, [missingSensorDetails, missingSwitchDetails, missingLightingDetails, missingOtherDeviceDetails]);

  const formatMissingGatewayInfo = (details: MissingGatewayDetails[]): React.ReactNode => {
    if (details.length === 0) return null;
    
    return (
        <div>
            <p className="font-semibold mb-1">Wymagana bramka!</p>
            {details.map(({ protocol, devices }) => (
                <div key={protocol}>
                    <p>
                        <span className="font-medium capitalize">{protocol}:</span>{' '}
                        {devices.map(d => d.name).join(', ')}
                    </p>
                </div>
            ))}
        </div>
    );
  };
  
  const sensorTooltipContent = useMemo(() => formatMissingGatewayInfo(missingSensorDetails), [missingSensorDetails]);
  const switchTooltipContent = useMemo(() => formatMissingGatewayInfo(missingSwitchDetails), [missingSwitchDetails]);
  const lightingTooltipContent = useMemo(() => formatMissingGatewayInfo(missingLightingDetails), [missingLightingDetails]);
  const otherDeviceTooltipContent = useMemo(() => formatMissingGatewayInfo(missingOtherDeviceDetails), [missingOtherDeviceDetails]);

  const { totalPrice, shoppingPrice } = useMemo(() => {
    const allDevices = new Map([
      ...sensors.map(d => [d.id, d]),
      ...switches.map(d => [d.id, d]),
      ...voiceAssistants.map(d => [d.id, d]),
      ...lighting.map(d => [d.id, d]),
      ...otherDevices.map(d => [d.id, d]),
    ]);

    const allDeviceIdsInRoom = [
      ...(room.sensorIds || []),
      ...(room.switchIds || []),
      ...(room.voiceAssistantIds || []),
      ...(room.lightingIds || []),
      ...(room.otherDeviceIds || []),
    ];

    const totalPrice = allDeviceIdsInRoom.reduce((sum, id) => {
        const device = allDevices.get(id);
        return sum + (device?.price || 0);
    }, 0);

    const usedOwnedQuantities = new Map<string, number>();
    let shoppingPrice = 0;
    for (const deviceId of allDeviceIdsInRoom) {
        const device = allDevices.get(deviceId);
        if (!device) continue;
        
        const ownedQuantity = device.quantity || 0;
        const usedCount = usedOwnedQuantities.get(deviceId) || 0;

        if (usedCount < ownedQuantity) {
            usedOwnedQuantities.set(deviceId, usedCount + 1);
        } else {
            shoppingPrice += (device.price || 0);
        }
    }

    return { totalPrice, shoppingPrice };
  }, [room, sensors, switches, voiceAssistants, lighting, otherDevices]);
  
  const DeviceIconWithWarning = ({ hasDevice, isMissingGateway, IconComponent, color, tooltipContent }: any) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <IconComponent className={cn(
            'text-gray-300',
            hasDevice && color,
            isMissingGateway && '!text-yellow-500'
          )} />
          {isMissingGateway && (
              <div className="absolute -top-1 -right-1 rounded-full bg-card p-0.5">
                <WarningIcon className="h-3 w-3 text-yellow-500" />
              </div>
          )}
        </div>
      </TooltipTrigger>
      {isMissingGateway && (
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      )}
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => onEditRoom(room)}>
        <CardHeader className="flex-grow pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>{room.name}</CardTitle>
            {totalPrice > 0 && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-semibold text-md text-primary">
                  <Coins className="h-4 w-4" />
                  <span>{shoppingPrice.toFixed(2)} zł</span>
                </div>
                {shoppingPrice < totalPrice && (
                  <div className="text-xs text-muted-foreground">
                    Wartość: {totalPrice.toFixed(2)} zł
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        {allMissingDetails.length > 0 && (
            <CardContent className="pt-2 pb-2">
                <div className="p-2 rounded-md bg-destructive/10 text-destructive-foreground text-xs">
                    <p className="font-bold mb-1 text-yellow-600 dark:text-yellow-500">Wymagana bramka!</p>
                    {allMissingDetails.map(({ protocol, devices }) => (
                        <div key={protocol}>
                            <p className="text-yellow-700 dark:text-yellow-600">
                                <span className="font-semibold capitalize">{protocol}:</span>{' '}
                                {devices.map(d => d.name).join(', ')}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        )}

        <CardFooter className="flex justify-between items-center pt-4">
          <div className="flex gap-3">
            <DeviceIconWithWarning
              hasDevice={hasSensors}
              isMissingGateway={missingSensorGateway}
              IconComponent={Thermometer}
              color="text-yellow-400"
              tooltipContent={sensorTooltipContent}
            />
            <DeviceIconWithWarning
              hasDevice={hasSwitches}
              isMissingGateway={missingSwitchGateway}
              IconComponent={ToggleRight}
              color="text-green-500"
              tooltipContent={switchTooltipContent}
            />
            <Mic className={hasAssistants ? "text-blue-500" : "text-gray-300"} />
            <DeviceIconWithWarning
              hasDevice={hasLighting}
              isMissingGateway={missingLightingGateway}
              IconComponent={Lightbulb}
              color="text-orange-400"
              tooltipContent={lightingTooltipContent}
            />
            <DeviceIconWithWarning
              hasDevice={hasOtherDevices}
              isMissingGateway={missingOtherDeviceGateway}
              IconComponent={Box}
              color="text-purple-400"
              tooltipContent={otherDeviceTooltipContent}
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
    </TooltipProvider>
  );
}
