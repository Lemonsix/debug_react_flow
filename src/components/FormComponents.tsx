import { PencilIcon } from "lucide-react";
import * as React from "react";
import type {
  ConditionOperator,
  EdgeCondition,
  MatchConfiguration,
  MatchModalidad,
  SinkConfiguration,
  SinkType,
} from "../types";
import { DateTimePicker } from "./DateTimePicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Componente base para inputs con validación
interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "select";
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  options,
  placeholder,
  className,
  error,
  required = false,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {type === "select" && options ? (
        <Select value={value.toString()} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Seleccionar ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          placeholder={placeholder}
          className={error ? "border-destructive" : ""}
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Configuración específica para nodos sink
interface SinkConfigEditorProps {
  config: SinkConfiguration;
  onChange: (config: SinkConfiguration) => void;
}

export function SinkConfigEditor({ config, onChange }: SinkConfigEditorProps) {
  const sinkTypeOptions = [
    { value: "podium", label: "Podio" },
    { value: "disqualification", label: "Eliminación" },
  ];

  const updateConfig = (
    field: keyof SinkConfiguration,
    value: string | number
  ) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-3 p-3 text-foreground border border-border rounded-lg">
      <div className="flex flex-col gap-2">
        <FormField
          label="Tipo de Resultado"
          value={config.sinkType}
          onChange={(val) => updateConfig("sinkType", val as SinkType)}
          type="select"
          options={sinkTypeOptions}
          required
        />

        {config.sinkType === "podium" && (
          <FormField
            label="Posición"
            value={config.position || 1}
            onChange={(val) => updateConfig("position", Number(val))}
            type="number"
            placeholder="1, 2, 3..."
          />
        )}
      </div>
    </div>
  );
}

// Editor de condiciones para edges
interface EdgeConditionEditorProps {
  condition: EdgeCondition;
  onChange: (condition: EdgeCondition) => void;
}

export function EdgeConditionEditor({
  condition,
  onChange,
}: EdgeConditionEditorProps) {
  const operatorOptions = [
    { value: ">=", label: "Greater than or equal (>=)" },
    { value: "<=", label: "Less than or equal (<=)" },
    { value: "==", label: "Equal to (==)" },
    { value: "!=", label: "Not equal to (!=)" },
    { value: ">", label: "Greater than (>)" },
    { value: "<", label: "Less than (<)" },
  ];

  const fieldOptions = [
    { value: "points", label: "Points" },
    { value: "position", label: "Position" },
    { value: "score", label: "Score" },
  ];

  const updateCondition = (
    field: keyof EdgeCondition,
    value: string | number
  ) => {
    onChange({ ...condition, [field]: value });
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg">
      <h4 className="text-sm font-semibold text-foreground">Edge Condition</h4>

      <div className="grid grid-cols-3 gap-2">
        <FormField
          label="Field"
          value={condition.field}
          onChange={(val) =>
            updateCondition("field", val as "points" | "position" | "score")
          }
          type="select"
          options={fieldOptions}
          required
        />

        <FormField
          label="Operator"
          value={condition.operator}
          onChange={(val) =>
            updateCondition("operator", val as ConditionOperator)
          }
          type="select"
          options={operatorOptions}
          required
        />

        <FormField
          label="Value"
          value={condition.value}
          onChange={(val) => updateCondition("value", Number(val))}
          type="number"
          placeholder="0"
          required
        />
      </div>

      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
        <strong>Preview:</strong> {condition.field} {condition.operator}{" "}
        {condition.value}
      </div>
    </div>
  );
}

// Componente de toggle para modo edición
interface EditToggleProps {
  isEditing: boolean;
  onToggle: (editing: boolean) => void;
  disabled?: boolean;
}

export function EditToggle({
  isEditing,
  onToggle,
  disabled = false,
}: EditToggleProps) {
  return (
    <button
      onClick={() => onToggle(!isEditing)}
      disabled={disabled}
      className={`
        px-1 py-1 text-xs font-medium rounded-md transition-all duration-200
        ${
          isEditing
            ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
            : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {isEditing ? "✓ Editing" : <PencilIcon className="w-4 h-4" />}
    </button>
  );
}

// Editor de configuración para nodos match
interface MatchConfigEditorProps {
  config: MatchConfiguration;
  onChange: (config: MatchConfiguration) => void;
}

export function MatchConfigEditor({
  config,
  onChange,
}: MatchConfigEditorProps) {
  const modalityOptions = React.useMemo(
    () => [
      { value: "presencial" as const, label: "Presencial" },
      { value: "online" as const, label: "Online" },
    ],
    []
  );

  const updateConfig = React.useCallback(
    (
      field: keyof MatchConfiguration,
      value: string | number | Date | undefined
    ) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange]
  );

  return (
    <div className="space-y-3 p-3 text-foreground border border-border rounded-lg">
      <div className="flex flex-col gap-2">
        <FormField
          label="Participantes"
          value={config.capacity}
          onChange={(val) => updateConfig("capacity", Number(val))}
          type="number"
          placeholder="Cantidad de participantes"
          required
        />

        <FormField
          label="Modalidad"
          value={config.modalidad}
          onChange={(val) => updateConfig("modalidad", val as MatchModalidad)}
          type="select"
          options={modalityOptions}
          required
        />
      </div>

      <div className="space-y-3">
        <DateTimePicker
          date={config.scheduledDate}
          time={config.scheduledTime}
          onDateChange={(date) => {
            const updatedConfig = {
              ...config,
              scheduledDate: date,
              // Si se limpia la fecha, también limpiar la hora
              ...(date === undefined && { scheduledTime: undefined }),
            };
            onChange(updatedConfig);
          }}
          onTimeChange={(time) => {
            const updatedConfig = {
              ...config,
              scheduledTime: time || undefined,
            };
            onChange(updatedConfig);
          }}
        />
      </div>
    </div>
  );
}
