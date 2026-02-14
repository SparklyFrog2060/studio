
'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
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

const PROTOCOL_COLORS: Record<string, string> = {
  matter: 'hsl(var(--chart-1))',
  zigbee: 'hsl(var(--chart-2))',
  tuya: 'hsl(var(--chart-3))',
  other_app: 'hsl(var(--chart-4))',
  bluetooth: 'hsl(var(--chart-5))',
};

const getDeviceProtocol = (device: any): Connectivity | undefined => {
    return device.connectivity;
}

export default function MindMapView({ floors, rooms, sensors, switches, lighting, otherDevices, voiceAssistants, activeGateways }: MindMapViewProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({});
  const [lines, setLines] = useState<Line[]>([]);

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    // Calculate on mount and on resize
    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    const observer = new ResizeObserver(calculatePositions);
    if(containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => {
        window.removeEventListener('resize', calculatePositions);
        if(containerRef.current) {
            observer.unobserve(containerRef.current);
        }
    };
  }, [floors, rooms, sensors, switches, lighting, otherDevices, voiceAssistants, activeGateways]);
  
  useLayoutEffect(() => {
      if (Object.keys(nodePositions).length === 0) return;

      const newLines: Line[] = [];

      const allAssignedDevices = rooms.flatMap(room => [
        ...room.sensorIds.map(id => sensors.find(d => d.id === id)),
        ...room.switchIds.map(id => switches.find(d => d.id === id)),
        ...room.lightingIds.map(id => lighting.find(d => d.id === id)),
        ...room.otherDeviceIds.map(id => otherDevices.find(d => d.id === id)),
      ]).filter((d): d is Sensor | Switch | Lighting | OtherDevice => !!d);

      const targetNodes = new Set<string>();

      allAssignedDevices.forEach(device => {
          const protocol = device.connectivity;
          if (!protocol) return;

          let targetNodeId: string | null = null;
          
          if (protocol === 'matter' || protocol === 'zigbee') {
              const gateway = activeGateways.find(g => ('connectivity' in g ? g.connectivity : g.gatewayProtocols || []).includes(protocol));
              if (gateway) {
                  targetNodeId = gateway.id;
              }
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
                  color: PROTOCOL_COLORS[protocol] || 'gray'
              });
              targetNodes.add(targetNodeId);
          }
      });
      
      // Connect active gateways that might not have devices yet
      activeGateways.forEach(g => {
        targetNodes.add(g.id);
      });
      
      const hardcodedNodes = ['cloud_tuya', 'local_other_app', 'local_bluetooth'];
      hardcodedNodes.forEach(nodeId => {
        if(newLines.some(line => line.to === nodeId)) {
            targetNodes.add(nodeId);
        }
      });

      targetNodes.forEach(targetId => {
          newLines.push({
              from: targetId,
              to: 'home_assistant',
              color: 'hsl(var(--muted-foreground))'
          });
      });

      setLines(newLines);

  }, [rooms, sensors, switches, lighting, otherDevices, activeGateways, nodePositions]);

  const allDevicesMap = new Map([
    ...sensors.map(d => [d.id, { ...d, type: 'sensor' }]),
    ...switches.map(d => [d.id, { ...d, type: 'switch' }]),
    ...lighting.map(d => [d.id, { ...d, type: 'lighting' }]),
    ...otherDevices.map(d => [d.id, { ...d, type: 'otherDevice' }]),
    ...voiceAssistants.map(d => [d.id, { ...d, type: 'voiceAssistant' }]),
  ]);

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
  
  const connectivityProtocolsInUse = Array.from(new Set(
      [...sensors, ...switches, ...lighting, ...otherDevices].map(d => d.connectivity)
  ));

  const getConnectivityNode = (protocol: Connectivity) => {
      if (protocol === 'matter' || protocol === 'zigbee') {
          const gateway = activeGateways.find(g => 'connectivity' in g ? g.connectivity.includes(protocol) : g.gatewayProtocols?.includes(protocol));
          return gateway ? { id: gateway.id, name: gateway.name, icon: <Router className="h-6 w-6" />, protocol } : null;
      }
      if (protocol === 'tuya') return { id: 'cloud_tuya', name: t.tuyaCloud, icon: <Cloud className="h-6 w-6" />, protocol };
      if (protocol === 'other_app') return { id: 'local_other_app', name: t.localIntegration, icon: <Cloud className="h-6 w-6" />, protocol };
      if (protocol === 'bluetooth') return { id: 'local_bluetooth', name: 'Bluetooth', icon: <Cloud className="h-6 w-6" />, protocol };
      return null;
  }
  
  const activeConnectivityNodes = [...new Set(connectivityProtocolsInUse.map(p => getConnectivityNode(p)?.id))]
    .map(id => {
        const p = connectivityProtocolsInUse.find(p => getConnectivityNode(p)?.id === id)
        if (p) return getConnectivityNode(p)
        return null;
    })
    .filter(Boolean) as {id: string, name: string, icon: JSX.Element, protocol: string}[];

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
            {/* Top Level Nodes */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
                 <div ref={el => nodeRefs.current['home_assistant'] = el} className="flex flex-col items-center gap-2 p-4 bg-background rounded-full shadow-lg border-2 border-primary">
                    <Home className="h-8 w-8 text-primary" />
                    <span className="font-bold text-sm">Home Assistant</span>
                </div>
            </div>

            <div className="flex items-start justify-center gap-8 flex-wrap">
                 {activeConnectivityNodes.map(node => (
                    <div key={node.id} ref={el => nodeRefs.current[node.id] = el} className="flex flex-col items-center text-center gap-2 p-3 bg-background rounded-lg shadow-md w-28">
                        {node.icon}
                        <span className="font-semibold text-xs">{node.name}</span>
                        <Badge variant="secondary" className="capitalize">{node.protocol}</Badge>
                    </div>
                 ))}
            </div>

            {/* Floors */}
            <div className="w-full flex flex-col gap-8 items-stretch">
                {floors.map(floor => (
                    <Card key={floor.id} className="p-4 bg-background/50 backdrop-blur-sm">
                        <CardHeader className="p-2">
                            <CardTitle>{floor.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 flex flex-wrap gap-4 justify-center">
                            {rooms.filter(r => r.floorId === floor.id).map(room => (
                                <Card key={room.id} className="p-3 min-w-[200px] bg-background">
                                    <CardHeader className="p-1">
                                        <CardTitle className="text-base">{room.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-1 flex flex-col gap-2 mt-2">
                                        {[...room.sensorIds, ...room.switchIds, ...room.lightingIds, ...room.otherDeviceIds, ...room.voiceAssistantIds].map(deviceId => {
                                            const device = allDevicesMap.get(deviceId);
                                            if (!device) return null;
                                            const protocol = getDeviceProtocol(device);
                                            return (
                                                <div key={device.id} ref={el => nodeRefs.current[device.id] = el} className="flex items-center gap-2 p-1.5 bg-muted rounded-md text-xs">
                                                    {renderDeviceIcon(device.type)}
                                                    <span className="flex-1">{device.name}</span>
                                                    {protocol && <Badge variant="outline" style={{borderColor: PROTOCOL_COLORS[protocol]}} className="text-xs capitalize">{protocol}</Badge>}
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
