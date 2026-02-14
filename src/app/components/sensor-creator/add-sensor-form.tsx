
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle, Trash2, Gauge } from "lucide-react";
import { useLocale } from "@/app/components/locale-provider";
import type { Sensor } from "@/app/lib/types";

const specSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nazwa jest wymagana"),
  value: z.string().min(1, "Wartość jest wymagana"),
  evaluation: z.enum(["good", "medium", "bad"]),
});

const formSchema = z.object({
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki."),
  brand: z.string().min(1, "Marka jest wymagana."),
  link: z.string().url("Niepoprawny URL.").optional().or(z.literal('')),
  price: z.coerce.number().min(0, "Cena nie może być ujemna."),
  priceEvaluation: z.enum(["good", "medium", "bad"]),
  connectivity: z.enum(["matter", "zigbee", "tuya", "other_app", "bluetooth"]),
  tags: z.array(z.string()),
  specs: z.array(specSchema),
});

type SensorFormData = z.infer<typeof formSchema>;

interface AddSensorFormProps {
  onAddSensor: (data: Omit<Sensor, "id" | "createdAt">) => void;
  isSaving: boolean;
}

const PREDEFINED_TAGS = ["Temperatura", "Wilgotność", "Ruch", "Jakość powietrza", "Wyciek wody"];

export default function AddSensorForm({ onAddSensor, isSaving }: AddSensorFormProps) {
  const { t } = useLocale();
  const [tagInput, setTagInput] = useState("");
  const [score, setScore] = useState(0);

  const form = useForm<SensorFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      link: "",
      price: 0,
      priceEvaluation: "medium",
      connectivity: "zigbee",
      tags: [],
      specs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specs",
  });
  
  const specs = form.watch("specs");
  const priceEvaluation = form.watch("priceEvaluation");
  const connectivity = form.watch("connectivity");

  useEffect(() => {
    const totalSpecPoints = specs.reduce((sum, spec) => {
      if (spec.evaluation === "good") return sum + 3;
      if (spec.evaluation === "medium") return sum + 2;
      if (spec.evaluation === "bad") return sum + 1;
      return sum;
    }, 0);

    let pricePoints = 0;
    if (priceEvaluation === "good") pricePoints = 3;
    if (priceEvaluation === "medium") pricePoints = 2;
    if (priceEvaluation === "bad") pricePoints = 1;

    let connectivityPoints = 0;
    if (connectivity === "matter" || connectivity === "zigbee") connectivityPoints = 3;
    else if (connectivity === "tuya") connectivityPoints = 2;
    else if (connectivity === "other_app" || connectivity === "bluetooth") connectivityPoints = 1;
    
    const totalPoints = totalSpecPoints + pricePoints + connectivityPoints;
    const maxPoints = specs.length * 3 + 3 + 3;
    const calculatedScore = maxPoints > 0 ? (totalPoints / maxPoints) * 10 : 0;
    setScore(Math.round(calculatedScore * 10) / 10);
  }, [specs, priceEvaluation, connectivity]);


  const handleAddTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !form.getValues("tags").includes(newTag)) {
      form.setValue("tags", [...form.getValues("tags"), newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove)
    );
  };
  
  const onSubmit = (data: SensorFormData) => {
    onAddSensor({ ...data, score });
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.addSensor}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sensorName}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.sensorNamePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.brand}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.brandPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.link}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.linkPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div>
              <Label>{t.price}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" placeholder={t.pricePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceEvaluation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4 items-center h-full"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="good" />
                            </FormControl>
                            <FormLabel className="font-normal text-green-600">{t.good}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="font-normal text-yellow-600">{t.medium}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bad" />
                            </FormControl>
                            <FormLabel className="font-normal text-red-600">{t.bad}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="connectivity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t.connectivity}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-x-4 gap-y-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="matter" /></FormControl>
                        <FormLabel className="font-normal">Matter</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="zigbee" /></FormControl>
                        <FormLabel className="font-normal">Zigbee</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="tuya" /></FormControl>
                        <FormLabel className="font-normal">Tuya</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="other_app" /></FormControl>
                        <FormLabel className="font-normal">Inna Aplikacja</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="bluetooth" /></FormControl>
                        <FormLabel className="font-normal">Bluetooth</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{t.tags}</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(e.currentTarget.value);
                    }
                  }}
                  placeholder={t.addTagPlaceholder}
                />
                <Button type="button" variant="outline" onClick={() => handleAddTag(tagInput)}>{t.addTag}</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                  {PREDEFINED_TAGS.map(tag => (
                      <Button key={tag} type="button" size="sm" variant={form.watch('tags').includes(tag) ? 'default' : 'secondary'} onClick={() => handleAddTag(tag)}>{tag}</Button>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch('tags').map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-base">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
            </FormItem>
            
            <div>
              <Label className="text-base font-medium">{t.technicalSpecs}</Label>
              <div className="mt-4 space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`specs.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.specName}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.specNamePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`specs.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.specValue}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.specValuePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`specs.${index}.evaluation`}
                      render={({ field }) => (
                        <FormItem className="space-y-3 mt-4">
                          <FormLabel>{t.evaluation}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="good" />
                                </FormControl>
                                <FormLabel className="font-normal text-green-600">{t.good}</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="medium" />
                                </FormControl>
                                <FormLabel className="font-normal text-yellow-600">{t.medium}</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="bad" />
                                </FormControl>
                                <FormLabel className="font-normal text-red-600">{t.bad}</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" className="mt-2 text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ id: crypto.randomUUID(), name: '', value: '', evaluation: 'medium' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addSpec}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="flex items-center gap-2">
                <Gauge className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">{t.score}:</span>
                <span className="text-2xl font-bold text-primary">{score.toFixed(1)}/10</span>
            </div>
            <Button type="submit" disabled={isSaving}>{t.saveSensor}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
