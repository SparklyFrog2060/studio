
'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Floor, Room, Sensor, Switch, Lighting, OtherDevice, VoiceAssistant, Gateway, Connectivity, GatewayConnectivity } from '@/app/lib/types';
import { useLocale } from '../locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Router, Cloud, Thermometer, ToggleRight, Lightbulb, Box, Mic } from 'lucide-react';

interface MindMapViewProps {
  floors: Floor[];
  rooms: Room[];
  sensors: Sensor[];
  switches: Switch[];
  lighting: Lighting[];
  otherDevices: OtherDevice[];
  voiceAssistants: VoiceAssistant[];
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

const getDeviceProtocol = (device: { connectivity?: Connectivity | GatewayConnectivity[] }): Connectivity | undefined => {
    if (typeof device.connectivity === 'string') {
        return device.connectivity;
    }
    return undefined;
}

export default function MindMapView({ floors, rooms, sensors, switches, lighting, otherDevices, voiceAssistants, activeGateways }: MindMapViewProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allDevicesMap = useMemo(() => new Map([
    ...sensors.map(d => [d.id, { ...d, type: 'sensor' as const }]),
    ...switches.map(d => [d.id, { ...d, type: 'switch' as const }]),
    ...lighting.map(d => [d.id, { ...d, type: 'lighting' as const }]),
    ...otherDevices.map(d => [d.id, { ...d, type: 'otherDevice' as const }]),
    ...voiceAssistants.map(d => [d.id, { ...d, type: 'voiceAssistant' as const }]),
  ]), [sensors, switches, lighting, otherDevices, voiceAssistants]);
  
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

  const activeGatewayIds = useMemo(() => new Set(activeGateways.map(g => g.id)), [activeGateways]);

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
  }, [floors, rooms, sensors, switches, lighting, otherDevices, voiceAssistants, activeGateways]);
  
  const midLevelNodes = useMemo(() => {
    const nodes: UnifiedGatewayNode[] = [...gatewayNodes];

    const allAssignedDevices = rooms.flatMap(room => [
        ...(room.sensorIds || []).map(id => sensors.find(d => d.id === id)),
        ...(room.switchIds || []).map(id => switches.find(d => d.id === id)),
        ...(room.lightingIds || []).map(id => lighting.find(d => d.id === id)),
        ...(room.otherDeviceIds || []).map(id => otherDevices.find(d => d.id === id)),
    ]).filter((d): d is Sensor | Switch | Lighting | OtherDevice => !!d);

    const neededHardcodedProtocols = new Set<string>();
    allAssignedDevices.forEach(device => {
        if (device && ['tuya', 'other_app', 'bluetooth'].includes(device.connectivity)) {
            neededHardcodedProtocols.add(device.connectivity);
        }
    });

    if (neededHardcodedProtocols.has('tuya')) {
        nodes.push({ id: 'cloud_tuya', name: t.tuyaCloud, protocols: ['tuya'], icon: <Cloud className="h-6 w-6" /> });
    }
    if (neededHardcodedProtocols.has('other_app')) {
        nodes.push({ id: 'local_other_app', name: t.localIntegration, protocols: ['other_app'], icon: <Cloud className="h-6 w-6" /> });
    }
    if (neededHardcodedProtocols.has('bluetooth')) {
        nodes.push({ id: 'local_bluetooth', name: 'Bluetooth', protocols: ['bluetooth'], icon: <Cloud className="h-6 w-6" /> });
    }

    return Array.from(new Map(nodes.map(item => [item.id, item])).values());
  }, [gatewayNodes, rooms, sensors, switches, lighting, otherDevices, t.tuyaCloud, t.localIntegration]);

  useLayoutEffect(() => {
    if (Object.keys(nodePositions).length === 0) return;

    const newLines: Line[] = [];

    const uniqueDeviceIds = new Set(rooms.flatMap(room => [
        ...(room.sensorIds || []),
        ...(room.switchIds || []),
        ...(room.lightingIds || []),
        ...(room.otherDeviceIds || []),
    ]));

    uniqueDeviceIds.forEach(deviceId => {
        const device = allDevicesMap.get(deviceId);
        if (!device) return;

        const protocol = getDeviceProtocol(device as any);
        if (!protocol) return;

        let targetNodeId: string | undefined;
        
        if (protocol === 'matter' || protocol === 'zigbee') {
            const suitableGatewayNode = gatewayNodes.find(node => node.protocols.includes(protocol as GatewayConnectivity));
            targetNodeId = suitableGatewayNode?.id;
        } else if (protocol === 'tuya') {
            targetNodeId = 'cloud_tuya';
        } else if (protocol === 'other_app') {
            targetNodeId = 'local_other_app';
        } else if (protocol === 'bluetooth') {
            targetNodeId = 'local_bluetooth';
        }

        if (targetNodeId) {
            newLines.push({
                from: device.id,
                to: targetNodeId,
                color: PROTOCOL_COLORS[protocol] || 'gray',
            });
        }
    });


    midLevelNodes.forEach(node => {
        newLines.push({
            from: node.id,
            to: 'home_assistant',
            color: 'hsl(var(--muted-foreground))',
        });
    });

    setLines(newLines);
}, [nodePositions, rooms, allDevicesMap, midLevelNodes, gatewayNodes]);

  const renderDeviceIcon = (type: string) => {
      switch (type) {
          case 'sensor': return <Thermometer className="h-4 w-4" />;
          case 'switch': return <ToggleRight className="h-4 w-4" />;
          case 'lighting': return <Lightbulb className="h-4 w-4" />;
          case 'otherDevice': return <Box className="h-4 w-4" />;
          case 'voiceAssistant': return <Mic className="h-4 w-4" />;
          default: return null;
      }
  };

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
                                const deviceCounts = new Map<string, number>();
                                const allDeviceIdsInRoom = [
                                    ...(room.sensorIds || []),
                                    ...(room.switchIds || []),
                                    ...(room.lightingIds || []),
                                    ...(room.otherDeviceIds || []),
                                    ...(room.voiceAssistantIds || []),
                                ].filter(id => !activeGatewayIds.has(id));

                                for (const id of allDeviceIdsInRoom) {
                                    deviceCounts.set(id, (deviceCounts.get(id) || 0) + 1);
                                }

                                return (
                                <Card key={room.id} className="p-3 min-w-[200px] bg-background">
                                    <CardHeader className="p-1">
                                        <CardTitle className="text-base">{room.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-1 flex flex-col gap-2 mt-2">
                                        {Array.from(deviceCounts.entries()).map(([deviceId, count]) => {
                                            const device = allDevicesMap.get(deviceId);
                                            if (!device) return null;
                                            const protocol = getDeviceProtocol(device as any);
                                            return (
                                                <div key={deviceId} ref={el => { if (el) nodeRefs.current[deviceId] = el; }} className="flex items-center gap-2 p-1.5 bg-muted rounded-md text-xs">
                                                    {renderDeviceIcon(device.type)}
                                                    <span className="flex-1">{device.name}</span>
                                                    {count > 1 && <span className="font-bold text-muted-foreground">x{count}</span>}
                                                    {protocol && <Badge variant="outline" style={{borderColor: PROTOCOL_COLORS[protocol]}} className="text-xs capitalize">{protocol}</Badge>}
                                                </div>
                                            )
                                        })}
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

    