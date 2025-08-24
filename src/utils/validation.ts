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
        node.sinkConfig.position
    )
    .map((node) => node.sinkConfig!.position!)
    .sort((a, b) => a - b);

  // Si no hay posiciones ocupadas, empezar en 1
  if (occupiedPositions.length === 0) {
    return 1;
  }

  // Buscar el primer gap en las posiciones
  for (let i = 0; i < occupiedPositions.length; i++) {
    if (occupiedPositions[i] !== i + 1) {
      return i + 1;
    }
  }

  // Si no hay gaps, usar la siguiente posición después de la última
  return occupiedPositions[occupiedPositions.length - 1] + 1;
}

/**
 * Valida que el torneo mantenga la estructura mínima requerida
 * Un torneo debe tener al menos:
 * - 1 nodo de match
 * - 1 nodo de podio
 * - 1 nodo de eliminación
 */
export function validateTournamentStructure(
  allNodes: GraphNode[],
  nodeToDelete?: GraphNode
): { isValid: boolean; error?: string } {
  // Si no hay nodos, no es válido
  if (allNodes.length === 0) {
    return {
      isValid: false,
      error: "El torneo debe tener al menos un nodo",
    };
  }

  // Filtrar nodos por tipo
  const matchNodes = allNodes.filter((node) => node.type === "match");
  const podiumNodes = allNodes.filter(
    (node) => node.type === "sink" && node.sinkConfig?.sinkType === "podium"
  );
  const disqualificationNodes = allNodes.filter(
    (node) =>
      node.type === "sink" && node.sinkConfig?.sinkType === "disqualification"
  );

  // Si vamos a eliminar un nodo, verificar que después de eliminarlo siga siendo válido
  if (nodeToDelete) {
    const remainingMatchNodes = matchNodes.filter(
      (node) => node.id !== nodeToDelete.id
    );
    const remainingPodiumNodes = podiumNodes.filter(
      (node) => node.id !== nodeToDelete.id
    );
    const remainingDisqualificationNodes = disqualificationNodes.filter(
      (node) => node.id !== nodeToDelete.id
    );

    // Verificar que después de eliminar siga habiendo al menos uno de cada tipo
    if (remainingMatchNodes.length === 0) {
      return {
        isValid: false,
        error:
          "No se puede eliminar el nodo. El torneo debe tener al menos un match.",
      };
    }

    if (remainingPodiumNodes.length === 0) {
      return {
        isValid: false,
        error:
          "No se puede eliminar el nodo. El torneo debe tener al menos un podio.",
      };
    }

    if (remainingDisqualificationNodes.length === 0) {
      return {
        isValid: false,
        error:
          "No se puede eliminar el nodo. El torneo debe tener al menos un nodo de eliminación.",
      };
    }
  } else {
    // Validación para el estado actual (sin eliminar)
    if (matchNodes.length === 0) {
      return {
        isValid: false,
        error: "El torneo debe tener al menos un nodo de match.",
      };
    }

    if (podiumNodes.length === 0) {
      return {
        isValid: false,
        error: "El torneo debe tener al menos un nodo de podio.",
      };
    }

    if (disqualificationNodes.length === 0) {
      return {
        isValid: false,
        error: "El torneo debe tener al menos un nodo de eliminación.",
      };
    }
  }

  return { isValid: true };
}
