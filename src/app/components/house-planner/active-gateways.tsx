
"use client";

import { useLocale } from "@/app/components/locale-provider";
import type { Gateway, VoiceAssistant } from "@/app/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Router, Mic } from "lucide-react";
import { useMemo } from "react";

type Device = (Gateway & { deviceType: 'gateway' }) | (VoiceAssistant & { deviceType: 'voice-assistant' });

interface ActiveGatewaysProps {
  gateways: Gateway[];
  voiceAssistants: VoiceAssistant[];
}

export default function ActiveGateways({ gateways, voiceAssistants }: ActiveGatewaysProps) {
  const { t } = useLocale();

  const gatewayDevices = useMemo((): Device[] => {
    const regularGateways = (gateways || []).map(g => ({ ...g, deviceType: 'gateway' as const }));
    const assistantGateways = (voiceAssistants || []).filter(va => va.isGateway).map(va => ({ ...va, deviceType: 'voice-assistant' as const }));
    return [...regularGateways, ...assistantGateways];
  }, [gateways, voiceAssistants]);

  if (gatewayDevices.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 animate-in fade-in-0 duration-300">
      <CardHeader>
        <CardTitle>{t.activeGateways}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gatewayDevices.map(device => {
            const protocols = device.deviceType === 'gateway' ? device.connectivity : device.gatewayProtocols;
            return (
              <div key={`${device.deviceType}-${device.id}`} className="flex items-center gap-4 rounded-lg border p-4 bg-muted/40">
                {device.deviceType === 'gateway' ? (
                  <Router className="h-8 w-8 text-primary" />
                ) : (
                  <Mic className="h-8 w-8 text-primary" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{device.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(protocols || []).map(protocol => (
                      <Badge key={protocol} variant="outline" className="capitalize border-primary/50 text-primary">{protocol}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
