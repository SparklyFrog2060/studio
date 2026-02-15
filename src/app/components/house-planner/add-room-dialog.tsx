
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/app/components/locale-provider";
import type { Room, Floor, RoomTemplate } from "@/app/lib/types";

interface AddRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Room, "id" | "createdAt" | "devices">, templateId?: string) => void;
  isSaving: boolean;
  floors: Floor[];
  templates: RoomTemplate[];
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
  floorId: z.string().min(1, "Piętro jest wymagane."),
  templateId: z.string().optional(),
});

type RoomFormData = z.infer<typeof formSchema>;

export default function AddRoomDialog({ isOpen, onOpenChange, onSubmit, isSaving, floors, templates }: AddRoomDialogProps) {
  const { t } = useLocale();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      floorId: "",
      templateId: "",
    },
  });

  const handleFormSubmit = (data: RoomFormData) => {
    const { templateId, ...roomData } = data;
    onSubmit(roomData, templateId);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.addRoom}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.roomName}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.roomNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.floorName}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz piętro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.useTemplate}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.noTemplate} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">{t.noTemplate}</SelectItem>
                      {templates.length > 0 ? (
                        templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">{t.noTemplates}</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
