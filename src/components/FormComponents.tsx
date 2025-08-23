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
import { TimestampPicker } from "./Timepicker";

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
  const baseInputClasses = `
    ${className} w-full px-3 py-2 text-sm border rounded-md transition-colors
    ${
      error
        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
    }
    focus:outline-none focus:ring-2
  `;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          placeholder={placeholder}
          className={baseInputClasses}
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
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
    <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <h4 className="text-sm font-semibold text-purple-800">
        Configuración de Sink
      </h4>
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
    <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-800">Edge Condition</h4>

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

      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
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
    <div className="space-y-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
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

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Fecha y Hora Programada
        </label>
        <TimestampPicker
          value={
            config.scheduledDate && config.scheduledTime
              ? new Date(
                  `${config.scheduledDate.toISOString().split("T")[0]}T${
                    config.scheduledTime
                  }`
                )
              : config.scheduledDate
          }
          onChange={(dateString: string | undefined) => {
            if (dateString) {
              const date = new Date(dateString);

              // Extraer la hora en formato HH:mm
              const hours = date.getHours().toString().padStart(2, "0");
              const minutes = date.getMinutes().toString().padStart(2, "0");

              // Actualizar ambos campos en una sola llamada para evitar sobrescribir
              const updatedConfig = {
                ...config,
                scheduledDate: date,
                scheduledTime: `${hours}:${minutes}`,
              };
              onChange(updatedConfig);
            } else {
              const updatedConfig = {
                ...config,
                scheduledDate: undefined,
                scheduledTime: undefined,
              };
              onChange(updatedConfig);
            }
          }}
          includeTime={true}
          timeFormat="24"
          className="w-full"
        />
      </div>
    </div>
  );
}
