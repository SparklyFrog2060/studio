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
import { PlusCircle } from 'lucide-react';
import { useLocale } from '@/app/components/locale-provider';
import type { Product, RoomProduct } from '@/app/lib/types';
import { PRODUCTS } from '@/app/lib/products';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductSelectorDialogProps {
  onAddProduct: (product: RoomProduct) => void;
}

export default function ProductSelectorDialog({ onAddProduct }: ProductSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };
  
  const groupedProducts = PRODUCTS.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {t.addProduct}
      </Button>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.selectProduct}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="py-4 space-y-6">
            {Object.entries(groupedProducts).map(([category, products]) => (
                <div key={category}>
                    <h3 className="text-lg font-semibold mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-4 rounded-lg border p-4">
                        <product.icon className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                            {product.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                            {formatCurrency(product.price)}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                            onAddProduct(product as RoomProduct);
                            setOpen(false);
                        }}>
                            {t.add}
                        </Button>
                        </div>
                    ))}
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t.cancel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
