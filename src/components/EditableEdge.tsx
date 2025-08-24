import { useState, useCallback, useEffect, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import type {
  GraphEdge,
  EdgeCondition,
  ConditionOperator,
  GraphNode,
} from "../types";
import { EditToggle } from "./FormComponents";
import { validateEdgeCondition } from "../utils/validation";
import { getEdgeSwitchLogic } from "../utils/edgeLogic";

interface EditableEdgeData extends GraphEdge {
  label?: string;
  [key: string]: unknown; // Añadir index signature para compatibilidad con React Flow
}

interface EditableEdgeProps extends EdgeProps {
  onConditionUpdate?: (edgeId: string, condition: EdgeCondition) => void;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  // Nuevas props para lógica de switch
  allEdges?: Edge[];
  targetNode?: GraphNode;
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
  // Nuevas props para lógica de switch
  allEdges = [],
  targetNode,
}: EditableEdgeProps) {
  // Usar el estado global de edición en lugar del local
  const isEditing = globalIsEditing;

  const edgeData = data as EditableEdgeData;

  // Calcular lógica de switch para este edge
  const currentEdge: Edge = {
    id,
    source: edgeData.fromNode,
    target: edgeData.toNode || "",
    data: edgeData,
  } as Edge;

  const switchLogic = getEdgeSwitchLogic(currentEdge, allEdges, targetNode);
  const { isDefault, color } = switchLogic;
  const [condition, setCondition] = useState<EdgeCondition>(
    edgeData?.condition || {
      field: isDefault ? "default" : "points",
      operator: ">=",
      value: 0,
    }
  );

  // Sincronizar estado local cuando cambien los datos del parent
  useEffect(() => {
    if (edgeData?.condition && !isEditing) {
      setCondition(edgeData.condition);
    }
  }, [edgeData?.condition, isEditing]);

  // Calcular path del edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Validación de la condición - "default" siempre es válido
  const validation = useMemo(
    () =>
      condition.field === "default"
        ? { isValid: true, errors: {} }
        : validateEdgeCondition(condition),
    [condition]
  );

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
      edgeData?.condition || {
        field: isDefault ? "default" : "points",
        operator: ">=",
        value: 0,
      }
    );
    onStopEditing?.();
  }, [edgeData?.condition, onStopEditing, isDefault]);

  // Generar label para mostrar la condición o "default"
  const getConditionLabel = () => {
    // Usar el estado local actual en lugar de edgeData?.condition para evitar retrasos
    const currentCondition = edgeData?.condition || condition;

    // Si el campo es "default", mostrar "default"
    if (currentCondition?.field === "default" || isDefault) {
      return "default";
    }

    // Para otros campos, mostrar la condición
    if (currentCondition && (currentCondition.field as string) !== "default") {
      return `${currentCondition.field} ${currentCondition.operator} ${currentCondition.value}`;
    }
    return edgeData?.outcome || "condition";
  };

  return (
    <>
      {/* Invisible larger path for easier clicking */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 20,
          stroke: "transparent",
          cursor: "pointer",
        }}
      />

      {/* Visible animated path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: isEditing ? 3 : 2,
          stroke: isEditing ? "#FFEE86" : color, // Usar color calculado según destino
          strokeDasharray: "8 4",
          strokeDashoffset: "0",
          transition: "all 0.2s",
          pointerEvents: "none", // Solo el invisible debe recibir clicks
          cursor: "pointer",
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
              <span
                className={`text-xs font-medium ${
                  isDefault ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {getConditionLabel()}
              </span>
              {/* Mostrar botón de edición para todos los edges */}
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
                      field: e.target.value as
                        | "points"
                        | "position"
                        | "score"
                        | "default",
                    })
                  }
                  className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-16"
                >
                  <option value="default">Default</option>
                  <option value="points">Points</option>
                  <option value="position">Position</option>
                  <option value="score">Score</option>
                </select>

                {/* Solo mostrar operador y valor si no es default */}
                {condition.field !== "default" && (
                  <>
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
                      className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-14"
                      placeholder="0"
                    />
                  </>
                )}
              </div>

              {/* Botones mejorados */}
              <div className="flex gap-1 justify-center">
                <button
                  onClick={handleSave}
                  disabled={!validation.isValid}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-w-12
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
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-12"
                  title="Cancel"
                >
                  Cancel
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
}: EdgeProps) {
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
      {/* Invisible larger path for easier clicking */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 20,
          stroke: "transparent",
          cursor: "pointer",
        }}
      />

      {/* Visible animated path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          strokeDasharray: "8 4",
          strokeDashoffset: "0",
          // animation: "dash-flow 2s linear infinite",
          pointerEvents: "none", // Solo el invisible debe recibir clicks
          cursor: "pointer",
        }}
      />

      {(data as EditableEdgeData)?.label && (
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
            {(data as EditableEdgeData).label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
