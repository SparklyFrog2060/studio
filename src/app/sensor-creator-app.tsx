
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { addSensor, deleteSensor, updateSensor } from "@/lib/firebase/sensors";
import { addSwitch, deleteSwitch, updateSwitch } from "@/lib/firebase/switches";
import { addLighting, deleteLighting, updateLighting } from "@/lib/firebase/lighting";
import { addOtherDevice, deleteOtherDevice, updateOtherDevice } from "@/lib/firebase/other-devices";
import { addVoiceAssistant, deleteVoiceAssistant, updateVoiceAssistant } from "@/lib/firebase/voice-assistants";
import { addGateway, deleteGateway, updateGateway } from "@/lib/firebase/gateways";
import { useToast } from "@/hooks/use-toast";
import AddSensorForm from "./components/sensor-creator/add-sensor-form";
import SensorList from "./components/sensor-creator/sensor-list";
import AddSwitchForm from "./components/switch-creator/add-switch-form";
import SwitchList from "./components/switch-creator/switch-list";
import AddLightingForm from "./components/lighting-creator/add-lighting-form";
import LightingList from "./components/lighting-creator/lighting-list";
import AddOtherDeviceForm from "./components/other-device-creator/add-other-device-form";
import OtherDeviceList from "./components/other-device-creator/other-device-list";
import AddVoiceAssistantForm from "./components/voice-assistant-creator/add-voice-assistant-form";
import VoiceAssistantList from "./components/voice-assistant-creator/voice-assistant-list";
import AddGatewayForm from "./components/gateway-creator/add-gateway-form";
import GatewayList from "./components/gateway-creator/gateway-list";
import HousePlanner from "./components/house-planner/house-planner";
import type { Sensor, Switch, Lighting, VoiceAssistant, Gateway, OtherDevice } from "./lib/types";
import { useLocale } from "./components/locale-provider";
import { Languages, Building, Thermometer, ToggleRight, Mic, LayoutGrid, Router, Menu, Lightbulb, Box } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeSwitcher } from "./components/theme-switcher";

type View = 'planner' | 'sensors' | 'switches' | 'lighting' | 'other-devices' | 'voice-assistants' | 'gateways';
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

  const { data: lighting, isLoading: isLoadingLighting } = useCollection<Lighting>(db ? "lighting" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingLighting, setIsSavingLighting] = useState(false);
  const [editingLighting, setEditingLighting] = useState<Lighting | null>(null);
  
  const { data: otherDevices, isLoading: isLoadingOtherDevices } = useCollection<OtherDevice>(db ? "other_devices" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingOtherDevice, setIsSavingOtherDevice] = useState(false);
  const [editingOtherDevice, setEditingOtherDevice] = useState<OtherDevice | null>(null);

  const { data: voiceAssistants, isLoading: isLoadingVoiceAssistants } = useCollection<VoiceAssistant>(db ? "voice_assistants" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingVoiceAssistant, setIsSavingVoiceAssistant] = useState(false);
  const [editingVoiceAssistant, setEditingVoiceAssistant] = useState<VoiceAssistant | null>(null);

  const { data: gateways, isLoading: isLoadingGateways } = useCollection<Gateway>(db ? "gateways" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);

  const { toast } = useToast();
  const [activeView, setActiveView] = useState<View>('planner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleAddLighting = async (data: Omit<Lighting, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingLighting(true);
    try {
      await addLighting(db, data);
      toast({ title: "Sukces!", description: `Oświetlenie "${data.name}" zostało dodane.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać oświetlenia." });
    } finally {
      setIsSavingLighting(false);
    }
  };

  const handleUpdateLighting = async (data: Omit<Lighting, "id" | "createdAt">) => {
    if (!db || !editingLighting) return;
    setIsSavingLighting(true);
    try {
      await updateLighting(db, editingLighting.id, data);
      toast({ title: "Sukces!", description: `Oświetlenie "${data.name}" zostało zaktualizowane.` });
      setEditingLighting(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować oświetlenia." });
    } finally {
      setIsSavingLighting(false);
    }
  };

  const handleDeleteLighting = async (id: string) => {
    if (!db) return;
    try {
      await deleteLighting(db, id);
      toast({ title: "Sukces!", description: "Oświetlenie zostało usunięte." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć oświetlenia." });
    }
  };
  
  const handleAddOtherDevice = async (data: Omit<OtherDevice, "id" | "createdAt">) => {
    if (!db) return;
    setIsSavingOtherDevice(true);
    try {
      await addOtherDevice(db, data);
      toast({ title: "Sukces!", description: `Urządzenie "${data.name}" zostało dodane.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się dodać urządzenia." });
    } finally {
      setIsSavingOtherDevice(false);
    }
  };

  const handleUpdateOtherDevice = async (data: Omit<OtherDevice, "id" | "createdAt">) => {
    if (!db || !editingOtherDevice) return;
    setIsSavingOtherDevice(true);
    try {
      await updateOtherDevice(db, editingOtherDevice.id, data);
      toast({ title: "Sukces!", description: `Urządzenie "${data.name}" zostało zaktualizowane.` });
      setEditingOtherDevice(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować urządzenia." });
    } finally {
      setIsSavingOtherDevice(false);
    }
  };

  const handleDeleteOtherDevice = async (id: string) => {
    if (!db) return;
    try {
      await deleteOtherDevice(db, id);
      toast({ title: "Sukces!", description: "Urządzenie zostało usunięte." });
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć urządzenia." });
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
  
  const handleMobileLinkClick = (view: View) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }

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
      case 'lighting': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddLightingForm onSubmit={handleAddLighting} isSaving={isSavingLighting} /></div>
          <div className="lg:col-span-2">
            {isLoadingLighting ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <LightingList lightingItems={lighting || []} onDeleteLighting={handleDeleteLighting} onEditLighting={setEditingLighting} />
            )}
          </div>
        </div>
      );
      case 'other-devices': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><AddOtherDeviceForm onSubmit={handleAddOtherDevice} isSaving={isSavingOtherDevice} /></div>
          <div className="lg:col-span-2">
            {isLoadingOtherDevices ? <div className="text-center text-muted-foreground mt-20">Ładowanie...</div> : (
              <OtherDeviceList devices={otherDevices || []} onDeleteDevice={handleDeleteOtherDevice} onEditDevice={setEditingOtherDevice} />
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
            <div className="flex items-center">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden mr-2">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Otwórz menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px]">
                    <div className="mt-6 flex flex-col gap-2">
                      <Button variant={activeView === 'planner' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('planner')}>
                          <LayoutGrid className="mr-2 h-5 w-5" />
                          {t.housePlanner}
                      </Button>
                      <Button variant={activeView === 'sensors' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('sensors')}>
                          <Thermometer className="mr-2 h-5 w-5" />
                          {t.sensors}
                      </Button>
                      <Button variant={activeView === 'switches' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('switches')}>
                          <ToggleRight className="mr-2 h-5 w-5" />
                          {t.switches}
                      </Button>
                      <Button variant={activeView === 'lighting' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('lighting')}>
                          <Lightbulb className="mr-2 h-5 w-5" />
                          {t.lighting}
                      </Button>
                      <Button variant={activeView === 'other-devices' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('other-devices')}>
                          <Box className="mr-2 h-5 w-5" />
                          {t.otherDevices}
                      </Button>
                      <Button variant={activeView === 'voice-assistants' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('voice-assistants')}>
                          <Mic className="mr-2 h-5 w-5" />
                          {t.voiceAssistants}
                      </Button>
                      <Button variant={activeView === 'gateways' ? 'secondary' : 'ghost'} size="lg" className="w-full justify-start text-base" onClick={() => handleMobileLinkClick('gateways')}>
                          <Router className="mr-2 h-5 w-5" />
                          {t.gateways}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <Building className="h-6 w-6 mr-2 text-primary" />
                <h1 className="text-xl font-bold">{t.appName}</h1>
            </div>

            <div className="flex-1 hidden md:flex justify-center px-4 min-w-0">
              <nav className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                  <Button variant={activeView === 'planner' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('planner')}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      {t.housePlanner}
                  </Button>
                  <Button variant={activeView === 'sensors' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('sensors')}>
                      <Thermometer className="mr-2 h-4 w-4" />
                      {t.sensors}
                  </Button>
                  <Button variant={activeView === 'switches' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('switches')}>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      {t.switches}
                  </Button>
                  <Button variant={activeView === 'lighting' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('lighting')}>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      {t.lighting}
                  </Button>
                  <Button variant={activeView === 'other-devices' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('other-devices')}>
                      <Box className="mr-2 h-4 w-4" />
                      {t.otherDevices}
                  </Button>
                  <Button variant={activeView === 'voice-assistants' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('voice-assistants')}>
                      <Mic className="mr-2 h-4 w-4" />
                      {t.voiceAssistants}
                  </Button>
                  <Button variant={activeView === 'gateways' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('gateways')}>
                      <Router className="mr-2 h-4 w-4" />
                      {t.gateways}
                  </Button>
              </nav>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
                <ThemeSwitcher />
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

      <Dialog open={!!editingLighting} onOpenChange={(isOpen) => !isOpen && setEditingLighting(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingLighting && <AddLightingForm initialData={editingLighting} onSubmit={handleUpdateLighting} isSaving={isSavingLighting}/>}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingOtherDevice} onOpenChange={(isOpen) => !isOpen && setEditingOtherDevice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingOtherDevice && <AddOtherDeviceForm initialData={editingOtherDevice} onSubmit={handleUpdateOtherDevice} isSaving={isSavingOtherDevice}/>}
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

    