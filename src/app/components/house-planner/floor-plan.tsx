
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { BaseDevice, Floor, Wall, FloorLayout, Room, RoomDevice } from '@/app/lib/types';
import { useLocale } from '../locale-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Thermometer, ToggleRight, Lightbulb, Box, Mic, PencilRuler, Save, RefreshCw, Shapes, Eraser, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddRoomFromPlanDialog from './add-room-from-plan-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const SNAP_THRESHOLD = 10;
const GRID_SIZE = 20;

export default function FloorPlan({ floor, rooms, allDevicesMap, onSaveLayout, onAddRoom, onUpdateRoom, isSaving }: FloorPlanProps) {
    const { t } = useLocale();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [walls, setWalls] = useState<Wall[]>(floor.layout?.walls || []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentShape, setCurrentShape] = useState<{ start: {x:number, y:number}, end: {x:number, y:number} } | null>(null);
    const [selectedDeviceForPlacing, setSelectedDeviceForPlacing] = useState<string | null>(null);
    const [mode, setMode] = useState<PlanMode>('draw-wall');
    
    const [polyRoomPoints, setPolyRoomPoints] = useState<{x: number, y: number}[]>([]);
    const [isNamingRoom, setIsNamingRoom] = useState(false);
    const [newRoomData, setNewRoomData] = useState<{ bounds: Room['bounds'], polygon: Room['polygon'] } | null>(null);
    
    const [snapIndicatorPos, setSnapIndicatorPos] = useState<{ x: number, y: number } | null>(null);
    const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
    
    const snapToGrid = (pos: { x: number, y: number }): { x: number, y: number } => {
        return {
            x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
        };
    };

    const findSnapPoint = (pos: { x: number; y: number }, skipGrid: boolean = false): { x: number; y: number } => {
        let closestPoint = pos;
        let minDistance = SNAP_THRESHOLD;

        for (const wall of walls) {
            const distStart = Math.hypot(pos.x - wall.start.x, pos.y - wall.start.y);
            if (distStart < minDistance) {
                minDistance = distStart;
                closestPoint = wall.start;
            }
            const distEnd = Math.hypot(pos.x - wall.end.x, pos.y - wall.end.y);
            if (distEnd < minDistance) {
                minDistance = distEnd;
                closestPoint = wall.end;
            }
        }
        
        if (closestPoint !== pos) return closestPoint;
        if (skipGrid) return pos;
        return snapToGrid(pos);
    };

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
            
            if (dx === 0 && dy === 0) {
                const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
                if (dist < minDistance) { minDistance = dist; closestWall = wall; }
                continue;
            }
            
            const t = ((pos.x - start.x) * dx + (pos.y - start.y) * dy) / (dx * dx + dy * dy);
            
            let closestPoint;
            if (t < 0) closestPoint = start;
            else if (t > 1) closestPoint = end;
            else closestPoint = { x: start.x + t * dx, y: start.y + t * dy };
            
            const dist = Math.hypot(pos.x - closestPoint.x, pos.y - closestPoint.y);
            
            if (dist < minDistance) { minDistance = dist; closestWall = wall; }
        }
        return closestWall;
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getEventCoordinates(e);

        if (mode === 'delete-wall') {
            e.preventDefault();
            const wallToDelete = findClosestWall(pos);
            if (wallToDelete) setWalls(prev => prev.filter(w => w.id !== wallToDelete.id));
            return;
        }

        if (mode === 'place-device' && selectedDeviceForPlacing) {
            e.preventDefault();
            const targetRoom = rooms.find(r => r.bounds && pos.x >= r.bounds.x && pos.x <= r.bounds.x + r.bounds.width && pos.y >= r.bounds.y && pos.y <= r.bounds.y + r.bounds.height);
            
            if (targetRoom) {
                const baseDevice = allDevicesMap.get(selectedDeviceForPlacing);
                if (!baseDevice) return;
                const newDevice: RoomDevice = {
                    instanceId: crypto.randomUUID(), deviceId: selectedDeviceForPlacing,
                    customName: baseDevice.name, isOwned: false, x: pos.x, y: pos.y,
                };
                onUpdateRoom(targetRoom.id, { devices: [...(targetRoom.devices || []), newDevice] });
            }
            setSelectedDeviceForPlacing(null);
            setMode('draw-wall');
            return;
        }

        if (mode === 'draw-room') {
            e.preventDefault();
            const snappedPos = findSnapPoint(pos);
            if (polyRoomPoints.length > 2 && Math.hypot(snappedPos.x - polyRoomPoints[0].x, snappedPos.y - polyRoomPoints[0].y) < SNAP_THRESHOLD) {
                const finalPoints = [...polyRoomPoints];
                const xCoords = finalPoints.map(p => p.x);
                const yCoords = finalPoints.map(p => p.y);
                const bounds = {
                    x: Math.min(...xCoords), y: Math.min(...yCoords),
                    width: Math.max(...xCoords) - Math.min(...xCoords),
                    height: Math.max(...yCoords) - Math.min(...yCoords),
                };
                setNewRoomData({ bounds, polygon: finalPoints });
                setIsNamingRoom(true);
                setPolyRoomPoints([]);
                setMode('draw-wall');
                return;
            }
            setPolyRoomPoints(prev => [...prev, snappedPos]);
            return;
        }

        if (mode === 'draw-wall') {
            e.preventDefault();
            const snappedPos = findSnapPoint(pos);
            setSnapIndicatorPos(snappedPos !== snapToGrid(pos) ? snappedPos : null);
            setIsDrawing(true);
            setStartPos(snappedPos);
            setCurrentShape({ start: snappedPos, end: snappedPos });
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getEventCoordinates(e);
        const snappedToPoint = findSnapPoint(pos, true);
        
        let finalPos = snapToGrid(pos);
        if (snappedToPoint !== pos) {
            finalPos = snappedToPoint;
        }
        setMousePos(finalPos);
        
        if (!isDrawing || !startPos) return;
        e.preventDefault();

        if (mode === 'draw-wall') {
            let endPos;
            const snappedWallEnd = findSnapPoint(pos, true);

            if (snappedWallEnd !== pos) {
                endPos = snappedWallEnd;
                setSnapIndicatorPos(endPos);
            } else {
                const gridPos = snapToGrid(pos);
                const dx = gridPos.x - startPos.x;
                const dy = gridPos.y - startPos.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    endPos = { x: gridPos.x, y: startPos.y };
                } else {
                    endPos = { x: startPos.x, y: gridPos.y };
                }
                setSnapIndicatorPos(null);
            }
            setCurrentShape({ start: startPos, end: endPos });
        }
    };

    const handlePointerUp = () => {
        if (mode === 'draw-wall') {
            if (!isDrawing || !currentShape) return;
            const { start, end } = currentShape;
            if (Math.hypot(end.x - start.x, end.y - start.y) > 5) {
                setWalls(prev => [...prev, { id: `wall-${Date.now()}`, start, end }]);
            }
            setIsDrawing(false);
            setStartPos(null);
            setCurrentShape(null);
            setSnapIndicatorPos(null);
        }
    };

    const handleNameRoom = (name: string) => {
        if (newRoomData) {
            onAddRoom({ name, floorId: floor.id, bounds: newRoomData.bounds, polygon: newRoomData.polygon });
        }
        setIsNamingRoom(false);
        setNewRoomData(null);
    };

    const handleDragStart = (e: React.DragEvent, deviceId: string) => {
        e.dataTransfer.setData('deviceId', deviceId);
        setMode('place-device');
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

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
                instanceId: crypto.randomUUID(), deviceId,
                customName: baseDevice.name, isOwned: false, x, y,
            };
            onUpdateRoom(targetRoom.id, { devices: [...(targetRoom.devices || []), newDevice] });
        }
        setMode('draw-wall');
    };

    const handleSave = () => onSaveLayout(floor.id, { walls });
    const handleReset = () => setWalls([]);

    const deviceCategories = useMemo(() => {
        const categories: Record<string, { label: string, devices: (BaseDevice & {type: string})[] }> = {
            'sensor': { label: t.sensors, devices: [] }, 'switch': { label: t.switches, devices: [] },
            'lighting': { label: t.lighting, devices: [] }, 'other-device': { label: t.otherDevices, devices: [] },
            'voice-assistant': { label: t.voiceAssistants, devices: [] }, 'gateway': { label: t.gateways, devices: [] },
        };
        allDevicesMap.forEach(device => { if (categories[device.type]) categories[device.type].devices.push(device); });
        return Object.values(categories).filter(c => c.devices.length > 0);
    }, [allDevicesMap, t]);

    const handleSelectDeviceForPlacing = (deviceId: string) => {
        setSelectedDeviceForPlacing(prev => {
            const newId = prev === deviceId ? null : deviceId;
            setMode(newId ? 'place-device' : 'draw-wall');
            return newId;
        });
    }

    const startDefineRoom = () => {
        setMode('draw-room');
        setPolyRoomPoints([]);
    }

    return (
        <>
        <Alert variant="destructive" className="md:hidden mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t.smallScreenTitle}</AlertTitle>
            <AlertDescription>{t.smallScreenWarning}</AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-20rem)]">
            <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={mode === 'draw-wall' ? 'secondary' : 'outline'} onClick={() => setMode('draw-wall')}><PencilRuler className="mr-2"/> {t.drawWall}</Button>
                    <Button variant={mode === 'draw-room' ? 'secondary' : 'outline'} onClick={startDefineRoom}><Shapes className="mr-2"/> {t.defineRoom}</Button>
                    <Button variant={mode === 'delete-wall' ? 'destructive' : 'outline'} onClick={() => setMode('delete-wall')}><Eraser className="mr-2"/> {t.deleteWall}</Button>
                    <Button onClick={handleSave} disabled={isSaving}><Save className="mr-2"/> {t.savePlan}</Button>
                    <Button onClick={handleReset} variant="destructive"><RefreshCw className="mr-2"/> {t.resetPlan}</Button>
                </div>
                <div
                    ref={canvasRef} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                    onDragOver={handleDragOver} onDrop={handleDrop}
                    className={cn(
                        "relative w-full h-full bg-muted/30 rounded-lg overflow-hidden",
                        mode === 'draw-wall' && 'cursor-crosshair', mode === 'draw-room' && 'cursor-crosshair',
                        mode === 'place-device' && 'cursor-copy', mode === 'delete-wall' && 'cursor-pointer'
                    )}
                    style={{
                        touchAction: 'none',
                        backgroundImage: 'linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.2) 1px, transparent 1px)',
                        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                    }}
                >
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {rooms.map(room => {
                            const path = room.polygon ? room.polygon.map(p => `${p.x},${p.y}`).join(' ') : (room.bounds ? `${room.bounds.x},${room.bounds.y} ${room.bounds.x+room.bounds.width},${room.bounds.y} ${room.bounds.x+room.bounds.width},${room.bounds.y+room.bounds.height} ${room.bounds.x},${room.bounds.y+room.bounds.height}` : '');
                            if (!path) return null;
                            return (
                                <g key={room.id}>
                                    <polygon
                                        points={path}
                                        fill="hsla(var(--primary) / 0.1)"
                                        stroke="hsla(var(--primary) / 0.5)"
                                        strokeWidth="2"
                                    />
                                    <text x={(room.bounds?.x || 0) + 5} y={(room.bounds?.y || 0) + 15} fill="hsl(var(--foreground))" fontSize="12" fontWeight="bold">
                                        {room.name}
                                    </text>
                                </g>
                            )
                        })}
                        {walls.map(wall => (
                            <line key={wall.id} x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke="hsl(var(--foreground))" strokeWidth="6" />
                        ))}
                        {currentShape && mode === 'draw-wall' && (
                            <line x1={currentShape.start.x} y1={currentShape.start.y} x2={currentShape.end.x} y2={currentShape.end.y} stroke="hsl(var(--primary))" strokeWidth="6" strokeDasharray="5,5" />
                        )}
                        {mode === 'draw-room' && polyRoomPoints.length > 0 && (
                            <g>
                                <polyline points={polyRoomPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="5,5"/>
                                {mousePos && <line x1={polyRoomPoints[polyRoomPoints.length-1].x} y1={polyRoomPoints[polyRoomPoints.length-1].y} x2={mousePos.x} y2={mousePos.y} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="5,5"/>}
                                {mousePos && polyRoomPoints.length > 2 && Math.hypot(mousePos.x - polyRoomPoints[0].x, mousePos.y - polyRoomPoints[0].y) < SNAP_THRESHOLD && (
                                    <circle cx={polyRoomPoints[0].x} cy={polyRoomPoints[0].y} r="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                                )}
                            </g>
                        )}
                        {snapIndicatorPos && <circle cx={snapIndicatorPos.x} cy={snapIndicatorPos.y} r="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
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
                <CardHeader><CardTitle>{t.devices}</CardTitle></CardHeader>
                <CardContent className="flex-grow overflow-hidden p-2">
                    <ScrollArea className="h-full" style={{ touchAction: 'pan-y' }}>
                        <div className="space-y-4 p-2">
                            {deviceCategories.map(category => (
                                <div key={category.label}>
                                    <h4 className="font-semibold text-sm mb-2">{category.label}</h4>
                                    <div className="space-y-2">
                                        {category.devices.map(device => (
                                            <div
                                                key={device.id} draggable onDragStart={(e) => handleDragStart(e, device.id)}
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
