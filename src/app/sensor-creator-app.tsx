
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { addSensor, deleteSensor, updateSensor } from "@/lib/firebase/sensors";
import { addSwitch, deleteSwitch, updateSwitch } from "@/lib/firebase/switches";
import { addVoiceAssistant, deleteVoiceAssistant, updateVoiceAssistant } from "@/lib/firebase/voice-assistants";
import { addGateway, deleteGateway, updateGateway } from "@/lib/firebase/gateways";
import { useToast } from "@/hooks/use-toast";
import AddSensorForm from "./components/sensor-creator/add-sensor-form";
import SensorList from "./components/sensor-creator/sensor-list";
import AddSwitchForm from "./components/switch-creator/add-switch-form";
import SwitchList from "./components/switch-creator/switch-list";
import AddVoiceAssistantForm from "./components/voice-assistant-creator/add-voice-assistant-form";
import VoiceAssistantList from "./components/voice-assistant-creator/voice-assistant-list";
import AddGatewayForm from "./components/gateway-creator/add-gateway-form";
import GatewayList from "./components/gateway-creator/gateway-list";
import HousePlanner from "./components/house-planner/house-planner";
import type { Sensor, Switch, VoiceAssistant, Gateway } from "./lib/types";
import { useLocale } from "./components/locale-provider";
import { Languages, Building, Thermometer, ToggleRight, Mic, LayoutGrid, Router } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

type View = 'planner' | 'sensors' | 'switches' | 'voice-assistants' | 'gateways';
type GatewayDevice = (Gateway & { deviceType: 'gateway' }) | (VoiceAssistant & { deviceType: 'voice-assistant' });

export default function SensorCreatorApp() {
  const { t, setLocale, locale } = useLocale();
  const db = useFirestore();

  const { data: sensors, isLoading: isLoadingSensors } = useCollection<Sensor>(db ? "sensors" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingSensor, setIsSavingSensor] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  
  const { data: switches, isLoading: isLoadingSwitches } = useCollection<Switch>(db ? "switches" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingSwitch, setIsSavingSwitch] = useState(false);
  const [editingSwitch, setEditingSwitch] = useState<Switch | null>(null);

  const { data: voiceAssistants, isLoading: isLoadingVoiceAssistants } = useCollection<VoiceAssistant>(db ? "voice_assistants" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingVoiceAssistant, setIsSavingVoiceAssistant] = useState(false);
  const [editingVoiceAssistant, setEditingVoiceAssistant] = useState<VoiceAssistant | null>(null);

  const { data: gateways, isLoading: isLoadingGateways } = useCollection<Gateway>(db ? "gateways" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);

  const { toast } = useToast();
  const [activeView, setActiveView] = useState<View>('planner');

  const gatewayDevices = useMemo((): GatewayDevice[] => {
    const regularGateways = (gateways || []).map(g => ({ ...g, deviceType: 'gateway' as const }));
    const assistantGateways = (voiceAssistants || []).filter(va => va.isGateway).map(va => ({ ...va, deviceType: 'voice-assistant' as const }));
    return [...regularGateways, ...assistantGateways];
  }, [gateways, voiceAssistants]);


  const handleAddSensor = async (data: Omit<Sensor, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingSensor(true);
    try {
      await addSensor(db, data);
      toast({ title: "Sukces!", description: `Czujnik "${data.name}" został dodany.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać czujnika." });
    } finally {
      setIsSavingSensor(false);
    }
  };

  const handleUpdateSensor = async (data: Omit<Sensor, "id" | "createdAt">) => {
    if (!db || !editingSensor) return;
    setIsSavingSensor(true);
    try {
      await updateSensor(db, editingSensor.id, data);
      toast({ title: "Sukces!", description: `Czujnik "${data.name}" został zaktualizowany.` });
      setEditingSensor(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować czujnika." });
    } finally {
      setIsSavingSensor(false);
    }
  };

  const handleDeleteSensor = async (id: string) => {
    if (!db) return;
    try {
      await deleteSensor(db, id);
      toast({ title: "Sukces!", description: "Czujnik został usunięty." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć czujnika." });
    }
  };
  
  const handleAddSwitch = async (data: Omit<Switch, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingSwitch(true);
    try {
      await addSwitch(db, data);
      toast({ title: "Sukces!", description: `Włącznik "${data.name}" został dodany.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać włącznika." });
    } finally {
      setIsSavingSwitch(false);
    }
  };

  const handleUpdateSwitch = async (data: Omit<Switch, "id" | "createdAt">) => {
    if (!db || !editingSwitch) return;
    setIsSavingSwitch(true);
    try {
      await updateSwitch(db, editingSwitch.id, data);
      toast({ title: "Sukces!", description: `Włącznik "${data.name}" został zaktualizowany.` });
      setEditingSwitch(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować włącznika." });
    } finally {
      setIsSavingSwitch(false);
    }
  };

  const handleDeleteSwitch = async (id: string) => {
    if (!db) return;
    try {
      await deleteSwitch(db, id);
      toast({ title: "Sukces!", description: "Włącznik został usunięty." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć włącznika." });
    }
  };

  const handleAddVoiceAssistant = async (data: Omit<VoiceAssistant, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingVoiceAssistant(true);
    try {
      await addVoiceAssistant(db, data);
      toast({ title: "Sukces!", description: `Asystent "${data.name}" został dodany.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać asystenta." });
    } finally {
      setIsSavingVoiceAssistant(false);
    }
  };

  const handleUpdateVoiceAssistant = async (data: Omit<VoiceAssistant, "id" | "createdAt">) => {
    if (!db || !editingVoiceAssistant) return;
    setIsSavingVoiceAssistant(true);
    try {
      await updateVoiceAssistant(db, editingVoiceAssistant.id, data);
      toast({ title: "Sukces!", description: `Asystent "${data.name}" został zaktualizowany.` });
      setEditingVoiceAssistant(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować asystenta." });
    } finally {
      setIsSavingVoiceAssistant(false);
    }
  };

  const handleDeleteVoiceAssistant = async (id: string) => {
    if (!db) return;
    try {
      await deleteVoiceAssistant(db, id);
      toast({ title: "Sukces!", description: "Asystent został usunięty." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć asystenta." });
    }
  };

  const handleAddGateway = async (data: Omit<Gateway, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingGateway(true);
    try {
      await addGateway(db, data);
      toast({ title: "Sukces!", description: `Bramka "${data.name}" została dodana.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać bramki." });
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleUpdateGateway = async (data: Omit<Gateway, "id" | "createdAt">) => {
    if (!db || !editingGateway) return;
    setIsSavingGateway(true);
    try {
      await updateGateway(db, editingGateway.id, data);
      toast({ title: "Sukces!", description: `Bramka "${data.name}" została zaktualizowana.` });
      setEditingGateway(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować bramki." });
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!db) return;
    try {
      await deleteGateway(db, id);
      toast({ title: "Sukces!", description: "Bramka została usunięta." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć bramki." });
    }
  };

  const handleEditDevice = (device: GatewayDevice) => {
    if (device.deviceType === 'gateway') {
      setEditingGateway(device);
    } else {
      setEditingVoiceAssistant(device);
    }
  };

  const handleDeleteDevice = (id: string, type: 'gateway' | 'voice-assistant') => {
    if (type === 'gateway') {
      handleDeleteGateway(id);
    } else {
      handleDeleteVoiceAssistant(id);
    }
  };


  const renderContent = () => {
    switch (activeView) {
      case 'planner': return <HousePlanner />;
      case 'sensors': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddSensorForm onSubmit={handleAddSensor} isSaving={isSavingSensor} /></div>
          <div className="lg:col-span-2">
            {isLoadingSensors ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <SensorList sensors={sensors || []} onDeleteSensor={handleDeleteSensor} onEditSensor={setEditingSensor} />
            )}
          </div>
        </div>
      );
      case 'switches': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddSwitchForm onSubmit={handleAddSwitch} isSaving={isSavingSwitch} /></div>
          <div className="lg:col-span-2">
            {isLoadingSwitches ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <SwitchList switches={switches || []} onDeleteSwitch={handleDeleteSwitch} onEditSwitch={setEditingSwitch} />
            )}
          </div>
        </div>
      );
      case 'voice-assistants': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddVoiceAssistantForm onSubmit={handleAddVoiceAssistant} isSaving={isSavingVoiceAssistant} /></div>
          <div className="lg:col-span-2">
            {isLoadingVoiceAssistants ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <VoiceAssistantList assistants={voiceAssistants || []} onDeleteAssistant={handleDeleteVoiceAssistant} onEditAssistant={setEditingVoiceAssistant} />
            )}
          </div>
        </div>
      );
      case 'gateways': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddGatewayForm onSubmit={handleAddGateway} isSaving={isSavingGateway} /></div>
          <div className="lg:col-span-2">
            {isLoadingGateways || isLoadingVoiceAssistants ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <GatewayList devices={gatewayDevices} onDeleteDevice={handleDeleteDevice} onEditDevice={handleEditDevice} />
            )}
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
            <div className="mr-auto flex items-center">
                <Building className="h-6 w-6 mr-2 text-primary" />
                <h1 className="text-xl font-bold">{t.appName}</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-1 mx-auto bg-muted p-1 rounded-lg">
                <Button variant={activeView === 'planner' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('planner')} className="w-40">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    {t.housePlanner}
                </Button>
                <Button variant={activeView === 'sensors' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('sensors')} className="w-32">
                    <Thermometer className="mr-2 h-4 w-4" />
                    {t.sensors}
                </Button>
                <Button variant={activeView === 'switches' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('switches')} className="w-32">
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t.switches}
                </Button>
                 <Button variant={activeView === 'voice-assistants' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('voice-assistants')} className="w-40">
                    <Mic className="mr-2 h-4 w-4" />
                    {t.voiceAssistants}
                </Button>
                <Button variant={activeView === 'gateways' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('gateways')} className="w-32">
                    <Router className="mr-2 h-4 w-4" />
                    {t.gateways}
                </Button>
            </nav>
            
            <div className="flex flex-1 items-center justify-end space-x-4">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t.language}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>{t.english}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocale('pl')} disabled={locale === 'pl'}>{t.polish}</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      <Dialog open={!!editingSensor} onOpenChange={(isOpen) => !isOpen && setEditingSensor(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingSensor && <AddSensorForm initialData={editingSensor} onSubmit={handleUpdateSensor} isSaving={isSavingSensor}/>}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingSwitch} onOpenChange={(isOpen) => !isOpen && setEditingSwitch(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingSwitch && <AddSwitchForm initialData={editingSwitch} onSubmit={handleUpdateSwitch} isSaving={isSavingSwitch}/>}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingVoiceAssistant} onOpenChange={(isOpen) => !isOpen && setEditingVoiceAssistant(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingVoiceAssistant && <AddVoiceAssistantForm initialData={editingVoiceAssistant} onSubmit={handleUpdateVoiceAssistant} isSaving={isSavingVoiceAssistant}/>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingGateway} onOpenChange={(isOpen) => !isOpen && setEditingGateway(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingGateway && <AddGatewayForm initialData={editingGateway} onSubmit={handleUpdateGateway} isSaving={isSavingGateway}/>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
