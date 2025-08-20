import { useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import type { GraphNode } from "../types";
import {
  FormField,
  NodeTypeSelector,
  SinkConfigEditor,
  EditToggle,
} from "./FormComponents";
import { validateNodeForm } from "../utils/validation";

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
    sinkConfig: data.sinkConfig || { sinkType: "qualification" as const },
  });

  // Validación del formulario
  const validation = validateNodeForm(
    formData.type,
    formData.capacity,
    formData.sinkConfig
  );

  // Actualizar datos del nodo
  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      const updates = { [field]: value };
      setFormData((prev) => ({ ...prev, ...updates }));

      if (onChange) {
        onChange(updates);
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
      sinkConfig: data.sinkConfig || { sinkType: "qualification" as const },
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
        ${isEditing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        min-w-80 max-w-80
      `}
      onClick={() => {
        if (data.editable && !isEditing && onStartEditing) {
          onStartEditing();
        }
      }}
    >
      {/* Header del nodo con toggle de edición */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`${config.accent} w-8 h-8 rounded-lg flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">
                {config.icon}
              </span>
            </div>
            <div>
              <div className={`font-semibold text-sm ${config.text}`}>
                {formData.type.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                ID: {data.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>

        {/* Información del nodo */}
        <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Node ID</div>
          <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">
            {data.id}
          </div>
        </div>
      </div>

      {/* Formulario de edición */}
      {isEditing && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="space-y-3">
            <NodeTypeSelector
              value={formData.type}
              onChange={(type) => handleUpdate("type", type)}
            />

            {formData.type !== "sink" && (
              <FormField
                label="Capacity"
                value={formData.capacity}
                onChange={(value) => handleUpdate("capacity", value)}
                type="number"
                placeholder="Number of slots"
                required
                error={validation.errors.capacity}
              />
            )}

            {formData.type === "sink" && (
              <SinkConfigEditor
                config={formData.sinkConfig}
                onChange={(config) => handleUpdate("sinkConfig", config)}
              />
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
      {formData.type !== "sink" && !isEditing && (
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
      {formData.type !== "sink" && data.slots && data.slots.length > 0 && !isEditing && (
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
              🏆 {formData.sinkConfig?.sinkType || "Final Result"}
            </div>
            {formData.sinkConfig?.sinkType === "podium" &&
              formData.sinkConfig.position && (
                <div className="text-purple-600 text-xs">
                  Position #{formData.sinkConfig.position}
                </div>
              )}
            {formData.sinkConfig?.sinkType === "qualification" &&
              formData.sinkConfig.threshold !== undefined && (
                <div className="text-purple-600 text-xs">
                  Threshold: {formData.sinkConfig.threshold} points
                </div>
              )}
            {formData.sinkConfig?.sinkType === "disqualification" &&
              formData.sinkConfig.reason && (
                <div className="text-purple-600 text-xs">
                  Reason: {formData.sinkConfig.reason}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Handles para conexiones */}
      {isEditing && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{ left: -6 }}
          />
          {formData.type !== "sink" && (
            <Handle
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors"
              style={{ right: -6 }}
            />
          )}
        </>
      )}
    </div>
  );
}
