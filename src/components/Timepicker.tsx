"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: string | undefined) => void;
  className?: string;
  disabled?: boolean;
  includeTime?: boolean;
  timeFormat?: "12" | "24";
}

export function TimestampPicker({
  value,
  onChange,
  className,
  disabled = false,
  includeTime = false,
  timeFormat = "24",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value
  );
  const [time, setTime] = React.useState({
    hours: value ? value.getHours() : 0,
    minutes: value ? value.getMinutes() : 0,
    seconds: value ? value.getSeconds() : 0,
  });

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setTime({
        hours: value.getHours(),
        minutes: value.getMinutes(),
        seconds: value.getSeconds(),
      });
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Solo cerrar automáticamente si no incluye tiempo
      if (!includeTime) {
        if (onChange) {
          onChange(date.toISOString());
        }
        setIsOpen(false);
      }
      // Si incluye tiempo, mantener abierto para que el usuario pueda ajustar la hora
    }
  };

  const handleTimeChange = (
    field: "hours" | "minutes" | "seconds",
    value: number
  ) => {
    setTime((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    if (selectedDate) {
      if (includeTime) {
        const newDate = new Date(selectedDate);
        newDate.setHours(time.hours, time.minutes, time.seconds);
        if (onChange) {
          onChange(newDate.toISOString());
        }
      } else {
        if (onChange) {
          onChange(selectedDate.toISOString());
        }
      }
    }
    setIsOpen(false);
  };

  const formatDisplayValue = (date: Date) => {
    if (includeTime) {
      return format(date, "dd-MM-yyyy HH:mm:ss", { locale: es });
    }
    return format(date, "dd-MM-yyyy", { locale: es });
  };
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={clsx(
            "w-full justify-start text-left font-normal border-gray-300 h-9",
            { "text-muted-foreground": !value },
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {value ? (
            formatDisplayValue(value)
          ) : (
            <span className="text-xs">
              {includeTime ? "Seleccione fecha y hora" : "Seleccione una fecha"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={clsx("p-0", includeTime ? "w-96" : "w-full")}
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={es}
        />
        {includeTime && (
          <>
            <Separator />
            <div className="p-4 space-y-4">
              <div className="text-sm font-medium">Seleccionar hora</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Horas</Label>
                  <Input
                    type="number"
                    min="0"
                    max={timeFormat === "24" ? "23" : "12"}
                    value={
                      timeFormat === "24"
                        ? time.hours
                        : time.hours > 12
                        ? time.hours - 12
                        : time.hours || 12
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (timeFormat === "24") {
                        handleTimeChange("hours", val);
                      } else {
                        const adjustedHours = time.hours >= 12 ? val + 12 : val;
                        handleTimeChange("hours", adjustedHours);
                      }
                    }}
                    className="h-8 text-center text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Minutos</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={time.minutes}
                    onChange={(e) =>
                      handleTimeChange("minutes", parseInt(e.target.value))
                    }
                    className="h-8 text-center text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Segundos</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={time.seconds}
                    onChange={(e) =>
                      handleTimeChange("seconds", parseInt(e.target.value))
                    }
                    className="h-8 text-center text-black				"
                  />
                </div>
              </div>
              {timeFormat === "12" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={time.hours < 12 ? "default" : "outline"}
                    onClick={() => {
                      if (time.hours >= 12) {
                        handleTimeChange("hours", time.hours - 12);
                      }
                    }}
                    className="flex-1 text-black"
                  >
                    AM
                  </Button>
                  <Button
                    size="sm"
                    variant={time.hours >= 12 ? "default" : "outline"}
                    onClick={() => {
                      if (time.hours < 12) {
                        handleTimeChange("hours", time.hours + 12);
                      }
                    }}
                    className="flex-1 text-black"
                  >
                    PM
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                  disabled={!selectedDate}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
