'use client';

import { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

// Perform this expensive operation only once.
const iconNames = Object.keys(LucideIcons).filter(
  (key) => typeof LucideIcons[key as keyof typeof LucideIcons] === 'object' && 
           !['createLucideIcon', 'icons', 'LucideProvider', 'Icon'].includes(key)
);

const MAX_ICONS_TO_DISPLAY = 120;

export default function IconPicker({ onSelect, selectedIcon }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search input to prevent re-rendering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200); // 200ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);


  const { displayedIcons, totalFound } = useMemo(() => {
      const filtered = iconNames.filter((name) =>
        name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      return {
        displayedIcons: filtered.slice(0, MAX_ICONS_TO_DISPLAY),
        totalFound: filtered.length,
      };
    }, [debouncedSearch]
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Szukaj ikony..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ScrollArea className="h-48 border rounded-md">
        <div className="p-2">
          <div className="grid grid-cols-8 gap-1">
            {displayedIcons.map((iconName) => {
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
          {totalFound > MAX_ICONS_TO_DISPLAY && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Wyświetlono {MAX_ICONS_TO_DISPLAY} z {totalFound} ikon. Uściślij wyszukiwanie.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
