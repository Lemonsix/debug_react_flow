import type {
  NodeType,
  EdgeCondition,
  SinkConfiguration,
  MatchConfiguration,
  GraphNode,
} from "../types";

// Validación para formularios de nodo
export function validateNodeForm(
  nodeType: NodeType,
  capacity: number,
  sinkConfig?: SinkConfiguration,
  matchConfig?: MatchConfiguration,
  currentNodeId?: string,
  allNodes?: GraphNode[]
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

    // Validación de posiciones duplicadas para podio
    if (
      sinkConfig.sinkType === "podium" &&
      sinkConfig.position &&
      currentNodeId &&
      allNodes
    ) {
      const duplicateValidation = validatePodiumPosition(
        sinkConfig.position,
        currentNodeId,
        allNodes
      );
      if (!duplicateValidation.isValid) {
        errors.position =
          duplicateValidation.error || "Position already exists";
      }
    }

    // Validación removida para qualification ya que no está disponible
  }

  if (nodeType === "match" && matchConfig) {
    if (!matchConfig.capacity || matchConfig.capacity < 1) {
      errors.matchCapacity = "Match capacity must be at least 1";
    }

    if (!matchConfig.modalidad) {
      errors.modalidad = "Modalidad is required";
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

  // Si el campo es "default", no validar operator ni value
  if (condition.field === "default") {
    return {
      isValid: true,
      errors: {},
    };
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

// Validación para posiciones de podio duplicadas
export function validatePodiumPosition(
  position: number,
  currentNodeId: string,
  allNodes: GraphNode[]
): { isValid: boolean; error?: string } {
  // Buscar otros nodos sink de tipo podio con la misma posición
  const duplicateNode = allNodes.find(
    (node) =>
      node.id !== currentNodeId &&
      node.type === "sink" &&
      node.sinkConfig?.sinkType === "podium" &&
      node.sinkConfig?.position === position
  );

  if (duplicateNode) {
    return {
      isValid: false,
      error: `Ya existe un podio en la posición ${position}. Cada posición debe ser única.`,
    };
  }

  return { isValid: true };
}

// Función para obtener la siguiente posición disponible de podio
export function getNextAvailablePodiumPosition(allNodes: GraphNode[]): number {
  // Obtener todas las posiciones de podio ocupadas
  const occupiedPositions = allNodes
    .filter(
      (node) =>
        node.type === "sink" &&
        node.sinkConfig?.sinkType === "podium" &&
        node.sinkConfig?.position
    )
    .map((node) => node.sinkConfig!.position!)
    .sort((a, b) => a - b);

  // Encontrar la primera posición disponible empezando desde 1
  let nextPosition = 1;
  for (const position of occupiedPositions) {
    if (position === nextPosition) {
      nextPosition++;
    } else {
      break;
    }
  }

  return nextPosition;
}
