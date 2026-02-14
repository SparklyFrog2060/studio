
"use client";

import { useState, useMemo } from "react";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Floor, Room, Sensor, Switch, VoiceAssistant, Lighting, OtherDevice, Gateway, GatewayConnectivity, Connectivity, HouseConfig } from "@/app/lib/types";
import { addFloor, deleteFloor } from "@/lib/firebase/floors";
import { addRoom, updateRoom, deleteRoom } from "@/lib/firebase/rooms";
import { updateHouseConfig } from "@/lib/firebase/house";
import { useLocale } from "@/app/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Wallet, Receipt, Router, Mic, Map, List } from "lucide-react";
import AddFloorDialog from "./add-floor-dialog";
import AddRoomDialog from "./add-room-dialog";
import EditRoomDialog from "./edit-room-dialog";
import FloorSection from "./floor-section";
import ShoppingListDialog from "./shopping-list-dialog";
import type { View } from "@/app/sensor-creator-app";
import AddHouseGatewayDialog from "./add-house-gateway-dialog";
import { doc } from "firebase/firestore";
import MindMapView from "./mind-map-view";


interface ShoppingListItem {
  name: string;
  price: number;
  type: 'Sensor' | 'Switch' | 'VoiceAssistant' | 'Lighting' | 'OtherDevice' | 'Gateway';
  link?: string;
}

interface HousePlannerProps {
    setActiveView: (view: View) => void;
}

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
  const houseConfigDocRef = useMemo(() => (db ? doc(db, "house_config", "main") : null), [db]);
  const { data: houseConfig, isLoading: isLoadingHouseConfig } = useDoc<HouseConfig>(houseConfigDocRef);


  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isAddGatewayDialogOpen, setIsAddGatewayDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [plannerView, setPlannerView] = useState<'list' | 'map'>('list');


  const assignedGatewayIds = useMemo(() => houseConfig?.gatewayIds || [], [houseConfig]);

  const neededProtocols = useMemo((): Set<GatewayConnectivity> => {
    const protocolSet = new Set<GatewayConnectivity>();
    if (!rooms || !sensors || !switches || !lighting || !otherDevices) return protocolSet;

    const allAssignedSensorIds = new Set(rooms.flatMap(r => r.sensorIds || []));
    const allAssignedSwitchIds = new Set(rooms.flatMap(r => r.switchIds || []));
    const allAssignedLightingIds = new Set(rooms.flatMap(r => r.lightingIds || []));
    const allAssignedOtherDeviceIds = new Set(rooms.flatMap(r => r.otherDeviceIds || []));

    const checkProtocols = (devices: {id: string, connectivity: Connectivity}[], assignedIds: Set<string>) => {
      devices?.forEach(device => {
        if (assignedIds.has(device.id)) {
          if (device.connectivity === 'zigbee' || device.connectivity === 'matter') {
            protocolSet.add(device.connectivity);
          }
        }
      });
    };

    checkProtocols(sensors || [], allAssignedSensorIds);
    checkProtocols(switches || [], allAssignedSwitchIds);
    checkProtocols(lighting || [], allAssignedLightingIds);
    checkProtocols(otherDevices || [], allAssignedOtherDeviceIds);

    return protocolSet;
  }, [rooms, sensors, switches, lighting, otherDevices]);

  const assignedGateways = useMemo(() => {
    if (!gateways || !assignedGatewayIds) return [];
    return gateways.filter(g => assignedGatewayIds.includes(g.id));
  }, [gateways, assignedGatewayIds]);

  const activeGatewaysForDisplay = useMemo(() => {
    const devices: (Gateway | VoiceAssistant)[] = [...assignedGateways];

    const assignedAssistantIds = new Set(rooms?.flatMap(r => r.voiceAssistantIds || []) || []);
    if (voiceAssistants) {
        const assignedAssistants = voiceAssistants.filter(va => va.isGateway && assignedAssistantIds.has(va.id));
        devices.push(...assignedAssistants);
    }

    return Array.from(new Map(devices.map(d => [d.id, d])).values());
  }, [assignedGateways, voiceAssistants, rooms]);
  
  const houseGatewayProtocols = useMemo((): Set<GatewayConnectivity> => {
    const protocols = new Set<GatewayConnectivity>();
    
    activeGatewaysForDisplay.forEach(device => {
        const deviceProtocols = 'connectivity' in device ? device.connectivity : device.gatewayProtocols || [];
        deviceProtocols.forEach(p => protocols.add(p as GatewayConnectivity));
    });

    return protocols;
  }, [activeGatewaysForDisplay]);
  
  const shoppingListItems = useMemo((): ShoppingListItem[] => {
    if (!rooms || !sensors || !switches || !voiceAssistants || !lighting || !otherDevices || !gateways) return [];

    const allAssignedSensorIds = new Set(rooms.flatMap(r => r.sensorIds || []));
    const allAssignedSwitchIds = new Set(rooms.flatMap(r => r.switchIds || []));
    const allAssignedAssistantIds = new Set(rooms.flatMap(r => r.voiceAssistantIds || []));
    const allAssignedLightingIds = new Set(rooms.flatMap(r => r.lightingIds || []));
    const allAssignedOtherDeviceIds = new Set(rooms.flatMap(r => r.otherDeviceIds || []));

    const assignedSensors = sensors
        .filter(s => allAssignedSensorIds.has(s.id))
        .map(s => ({ name: s.name, price: s.price || 0, type: 'Sensor' as const, link: s.link }));

    const assignedSwitches = switches
        .filter(s => allAssignedSwitchIds.has(s.id))
        .map(s => ({ name: s.name, price: s.price || 0, type: 'Switch' as const, link: s.link }));
    
    const assignedAssistants = voiceAssistants
        .filter(v => allAssignedAssistantIds.has(v.id))
        .map(v => ({ name: v.name, price: v.price || 0, type: 'VoiceAssistant' as const, link: v.link }));
    
    const assignedLighting = lighting
        .filter(l => allAssignedLightingIds.has(l.id))
        .map(l => ({ name: l.name, price: l.price || 0, type: 'Lighting' as const, link: l.link }));
    
    const assignedOtherDevices = otherDevices
        .filter(d => allAssignedOtherDeviceIds.has(d.id))
        .map(d => ({ name: d.name, price: d.price || 0, type: 'OtherDevice' as const, link: d.link }));
        
    const gatewayItems = assignedGateways
      .filter(g => g.connectivity.some(p => neededProtocols.has(p)))
      .map(g => ({ name: g.name, price: g.price || 0, type: 'Gateway' as const, link: g.link }));

    return [...assignedSensors, ...assignedSwitches, ...assignedAssistants, ...assignedLighting, ...assignedOtherDevices, ...gatewayItems];
  }, [rooms, sensors, switches, voiceAssistants, lighting, otherDevices, assignedGateways, neededProtocols, gateways]);
  
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

  const handleAddRoom = async (data: Omit<Room, "id" | "createdAt" | "sensorIds" | "switchIds" | "voiceAssistantIds" | "lightingIds" | "otherDeviceIds">) => {
    if (!db) return;
    setIsSaving(true);
    const newRoomData = { ...data, sensorIds: [], switchIds: [], voiceAssistantIds: [], lightingIds: [], otherDeviceIds: [] };
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

  const isLoading = isLoadingFloors || isLoadingRooms || isLoadingHouseConfig;

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
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-end gap-2">
            <Button variant="outline" onClick={() => setPlannerView(v => v === 'list' ? 'map' : 'list')}>
              {plannerView === 'list' ? <Map className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
              {plannerView === 'list' ? t.mapView : t.listView}
            </Button>
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
      
      {activeGatewaysForDisplay.length > 0 && plannerView === 'list' && (
        <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-3">{t.activeGateways}</h3>
            <div className="flex flex-wrap gap-4">
                {activeGatewaysForDisplay.map(device => (
                    <div key={device.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/40">
                         {'connectivity' in device ? <Router className="h-5 w-5 text-primary" /> : <Mic className="h-5 w-5 text-primary" />}
                         <span className="font-semibold">{device.name}</span>
                         <div className="flex gap-1">
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
      ) : plannerView === 'list' ? (
        floors && floors.length > 0 ? (
          <div className="space-y-8">
            {floors.map(floor => (
              <FloorSection
                key={floor.id}
                floor={floor}
                rooms={rooms?.filter(room => room.floorId === floor.id) || []}
                sensors={sensors || []}
                switches={switches || []}
                voiceAssistants={voiceAssistants || []}
                lighting={lighting || []}
                otherDevices={otherDevices || []}
                onEditRoom={setEditingRoom}
                onDeleteFloor={handleDeleteFloor}
                onDeleteRoom={handleDeleteRoom}
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
      ) : (
          <MindMapView
            floors={floors || []}
            rooms={rooms || []}
            sensors={sensors || []}
            switches={switches || []}
            lighting={lighting || []}
            otherDevices={otherDevices || []}
            voiceAssistants={voiceAssistants || []}
            activeGateways={activeGatewaysForDisplay}
          />
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
        lighting={lighting || []}
        otherDevices={otherDevices || []}
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
    </div>
  );
}
