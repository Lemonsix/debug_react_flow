import { Position } from "@xyflow/react";
import { PencilIcon, SaveIcon, TrophyIcon, XIcon } from "lucide-react";
import type { GraphNode, EsportType, SinkConfiguration } from "../../types";
import { isSinkConfiguration } from "../../types";
import { PodiumConfigEditor } from "../FormComponents";
import { useBaseNode } from "./BaseNode";
import { LabeledHandle } from "../LabeledHandle";

interface PodiumNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType;
}

export function PodiumNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
  allNodes = [],
  esport,
}: PodiumNodeProps) {
  // Usar SOLO el estado global de edición, ignorar data.editable
  // Esto asegura que todos los nodos estén no-editables por defecto
  const isEditing = globalIsEditing;

  // Usar el hook base para la lógica común
  const {
    formData,
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

  // Generar handles dinámicamente para nodos podio
  const generatePodiumHandles = () => {
    const places =
      data.config && isSinkConfiguration(data.config)
        ? data.config.places || 3
        : 3;
    return Array.from({ length: places }, (_, index) => {
      const position = index + 1;
      const title =
        position === 1
          ? "🥇 1º Lugar"
          : position === 2
          ? "🥈 2º Lugar"
          : position === 3
          ? "🥉 3º Lugar"
          : `${position}º Lugar`;

      const startOffset = 16;
      const endOffset = 22;
      const availableHeight = 100 - startOffset - endOffset;
      const topPosition =
        startOffset + (availableHeight * (index + 1)) / (places + 1);

      return (
        <LabeledHandle
          key={`podium-${index}`}
          id={`sink-${data.id}-${index}`}
          title={title}
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          isConnectableStart={false}
          isConnectableEnd={true}
          style={{
            width: 14,
            height: 14,
            top: `${topPosition}%`,
            transform: "translateY(-50%)",
            position: "absolute",
            left: -12, // 👈 fuera del card
            zIndex: 20,
          }}
        />
      );
    });
  };

  return (
    <div
      className={`
        relative   /* 👈 NECESARIO para posicionar handles absolutos */
        group
        flex flex-row
        bg-background
        border border-yellow-300/60
        rounded-2xl
        shadow-sm hover:shadow-md
        transition-all duration-200
        ${
          isEditing
            ? "ring-2 ring-blue-400 ring-opacity-50 border-blue-400"
            : ""
        }
        cursor-grab active:cursor-grabbing
        pl-8        /* 👈 gutter interno; evita que el contenido choque con los handles */
        pr-3 py-2
      `}
      style={{
        // 👇 altura mínima dinámica para distribuir bien los handles
        minHeight: Math.max(
          140,
          100 +
            ((data.config && isSinkConfiguration(data.config)
              ? data.config.places ?? 3
              : 3) -
              3) *
              28
        ),
      }}
      onClick={() => {
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
      {/* Header + contenido */}
      <div className="flex gap-3 w-full">
        <div className="flex-1">
          {/* Badge (botón) con cantidad de posiciones */}
          {!isEditing && onStartEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing?.();
              }}
              className="absolute top-2 right-2 px-2 py-1 rounded-sm text-xs font-medium
                           bg-white/90 text-slate-800 border border-slate-200 hover:bg-white hover:border-blue-400 hover:bg-blue-50"
              title="Editar podio"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}

          {/* Título + subtítulo */}
          {!isEditing && (
            <div className="mb-2">
              <div className="text-sm text-yellow-300 font-semibold flex items-center gap-1">
                <TrophyIcon className="w-15 h-5" /> Podio
              </div>
            </div>
          )}

          {/* Form edición */}
          {isEditing && (
            <div className="pt-1">
              <PodiumConfigEditor
                config={formData.config as SinkConfiguration}
                onChange={(config) => handleUpdate("config", config)}
              />

              <div className="flex gap-2 pt-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                             text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  <XIcon className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!combinedValidation.isValid}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                    ${
                      combinedValidation.isValid
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                >
                  <SaveIcon className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Handles a la izquierda, por fuera del card */}
      {generatePodiumHandles()}
    </div>
  );
}
