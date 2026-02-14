"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/app/components/locale-provider";
import type { Gateway } from "@/app/lib/types";

interface AddHouseGatewayDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (gatewayIds: string[]) => void;
  isSaving: boolean;
  allGateways: Gateway[];
  assignedGatewayIds: string[];
}

export default function AddHouseGatewayDialog({ isOpen, onOpenChange, onSubmit, isSaving, allGateways, assignedGatewayIds }: AddHouseGatewayDialogProps) {
  const { t } = useLocale();
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedGatewayIds);

  useEffect(() => {
    // When dialog opens, sync state with props
    if (isOpen) {
      setSelectedIds(assignedGatewayIds);
    }
  }, [isOpen, assignedGatewayIds]);

  const handleCheckboxChange = (gatewayId: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, gatewayId] : prev.filter(id => id !== gatewayId)
    );
  };

  const handleSave = () => {
    onSubmit(selectedIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.manageHouseGateways}</DialogTitle>
          <DialogDescription>{t.selectGatewaysForHouse}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded-md p-4">
            <div className="space-y-4">
            {allGateways.length > 0 ? allGateways.map((gateway) => (
                <div key={gateway.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`gateway-${gateway.id}`}
                        checked={selectedIds.includes(gateway.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(gateway.id, !!checked)}
                    />
                    <Label htmlFor={`gateway-${gateway.id}`} className="font-normal w-full">
                        <div className="flex justify-between items-center">
                            <span>{gateway.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">{gateway.connectivity.join(', ')}</span>
                        </div>
                    </Label>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center">{t.noGatewaysCreated}</p>
            )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {t.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    