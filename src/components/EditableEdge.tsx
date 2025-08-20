import { useState, useCallback } from "react";
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

export default function EditableEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<EditableEdgeData>) {
  const [isEditing, setIsEditing] = useState(data?.editable || false);
  const [condition, setCondition] = useState<EdgeCondition>(
    data?.condition || {
      field: "points",
      operator: ">=",
      value: 0,
    }
  );

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
    if (!validation.isValid) return;

    // Aquí iría la lógica para actualizar el edge en el estado global
    console.log("Saving edge condition:", condition);
    setIsEditing(false);
  }, [condition, validation.isValid]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setCondition(
      data?.condition || {
        field: "points",
        operator: ">=",
        value: 0,
      }
    );
    setIsEditing(false);
  }, [data?.condition]);

  // Generar label para mostrar la condición
  const getConditionLabel = () => {
    if (data?.condition) {
      return `${data.condition.field} ${data.condition.operator} ${data.condition.value}`;
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
                onToggle={() => setIsEditing(true)}
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
                  className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-12"
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
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }
                  `}
                  title="Save"
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
