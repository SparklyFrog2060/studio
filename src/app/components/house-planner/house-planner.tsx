
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Floor, Room, Sensor, Switch, VoiceAssistant, Lighting, OtherDevice, Gateway, GatewayConnectivity, HouseConfig, RoomDevice, BaseDevice, RoomTemplate, FloorLayout } from "@/app/lib/types";
import { addFloor, deleteFloor, updateFloor } from "@/lib/firebase/floors";
import { addRoom, updateRoom, deleteRoom } from "@/lib/firebase/rooms";
import { updateHouseConfig } from "@/lib/firebase/house";
import { useLocale } from "@/app/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Wallet, Receipt, Router, Mic, Map as MapIcon, ListTree, Eye, EyeOff, PencilRuler, CaseUpper } from "lucide-react";
import AddFloorDialog from "./add-floor-dialog";
import AddRoomDialog from "./add-room-dialog";
import EditRoomDialog from "./edit-room-dialog";
import FloorSection from "./floor-section";
import ShoppingListDialog from "./shopping-list-dialog";
import type { View } from "@/app/sensor-creator-app";
import AddHouseGatewayDialog from "./add-house-gateway-dialog";
import { doc } from "firebase/firestore";
import MindMapView from "./mind-map-view";
import { addRoomTemplate } from "@/lib/firebase/room-templates";
import SaveRoomAsTemplateDialog from "./save-room-as-template-dialog";
import RoomCard from "./room-card";
import FloorPlan from "./floor-plan";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddRoomFromPlanDialog from "./add-room-from-plan-dialog";


interface ShoppingListItem {
  brand: string;
  baseName: string;
  customName: string;
  price: number;
  type: 'sensor' | 'switch' | 'voice-assistant' | 'lighting' | 'other-device' | 'gateway';
  link?: string;
}

interface HousePlannerProps {
    setActiveView: (view: View) => void;
}

type ActiveGatewayDevice = (Gateway | VoiceAssistant) & { roomName?: string };

export default function HousePlanner({ setActiveView }: HousePlannerProps) {
  const { t } = useLocale();
  const db = useFirestore();
  const { toast } = useToast();

  const { data: floors, isLoading: isLoadingFloors } = useCollection<Floor>(db ? "floors" : null, { sort: { field: "createdAt", direction: "asc" } });
  const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(db ? "rooms" : null, { sort: { field: "createdAt", direction: "asc" } });
  const { data: sensors } = useCollection<Sensor>(db ? "sensors" : null);
  const { data: switches } = useCollection<Switch>(db ? "switches" : null);
  const { data: voiceAssistants } = useCollection<VoiceAssistant>(db ? "voice_assistants" : null);
  const { data: lighting } = useCollection<Lighting>(db ? "lighting" : null);
  const { data: otherDevices } = useCollection<OtherDevice>(db ? "other_devices" : null);
  const { data: gateways } = useCollection<Gateway>(db ? "gateways" : null);
  const { data: roomTemplates, isLoading: isLoadingRoomTemplates } = useCollection<RoomTemplate>(db ? "room_templates" : null, { sort: { field: "createdAt", direction: "asc" } });
  const houseConfigDocRef = useMemo(() => (db ? doc(db, "house_config", "main") : null), [db]);
  const { data: houseConfig, isLoading: isLoadingHouseConfig } = useDoc<HouseConfig>(houseConfigDocRef);


  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isAddGatewayDialogOpen, setIsAddGatewayDialogOpen] = useState(false);
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToTemplate, setRoomToTemplate] = useState<Room | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [plannerView, setPlannerView] = useState<'list' | 'map' | 'plan'>('list');
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  useEffect(() => {
    if (floors && floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const allDevicesMap = useMemo(() => {
    const map = new Map<string, BaseDevice & {type: string}>();
    sensors?.forEach(d => map.set(d.id, {...d, type: 'sensor'}));
    switches?.forEach(d => map.set(d.id, {...d, type: 'switch'}));
    voiceAssistants?.forEach(d => map.set(d.id, {...d, type: 'voice-assistant'}));
    lighting?.forEach(d => map.set(d.id, {...d, type: 'lighting'}));
    otherDevices?.forEach(d => map.set(d.id, {...d, type: 'other-device'}));
    gateways?.forEach(d => map.set(d.id, {...d, type: 'gateway'}));
    return map;
  }, [sensors, switches, voiceAssistants, lighting, otherDevices, gateways]);

  const assignedGatewayIds = useMemo(() => houseConfig?.gatewayIds || [], [houseConfig]);

  const assignedGateways = useMemo(() => {
    if (!gateways || !assignedGatewayIds) return [];
    return gateways.filter(g => assignedGatewayIds.includes(g.id));
  }, [gateways, assignedGatewayIds]);

  const deviceToRoomMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!rooms) return map;
    for (const room of rooms) {
        for (const deviceInstance of room.devices || []) {
            map.set(deviceInstance.deviceId, room.name);
        }
    }
    return map;
  }, [rooms]);

  const activeGatewaysForDisplay = useMemo((): ActiveGatewayDevice[] => {
    const devices = new Map<string, ActiveGatewayDevice>();

    // 1. Add gateways assigned at the house level
    assignedGateways.forEach(gateway => {
        devices.set(gateway.id, {
            ...gateway,
            roomName: deviceToRoomMap.get(gateway.id)
        });
    });

    // 2. Add voice assistants with gateway capabilities that are in rooms
    if (voiceAssistants && rooms) {
        const roomDeviceInstances = rooms.flatMap(r => r.devices || []);

        roomDeviceInstances.forEach(instance => {
            const device = allDevicesMap.get(instance.deviceId);
            // Check if it's a voice assistant that is a gateway
            if (device?.type === 'voice-assistant' && (device as VoiceAssistant).isGateway) {
                // Avoid re-adding if it's already there, but update with room name
                if (!devices.has(device.id)) {
                    devices.set(device.id, {
                        ...(device as VoiceAssistant),
                        roomName: deviceToRoomMap.get(device.id)
                    });
                }
            }
        });
    }

    return Array.from(devices.values());
  }, [assignedGateways, voiceAssistants, rooms, allDevicesMap, deviceToRoomMap]);
  
  const houseGatewayProtocols = useMemo((): Set<GatewayConnectivity> => {
    const protocols = new Set<GatewayConnectivity>();
    activeGatewaysForDisplay.forEach(device => {
        const deviceProtocols = 'connectivity' in device ? device.connectivity : device.gatewayProtocols || [];
        deviceProtocols.forEach(p => protocols.add(p as GatewayConnectivity));
    });
    return protocols;
  }, [activeGatewaysForDisplay]);
  
  const shoppingListItems = useMemo((): ShoppingListItem[] => {
    const items: ShoppingListItem[] = [];
    const usedOwnedQuantities: { [key: string]: number } = {};

    // First pass: gather all non-owned devices from rooms
    (rooms || []).forEach(room => {
      (room.devices || []).forEach(instance => {
        if (!instance.isOwned) {
          const device = allDevicesMap.get(instance.deviceId);
          if (device) {
            items.push({
              brand: device.brand,
              baseName: device.name,
              customName: instance.customName,
              price: device.price || 0,
              type: device.type as ShoppingListItem['type'],
              link: device.link,
            });
          }
        } else {
            if (!usedOwnedQuantities[instance.deviceId]) {
                usedOwnedQuantities[instance.deviceId] = 0;
            }
            usedOwnedQuantities[instance.deviceId]++;
        }
      });
    });
    
    // Second pass: check house-level gateways
    (assignedGateways || []).forEach(gateway => {
        const totalOwned = gateway.quantity || 0;
        const totalUsed = usedOwnedQuantities[gateway.id] || 0;
        if(totalOwned <= totalUsed) {
            items.push({
                brand: gateway.brand,
                baseName: gateway.name,
                customName: gateway.name, 
                price: gateway.price || 0,
                type: 'gateway',
                link: gateway.link,
            });
        }
    });

    return items;
  }, [rooms, allDevicesMap, assignedGateways]);
  
  const totalHousePrice = useMemo(() => {
    return shoppingListItems.reduce((sum, item) => sum + item.price, 0);
  }, [shoppingListItems]);

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

  const handleUpdateFloorLayout = async (floorId: string, layout: FloorLayout) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await updateFloor(db, floorId, { layout });
      toast({ title: "Sukces!", description: "Plan piętra został zapisany." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zapisać planu piętra." });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteFloor = async (floorId: string) => {
    if (!db) return;
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

  const handleAddRoom = async (data: Omit<Room, "id" | "createdAt" | "devices" | "bounds">, templateId?: string) => {
    if (!db) return;
    setIsSaving(true);
    
    let devicesFromTemplate: RoomDevice[] = [];
    if (templateId) {
        const template = roomTemplates?.find(t => t.id === templateId);
        if (template) {
            devicesFromTemplate = template.devices.map(device => ({
                ...device,
                instanceId: crypto.randomUUID()
            }));
        }
    }
    
    const newRoomData = { ...data, devices: devicesFromTemplate };
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

  const handleAddRoomFromPlan = async (data: Omit<Room, "id" | "createdAt" | "devices">) => {
    if (!db) return;
    setIsSaving(true);
    const newRoomData = { ...data, devices: [] };
     try {
      await addRoom(db, newRoomData);
      toast({ title: "Sukces!", description: `Pomieszczenie "${data.name}" zostało dodane.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać pomieszczenia." });
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleUpdateRoom = async (roomId: string, data: Partial<Omit<Room, "id" | "createdAt" | "floorId">>) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await updateRoom(db, roomId, data);
      toast({ title: "Sukces!", description: `Pomieszczenie zostało zaktualizowane.` });
      setEditingRoom(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować pomieszczenia." });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleUpdateHouseGateways = async (gatewayIds: string[]) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await updateHouseConfig(db, gatewayIds);
      toast({ title: "Sukces!", description: "Bramki domu zostały zaktualizowane." });
      setIsAddGatewayDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować bramek." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenSaveAsTemplateDialog = (room: Room) => {
    setRoomToTemplate(room);
    setIsSaveAsTemplateDialogOpen(true);
  };

  const handleSaveRoomAsTemplate = async (data: { name: string }) => {
    if (!db || !roomToTemplate) return;
    setIsSaving(true);
    try {
      const templateData = {
        name: data.name,
        devices: roomToTemplate.devices.map(({ deviceId, customName, isOwned }) => ({
            instanceId: crypto.randomUUID(),
            deviceId,
            customName,
            isOwned
        })),
      };
      await addRoomTemplate(db, templateData);
      toast({ title: "Sukces!", description: `Szablon "${data.name}" został zapisany.` });
      setIsSaveAsTemplateDialogOpen(false);
      setRoomToTemplate(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zapisać szablonu." });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingFloors || isLoadingRooms || isLoadingHouseConfig || isLoadingRoomTemplates;
  const selectedFloor = useMemo(() => floors?.find(f => f.id === selectedFloorId), [floors, selectedFloorId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex w-full md:w-auto justify-between md:justify-start items-center gap-4">
            <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                    <span className="text-muted-foreground text-sm font-medium">{t.total}:</span>
                    <div className="text-2xl font-bold text-primary">{totalHousePrice.toFixed(2)} zł</div>
                </div>
            </div>
             <Button variant="outline" onClick={() => setIsShoppingListOpen(true)} disabled={totalHousePrice <= 0}>
              <Receipt className="mr-2 h-4 w-4" />
              {t.shoppingList}
            </Button>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-end items-center gap-2">
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button variant={plannerView === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPlannerView('list')}>
                    <ListTree className="mr-2 h-4 w-4" />
                    {t.floorView}
                </Button>
                <Button variant={plannerView === 'plan' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPlannerView('plan')}>
                    <PencilRuler className="mr-2 h-4 w-4" />
                    {t.planView}
                </Button>
                <Button variant={plannerView === 'map' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPlannerView('map')}>
                    <MapIcon className="mr-2 h-4 w-4" />
                    {t.mapView}
                </Button>
            </div>
            <Button onClick={() => setIsAddFloorDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.addFloor}
            </Button>
            <Button onClick={() => setIsAddRoomDialogOpen(true)} disabled={!floors || floors.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.addRoom}
            </Button>
            <Button onClick={() => setIsAddGatewayDialogOpen(true)}>
                <Router className="mr-2 h-4 w-4" />
                {t.manageHouseGateways}
            </Button>
        </div>
      </div>
      
      {activeGatewaysForDisplay.length > 0 && plannerView !== 'map' && (
        <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-3">{t.activeGateways}</h3>
            <div className="flex flex-wrap gap-4">
                {activeGatewaysForDisplay.map(device => (
                    <div key={device.id} className="flex items-center gap-3 p-2 rounded-md border bg-muted/40">
                         {'connectivity' in device ? <Router className="h-5 w-5 text-primary" /> : <Mic className="h-5 w-5 text-primary" />}
                         <div className="flex-grow">
                            <span className="font-semibold">{device.name}</span>
                            {device.roomName && <span className="text-xs text-muted-foreground ml-1">({device.roomName})</span>}
                         </div>
                         <div className="flex gap-1 flex-shrink-0">
                            {('connectivity' in device ? device.connectivity : device.gatewayProtocols || []).map(protocol => (
                                <Badge key={protocol} variant="secondary" className="capitalize">{protocol}</Badge>
                            ))}
                         </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground mt-20">Ładowanie...</div>
      ) : (
        <>
          {plannerView === 'list' && (
             floors && floors.length > 0 ? (
              <div className="space-y-8">
                {floors.map(floor => (
                  <FloorSection
                    key={floor.id}
                    floor={floor}
                    rooms={rooms?.filter(room => room.floorId === floor.id) || []}
                    allDevicesMap={allDevicesMap}
                    onEditRoom={(room) => setEditingRoom(room)}
                    onDeleteFloor={handleDeleteFloor}
                    onDeleteRoom={handleDeleteRoom}
                    onSaveAsTemplate={handleOpenSaveAsTemplateDialog}
                    houseGatewayProtocols={houseGatewayProtocols}
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
            )
          )}
          {plannerView === 'plan' && (
            floors && floors.length > 0 ? (
              <div className="space-y-4">
                <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                  <SelectTrigger className="w-full md:w-72">
                    <SelectValue placeholder={t.selectFloor} />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map(floor => (
                      <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFloor && (
                  <FloorPlan
                    key={selectedFloor.id}
                    floor={selectedFloor}
                    rooms={rooms?.filter(r => r.floorId === selectedFloor.id) || []}
                    allDevicesMap={allDevicesMap}
                    onSaveLayout={handleUpdateFloorLayout}
                    onAddRoom={handleAddRoomFromPlan}
                    onUpdateRoom={handleUpdateRoom}
                    isSaving={isSaving}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <PencilRuler className="text-primary h-10 w-10"/>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">{t.noFloors}</h2>
                <p className="mt-2">{t.clickToAddRoom}</p>
              </div>
            )
          )}
          {plannerView === 'map' && (
            <MindMapView
              floors={floors || []}
              rooms={rooms || []}
              allDevicesMap={allDevicesMap}
              activeGateways={activeGatewaysForDisplay}
            />
          )}
        </>
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
          onSubmit={(data, templateId) => handleAddRoom(data, templateId)}
          isSaving={isSaving}
          floors={floors}
          templates={roomTemplates || []}
        />
      )}

      <EditRoomDialog
        isOpen={!!editingRoom}
        onOpenChange={(isOpen) => !isOpen && setEditingRoom(null)}
        onSubmit={(data) => handleUpdateRoom(editingRoom!.id, data)}
        isSaving={isSaving}
        room={editingRoom}
        allDevicesMap={allDevicesMap}
        allRooms={rooms || []}
      />

      <ShoppingListDialog
        isOpen={isShoppingListOpen}
        onOpenChange={setIsShoppingListOpen}
        items={shoppingListItems}
        totalPrice={totalHousePrice}
      />

      <AddHouseGatewayDialog
        isOpen={isAddGatewayDialogOpen}
        onOpenChange={setIsAddGatewayDialogOpen}
        onSubmit={handleUpdateHouseGateways}
        isSaving={isSaving}
        allGateways={gateways || []}
        assignedGatewayIds={assignedGatewayIds}
      />

      <SaveRoomAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onOpenChange={setIsSaveAsTemplateDialogOpen}
        onSubmit={handleSaveRoomAsTemplate}
        isSaving={isSaving}
        room={roomToTemplate}
      />
    </div>
  );
}
