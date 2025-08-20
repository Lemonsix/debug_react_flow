import type { NodeType, EdgeCondition, SinkConfiguration, MatchConfiguration } from "../types";

// Validación para formularios de nodo
export function validateNodeForm(
  nodeType: NodeType,
  capacity: number,
  sinkConfig?: SinkConfiguration,
  matchConfig?: MatchConfiguration
) {
  const errors: Record<string, string> = {};

  if (!nodeType) {
    errors.nodeType = "Node type is required";
  }

  if (nodeType !== "sink" && (!capacity || capacity < 1)) {
    errors.capacity = "Capacity must be at least 1";
  }

  if (nodeType === "sink" && sinkConfig) {
    if (!sinkConfig.sinkType) {
      errors.sinkType = "Sink type is required";
    }

    if (
      sinkConfig.sinkType === "podium" &&
      (!sinkConfig.position || sinkConfig.position < 1)
    ) {
      errors.position = "Position must be at least 1";
    }

    // Validación removida para qualification ya que no está disponible
  }

  if (nodeType === "match" && matchConfig) {
    if (!matchConfig.capacity || matchConfig.capacity < 1) {
      errors.matchCapacity = "Match capacity must be at least 1";
    }

    if (!matchConfig.modality) {
      errors.modality = "Modality is required";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Validación para condiciones de edges
export function validateEdgeCondition(condition: EdgeCondition) {
  const errors: Record<string, string> = {};

  if (!condition.field) {
    errors.field = "Field is required";
  }

  if (!condition.operator) {
    errors.operator = "Operator is required";
  }

  if (condition.value === undefined || condition.value === null) {
    errors.value = "Value is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
