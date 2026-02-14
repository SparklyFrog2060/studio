"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocale } from "@/app/components/locale-provider";
import type { Room, Sensor, Switch, VoiceAssistant, Lighting, OtherDevice } from "@/app/lib/types";
import { Plus, Minus } from "lucide-react";

interface EditRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Room, "id" | "createdAt" | "floorId">) => void;
  isSaving: boolean;
  room: Room | null;
  sensors: Sensor[];
  switches: Switch[];
  voiceAssistants: VoiceAssistant[];
  lighting: Lighting[];
  otherDevices: OtherDevice[];
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
  sensorIds: z.array(z.string()),
  switchIds: z.array(z.string()),
  voiceAssistantIds: z.array(z.string()),
  lightingIds: z.array(z.string()),
  otherDeviceIds: z.array(z.string()),
});

type RoomFormData = z.infer<typeof formSchema>;
type DeviceField = keyof Omit<RoomFormData, 'name'>;

export default function EditRoomDialog({ isOpen, onOpenChange, onSubmit, isSaving, room, sensors, switches, voiceAssistants, lighting, otherDevices }: EditRoomDialogProps) {
  const { t } = useLocale();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sensorIds: [],
      switchIds: [],
      voiceAssistantIds: [],
      lightingIds: [],
      otherDeviceIds: [],
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        sensorIds: room.sensorIds || [],
        switchIds: room.switchIds || [],
        voiceAssistantIds: room.voiceAssistantIds || [],
        lightingIds: room.lightingIds || [],
        otherDeviceIds: room.otherDeviceIds || [],
      });
    }
  }, [room, form]);

  const handleDeviceCountChange = (field: DeviceField, deviceId: string, change: 'increment' | 'decrement') => {
    const currentIds = form.getValues(field) || [];
    if (change === 'increment') {
        form.setValue(field, [...currentIds, deviceId]);
    } else {
        const index = currentIds.lastIndexOf(deviceId);
        if (index > -1) {
            const newIds = [...currentIds];
            newIds.splice(index, 1);
            form.setValue(field, newIds);
        }
    }
  };

  const renderDeviceSelector = (
    field: DeviceField, 
    devices: {id: string, name: string}[], 
    noDevicesText: string
  ) => {
    const watchedIds = form.watch(field) || [];
    return (
      <ScrollArea className="max-h-48">
        <div className="space-y-3 p-1">
          {devices.length > 0 ? devices.map(device => {
            const count = watchedIds.filter(id => id === device.id).length;
            return (
              <div key={device.id} className="flex items-center justify-between">
                <FormLabel className="font-normal text-sm">{device.name}</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeviceCountChange(field, device.id, 'decrement')}
                    disabled={count === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-4 text-center">{count}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeviceCountChange(field, device.id, 'increment')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          }) : <p className="p-2 text-sm text-muted-foreground">{noDevicesText}</p>}
        </div>
      </ScrollArea>
    );
  };
  
  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

            <Accordion type="multiple" className="w-full">
              {/* SENSORS */}
              <AccordionItem value="sensors">
                <AccordionTrigger className="text-base font-semibold">{t.sensors}</AccordionTrigger>
                <AccordionContent>
                  {renderDeviceSelector('sensorIds', sensors, t.noSensorsCreated)}
                </AccordionContent>
              </AccordionItem>

              {/* SWITCHES */}
              <AccordionItem value="switches">
                <AccordionTrigger className="text-base font-semibold">{t.switches}</AccordionTrigger>
                <AccordionContent>
                  {renderDeviceSelector('switchIds', switches, t.noSwitchesCreated)}
                </AccordionContent>
              </AccordionItem>

              {/* VOICE ASSISTANTS */}
              <AccordionItem value="voice-assistants">
                <AccordionTrigger className="text-base font-semibold">{t.voiceAssistants}</AccordionTrigger>
                <AccordionContent>
                  {renderDeviceSelector('voiceAssistantIds', voiceAssistants, t.noVoiceAssistantsCreated)}
                </AccordionContent>
              </AccordionItem>
              
               {/* LIGHTING */}
              <AccordionItem value="lighting">
                <AccordionTrigger className="text-base font-semibold">{t.lighting}</AccordionTrigger>
                <AccordionContent>
                  {renderDeviceSelector('lightingIds', lighting, t.noLightingCreated)}
                </AccordionContent>
              </AccordionItem>

               {/* OTHER DEVICES */}
               <AccordionItem value="other-devices">
                <AccordionTrigger className="text-base font-semibold">{t.otherDevices}</AccordionTrigger>
                <AccordionContent>
                  {renderDeviceSelector('otherDeviceIds', otherDevices, t.noOtherDevicesCreated)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
