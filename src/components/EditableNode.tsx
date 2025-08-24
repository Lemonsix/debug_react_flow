import { Handle, Position } from "@xyflow/react";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { GraphNode, MatchConfiguration } from "../types";
import {
  validateNodeForm,
  validateTournamentStructure,
} from "../utils/validation";
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
  // Los nodos sink nunca pueden ser editados
  const isEditing =
    data.type === "sink" ? false : globalIsEditing || data.editable;
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

      // Validar que el cambio no rompa la estructura mínima del torneo
      if (
        field === "type" ||
        (field === "sinkConfig" &&
          value &&
          typeof value === "object" &&
          "sinkType" in value)
      ) {
        const updatedFormData = { ...formData, ...updates };
        const simulatedNode = { ...data, ...updatedFormData };
        const otherNodes = allNodes.filter((n) => n.id !== data.id);
        const allNodesWithUpdate = [...otherNodes, simulatedNode];

        const validation = validateTournamentStructure(allNodesWithUpdate);
        if (!validation.isValid) {
          alert(validation.error);
          // Revertir el cambio
          setFormData((prev) => ({ ...prev }));
          return;
        }
      }

      if (onChange) {
        // Incluir matchConfig en las actualizaciones si es un nodo de match
        if (field === "matchConfig") {
          onChange({ ...updates, matchConfig: value as MatchConfiguration });
        } else {
          onChange(updates);
        }
      }
    },
    [onChange, formData, data, allNodes]
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
  const getNodeConfig = () => {
    if (formData.type === "match") {
      return {
        border: "border-emerald-200",
        text: "text-emerald-800",
        accent: "bg-emerald-500",
        icon: "M",
      };
    } else if (formData.type === "sink") {
      // Configuración específica según el tipo de sink
      if (formData.sinkConfig?.sinkType === "podium") {
        return {
          border: "border-yellow-200",
          text: "text-yellow-800",
          accent: "bg-yellow-500",
          icon: "P",
        };
      } else if (formData.sinkConfig?.sinkType === "disqualification") {
        return {
          border: "border-red-200",
          text: "text-red-800",
          accent: "bg-red-500",
          icon: "E",
        };
      } else {
        // Fallback para otros tipos de sink
        return {
          border: "border-gray-200",
          text: "text-gray-800",
          accent: "bg-gray-500",
          icon: "S",
        };
      }
    }
    // Fallback genérico
    return {
      border: "border-gray-200",
      text: "text-gray-800",
      accent: "bg-gray-500",
      icon: "?",
    };
  };

  const config = getNodeConfig();

  return (
    <div
      className={`
        flex flex-row bg-background border-2 ${
          config.border
        } rounded-lg shadow-sm
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
        // Solo los nodos no-match y no-sink se pueden editar con clic general
        if (
          !isEditing &&
          onStartEditing &&
          formData.type !== "match" &&
          formData.type !== "sink"
        ) {
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
                  {formData.type === "sink" &&
                  formData.sinkConfig?.sinkType === "podium"
                    ? `Podio #${formData.sinkConfig.position || 1}`
                    : formData.type === "sink" &&
                      formData.sinkConfig?.sinkType === "disqualification"
                    ? "Eliminación"
                    : formData.type === "sink"
                    ? "Resultado Final"
                    : formData.type.toUpperCase()}
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
                onClick={handleCancel}
                className="flex flex-row gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <XIcon className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!validation.isValid}
                className={`
                  flex flex-row gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    validation.isValid
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                <SaveIcon className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información para nodos sink */}

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
