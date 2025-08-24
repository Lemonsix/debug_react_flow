"use client";

import React from "react";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import type { FieldValues, Control, FieldPath } from "react-hook-form";
import { useState } from "react";

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
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={time || ""}
          onChange={(e) => onTimeChange?.(e.target.value)}
          disabled={disabled}
          className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
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
                <Input
                  type="time"
                  step="1"
                  {...field}
                  value={field.value || ""}
                  disabled={disabled}
                  className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
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
