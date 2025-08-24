import { Handle, Position } from "@xyflow/react";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { GraphNode, MatchConfiguration } from "../types";
import { validateNodeForm } from "../utils/validation";
import { MatchConfigEditor } from "./FormComponents";
import { SinkConfigForm } from "./SinkConfigForm";

interface EditableNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
}

export default function EditableNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
  allNodes = [],
}: EditableNodeProps) {
  // Usar el estado global de edición en lugar del local
  const isEditing = globalIsEditing || data.editable;
  const [formData, setFormData] = useState({
    type: data.type,
    capacity: data.capacity,
    sinkConfig: data.sinkConfig || { sinkType: "podium" as const },
    matchConfig: data.matchConfig || {
      capacity: data.capacity,
      modalidad: "presencial" as const,
      scheduledDate: undefined,
      scheduledTime: undefined,
    },
  });

  // Sincronizar formData solo cuando cambien las propiedades relevantes para el formulario
  useEffect(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      sinkConfig: data.sinkConfig || { sinkType: "podium" as const },
      matchConfig: data.matchConfig || {
        capacity: data.capacity,
        modalidad: "presencial" as const,
        scheduledDate: undefined,
        scheduledTime: undefined,
      },
    });
  }, [data.type, data.capacity, data.sinkConfig, data.matchConfig]);

  // Validación del formulario
  const validation = validateNodeForm(
    formData.type,
    formData.capacity,
    formData.sinkConfig,
    formData.matchConfig,
    data.id,
    allNodes
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
        modalidad: "presencial" as const,
        scheduledDate: undefined,
        scheduledTime: undefined,
      },
    });
    // Desactivar la edición automáticamente
    onStopEditing?.();
  }, [data, onStopEditing]);

  // Configuración visual por tipo de nodo
  const nodeTypeConfig = {
    match: {
      border: "border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-500",
      icon: "M",
    },
    sink: {
      border: "border-purple-200",
      text: "text-purple-800",
      accent: "bg-purple-500",
      icon: "S",
    },
  };

  const config = nodeTypeConfig[formData.type];

  return (
    <div
      className={`
        flex flex-row bg-white border-2 ${config.border} rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isEditing ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
        ${
          isEditing
            ? "cursor-grab active:cursor-grabbing"
            : formData.type === "match"
            ? "cursor-default"
            : "cursor-pointer"
        }
       
      `}
      onClick={() => {
        // Solo los nodos no-match se pueden editar con clic general
        if (!isEditing && onStartEditing && formData.type !== "match") {
          onStartEditing();
        }
      }}
    >
      {/* Header del nodo con toggle de edición */}
      <div className={`flex flex-row p-2 gap-2`}>
        <div
          className={`flex items-center ${
            formData.type === "match" && !isEditing
              ? "justify-center"
              : "justify-between"
          } ${formData.type === "match" && !isEditing ? "" : "mb-3"}`}
        >
          <div className="flex items-center">
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
              <span className="hover:cursor-pointer">
                <PencilIcon className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>

        {/* Información del nodo match cuando no está en edición */}
        {formData.type === "match" && !isEditing && formData.matchConfig && (
          <div className=" text-left">
            <div className="text-xs text-emerald-600 font-medium mb-1">
              {formData.matchConfig.modalidad === "presencial"
                ? "Presencial"
                : "Online"}
            </div>
            <div className="text-nowrap text-xs text-emerald-600">
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
        <div className="p-2 ">
          <div>
            {formData.type === "match" ? (
              <MatchConfigEditor
                config={formData.matchConfig}
                onChange={(config) => handleUpdate("matchConfig", config)}
              />
            ) : formData.type === "sink" ? (
              <SinkConfigForm
                config={formData.sinkConfig}
                onChange={(config) => handleUpdate("sinkConfig", config)}
                nodeId={data.id}
                allNodes={allNodes}
              />
            ) : null}

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
                <SaveIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información para nodos sink */}
      {formData.type === "sink" && !isEditing && (
        <div className="p-1">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
            <div className="text-purple-700 text-sm font-semibold mb-1">
              {formData.sinkConfig?.sinkType === "podium"
                ? "🏆 Podio"
                : formData.sinkConfig?.sinkType === "disqualification"
                ? "❌ Eliminación"
                : "🏁 Resultado Final"}
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
        style={{ width: 15, height: 15 }}
      />
      {formData.type !== "sink" && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          style={{ width: 15, height: 15 }}
        />
      )}
    </div>
  );
}
