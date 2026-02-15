
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { BaseDevice, Floor, Wall, FloorLayout, Room, RoomDevice } from '@/app/lib/types';
import { useLocale } from '../locale-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Thermometer, ToggleRight, Lightbulb, Box, Mic, PencilRuler, Save, RefreshCw, CaseUpper, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddRoomFromPlanDialog from './add-room-from-plan-dialog';

type PlanMode = 'draw-wall' | 'draw-room' | 'place-device' | 'delete-wall';

const DeviceIcon = ({ type, ...props }: { type: string } & React.ComponentProps<typeof Thermometer>) => {
    switch (type) {
        case 'sensor': return <Thermometer {...props} />;
        case 'switch': return <ToggleRight {...props} />;
        case 'lighting': return <Lightbulb {...props} />;
        case 'other-device': return <Box {...props} />;
        case 'voice-assistant': return <Mic {...props} />;
        case 'gateway': return <Box {...props} />;
        default: return <Box {...props} />;
    }
};

interface FloorPlanProps {
    floor: Floor;
    rooms: Room[];
    allDevicesMap: Map<string, BaseDevice & { type: string }>;
    onSaveLayout: (floorId: string, layout: FloorLayout) => void;
    onAddRoom: (room: Omit<Room, 'id' | 'createdAt' | 'devices'>) => void;
    onUpdateRoom: (roomId: string, data: Partial<Omit<Room, 'id'>>) => void;
    isSaving: boolean;
}

export default function FloorPlan({ floor, rooms, allDevicesMap, onSaveLayout, onAddRoom, onUpdateRoom, isSaving }: FloorPlanProps) {
    const { t } = useLocale();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [walls, setWalls] = useState<Wall[]>(floor.layout?.walls || []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentShape, setCurrentShape] = useState<{ start: {x:number, y:number}, end: {x:number, y:number} } | null>(null);
    const [selectedDeviceForPlacing, setSelectedDeviceForPlacing] = useState<string | null>(null);
    const [mode, setMode] = useState<PlanMode>('draw-wall');
    const [isNamingRoom, setIsNamingRoom] = useState(false);
    const [newRoomBounds, setNewRoomBounds] = useState<{x:number,y:number,width:number,height:number} | null>(null);

    const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        const touch = (e as React.TouchEvent).touches?.[0];
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const findClosestWall = (pos: { x: number, y: number }): Wall | null => {
        let closestWall: Wall | null = null;
        let minDistance = 15; // Click threshold of 15px

        for (const wall of walls) {
            const { start, end } = wall;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            
            if (dx === 0 && dy === 0) { // Wall is a point
                const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestWall = wall;
                }
                continue;
            }
            
            const t = ((pos.x - start.x) * dx + (pos.y - start.y) * dy) / (dx * dx + dy * dy);
            
            let closestPoint;
            if (t < 0) {
                closestPoint = start;
            } else if (t > 1) {
                closestPoint = end;
            } else {
                closestPoint = { x: start.x + t * dx, y: start.y + t * dy };
            }
            
            const dist = Math.hypot(pos.x - closestPoint.x, pos.y - closestPoint.y);
            
            if (dist < minDistance) {
                minDistance = dist;
                closestWall = wall;
            }
        }
        return closestWall;
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getEventCoordinates(e);

        if (mode === 'delete-wall') {
            e.preventDefault();
            const wallToDelete = findClosestWall(pos);
            if (wallToDelete) {
                setWalls(prev => prev.filter(w => w.id !== wallToDelete.id));
            }
            return;
        }

        if (mode === 'place-device' && selectedDeviceForPlacing) {
            e.preventDefault();
            const targetRoom = rooms.find(r => r.bounds && pos.x >= r.bounds.x && pos.x <= r.bounds.x + r.bounds.width && pos.y >= r.bounds.y && pos.y <= r.bounds.y + r.bounds.height);
            
            if (targetRoom) {
                const baseDevice = allDevicesMap.get(selectedDeviceForPlacing);
                if (!baseDevice) return;
                
                const newDevice: RoomDevice = {
                    instanceId: crypto.randomUUID(),
                    deviceId: selectedDeviceForPlacing,
                    customName: baseDevice.name,
                    isOwned: false,
                    x: pos.x,
                    y: pos.y,
                };

                const updatedDevices = [...(targetRoom.devices || []), newDevice];
                onUpdateRoom(targetRoom.id, { devices: updatedDevices });
            }

            setSelectedDeviceForPlacing(null);
            setMode('draw-wall');
            return;
        }

        e.preventDefault();
        setIsDrawing(true);
        setStartPos(pos);
        setCurrentShape({ start: pos, end: pos });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !startPos) return;
        e.preventDefault();
        const pos = getEventCoordinates(e);
        setCurrentShape({ start: startPos, end: pos });
    };

    const handlePointerUp = () => {
        if (!isDrawing || !currentShape) return;
        const { start, end } = currentShape;

        if (mode === 'draw-wall') {
             if (Math.hypot(end.x - start.x, end.y - start.y) > 5) {
                setWalls(prev => [...prev, { id: `wall-${Date.now()}`, start, end }]);
            }
        } else if (mode === 'draw-room') {
            const bounds = {
                x: Math.min(start.x, end.x),
                y: Math.min(start.y, end.y),
                width: Math.abs(start.x - end.x),
                height: Math.abs(start.y - end.y),
            };
            if (bounds.width > 10 && bounds.height > 10) {
                setNewRoomBounds(bounds);
                setIsNamingRoom(true);
            }
        }
       
        setIsDrawing(false);
        setStartPos(null);
        setCurrentShape(null);
    };

    const handleNameRoom = (name: string) => {
        if (newRoomBounds) {
            onAddRoom({ name, floorId: floor.id, bounds: newRoomBounds });
        }
        setIsNamingRoom(false);
        setNewRoomBounds(null);
        setMode('draw-wall');
    };

    const handleDragStart = (e: React.DragEvent, deviceId: string) => {
        e.dataTransfer.setData('deviceId', deviceId);
        setMode('place-device');
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
        
        const targetRoom = rooms.find(r => r.bounds && x >= r.bounds.x && x <= r.bounds.x + r.bounds.width && y >= r.bounds.y && y <= r.bounds.y + r.bounds.height);

        if (targetRoom) {
            const baseDevice = allDevicesMap.get(deviceId);
            if (!baseDevice) return;
            
            const newDevice: RoomDevice = {
                instanceId: crypto.randomUUID(),
                deviceId: deviceId,
                customName: baseDevice.name,
                isOwned: false,
                x: x,
                y: y,
            };
            const updatedDevices = [...(targetRoom.devices || []), newDevice];
            onUpdateRoom(targetRoom.id, { devices: updatedDevices });
        } else {
             // Handle drop outside a room if needed
        }

        setMode('draw-wall');
    };

    const handleSave = () => {
        onSaveLayout(floor.id, { walls });
    };

    const handleReset = () => {
        setWalls([]);
        // Potentially clear rooms or devices on plan
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

    const handleSelectDeviceForPlacing = (deviceId: string) => {
        setSelectedDeviceForPlacing(prev => {
            const newId = prev === deviceId ? null : deviceId;
            setMode(newId ? 'place-device' : 'draw-wall');
            return newId;
        });
    }

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-20rem)]">
            <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={mode === 'draw-wall' ? 'secondary' : 'outline'} onClick={() => setMode('draw-wall')}><PencilRuler className="mr-2"/> {t.drawWall}</Button>
                    <Button variant={mode === 'draw-room' ? 'secondary' : 'outline'} onClick={() => setMode('draw-room')}><CaseUpper className="mr-2"/> {t.defineRoom}</Button>
                    <Button variant={mode === 'delete-wall' ? 'destructive' : 'outline'} onClick={() => setMode('delete-wall')}><Eraser className="mr-2"/> {t.deleteWall}</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-2"/> {t.savePlan}
                    </Button>
                     <Button onClick={handleReset} variant="destructive">
                        <RefreshCw className="mr-2"/> {t.resetPlan}
                    </Button>
                </div>
                <div
                    ref={canvasRef}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "relative w-full h-full bg-muted/30 rounded-lg overflow-hidden",
                        mode === 'draw-wall' && 'cursor-crosshair',
                        mode === 'draw-room' && 'cursor-crosshair',
                        mode === 'place-device' && 'cursor-copy',
                        mode === 'delete-wall' && 'cursor-pointer'
                    )}
                    style={{
                        touchAction: 'none',
                        backgroundImage:
                            'linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.2) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                >
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {rooms.map(room => room.bounds && (
                            <g key={room.id}>
                                <rect 
                                    x={room.bounds.x} 
                                    y={room.bounds.y} 
                                    width={room.bounds.width} 
                                    height={room.bounds.height}
                                    fill="hsla(var(--primary) / 0.1)"
                                    stroke="hsla(var(--primary) / 0.5)"
                                    strokeWidth="2"
                                />
                                <text x={room.bounds.x + 5} y={room.bounds.y + 15} fill="hsl(var(--foreground))" fontSize="12" fontWeight="bold">
                                    {room.name}
                                </text>
                            </g>
                        ))}
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
                        {currentShape && mode === 'draw-wall' && (
                            <line
                                x1={currentShape.start.x}
                                y1={currentShape.start.y}
                                x2={currentShape.end.x}
                                y2={currentShape.end.y}
                                stroke="hsl(var(--primary))"
                                strokeWidth="4"
                                strokeDasharray="5,5"
                            />
                        )}
                        {currentShape && mode === 'draw-room' && (
                             <rect
                                x={Math.min(currentShape.start.x, currentShape.end.x)}
                                y={Math.min(currentShape.start.y, currentShape.end.y)}
                                width={Math.abs(currentShape.start.x - currentShape.end.x)}
                                height={Math.abs(currentShape.start.y - currentShape.end.y)}
                                stroke="hsl(var(--primary))"
                                strokeWidth="2"
                                fill="hsla(var(--primary) / 0.2)"
                                strokeDasharray="5,5"
                            />
                        )}
                    </svg>
                    {rooms.flatMap(room => room.devices || []).map(device => {
                        const baseDevice = allDevicesMap.get(device.deviceId);
                        if (!baseDevice || typeof device.x === 'undefined' || typeof device.y === 'undefined') return null;
                        return (
                            <div key={device.instanceId} className="absolute p-1 bg-background border rounded-md shadow-lg pointer-events-none" style={{ left: device.x, top: device.y, transform: 'translate(-50%, -50%)' }}>
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
                    <ScrollArea className="h-full" style={{ touchAction: 'pan-y' }}>
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
                                                onClick={() => handleSelectDeviceForPlacing(device.id)}
                                                className={cn(
                                                    "flex items-center gap-2 p-2 bg-muted/50 rounded-md cursor-pointer active:cursor-grabbing",
                                                    selectedDeviceForPlacing === device.id && "ring-2 ring-primary"
                                                )}
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
        <AddRoomFromPlanDialog 
            isOpen={isNamingRoom}
            onOpenChange={setIsNamingRoom}
            onSubmit={handleNameRoom}
        />
        </>
    );
}
