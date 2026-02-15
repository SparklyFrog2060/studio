'use client';

import { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

const iconNames = Object.keys(LucideIcons).filter(
  (key) => typeof LucideIcons[key as keyof typeof LucideIcons] === 'object' && 
           !['createLucideIcon', 'icons', 'LucideProvider', 'Icon'].includes(key)
);

export default function IconPicker({ onSelect, selectedIcon }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(
    () =>
      iconNames.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Szukaj ikony..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ScrollArea className="h-48 border rounded-md">
        <div className="grid grid-cols-8 gap-1 p-2">
          {filteredIcons.map((iconName) => {
            const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
            return (
              <button
                key={iconName}
                title={iconName}
                onClick={() => onSelect(iconName)}
                className={cn(
                  'flex items-center justify-center p-2 rounded-md hover:bg-accent',
                  selectedIcon === iconName && 'bg-accent text-accent-foreground ring-2 ring-ring'
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
