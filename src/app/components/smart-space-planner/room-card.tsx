"use client";

import { useMemo } from 'react';
import type { Room, RoomProduct } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Trash2, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/app/components/locale-provider';
import ProductSelectorDialog from './product-selector-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from '@/components/ui/separator';

interface RoomCardProps {
  room: Room;
  onDeleteRoom: (roomId: string) => void;
  onAddProductToRoom: (roomId: string, product: RoomProduct) => void;
  onRemoveProductFromRoom: (roomId: string, instanceId: string) => void;
}

export default function RoomCard({
  room,
  onDeleteRoom,
  onAddProductToRoom,
  onRemoveProductFromRoom
}: RoomCardProps) {
  const { t } = useLocale();

  const roomTotal = useMemo(() => {
    return room.products.reduce((sum, product) => sum + product.price, 0);
  }, [room.products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{room.name}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{t.delete}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteRoomConfirmation}</AlertDialogTitle>
              <AlertDialogDescription>{t.deleteRoomDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteRoom(room.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.confirm}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col pt-0">
        {room.products.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-4">
            <p className="mb-2">{t.noProducts}</p>
            <p className="text-sm">{t.addProductToStart}</p>
          </div>
        ) : (
          <ScrollArea className="flex-grow h-48">
            <div className="space-y-4 pr-4">
              {room.products.map((product) => (
                <div key={product.instanceId} className="flex items-center">
                  <product.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="flex-1 text-sm">{product.name}</span>
                  <span className="text-sm font-mono">{formatCurrency(product.price)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => onRemoveProductFromRoom(room.id, product.instanceId)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Separator className="my-0" />

      <CardFooter className="flex justify-between items-center pt-4">
        <div className="flex items-center">
            <div className="text-2xl font-bold">{formatCurrency(roomTotal)}</div>
            <div className="text-xs text-muted-foreground ml-2">{t.roomTotal}</div>
        </div>
        <ProductSelectorDialog onAddProduct={(p) => onAddProductToRoom(room.id, p)} />
      </CardFooter>
    </Card>
  );
}
