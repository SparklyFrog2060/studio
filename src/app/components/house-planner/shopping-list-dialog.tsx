
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/app/components/locale-provider";

interface ShoppingListItem {
  name: string;
  price: number;
  type: 'Sensor' | 'Switch' | 'VoiceAssistant';
}

interface ShoppingListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  items: ShoppingListItem[];
  totalPrice: number;
}

export default function ShoppingListDialog({ isOpen, onOpenChange, items, totalPrice }: ShoppingListDialogProps) {
  const { t } = useLocale();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Set date only on client-side after mount to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('pl-PL'));
  }, []);

  const sensors = items.filter(item => item.type === 'Sensor');
  const switches = items.filter(item => item.type === 'Switch');
  const assistants = items.filter(item => item.type === 'VoiceAssistant');

  const renderSection = (title: string, sectionItems: ShoppingListItem[]) => {
    if (sectionItems.length === 0) return null;
    return (
      <div>
        <h4 className="font-semibold text-lg my-3 text-muted-foreground">{title}</h4>
        {sectionItems.map((item, index) => (
          <div key={`${title}-${index}`} className="flex justify-between items-center text-sm py-2 border-b border-dashed">
            <span>{item.name}</span>
            <span>{item.price.toFixed(2)} zł</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-mono tracking-widest uppercase">{t.shoppingList}</DialogTitle>
          <DialogDescription className="text-center font-mono">
            {currentDate}
          </DialogDescription>
        </DialogHeader>
        <div className="font-mono my-4">
          <ScrollArea className="h-72">
            <div className="p-1 pr-4">
              {items.length > 0 ? (
                <>
                  {renderSection(t.sensors, sensors)}
                  {renderSection(t.switches, switches)}
                  {renderSection(t.voiceAssistants, assistants)}
                </>
              ) : (
                <p className="text-center text-muted-foreground">Brak produktów na liście.</p>
              )}
            </div>
          </ScrollArea>
          <Separator className="my-4 bg-foreground" />
          <div className="flex justify-between font-bold text-lg">
            <span>{t.total.toUpperCase()}</span>
            <span>{totalPrice.toFixed(2)} zł</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
