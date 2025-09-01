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
  DefaultCondition,
  ScoreCondition,
  PositionCondition,
  ConditionOperator,
  GraphNode,
  EsportType,
} from "../types";
import { EditToggle } from "./FormComponents";
import { validateEdgeCondition } from "../utils/validation";
import { getEdgeSwitchLogic } from "../utils/edgeLogic";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getEsportConfig } from "../config/esports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

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
  esport: EsportType; // Prop para theming del esport
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
  // Nuevas props para lógica switch
  allEdges = [],
  targetNode,
  esport,
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

  // 1) Memo para switch logic estable
  const { isDefault, color } = useMemo(() => {
    return getEdgeSwitchLogic(currentEdge, allEdges, targetNode);
  }, [id, edgeData.fromNode, edgeData.toNode, edgeData, allEdges, targetNode]);

  const [condition, setCondition] = useState<EdgeCondition>(() => {
    // Usar la lógica de switch para determinar la condición inicial
    if (isDefault) {
      return { field: "default", operator: ">=", value: 0 } as DefaultCondition;
    }
    return (
      edgeData?.condition ||
      ({ field: "score", operator: ">", value: 0 } as ScoreCondition)
    );
  });

  // 2) effectiveCondition: única fuente de verdad para el render
  const defaultCond = useMemo<EdgeCondition>(
    () => ({ field: "default", operator: ">=", value: 0 }),
    []
  );

  const effectiveCondition = useMemo<EdgeCondition>(() => {
    if (isEditing) return condition; // mientras edito, muestro lo local
    if (isDefault) return defaultCond; // si es default por lógica de switch
    return (
      edgeData?.condition ??
      ({ field: "score", operator: ">", value: 0 } as ScoreCondition)
    ); // fallback no default
  }, [isEditing, condition, isDefault, edgeData?.condition, defaultCond]);

  // Sincronizar estado local cuando cambien los datos del parent
  useEffect(() => {
    if (!isEditing) {
      setCondition(
        edgeData?.condition ??
          ({ field: "score", operator: ">", value: 0 } as ScoreCondition)
      );
    }
  }, [isEditing, edgeData?.condition]);

  // Efecto para sincronizar la condición con la lógica de switch
  useEffect(() => {
    // Si no estamos editando, sincronizar el estado local con la lógica de switch
    if (!isEditing) {
      const shouldBeDefault = isDefault;
      const currentField = condition.field;

      // Si hay inconsistencia entre isDefault y condition.field, corregirla
      if (shouldBeDefault && currentField !== "default") {
        const newCondition: EdgeCondition = {
          field: "default",
          operator: ">=",
          value: 0,
        };
        setCondition(newCondition);
      } else if (!shouldBeDefault && currentField === "default") {
        // Si no es default pero tiene field "default", cambiar a score
        const newCondition: EdgeCondition = {
          field: "score",
          operator: ">",
          value: 0,
        };
        setCondition(newCondition);
      }
    }
  }, [isDefault, isEditing, id, condition.field]);

  // Efecto para sincronizar cuando edgeData cambie (por ejemplo, después de validateDefaultEdges)
  useEffect(() => {
    if (edgeData?.condition && !isEditing) {
      // Solo actualizar si la condición local es diferente
      if (JSON.stringify(edgeData.condition) !== JSON.stringify(condition)) {
        setCondition(edgeData.condition);
      }
    }
  }, [edgeData?.condition, isEditing, id]);

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
  const validation = useMemo(() => {
    if (isDefault || condition.field === "default") {
      return { isValid: true, errors: {} };
    }

    // Para Fortnite, validar que el valor sea positivo
    if (esport === "fortnite" && condition.value < 0) {
      return {
        isValid: false,
        errors: { value: "El valor debe ser un número positivo" },
      };
    }

    return validateEdgeCondition(condition);
  }, [condition, esport, isDefault]);

  // Manejar guardado de condición
  const handleSave = useCallback(() => {
    if (!validation.isValid) {
      console.warn("Validation failed:", validation);
      return;
    }

    try {
      // Asegurar que la condición sea consistente con la lógica de switch
      const finalCondition = isDefault
        ? ({
            field: "default" as const,
            operator: ">=" as const,
            value: 0,
          } as DefaultCondition)
        : condition;

      // Actualizar el edge en el estado global
      if (onConditionUpdate && id) {
        onConditionUpdate(id, finalCondition);
      }
      // La edición se cierra automáticamente desde TournamentEditor
    } catch (error) {
      console.error("Error saving condition:", error);
    }
  }, [condition, validation, onConditionUpdate, id, isDefault]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    // Usar la lógica de switch para determinar la condición correcta al cancelar
    if (isDefault) {
      setCondition({
        field: "default",
        operator: ">=",
        value: 0,
      } as DefaultCondition);
    } else {
      setCondition(
        edgeData?.condition ||
          ({ field: "score", operator: ">", value: 0 } as ScoreCondition)
      );
    }
    onStopEditing?.();
  }, [edgeData?.condition, onStopEditing, isDefault, id]);

  // Generar label para mostrar la condición o "default"
  const getConditionLabel = () => {
    if (isDefault || effectiveCondition.field === "default") {
      return "Derrota";
    }

    // Para otros campos, mostrar la condición con theming del esport
    if (
      effectiveCondition.field === "score" ||
      effectiveCondition.field === "position"
    ) {
      const esportConfig = getEsportConfig(esport);

      // Si es un esport competitivo (cs2, valorant, etc.), usar labels específicos
      if (esport !== "fortnite") {
        // Para edges de ganador basados en score, usar BO1, BO3, BO5
        if (
          effectiveCondition.field === "score" &&
          effectiveCondition.operator === ">"
        ) {
          if (effectiveCondition.value === 0) {
            return "Ganador BO1";
          } else if (effectiveCondition.value === 1) {
            return "Ganador BO3"; // score > 1
          } else if (effectiveCondition.value === 2) {
            return "Ganador BO5"; // score > 2
          }
          // caso custom score -> "Ganador (custom)"
          return "Ganador (custom)";
        }
        // Para otros casos, usar el label genérico del esport
        return esportConfig.edgeLabels.winner;
      }

      // Para Fortnite, generar labels descriptivos en lenguaje natural
      if (esport === "fortnite") {
        const { field, operator, value } = effectiveCondition;

        if (field === "position") {
          switch (operator) {
            case "<=":
              return `Top ${value}`;
            case "<":
              return `Top ${value - 1}`;
            case ">=":
              return `Posición ${value} o mejor`;
            case ">":
              return `Posición ${value + 1} o mejor`;
            case "==":
              return `Posición ${value}`;
            case "!=":
              return `No posición ${value}`;
            default:
              return `Posición ${operator} ${value}`;
          }
        } else if (field === "score") {
          switch (operator) {
            case ">=":
              return `Score ${value} o más`;
            case ">":
              return `Score ${value + 1} o más`;
            case "<=":
              return `Score ${value} o menos`;
            case "<":
              return `Score ${value - 1} o menos`;
            case "==":
              return `Score exacto ${value}`;
            case "!=":
              return `Score diferente de ${value}`;
            default:
              return `Score ${operator} ${value}`;
          }
        }

        // Si es score o position, mostrar la condición
        if (effectiveCondition !== defaultCond) {
          const condition = effectiveCondition as
            | ScoreCondition
            | PositionCondition;
          return `${condition.field} ${condition.operator} ${condition.value}`;
        }
      }
    }

    // Si no es ninguno de los casos anteriores, usar el outcome del edge
    return edgeData?.outcome || "condition";
  };

  // Generar tooltip descriptivo en lenguaje natural para la condición
  const getConditionTooltip = () => {
    if (isDefault || effectiveCondition.field === "default") {
      return "Los equipos que pierdan el match seguirán este flujo hacia la derrota";
    }

    const { field, operator, value } = effectiveCondition;

    // Mapear campos a lenguaje natural
    const fieldNames: Record<string, string> = {
      position: "posición",
      score: "puntuación",
    };

    // Mapear operadores a lenguaje natural
    const operatorNames: Record<string, string> = {
      ">=": "mayor o igual a",
      "<=": "menor o igual a",
      "==": "igual a",
      "!=": "diferente de",
      ">": "mayor que",
      "<": "menor que",
    };

    const fieldName = fieldNames[field] || field;
    const operatorName = operatorNames[operator] || operator;

    // Generar descripción contextual según el campo y esport
    if (esport !== "fortnite" && field === "score" && operator === ">") {
      if (value === 0) {
        return "Los equipos que ganen al menos 1 ronda (BO1) seguirán este flujo";
      } else if (value === 1) {
        return "Los equipos que ganen al menos 2 rondas (BO3) seguirán este flujo";
      } else if (value === 2) {
        return "Los equipos que ganen al menos 3 rondas (BO5) seguirán este flujo";
      }
    }

    // Generar descripción contextual según el campo
    switch (field) {
      case "score":
        return `Los participantes con ${fieldName} ${operatorName} ${value} seguirán este camino`;
      case "position":
        return `Los participantes en ${fieldName} ${operatorName} ${value} continuarán por esta ruta`;
      default:
        return `Los participantes con ${fieldName} ${operatorName} ${value} seguirán esta dirección`;
    }
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-xs font-medium cursor-help ${
                      isDefault ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {getConditionLabel()}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getConditionTooltip()}</p>
                </TooltipContent>
              </Tooltip>
              {/* Mostrar botón de edición para todos los edges */}
              <EditToggle
                isEditing={false}
                onToggle={() => onStartEditing?.()}
              />
            </div>
          ) : (
            // Editor súper compacto de condición
            <div className="bg-white border-2 border-blue-400 rounded p-2 shadow-lg min-w-fit">
              {/* Para esports competitivos, mostrar selector de BO1/BO3/BO5 */}
              {esport !== "fortnite" ? (
                <div className="mb-2">
                  <Select
                    onValueChange={(value) => {
                      if (value === "default") {
                        setCondition({
                          field: "default",
                          operator: ">=",
                          value: 0,
                        });
                      } else if (value === "bo1") {
                        setCondition({
                          field: "score",
                          operator: ">",
                          value: 0,
                        });
                      } else if (value === "bo3") {
                        setCondition({
                          field: "score",
                          operator: ">",
                          value: 1,
                        });
                      } else if (value === "bo5") {
                        setCondition({
                          field: "score",
                          operator: ">",
                          value: 2,
                        });
                      }
                    }}
                    value={
                      isDefault || effectiveCondition.field === "default"
                        ? "default"
                        : effectiveCondition.field === "score" &&
                          effectiveCondition.operator === ">" &&
                          effectiveCondition.value === 0
                        ? "bo1"
                        : effectiveCondition.field === "score" &&
                          effectiveCondition.operator === ">" &&
                          effectiveCondition.value === 1
                        ? "bo3"
                        : effectiveCondition.field === "score" &&
                          effectiveCondition.operator === ">" &&
                          effectiveCondition.value === 2
                        ? "bo5"
                        : "custom"
                    }
                  >
                    <SelectTrigger className="text-xs px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none min-w-fit">
                      <SelectValue placeholder="Derrota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Derrota</SelectItem>
                      <SelectItem value="bo1">Ganador BO1</SelectItem>
                      <SelectItem value="bo3">Ganador BO3</SelectItem>
                      <SelectItem value="bo5">Ganador BO5</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Para Fortnite, mostrar selector personalizado con campos configurables
                <div className="mb-2 space-y-2">
                  <Select
                    onValueChange={(value) => {
                      if (value === "derrota") {
                        setCondition({
                          field: "default",
                          operator: ">=",
                          value: 0,
                        });
                      } else if (value === "victoria-posicion") {
                        setCondition({
                          field: "position",
                          operator: "<=",
                          value: 10, // Top 10 por defecto
                        });
                      } else if (value === "victoria-score") {
                        setCondition({
                          field: "score",
                          operator: ">=",
                          value: 50, // Score mínimo por defecto
                        });
                      }
                    }}
                    value={
                      isDefault || effectiveCondition.field === "default"
                        ? "derrota"
                        : effectiveCondition.field === "position"
                        ? "victoria-posicion"
                        : effectiveCondition.field === "score"
                        ? "victoria-score"
                        : "custom"
                    }
                  >
                    <SelectTrigger className="text-xs px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-32">
                      <SelectValue placeholder="Derrota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="derrota">Derrota</SelectItem>
                      <SelectItem value="victoria-posicion">
                        Victoria por Posición
                      </SelectItem>
                      <SelectItem value="victoria-score">
                        Victoria por Score
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Campos configurables para victoria en Fortnite - NO mostrar para Derrota */}
                  {!isDefault &&
                    effectiveCondition.field !== "default" &&
                    esport === "fortnite" && (
                      <div className="flex gap-1">
                        <Select
                          onValueChange={(value) => {
                            if (
                              condition.field === "score" ||
                              condition.field === "position"
                            ) {
                              setCondition({
                                ...condition,
                                operator: value as ConditionOperator,
                              } as ScoreCondition);
                            }
                          }}
                          value={
                            condition.field === "default"
                              ? ">="
                              : condition.operator
                          }
                        >
                          <SelectTrigger className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-10">
                            <SelectValue placeholder=">=" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=">=">&ge;</SelectItem>
                            <SelectItem value="<=">&le;</SelectItem>
                            <SelectItem value="==">=</SelectItem>
                            <SelectItem value="!=">≠</SelectItem>
                            <SelectItem value=">">&gt;</SelectItem>
                            <SelectItem value="<">&lt;</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="text"
                          value={
                            condition.field === "default" ? 0 : condition.value
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            // Permitir solo números positivos
                            if (value === "" || /^\d+$/.test(value)) {
                              if (
                                condition.field === "score" ||
                                condition.field === "position"
                              ) {
                                setCondition({
                                  ...condition,
                                  value: value === "" ? 0 : Number(value),
                                } as ScoreCondition);
                              }
                            }
                          }}
                          className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-14"
                          placeholder="10"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Solo mostrar operador y valor si no es default Y es Fortnite */}
              {!isDefault &&
                effectiveCondition.field !== "default" &&
                esport === "fortnite" && (
                  <>
                    <Select
                      onValueChange={(value) => {
                        if (
                          condition.field === "score" ||
                          condition.field === "position"
                        ) {
                          setCondition({
                            ...condition,
                            operator: value as ConditionOperator,
                          } as ScoreCondition);
                        }
                      }}
                      value={
                        condition.field === "default"
                          ? ">="
                          : condition.operator
                      }
                    >
                      <SelectTrigger className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-10">
                        <SelectValue placeholder=">=" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">&ge;</SelectItem>
                        <SelectItem value="<=">&le;</SelectItem>
                        <SelectItem value="==">=</SelectItem>
                        <SelectItem value="!=">≠</SelectItem>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      value={
                        condition.field === "default" ? 0 : condition.value
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir solo números (incluyendo negativos)
                        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                          if (
                            condition.field === "score" ||
                            condition.field === "position"
                          ) {
                            setCondition({
                              ...condition,
                              value: value === "" ? 0 : Number(value),
                            } as ScoreCondition);
                          }
                        }
                      }}
                      className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none w-14"
                      placeholder="0"
                    />
                  </>
                )}

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
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-12"
                  title="Cancel"
                >
                  Cancelar
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
