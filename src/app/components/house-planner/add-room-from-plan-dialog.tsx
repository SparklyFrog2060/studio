
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocale } from "@/app/components/locale-provider";

interface AddRoomFromPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (name: string) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana."),
});

type RoomFormData = z.infer<typeof formSchema>;

export default function AddRoomFromPlanDialog({ isOpen, onOpenChange, onSubmit }: AddRoomFromPlanDialogProps) {
  const { t } = useLocale();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset();
    }
  }, [isOpen, form]);


  const handleFormSubmit = (data: RoomFormData) => {
    onSubmit(data.name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.nameYourRoom}</DialogTitle>
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
            <DialogFooter>
              <Button type="submit">
                {t.addRoom}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
