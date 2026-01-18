"use client";

import { Building, Languages, Wallet } from 'lucide-react';
import { useLocale } from '@/app/components/locale-provider';
import AddRoomDialog from './add-room-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  totalCost: number;
  onAddRoom: (name: string) => void;
}

export default function Header({ totalCost, onAddRoom }: HeaderProps) {
  const { t, setLocale, locale } = useLocale();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
            <Building className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-xl font-bold">{t.appName}</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center text-sm font-medium p-2 rounded-lg bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm">
                <Wallet className="h-5 w-5 mr-2 text-accent" />
                <span>{t.totalCost}: </span>
                <span className="ml-1 font-bold text-foreground">{formatCurrency(totalCost)}</span>
            </div>
          
            <AddRoomDialog onAddRoom={onAddRoom} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Languages className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">{t.language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                  {t.english}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('pl')} disabled={locale === 'pl'}>
                  {t.polish}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
