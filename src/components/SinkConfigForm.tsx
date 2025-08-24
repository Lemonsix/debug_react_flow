import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SinkConfiguration, SinkType, GraphNode } from "../types";
import { validatePodiumPosition } from "../utils/validation";
import { useEffect, useRef, useState } from "react";

// Schema de validación con Zod
const sinkConfigSchema = z.object({
  sinkType: z.enum(["disqualification", "podium"]),
  position: z
    .number()
    .min(1, "La posición debe ser al menos 1")
    .max(100, "La posición no puede ser mayor a 100")
    .optional(),
});

type SinkConfigFormData = z.infer<typeof sinkConfigSchema>;

interface SinkConfigFormProps {
  config: SinkConfiguration;
  onChange: (config: SinkConfiguration) => void;
  nodeId: string;
  allNodes: GraphNode[];
}

export function SinkConfigForm({
  config,
  onChange,
  nodeId,
  allNodes,
}: SinkConfigFormProps) {
  const form = useForm<SinkConfigFormData>({
    resolver: zodResolver(sinkConfigSchema),
    defaultValues: {
      sinkType: config.sinkType as "disqualification" | "podium",
      position: config.position || 1,
    },
    mode: "onChange", // Validar en tiempo real
  });

  const sinkType = form.watch("sinkType");

  // Guardar el valor anterior para rollback
  const previousPositionRef = useRef<number | undefined>(config.position);

  // Estado local para el input de posición (permite edición libre)
  const [localPositionValue, setLocalPositionValue] = useState<string>("");

  // Validación de posición duplicada personalizada
  const validatePosition = (position: number) => {
    if (sinkType === "podium") {
      const validation = validatePodiumPosition(position, nodeId, allNodes);
      return validation.isValid ? true : validation.error;
    }
    return true;
  };

  // Inicializar y mantener sincronizado el valor local del input
  useEffect(() => {
    if (config.position !== undefined) {
      previousPositionRef.current = config.position;
      setLocalPositionValue(config.position.toString());
    } else {
      setLocalPositionValue("");
    }
  }, [config.position]);

  // Sincronizar cambios con el componente padre
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data.sinkType) {
        const newConfig: SinkConfiguration = {
          sinkType: data.sinkType as SinkType,
          ...(data.sinkType === "podium" && { position: data.position || 1 }),
        };
        onChange(newConfig);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-3 p-3 text-foreground border border-border rounded-lg">
      <h4 className="text-sm font-semibold text-foreground">
        Configuración de Sink
      </h4>

      <Form {...form}>
        <form className="space-y-3">
          <FormField<SinkConfigFormData>
            control={form.control}
            name="sinkType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Resultado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string}
                >
                  <FormControl>
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="podium">Podio</SelectItem>
                    <SelectItem value="disqualification">
                      Eliminación
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {sinkType === "podium" && (
            <FormField<SinkConfigFormData>
              control={form.control}
              name="position"
              rules={{
                validate: (value) => {
                  if (value === undefined) return "Posición es requerida";
                  if (typeof value !== "number")
                    return "Posición debe ser un número";
                  return validatePosition(value);
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posición</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="1, 2, 3..."
                      value={localPositionValue}
                      onChange={(e) => {
                        // Permitir cualquier cambio durante la edición
                        const value = e.target.value;
                        setLocalPositionValue(value);
                      }}
                      onBlur={() => {
                        // Al perder focus, validar y hacer rollback si es necesario
                        if (
                          localPositionValue === "" ||
                          !/^\d+$/.test(localPositionValue)
                        ) {
                          // Rollback al valor anterior
                          const rollbackValue =
                            previousPositionRef.current || 1;
                          setLocalPositionValue(rollbackValue.toString());
                          field.onChange(rollbackValue);
                        } else {
                          const numValue = Number(localPositionValue);
                          if (numValue >= 1 && numValue <= 100) {
                            // Valor válido, actualizar el form
                            field.onChange(numValue);
                          } else {
                            // Valor fuera de rango, rollback
                            const rollbackValue =
                              previousPositionRef.current || 1;
                            setLocalPositionValue(rollbackValue.toString());
                            field.onChange(rollbackValue);
                          }
                        }
                        field.onBlur();
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </div>
  );
}
