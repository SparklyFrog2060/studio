
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Gauge, CheckCircle, AlertTriangle, XCircle, Link as LinkIcon, Pencil, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocale } from "@/app/components/locale-provider";
import type { Switch, Connectivity } from "@/app/lib/types";

interface SwitchCardProps {
  switchItem: Switch;
  onDelete: (id: string) => void;
  onEdit: (switchItem: Switch) => void;
}

export default function SwitchCard({ switchItem, onDelete, onEdit }: SwitchCardProps) {
  const { t } = useLocale();

  const getEvaluationIcon = (evaluation: 'good' | 'medium' | 'bad') => {
    switch (evaluation) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };
  
  const getConnectivityInfo = (connectivity: Connectivity) => {
    switch (connectivity) {
      case 'matter':
        return { name: 'Matter', evaluation: 'good' as const };
      case 'zigbee':
        return { name: 'Zigbee', evaluation: 'good' as const };
      case 'tuya':
        return { name: 'Tuya', evaluation: 'medium' as const };
      case 'other_app':
        return { name: 'Inna Aplikacja', evaluation: 'bad' as const };
      case 'bluetooth':
        return { name: 'Bluetooth', evaluation: 'bad' as const };
      default:
        return { name: '', evaluation: 'medium' as const };
    }
  };

  const getHAIcon = (score: number) => {
    if (score >= 5) {
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
    }
    if (score >= 3) {
        return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
    }
    return <ShieldX className="h-5 w-5 text-red-500" />;
  };

  const getTypeInfo = (type: 'wall' | 'in-wall') => {
      return type === 'wall' ? t.wall : t.inWall;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <CardTitle className="text-xl">{switchItem.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{switchItem.brand}</p>
          </div>
           <p className="text-xs text-muted-foreground">{t.type}: {getTypeInfo(switchItem.type)}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {switchItem.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(switchItem)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t.edit}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t.delete}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteConfirmation}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(switchItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.confirm}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <h4 className="font-semibold">{t.technicalSpecs}</h4>
        <div className="space-y-2">
          {switchItem.price > 0 && (
            <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/40">
                <div className="flex items-center gap-2">
                    {getEvaluationIcon(switchItem.priceEvaluation)}
                    <span>{t.price}:</span>
                    <span className="font-semibold">{switchItem.price.toFixed(2)} zł</span>
                </div>
                {switchItem.link && (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <a href={switchItem.link} target="_blank" rel="noopener noreferrer" aria-label="Product link">
                            <LinkIcon className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>
          )}
          {switchItem.connectivity && (
            <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/40">
              <div className="flex items-center gap-2">
                {getEvaluationIcon(getConnectivityInfo(switchItem.connectivity).evaluation)}
                <span>{t.connectivity}:</span>
                <span className="font-semibold">{getConnectivityInfo(switchItem.connectivity).name}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/40">
              <div className="flex items-center gap-2">
                {getHAIcon(switchItem.homeAssistantCompatibility)}
                <span>{t.homeAssistantCompatibility}:</span>
                <span className="font-semibold">{switchItem.homeAssistantCompatibility}/5</span>
              </div>
          </div>
          {switchItem.specs.map(spec => (
            <div key={spec.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/40">
                <div className="flex items-center gap-2">
                    {getEvaluationIcon(spec.evaluation)}
                    <span>{spec.name}:</span>
                    <span className="font-semibold">{spec.value}</span>
                </div>
            </div>
          ))}
          {switchItem.specs.length === 0 && switchItem.price <= 0 && <p className="text-sm text-muted-foreground">Brak specyfikacji.</p>}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 text-lg font-bold">
            <Gauge className="h-6 w-6 text-primary" />
            <span>{t.score}:</span>
            <span className="text-2xl text-primary">{switchItem.score.toFixed(1)}/10</span>
        </div>
      </CardFooter>
    </Card>
  );
}
