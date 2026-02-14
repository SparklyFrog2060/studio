
"use client";

import type { Switch } from '@/app/lib/types';
import SwitchCard from './switch-card';
import { useLocale } from '../locale-provider';

interface SwitchListProps {
  switches: Switch[];
  onDeleteSwitch: (id: string) => void;
  onEditSwitch: (switchItem: Switch) => void;
}

export default function SwitchList({ switches, onDeleteSwitch, onEditSwitch }: SwitchListProps) {
    const { t } = useLocale();
  if (switches.length === 0) {
    return (
        <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{t.noSwitches}</h2>
            <p className="mt-2">{t.clickToAddSwitch}</p>
        </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {switches.map(switchItem => (
        <div key={switchItem.id} className="animate-in fade-in-0 zoom-in-95 duration-300">
            <SwitchCard switchItem={switchItem} onDelete={onDeleteSwitch} onEdit={onEditSwitch} />
        </div>
      ))}
    </div>
  );
}
