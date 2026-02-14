"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocale } from "@/app/components/locale-provider";
import type { Room, RoomDevice, BaseDevice } from "@/app/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function DeviceAdder({ devices, onAdd, categoryLabel }: { devices: (BaseDevice & { type: string })[], onAdd: (deviceId: string, quantity: number) => void, categoryLabel: string }) {
  const { t } = useLocale();
  const [selectedDevice, setSelectedDevice] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddClick = () => {
    if (!selectedDevice || quantity < 1) return;
    onAdd(selectedDevice, quantity);
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      <Select onValueChange={setSelectedDevice} value={selectedDevice}>
        <SelectTrigger>
          <SelectValue placeholder={`${t.add} ${categoryLabel.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {devices.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min="1"
        value={quantity}
        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-20"
        aria-label={t.quantityOwned}
      />
      <Button type="button" onClick={handleAddClick} disabled={!selectedDevice}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface EditRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Room, "id" | "createdAt" | "floorId">) => void;
  isSaving: boolean;
  room: Room | null;
  allDevicesMap: Map<string, BaseDevice & { type: string }>;
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
  devices: z.array(z.object({
    instanceId: z.string(),
    deviceId: z.string(),
    customName: z.string(),
  })),
});

type RoomFormData = z.infer<typeof formSchema>;

export default function EditRoomDialog({ isOpen, onOpenChange, onSubmit, isSaving, room, allDevicesMap }: EditRoomDialogProps) {
  const { t } = useLocale();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", devices: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "devices",
    keyName: "key"
  });

  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        devices: room.devices || [],
      });
    }
  }, [room, form]);

  const deviceCategories = useMemo(() => {
    const categories: Record<string, { label: string, devices: (BaseDevice & {type: string})[] }> = {
        'sensor': { label: t.sensors, devices: [] },
        'switch': { label: t.switches, devices: [] },
        'lighting': { label: t.lighting, devices: [] },
        'other-device': { label: t.otherDevices, devices: [] },
        'voice-assistant': { label: t.voiceAssistants, devices: [] },
    };
    allDevicesMap.forEach(device => {
        if (categories[device.type]) {
            categories[device.type].devices.push(device);
        }
    });
    return categories;
  }, [allDevicesMap, t]);

  const handleAddDevices = (deviceId: string, quantity: number) => {
    const device = allDevicesMap.get(deviceId);
    if (!device) return;

    for (let i = 0; i < quantity; i++) {
        append({
            instanceId: crypto.randomUUID(),
            deviceId: device.id,
            customName: device.name,
        });
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.editRoom}: {room.name}</DialogTitle>
          <DialogDescription>{t.assignDevices}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.roomName}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <ScrollArea className="h-[50vh] pr-4">
              <Accordion type="multiple" className="w-full" defaultValue={Object.keys(deviceCategories)}>
                {Object.entries(deviceCategories).map(([type, { label, devices }]) => (
                  <AccordionItem value={type} key={type}>
                    <AccordionTrigger className="text-base font-semibold">{label}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {fields.map((field, index) => {
                          const device = allDevicesMap.get(field.deviceId);
                          if (device?.type !== type) return null;
                          return (
                            <div key={field.key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                               <FormField
                                control={form.control}
                                name={`devices.${index}.customName`}
                                render={({ field: inputField }) => (
                                  <FormItem className="flex-grow">
                                    <FormControl>
                                      <Input {...inputField} placeholder={device.name} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">({device.name})</span>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                        {devices.length > 0 ? (
                            <DeviceAdder devices={devices} onAdd={handleAddDevices} categoryLabel={label} />
                        ) : (
                            <p className="p-2 text-sm text-muted-foreground">{t.noDevicesOfThisType}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
            
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {t.saveChanges}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
