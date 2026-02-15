'use client';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

const fallbackIconMap: Record<string, React.ElementType> = {
    'sensor': LucideIcons.Thermometer,
    'switch': LucideIcons.ToggleRight,
    'lighting': LucideIcons.Lightbulb,
    'other-device': LucideIcons.Box,
    'voice-assistant': LucideIcons.Mic,
    'gateway': LucideIcons.Router,
};

interface DeviceIconProps extends React.HTMLAttributes<SVGElement> {
    icon?: string;
    type: string;
}

export function DeviceIcon({ icon, type, className, ...props }: DeviceIconProps) {
    const IconComponent = icon ? (LucideIcons[icon as keyof typeof LucideIcons] as React.ElementType) : null;
    
    if (IconComponent) {
        return <IconComponent className={cn('h-5 w-5', className)} {...props} />;
    }

    const FallbackIcon = fallbackIconMap[type] || LucideIcons.Box;
    return <FallbackIcon className={cn('h-5 w-5', className)} {...props} />;
}
