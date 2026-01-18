"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from 'lucide-react';
import { useLocale } from '@/app/components/locale-provider';

interface AddRoomDialogProps {
  onAddRoom: (name: string) => void;
}

export default function AddRoomDialog({ onAddRoom }: AddRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const { t } = useLocale();

  const handleAdd = () => {
    if (roomName.trim()) {
      onAddRoom(roomName.trim());
      setRoomName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {t.createRoom}
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.createRoom}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t.roomName}
            </Label>
            <Input
              id="name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={t.roomNamePlaceholder}
              className="col-span-3"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t.cancel}
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleAdd} disabled={!roomName.trim()}>
            {t.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
