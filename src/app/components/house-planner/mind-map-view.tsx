'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Floor, Room, VoiceAssistant, Gateway, GatewayConnectivity, BaseDevice, Connectivity } from '@/app/lib/types';
import { useLocale } from '../locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Router, Cloud, Thermometer, ToggleRight, Lightbulb, Box, Mic, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MindMapViewProps {
  floors: Floor[];
  rooms: Room[];
  allDevicesMap: Map<string, BaseDevice & { type: string }>;
  activeGateways: (Gateway | VoiceAssistant)[];
}

interface Position {
  x: number;
  y: number;
}

interface Line {
  from: string;
  to: string;
  color: string;
}

interface UnifiedGatewayNode {
  id: string;
  name: string;
  protocols: GatewayConnectivity[];
  icon: JSX.Element;
}

const PROTOCOL_COLORS: Record<string, string> = {
  matter: 'hsl(var(--chart-1))',
  zigbee: 'hsl(var(--chart-2))',
  tuya: 'hsl(var(--chart-3))',
  other_app: 'hsl(var(--chart-4))',
  bluetooth: 'hsl(var(--chart-5))',
};

const getDeviceProtocol = (device: BaseDevice & {type: string}): Connectivity | undefined => {
    if ('connectivity' in device) {
        return (device as any).connectivity;
    }
    return undefined;
}

const DeviceIcon = ({ type, ...props }: {type: string} & React.ComponentProps<typeof Thermometer>) => {
    switch (type) {
        case 'sensor': return <Thermometer {...props} />;
        case 'switch': return <ToggleRight {...props} />;
        case 'lighting': return <Lightbulb {...props} />;
        case 'other-device': return <Box {...props} />;
        case 'voice-assistant': return <Mic {...props} />;
        default: return <Box {...props} />;
    }
};

export default function MindMapView({ floors, rooms, allDevicesMap, activeGateways }: MindMapViewProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hiddenRoomIds, setHiddenRoomIds] = useState<Set<string>>(new Set());

  const toggleRoomVisibility = (roomId: string) => {
    setHiddenRoomIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const gatewayNodes = useMemo((): UnifiedGatewayNode[] => {
    return activeGateways.map(gw => {
      if ('connectivity' in gw) { // It's a dedicated Gateway
        return {
          id: gw.id,
          name: gw.name,
          protocols: gw.connectivity,
          icon: <Router className="h-6 w-6" />,
        };
      }
      // It's a VoiceAssistant with gateway capabilities
      return {
        id: gw.id,
        name: gw.name,
        protocols: gw.gatewayProtocols || [],
        icon: <Mic className="h-6 w-6" />,
      };
    });
  }, [activeGateways]);

  useLayoutEffect(() => {
    const calculatePositions = () => {
        if (!containerRef.current) return;
        const newPositions: Record<string, Position> = {};
        const containerRect = containerRef.current.getBoundingClientRect();

        Object.keys(nodeRefs.current).forEach(id => {
            const el = nodeRefs.current[id];
            if (el) {
                const rect = el.getBoundingClientRect();
                newPositions[id] = {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                };
            }
        });
        setNodePositions(newPositions);
    };

    calculatePositions();
    const observer = new ResizeObserver(calculatePositions);
    const currentRef = containerRef.current;
    if (currentRef) {
        observer.observe(currentRef);
    }
    window.addEventListener('resize', calculatePositions);

    return () => {
        window.removeEventListener('resize', calculatePositions);
        if (currentRef) {
            observer.unobserve(currentRef);
        }
    };
  }, [floors, rooms, allDevicesMap, activeGateways]);
  
  const midLevelNodes = useMemo(() => {
    const nodes: UnifiedGatewayNode[] = [...gatewayNodes];

    const allAssignedDeviceProtocols = new Set<string>();
    rooms.forEach(room => {
        (room.devices || []).forEach(instance => {
            const device = allDevicesMap.get(instance.deviceId);
            if (device) {
                const protocol = getDeviceProtocol(device as any);
                if (protocol) {
                    allAssignedDeviceProtocols.add(protocol);
                }
            }
        });
    });

    if (allAssignedDeviceProtocols.has('tuya')) {
        nodes.push({ id: 'cloud_tuya', name: t.tuyaCloud, protocols: ['tuya'], icon: <Cloud className="h-6 w-6" /> });
    }
    if (allAssignedDeviceProtocols.has('other_app')) {
        nodes.push({ id: 'local_other_app', name: t.localIntegration, protocols: ['other_app'], icon: <Cloud className="h-6 w-6" /> });
    }
    if (allAssignedDeviceProtocols.has('bluetooth')) {
        nodes.push({ id: 'local_bluetooth', name: 'Bluetooth', protocols: ['bluetooth'], icon: <Cloud className="h-6 w-6" /> });
    }

    return Array.from(new Map(nodes.map(item => [item.id, item])).values());
  }, [gatewayNodes, rooms, allDevicesMap, t.tuyaCloud, t.localIntegration]);

  useLayoutEffect(() => {
    if (Object.keys(nodePositions).length === 0) return;

    const newLines: Line[] = [];

    rooms.forEach(room => {
        if (hiddenRoomIds.has(room.id)) return; // Don't draw lines for hidden rooms

        const protocolsInRoom = new Map<string, string>(); // Map protocol to a target gateway ID

        (room.devices || []).forEach(instance => {
            const device = allDevicesMap.get(instance.deviceId);
            if (!device) return;

            const protocol = getDeviceProtocol(device as any);
            if (!protocol) return;

            let targetNodeId: string | undefined;
            if (protocol === 'matter' || protocol === 'zigbee') {
                const suitableGateway = gatewayNodes.find(g => g.protocols.includes(protocol as GatewayConnectivity));
                targetNodeId = suitableGateway?.id;
            } else if (protocol === 'tuya') {
                targetNodeId = 'cloud_tuya';
            } else if (protocol === 'other_app') {
                targetNodeId = 'local_other_app';
            } else if (protocol === 'bluetooth') {
                targetNodeId = 'local_bluetooth';
            }

            if (targetNodeId) {
                protocolsInRoom.set(protocol, targetNodeId);
            }
        });
        
        protocolsInRoom.forEach((targetId, protocol) => {
            newLines.push({
                from: room.id, // Draw line from the room card
                to: targetId,
                color: PROTOCOL_COLORS[protocol] || 'gray',
            });
        });
    });

    midLevelNodes.forEach(node => {
        newLines.push({
            from: node.id,
            to: 'home_assistant',
            color: 'hsl(var(--muted-foreground))',
        });
    });

    setLines(newLines);
}, [nodePositions, rooms, allDevicesMap, midLevelNodes, gatewayNodes, hiddenRoomIds]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[80vh] p-4 bg-muted/30 rounded-lg overflow-auto">
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {lines.map((line, index) => {
                const fromPos = nodePositions[line.from];
                const toPos = nodePositions[line.to];
                if (!fromPos || !toPos) return null;
                return <line key={index} x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y} stroke={line.color} strokeWidth="2" />
            })}
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-16">
            <div className="flex items-center justify-center gap-8 flex-wrap">
                 <div ref={el => nodeRefs.current['home_assistant'] = el} className="flex flex-col items-center gap-2 p-4 bg-background rounded-full shadow-lg border-2 border-primary">
                    <Home className="h-8 w-8 text-primary" />
                    <span className="font-bold text-sm">Home Assistant</span>
                </div>
            </div>

            <div className="flex items-start justify-center gap-8 flex-wrap">
                 {midLevelNodes.map(node => (
                    <div key={node.id} ref={el => nodeRefs.current[node.id] = el} className="flex flex-col items-center text-center gap-2 p-3 bg-background rounded-lg shadow-md w-28">
                        {node.icon}
                        <span className="font-semibold text-xs">{node.name}</span>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {node.protocols.map(p => <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>)}
                        </div>
                    </div>
                 ))}
            </div>

            <div className="w-full flex flex-col gap-8 items-stretch">
                {floors.map(floor => (
                    <Card key={floor.id} className="p-4 bg-background/50 backdrop-blur-sm">
                        <CardHeader className="p-2">
                            <CardTitle>{floor.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 flex flex-wrap gap-4 justify-center">
                            {rooms.filter(r => r.floorId === floor.id).map(room => {
                                const isHidden = hiddenRoomIds.has(room.id);
                                return (
                                <Card 
                                    key={room.id} 
                                    ref={el => nodeRefs.current[room.id] = el} 
                                    className={cn(
                                        "p-3 min-w-[200px] bg-background transition-opacity",
                                        isHidden && "opacity-30"
                                    )}
                                >
                                    <CardHeader className="p-1 flex flex-row justify-between items-start">
                                        <CardTitle className="text-base">{room.name}</CardTitle>
                                         <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6" 
                                            onClick={(e) => { e.stopPropagation(); toggleRoomVisibility(room.id); }}
                                        >
                                            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </CardHeader>
                                    <CardContent className={cn("p-1 flex flex-col gap-2 mt-2 transition-opacity", isHidden && "opacity-0")}>
                                        {(room.devices || []).map(instance => {
                                            const device = allDevicesMap.get(instance.deviceId);
                                            if (!device) return null;
                                            const protocol = getDeviceProtocol(device as any);
                                            return (
                                                <div key={instance.instanceId} className="flex items-center gap-2 p-1.5 bg-muted rounded-md text-xs">
                                                    <DeviceIcon type={device.type} className="h-4 w-4 flex-shrink-0"/>
                                                    <span className="flex-1 truncate" title={instance.customName}>{instance.customName}</span>
                                                    {protocol && <Badge variant="outline" style={{borderColor: PROTOCOL_COLORS[protocol]}} className="text-xs capitalize">{protocol}</Badge>}
                                                </div>
                                            )
                                        })}
                                        {(room.devices || []).length === 0 && (
                                            <p className="text-xs text-muted-foreground">{t.noDevicesAssigned}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )})}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
