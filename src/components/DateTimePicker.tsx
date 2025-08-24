"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

// Función para generar opciones de tiempo cada 15 minutos
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push({
        value: timeString,
        label: timeString,
      });
    }
  }
  return options;
};

interface DateTimePickerProps {
  date?: Date;
  time?: string;
  onDateChange?: (date: Date | undefined) => void;
  onTimeChange?: (time: string) => void;
  disabled?: boolean;
}

// Componente standalone para usar sin react-hook-form
export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const timeOptions = generateTimeOptions();

  return (
    <div className="flex gap-4">
      {/* Date Picker */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1 text-sm font-medium">
          Fecha
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-40 justify-between font-normal"
              disabled={disabled}
            >
              {date
                ? format(date, "dd/MM/yyyy", { locale: es })
                : "Seleccionar fecha"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(date) => {
                onDateChange?.(date);
                setOpen(false);
              }}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1 text-sm font-medium">
          Hora
        </Label>
        <Select
          value={time || ""}
          onValueChange={(value) => onTimeChange?.(value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="HH:MM" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Props para usar con react-hook-form
interface FormDateTimePickerProps<T extends FieldValues> {
  control: Control<T>;
  dateName: FieldPath<T>;
  timeName: FieldPath<T>;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

// Componente para usar con react-hook-form
export function FormDateTimePicker<T extends FieldValues>({
  control,
  dateName,
  timeName,
  label = "Fecha y Hora",
  description,
  disabled = false,
  className,
}: FormDateTimePickerProps<T>) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const timeOptions = generateTimeOptions();

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
      )}

      <div className="flex gap-4">
        {/* Date Field */}
        <FormField
          control={control}
          name={dateName}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="px-1 text-sm font-medium">Fecha</FormLabel>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-40 justify-between font-normal"
                      disabled={disabled}
                    >
                      {field.value
                        ? format(new Date(field.value), "dd/MM/yyyy", {
                            locale: es,
                          })
                        : "Seleccionar fecha"}
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      field.onChange(date?.toISOString().split("T")[0]);
                      setDateOpen(false);
                    }}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Field */}
        <FormField
          control={control}
          name={timeName}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="px-1 text-sm font-medium">Hora</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {description && (
        <FormDescription className="text-sm text-muted-foreground">
          {description}
        </FormDescription>
      )}
    </div>
  );
}
