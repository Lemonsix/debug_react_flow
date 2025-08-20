import { useState, useCallback, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import type { GraphEdge, EdgeCondition, ConditionOperator } from "../types";
import { EditToggle } from "./FormComponents";
import { validateEdgeCondition } from "../utils/validation";

interface EditableEdgeData extends GraphEdge {
  label?: string;
}

interface EditableEdgeProps extends EdgeProps<EditableEdgeData> {
  onConditionUpdate?: (edgeId: string, condition: EdgeCondition) => void;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
}

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  onConditionUpdate,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
}: EditableEdgeProps) {
  // Usar el estado global de edición en lugar del local
  const isEditing = globalIsEditing;

  const [condition, setCondition] = useState<EdgeCondition>(
    data?.condition || {
      field: "points",
      operator: ">=",
      value: 0,
    }
  );

  // Sincronizar estado local cuando cambien los datos del parent
  useEffect(() => {
    if (data?.condition && !isEditing) {
      setCondition(data.condition);
    }
  }, [data?.condition, isEditing]);

  // Calcular path del edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Validación de la condición
  const validation = validateEdgeCondition(condition);

  // Manejar guardado de condición
  const handleSave = useCallback(() => {
    if (!validation.isValid) {
      console.warn("Validation failed:", validation);
      return;
    }

    try {
      // Actualizar el edge en el estado global
      if (onConditionUpdate && id) {
        onConditionUpdate(id, condition);
      }
      // La edición se cierra automáticamente desde TournamentEditor
    } catch (error) {
      console.error("Error saving condition:", error);
    }
  }, [condition, validation, onConditionUpdate, id]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setCondition(
      data?.condition || {
        field: "points",
        operator: ">=",
        value: 0,
      }
    );
    onStopEditing?.();
  }, [data?.condition, onStopEditing]);

  // Generar label para mostrar la condición
  const getConditionLabel = () => {
    // Usar el estado local actual en lugar de data?.condition para evitar retrasos
    const currentCondition = data?.condition || condition;
    if (currentCondition) {
      return `${currentCondition.field} ${currentCondition.operator} ${currentCondition.value}`;
    }
    return data?.outcome || "";
  };

  return (
    <>
      {/* Path del edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: isEditing ? 2.5 : 1.5,
          stroke: isEditing ? "#3b82f6" : "#94a3b8",
          transition: "all 0.2s",
        }}
      />

      {/* Label y editor flotante */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {!isEditing ? (
            // Mostrar condición como label
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-xs font-medium text-gray-700">
                {getConditionLabel()}
              </span>
              <EditToggle
                isEditing={false}
                onToggle={() => onStartEditing?.()}
              />
            </div>
          ) : (
            // Editor súper compacto de condición
            <div className="bg-white border-2 border-blue-400 rounded p-2 shadow-lg min-w-fit">
              <div className="flex gap-1 mb-2">
                <select
                  value={condition.field}
                  onChange={(e) =>
                    setCondition({
                      ...condition,
                      field: e.target.value as "points" | "position" | "score",
                    })
                  }
                  className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-16"
                >
                  <option value="points">Points</option>
                  <option value="position">Position</option>
                  <option value="score">Score</option>
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) =>
                    setCondition({
                      ...condition,
                      operator: e.target.value as ConditionOperator,
                    })
                  }
                  className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-10"
                >
                  <option value=">=">&ge;</option>
                  <option value="<=">&le;</option>
                  <option value="==">=</option>
                  <option value="!=">≠</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>

                <input
                  type="number"
                  value={condition.value}
                  onChange={(e) =>
                    setCondition({
                      ...condition,
                      value: Number(e.target.value),
                    })
                  }
                  className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none "
                  placeholder="0"
                />
              </div>

              {/* Botones mini */}
              <div className="flex gap-0.5 justify-center">
                <button
                  onClick={handleSave}
                  disabled={!validation.isValid}
                  className={`
                    px-1.5 py-0.5 text-xs rounded transition-colors
                    ${
                      validation.isValid
                        ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }
                  `}
                  title={
                    validation.isValid
                      ? "Save"
                      : `Error: ${
                          Object.values(validation.errors).join(", ") ||
                          "Invalid condition"
                        }`
                  }
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="px-1.5 py-0.5 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Componente para edges simples que no necesitan edición
export function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<EditableEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 1.5,
          stroke: "#94a3b8",
        }}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: "all",
            }}
            className="nodrag nopan bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 font-medium"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
