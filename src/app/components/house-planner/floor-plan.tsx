
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { BaseDevice, Floor, Wall, PlacedDevice, FloorLayout } from '@/app/lib/types';
import { useLocale } from '../locale-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Thermometer, ToggleRight, Lightbulb, Box, Mic, PencilRuler, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const DeviceIcon = ({ type, ...props }: { type: string } & React.ComponentProps<typeof Thermometer>) => {
    switch (type) {
        case 'sensor': return <Thermometer {...props} />;
        case 'switch': return <ToggleRight {...props} />;
        case 'lighting': return <Lightbulb {...props} />;
        case 'other-device': return <Box {...props} />;
        case 'voice-assistant': return <Mic {...props} />;
        case 'gateway': return <Box {...props} />; // Placeholder for gateway
        default: return <Box {...props} />;
    }
};

interface FloorPlanProps {
    floor: Floor;
    allDevicesMap: Map<string, BaseDevice & { type: string }>;
    onSave: (floorId: string, layout: FloorLayout) => void;
    isSaving: boolean;
}

export default function FloorPlan({ floor, allDevicesMap, onSave, isSaving }: FloorPlanProps) {
    const { t } = useLocale();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [walls, setWalls] = useState<Wall[]>(floor.layout?.walls || []);
    const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>(floor.layout?.placedDevices || []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentWall, setCurrentWall] = useState<Wall | null>(null);

    const getCanvasCoordinates = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const pos = getCanvasCoordinates(e);
        setStartPos(pos);
        setCurrentWall({ id: `wall-${Date.now()}`, start: pos, end: pos });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !startPos) return;
        const pos = getCanvasCoordinates(e);
        setCurrentWall({ id: currentWall!.id, start: startPos, end: pos });
    };

    const handleMouseUp = () => {
        if (currentWall) {
            setWalls(prev => [...prev, currentWall]);
        }
        setIsDrawing(false);
        setStartPos(null);
        setCurrentWall(null);
    };

    const handleDragStart = (e: React.DragEvent, deviceId: string) => {
        e.dataTransfer.setData('deviceId', deviceId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const deviceId = e.dataTransfer.getData('deviceId');
        const canvas = canvasRef.current;
        if (!deviceId || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newDevice: PlacedDevice = {
            instanceId: crypto.randomUUID(),
            deviceId,
            x,
            y,
        };
        setPlacedDevices(prev => [...prev, newDevice]);
    };

    const handleSave = () => {
        onSave(floor.id, { walls, placedDevices });
    };

    const handleReset = () => {
        setWalls([]);
        setPlacedDevices([]);
    }

    const deviceCategories = useMemo(() => {
        const categories: Record<string, { label: string, devices: (BaseDevice & {type: string})[] }> = {
            'sensor': { label: t.sensors, devices: [] },
            'switch': { label: t.switches, devices: [] },
            'lighting': { label: t.lighting, devices: [] },
            'other-device': { label: t.otherDevices, devices: [] },
            'voice-assistant': { label: t.voiceAssistants, devices: [] },
            'gateway': { label: t.gateways, devices: [] },
        };
        allDevicesMap.forEach(device => {
            if (categories[device.type]) {
                categories[device.type].devices.push(device);
            }
        });
        return Object.values(categories).filter(c => c.devices.length > 0);
    }, [allDevicesMap, t]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-20rem)]">
            <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline"><PencilRuler className="mr-2"/> {t.drawWall}</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-2"/> {t.savePlan}
                    </Button>
                     <Button onClick={handleReset} variant="destructive">
                        <RefreshCw className="mr-2"/> {t.resetPlan}
                    </Button>
                </div>
                <div
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="relative w-full h-full bg-muted/30 rounded-lg overflow-hidden cursor-crosshair"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.2) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                >
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {walls.map(wall => (
                            <line
                                key={wall.id}
                                x1={wall.start.x}
                                y1={wall.start.y}
                                x2={wall.end.x}
                                y2={wall.end.y}
                                stroke="hsl(var(--foreground))"
                                strokeWidth="4"
                            />
                        ))}
                        {currentWall && (
                            <line
                                x1={currentWall.start.x}
                                y1={currentWall.start.y}
                                x2={currentWall.end.x}
                                y2={currentWall.end.y}
                                stroke="hsl(var(--primary))"
                                strokeWidth="4"
                                strokeDasharray="5,5"
                            />
                        )}
                    </svg>
                    {placedDevices.map(device => {
                        const baseDevice = allDevicesMap.get(device.deviceId);
                        if (!baseDevice) return null;
                        return (
                            <div key={device.instanceId} className="absolute p-1 bg-background border rounded-md shadow-lg" style={{ left: device.x, top: device.y, transform: 'translate(-50%, -50%)' }}>
                                <DeviceIcon type={baseDevice.type} className="h-5 w-5"/>
                            </div>
                        )
                    })}
                </div>
            </div>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>{t.devices}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-2">
                    <ScrollArea className="h-full">
                        <div className="space-y-4 p-2">
                            {deviceCategories.map(category => (
                                <div key={category.label}>
                                    <h4 className="font-semibold text-sm mb-2">{category.label}</h4>
                                    <div className="space-y-2">
                                        {category.devices.map(device => (
                                            <div
                                                key={device.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, device.id)}
                                                className="flex items-center gap-2 p-2 bg-muted/50 rounded-md cursor-grab active:cursor-grabbing"
                                            >
                                                <DeviceIcon type={device.type} className="h-4 w-4 text-muted-foreground"/>
                                                <span className="text-xs font-medium">{device.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
