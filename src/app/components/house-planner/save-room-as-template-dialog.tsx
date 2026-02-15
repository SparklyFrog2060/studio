"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocale } from "@/app/components/locale-provider";
import type { Room, RoomTemplate } from "@/app/lib/types";

interface SaveRoomAsTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<RoomTemplate, "id" | "createdAt" | "devices">) => void;
  isSaving: boolean;
  room: Room | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
});

type TemplateFormData = z.infer<typeof formSchema>;

export default function SaveRoomAsTemplateDialog({ isOpen, onOpenChange, onSubmit, isSaving, room }: SaveRoomAsTemplateDialogProps) {
  const { t } = useLocale();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: room ? `${room.name} ${t.template}` : "",
    },
  });

  const handleFormSubmit = (data: TemplateFormData) => {
    onSubmit(data);
    form.reset();
  };
  
  React.useEffect(() => {
    if (room) {
      form.reset({
        name: `${room.name} ${t.template}`
      });
    }
  }, [room, form, t.template]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.saveAsTemplate}</DialogTitle>
          <DialogDescription>
            Zapisz konfigurację urządzeń z pokoju "{room?.name}" jako szablon.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.templateName}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.templateNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {t.saveTemplate}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
