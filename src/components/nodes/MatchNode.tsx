import { Handle, Position } from "@xyflow/react";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import type { GraphNode, EsportType } from "../../types";
import { MatchConfigEditor } from "../FormComponents";
import { useBaseNode } from "./BaseNode";

interface MatchNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType;
}

export function MatchNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
  allNodes = [],
  esport,
}: MatchNodeProps) {
  // Usar SOLO el estado global de edición, ignorar data.editable
  // Esto asegura que todos los nodos estén no-editables por defecto
  const isEditing = globalIsEditing;

  // Usar el hook base para la lógica común
  const {
    formData,
    config,
    combinedValidation,
    handleUpdate,
    handleSave,
    handleCancel,
  } = useBaseNode({
    data,
    onChange,
    onStopEditing,
    allNodes,
    esport,
  });

  return (
    <div
      className={`
        flex flex-row bg-background border-2 min-w-48 ${
          config.border
        } rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${
          isEditing
            ? "ring-2 ring-blue-400 ring-opacity-50 border-blue-400"
            : ""
        }
        ${
          isEditing
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
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
            <div>
              <div className={`font-semibold text-sm ${config.text}`}>
                {formData.type.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Botón de edición para nodos match - siempre visible cuando no está editando */}
          {!isEditing && onStartEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing?.();
              }}
              className="absolute top-1 right-1 px-2 py-1 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-xs font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50"
              title="Editar nodo"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Información del nodo match cuando no está en edición */}
        {!isEditing && formData.matchConfig && (
          <div className="text-left">
            {formData.matchConfig.title && (
              <div className="text-sm text-emerald-700 font-semibold mb-1">
                {formData.matchConfig.title}
              </div>
            )}
            <div className="text-xs text-emerald-600 font-medium mb-1">
              {formData.matchConfig.modalidad === "presencial"
                ? "Presencial"
                : "Online"}
            </div>
            <div className="text-nowrap text-xs text-emerald-600 mb-2">
              {formData.matchConfig.capacity} equipos
            </div>
            {formData.matchConfig.scheduledDate && (
              <div className="text-xs text-emerald-600 mb-2">
                📅 {formData.matchConfig.scheduledDate.toLocaleDateString()}
                {formData.matchConfig.scheduledTime && (
                  <span> 🕐 {formData.matchConfig.scheduledTime}</span>
                )}
              </div>
            )}

            {/* Slots de equipos */}
            <div className="space-y-1">
              {Array.from(
                { length: formData.matchConfig.capacity || 2 },
                (_, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs border border-emerald-600 rounded  text-emerald-700 text-center"
                  >
                    Equipo {index + 1}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Formulario de edición */}
      {isEditing && (
        <div className="p-2 ">
          <div>
            <MatchConfigEditor
              config={formData.matchConfig}
              onChange={(config) => handleUpdate("matchConfig", config)}
              esport={esport}
            />

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
                disabled={!combinedValidation.isValid}
                className={`
                  flex flex-row gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    combinedValidation.isValid
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

      {/* Handles para conexiones */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        isConnectableStart={false}
        isConnectableEnd={true}
        style={{ width: 15, height: 15 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: 15, height: 15 }}
      />
    </div>
  );
}
