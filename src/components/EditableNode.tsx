import { useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import type { GraphNode } from "../types";
import {
  FormField,
  NodeTypeSelector,
  SinkConfigEditor,
  MatchConfigEditor,
} from "./FormComponents";
import { validateNodeForm } from "../utils/validation";
import type { MatchConfiguration } from "../types";

interface EditableNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
}

export default function EditableNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
}: EditableNodeProps) {
  // Usar el estado global de edición en lugar del local
  const isEditing = globalIsEditing || data.editable;
  const [formData, setFormData] = useState({
    type: data.type,
    capacity: data.capacity,
    sinkConfig: data.sinkConfig || { sinkType: "podium" as const },
    matchConfig: data.matchConfig || { 
      capacity: data.capacity, 
      modality: "presencial" as const,
      scheduledDate: undefined,
      scheduledTime: undefined
    },
  });

  // Validación del formulario
  const validation = validateNodeForm(
    formData.type,
    formData.capacity,
    formData.sinkConfig,
    formData.matchConfig
  );

  // Actualizar datos del nodo
  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      const updates = { [field]: value };
      setFormData((prev) => ({ ...prev, ...updates }));

      if (onChange) {
        // Incluir matchConfig en las actualizaciones si es un nodo de match
        if (field === "matchConfig") {
          onChange({ ...updates, matchConfig: value as MatchConfiguration });
        } else {
          onChange(updates);
        }
      }
    },
    [onChange]
  );

  // Guardar cambios y salir del modo edición
  const handleSave = useCallback(() => {
    if (!validation.isValid) return;

    if (onChange) {
      onChange({
        ...formData,
        editable: false,
      });
    }
    // Desactivar la edición automáticamente
    onStopEditing?.();
  }, [formData, validation.isValid, onChange, onStopEditing]);

  // Cancelar edición y revertir cambios
  const handleCancel = useCallback(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      sinkConfig: data.sinkConfig || { sinkType: "podium" as const },
      matchConfig: data.matchConfig || { 
        capacity: data.capacity, 
        modality: "presencial" as const,
        scheduledDate: undefined,
        scheduledTime: undefined
      },
    });
    // Desactivar la edición automáticamente
    onStopEditing?.();
  }, [data, onStopEditing]);

  // Configuración visual por tipo de nodo
  const nodeTypeConfig = {
    match: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-500",
      icon: "M",
    },
    sink: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      accent: "bg-purple-500",
      icon: "S",
    },
  };

  const config = nodeTypeConfig[formData.type];
  const filled = data.slots?.filter((s) => !!s.participantId).length || 0;

  return (
    <div
      className={`
        relative bg-white border-2 ${config.border} rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isEditing ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
        ${isEditing ? "cursor-grab active:cursor-grabbing" : formData.type === "match" ? "cursor-default" : "cursor-pointer"}
        ${formData.type === "match" && !isEditing ? "min-w-32 max-w-32" : "min-w-80 max-w-80"}
      `}
      onClick={() => {
        // Solo los nodos no-match se pueden editar con clic general
        if (!isEditing && onStartEditing && formData.type !== "match") {
          onStartEditing();
        }
      }}
    >
      {/* Header del nodo con toggle de edición */}
      <div className={`${formData.type === "match" && !isEditing ? "p-2" : "p-4"} border-b border-gray-100`}>
        <div className={`flex items-center ${formData.type === "match" && !isEditing ? "justify-center" : "justify-between"} ${formData.type === "match" && !isEditing ? "" : "mb-3"}`}>
          <div className="flex items-center gap-3">
            <div
              className={`${config.accent} w-8 h-8 rounded-lg flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">
                {config.icon}
              </span>
            </div>
            {formData.type !== "match" || isEditing ? (
              <div>
                <div className={`font-semibold text-sm ${config.text}`}>
                  {formData.type.toUpperCase()}
                </div>
                {formData.type !== "match" && formData.type !== "sink" && (
                  <div className="text-xs text-gray-500 font-medium">
                    ID: {data.id.slice(0, 8)}...
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Botón de edición para nodos match */}
          {formData.type === "match" && !isEditing && onStartEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing?.();
              }}
              className="absolute top-1 right-1 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="text-xs text-gray-600">✏️</span>
            </button>
          )}
        </div>

        {/* Información del nodo - solo para nodos que no sean match ni sink */}
        {formData.type !== "match" && formData.type !== "sink" && (
          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Node ID</div>
            <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">
              {data.id}
            </div>
          </div>
        )}

        {/* Información del nodo match cuando no está en edición */}
        {formData.type === "match" && !isEditing && formData.matchConfig && (
          <div className="p-2 text-center">
            <div className="text-xs text-emerald-600 font-medium mb-1">
              {formData.matchConfig.modality === "presencial" ? "🏟️ Presencial" : "💻 Online"}
            </div>
            <div className="text-xs text-emerald-600">
              {formData.matchConfig.capacity} participantes
            </div>
            {formData.matchConfig.scheduledDate && (
              <div className="text-xs text-emerald-600 mt-1">
                📅 {formData.matchConfig.scheduledDate.toLocaleDateString()}
                {formData.matchConfig.scheduledTime && (
                  <span> 🕐 {formData.matchConfig.scheduledTime}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulario de edición */}
      {isEditing && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="space-y-3">
            {formData.type === "match" ? (
              <MatchConfigEditor
                config={formData.matchConfig}
                onChange={(config) => handleUpdate("matchConfig", config)}
              />
            ) : formData.type === "sink" ? (
              <SinkConfigEditor
                config={formData.sinkConfig}
                onChange={(config) => handleUpdate("sinkConfig", config)}
              />
            ) : (
              <>
                <NodeTypeSelector
                  value={formData.type}
                  onChange={(type) => handleUpdate("type", type)}
                />

                <FormField
                  label="Capacity"
                  value={formData.capacity}
                  onChange={(value) => handleUpdate("capacity", value)}
                  type="number"
                  placeholder="Number of slots"
                  required
                  error={validation.errors.capacity}
                />
              </>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!validation.isValid}
                className={`
                  flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    validation.isValid
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de capacidad */}
      {formData.type !== "sink" && formData.type !== "match" && !isEditing && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Capacity</span>
            <div
              className={`
                px-2 py-1 rounded text-xs font-semibold
                ${
                  filled === formData.capacity
                    ? "bg-green-100 text-green-800"
                    : filled > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
            >
              {filled}/{formData.capacity}
            </div>
          </div>
        </div>
      )}

      {/* Slots visuales */}
      {formData.type !== "sink" && formData.type !== "match" && data.slots && data.slots.length > 0 && !isEditing && (
        <div className="p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Slots</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slots.slice(0, formData.capacity).map((slot, index) => (
              <div
                key={index}
                className={`
                  p-2 rounded border transition-colors text-xs
                  ${
                    slot.participantId
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-5 h-3 rounded flex items-center justify-center text-xs font-bold
                      ${
                        slot.participantId
                          ? "bg-green-500 text-white"
                          : "bg-gray-400 text-white"
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {slot.participantId ? "Occupied" : "Empty"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información para nodos sink */}
      {formData.type === "sink" && !isEditing && (
        <div className="p-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-purple-700 text-sm font-semibold mb-1">
              {formData.sinkConfig?.sinkType === "podium" ? "🏆 Podio" : 
               formData.sinkConfig?.sinkType === "disqualification" ? "❌ Eliminación" : 
               "🏁 Resultado Final"}
            </div>
            {formData.sinkConfig?.sinkType === "podium" &&
              formData.sinkConfig.position && (
                <div className="text-purple-600 text-xs">
                  Posición #{formData.sinkConfig.position}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Handles para conexiones - siempre visibles y más grandes */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-5 h-5 bg-white border-2 border-gray-400 hover:border-blue-500 transition-colors shadow-md"
        style={{ left: -10 }}
      />
      {formData.type !== "sink" && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="w-5 h-5 bg-white border-2 border-gray-400 hover:border-blue-500 transition-colors shadow-md"
          style={{ right: -10 }}
        />
      )}
    </div>
  );
}
