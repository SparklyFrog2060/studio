
"use client";

import { useState } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { addSensor, deleteSensor } from "@/lib/firebase/sensors";
import { useToast } from "@/hooks/use-toast";
import AddSensorForm from "./components/sensor-creator/add-sensor-form";
import SensorList from "./components/sensor-creator/sensor-list";
import type { Sensor } from "./lib/types";
import { useLocale } from "./components/locale-provider";
import { Languages, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SensorCreatorApp() {
  const { t, setLocale, locale } = useLocale();
  const db = useFirestore();
  const { data: sensors, isLoading } = useCollection(db ? "sensors" : null, { sort: { field: "createdAt", direction: "desc" }});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleAddSensor = async (data: Omit<Sensor, "id" | "createdAt">) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await addSensor(db, data);
      toast({
        title: "Sukces!",
        description: `Czujnik "${data.name}" został dodany.`,
      });
    } catch (error) {
      console.error("Error adding sensor: ", error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się dodać czujnika.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSensor = async (id: string) => {
    if (!db) return;
    try {
      await deleteSensor(db, id);
      toast({
        title: "Sukces!",
        description: "Czujnik został usunięty.",
      });
    } catch (error) {
      console.error("Error deleting sensor: ", error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się usunąć czujnika.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
            <div className="mr-4 flex items-center">
                <Building className="h-6 w-6 mr-2 text-primary" />
                <h1 className="text-xl font-bold">{t.appName}</h1>
            </div>
            
            <div className="flex flex-1 items-center justify-end space-x-4">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t.language}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                    {t.english}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocale('pl')} disabled={locale === 'pl'}>
                    {t.polish}
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
                <AddSensorForm onAddSensor={handleAddSensor} isSaving={isSaving} />
            </div>
            <div className="lg:col-span-2">
                {isLoading ? (
                    <p>Ładowanie czujników...</p>
                ) : (
                    <SensorList sensors={sensors as Sensor[]} onDeleteSensor={handleDeleteSensor} />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
