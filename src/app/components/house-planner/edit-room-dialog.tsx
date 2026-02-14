
"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/app/components/locale-provider";
import type { Room, Sensor, Switch, VoiceAssistant } from "@/app/lib/types";

interface EditRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Room, "id" | "createdAt" | "floorId">) => void;
  isSaving: boolean;
  room: Room | null;
  sensors: Sensor[];
  switches: Switch[];
  voiceAssistants: VoiceAssistant[];
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
  sensorIds: z.array(z.string()),
  switchIds: z.array(z.string()),
  voiceAssistantIds: z.array(z.string()),
});

type RoomFormData = z.infer<typeof formSchema>;

export default function EditRoomDialog({ isOpen, onOpenChange, onSubmit, isSaving, room, sensors, switches, voiceAssistants }: EditRoomDialogProps) {
  const { t } = useLocale();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sensorIds: [],
      switchIds: [],
      voiceAssistantIds: [],
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        sensorIds: room.sensorIds || [],
        switchIds: room.switchIds || [],
        voiceAssistantIds: room.voiceAssistantIds || [],
      });
    }
  }, [room, form]);
  
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SENSORS */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t.sensors}</h3>
                <Separator />
                <ScrollArea className="h-48">
                  <div className="space-y-2 p-1">
                    {sensors.map(sensor => (
                      <FormField
                        key={sensor.id}
                        control={form.control}
                        name="sensorIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(sensor.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, sensor.id])
                                    : field.onChange(field.value?.filter(id => id !== sensor.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{sensor.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* SWITCHES */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t.switches}</h3>
                <Separator />
                <ScrollArea className="h-48">
                  <div className="space-y-2 p-1">
                    {switches.map(switchItem => (
                      <FormField
                        key={switchItem.id}
                        control={form.control}
                        name="switchIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(switchItem.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, switchItem.id])
                                    : field.onChange(field.value?.filter(id => id !== switchItem.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{switchItem.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* VOICE ASSISTANTS */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t.voiceAssistants}</h3>
                <Separator />
                <ScrollArea className="h-48">
                  <div className="space-y-2 p-1">
                    {voiceAssistants.map(assistant => (
                      <FormField
                        key={assistant.id}
                        control={form.control}
                        name="voiceAssistantIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(assistant.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, assistant.id])
                                    : field.onChange(field.value?.filter(id => id !== assistant.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{assistant.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

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
