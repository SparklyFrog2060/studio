
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer, ToggleRight, Mic, Pencil, Trash2, Coins, Lightbulb, Box, AlertTriangle as WarningIcon, Copy } from "lucide-react";
import type { Room, GatewayConnectivity, BaseDevice, Sensor, Switch, Lighting, OtherDevice } from "@/app/lib/types";
import { useLocale } from "../locale-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


interface RoomCardProps {
  room: Room;
  allDevicesMap: Map<string, BaseDevice & { type: string }>;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onSaveAsTemplate: (room: Room) => void;
  houseGatewayProtocols: Set<GatewayConnectivity>;
}

const PROTOCOLS_NEEDING_GATEWAY: string[] = ['zigbee', 'matter'];

interface MissingGatewayDetails {
  protocol: string;
  devices: { name: string }[];
}

const typeToColorClass: Record<string, string> = {
    'sensor': 'text-blue-500',
    'switch': 'text-green-500',
    'lighting': 'text-yellow-500',
    'other-device': 'text-purple-500',
    'voice-assistant': 'text-sky-500',
};

const DeviceIcon = ({ type, ...props }: {type: string} & React.ComponentProps<typeof Thermometer>) => {
    switch (type) {
        case 'sensor': return <Thermometer {...props} />;
        case 'switch': return <ToggleRight {...props} />;
        case 'lighting': return <Lightbulb {...props} />;
        case 'other-device': return <Box {...props} />;
        case 'voice-assistant': return <Mic {...props} />;
        default: return <Box {...props} />;
    }
};

export default function RoomCard({ room, allDevicesMap, onEditRoom, onDeleteRoom, onSaveAsTemplate, houseGatewayProtocols }: RoomCardProps) {
  const { t } = useLocale();

  const { devicesInRoom, missingGatewayDetails } = useMemo(() => {
    const devices = (room.devices || []).map(instance => {
      const baseDevice = allDevicesMap.get(instance.deviceId);
      return { ...instance, baseDevice };
    }).filter(item => item.baseDevice);

    const missingDetails: { [protocol: string]: { name: string }[] } = {};

    devices.forEach(({ baseDevice, customName }) => {
        if (!baseDevice) return;
        
        const connectivity = (baseDevice as any).connectivity;
        if (connectivity && PROTOCOLS_NEEDING_GATEWAY.includes(connectivity) && !houseGatewayProtocols.has(connectivity as GatewayConnectivity)) {
            if (!missingDetails[connectivity]) {
                missingDetails[connectivity] = [];
            }
            missingDetails[connectivity].push({ name: customName || baseDevice.name });
        }
    });

    return {
      devicesInRoom: devices,
      missingGatewayDetails: Object.entries(missingDetails).map(([protocol, devices]) => ({ protocol, devices }))
    };
  }, [room.devices, allDevicesMap, houseGatewayProtocols]);


  const { totalPrice, shoppingPrice } = useMemo(() => {
    const total = (room.devices || []).reduce((acc, instance) => {
        const device = allDevicesMap.get(instance.deviceId);
        return acc + (device?.price || 0);
    }, 0);

    const shopping = (room.devices || [])
        .filter(instance => !instance.isOwned)
        .reduce((acc, instance) => {
            const device = allDevicesMap.get(instance.deviceId);
            return acc + (device?.price || 0);
        }, 0);
    
    return { totalPrice: total, shoppingPrice: shopping };
  }, [room.devices, allDevicesMap]);
  
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
        
        {missingGatewayDetails.length > 0 && (
            <CardContent className="pt-2 pb-2">
                <div className="p-2 rounded-md bg-destructive/10 text-destructive-foreground text-xs">
                    <p className="font-bold mb-1 text-yellow-600 dark:text-yellow-500">Wymagana bramka!</p>
                    {missingGatewayDetails.map(({ protocol, devices }) => (
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

        <CardContent className="flex-grow pt-4">
            {devicesInRoom.length > 0 ? (
                <ul className="space-y-2">
                    {devicesInRoom.map(item => (
                        <li key={item.instanceId} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <DeviceIcon type={item.baseDevice!.type} className={cn("h-4 w-4 shrink-0", typeToColorClass[item.baseDevice!.type] || 'text-muted-foreground')} />
                                <span className="truncate" title={item.customName}>{item.customName}</span>
                            </div>
                            {!item.isOwned && item.baseDevice?.price != null && item.baseDevice.price > 0 && (
                                <span className="font-semibold text-primary/90 text-xs shrink-0 whitespace-nowrap">
                                    + {item.baseDevice.price.toFixed(2)} zł
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">{t.noDevicesAssigned}</p>
            )}
        </CardContent>


        <CardFooter className="flex justify-end items-center pt-4">
          <div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); onSaveAsTemplate(room); }}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">{t.saveAsTemplate}</span>
              </Button>
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
