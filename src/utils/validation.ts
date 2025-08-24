import type {
  NodeType,
  EdgeCondition,
  SinkConfiguration,
  MatchConfiguration,
  GraphNode,
} from "../types";
import type { Edge, Node } from "@xyflow/react";

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

/**
 * Detecta si agregar un edge crearía una dependencia circular
 * Utiliza DFS (Depth-First Search) para detectar ciclos en el grafo dirigido
 */
export function detectCircularDependency(
  sourceNodeId: string,
  targetNodeId: string,
  existingEdges: Edge[],
  allNodes?: Node[]
): {
  hasCircle: boolean;
  error?: string;
  circularPath?: { path: string[]; details: string };
} {
  // Si source y target son el mismo nodo, es un ciclo inmediato
  if (sourceNodeId === targetNodeId) {
    return {
      hasCircle: true,
      error: "No se puede conectar un nodo consigo mismo.",
    };
  }

  // Si el target es un nodo sink, no puede crear ciclos porque los sink son terminales
  // (no tienen handles de salida, por lo que nunca pueden ser source de otro edge)
  if (allNodes) {
    const targetNode = allNodes.find((node) => node.id === targetNodeId);
    if (targetNode && (targetNode.data as { type?: string })?.type === "sink") {
      return { hasCircle: false }; // Los nodos sink no pueden crear ciclos
    }
  }

  // Crear un mapa de adyacencia del grafo actual
  const adjacencyMap = new Map<string, string[]>();

  // Construir el grafo de adyacencia con los edges existentes
  existingEdges.forEach((edge) => {
    if (edge.source && edge.target) {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push(edge.target);
    }
  });

  // Simular la adición del nuevo edge
  if (!adjacencyMap.has(sourceNodeId)) {
    adjacencyMap.set(sourceNodeId, []);
  }
  adjacencyMap.get(sourceNodeId)!.push(targetNodeId);

  // Realizar DFS desde el targetNode para ver si puede alcanzar el sourceNode
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyMap.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true; // Ciclo encontrado
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Ciclo encontrado - back edge
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Verificar si existe un ciclo desde el targetNode
  if (dfs(targetNodeId)) {
    // Encontrar el camino circular detallado
    const circularPath = findCircularPath(
      sourceNodeId,
      targetNodeId,
      existingEdges,
      allNodes
    );

    return {
      hasCircle: true,
      error: `Esta conexión crearía una dependencia circular. El nodo de destino ya tiene un camino que lleva de vuelta al nodo de origen.`,
      circularPath,
    };
  }

  return { hasCircle: false };
}

/**
 * Encuentra el camino circular si existe uno
 * Útil para mostrar información más detallada al usuario
 */
export function findCircularPath(
  sourceNodeId: string,
  targetNodeId: string,
  existingEdges: Edge[],
  allNodes?: Node[]
): { path: string[]; details: string } | undefined {
  // Si el target es un nodo sink, no puede crear ciclos
  if (allNodes) {
    const targetNode = allNodes.find((node) => node.id === targetNodeId);
    if (targetNode && (targetNode.data as { type?: string })?.type === "sink") {
      return undefined; // Los nodos sink no pueden crear ciclos
    }
  }

  // Crear mapa de adyacencia
  const adjacencyMap = new Map<string, string[]>();
  const edgeMap = new Map<string, Edge>();

  existingEdges.forEach((edge) => {
    if (edge.source && edge.target) {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push(edge.target);
      edgeMap.set(`${edge.source}->${edge.target}`, edge);
    }
  });

  // Simular el nuevo edge
  if (!adjacencyMap.has(sourceNodeId)) {
    adjacencyMap.set(sourceNodeId, []);
  }
  adjacencyMap.get(sourceNodeId)!.push(targetNodeId);

  // DFS para encontrar un camino desde targetNode a sourceNode
  function findPath(
    current: string,
    target: string,
    path: string[]
  ): string[] | null {
    if (current === target) {
      return [...path, current];
    }

    const neighbors = adjacencyMap.get(current) || [];
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        // Evitar bucles infinitos
        const result = findPath(neighbor, target, [...path, current]);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  const circularPath = findPath(targetNodeId, sourceNodeId, []);

  if (!circularPath) {
    return undefined;
  }

  // Generar detalles del camino circular
  let details = "CAMINO CIRCULAR DETECTADO:\n";
  details += "========================\n\n";

  // Agregar el nuevo edge que se está intentando crear
  details += `🔄 NUEVA CONEXIÓN (que causaría el ciclo):\n`;
  details += `   ${sourceNodeId} → ${targetNodeId}\n\n`;

  // Agregar el camino existente que forma el ciclo
  details += `🔄 CAMINO EXISTENTE (que forma el ciclo):\n`;
  for (let i = 0; i < circularPath.length - 1; i++) {
    const from = circularPath[i];
    const to = circularPath[i + 1];
    const edge = edgeMap.get(`${from}->${to}`);

    if (edge) {
      details += `   ${from} → ${to} (Edge ID: ${edge.id})\n`;
    } else {
      details += `   ${from} → ${to}\n`;
    }
  }

  // Agregar el cierre del ciclo
  details += `   ${
    circularPath[circularPath.length - 1]
  } → ${sourceNodeId} (NUEVA CONEXIÓN)\n\n`;

  // Agregar información de nodos
  details += `📋 DETALLE DE NODOS EN EL CICLO:\n`;
  details += `   ${circularPath.join(" → ")} → ${sourceNodeId}\n\n`;

  // Agregar información de edges
  details += `🔗 EDGES INVOLUCRADOS:\n`;
  for (let i = 0; i < circularPath.length - 1; i++) {
    const from = circularPath[i];
    const to = circularPath[i + 1];
    const edge = edgeMap.get(`${from}->${to}`);

    if (edge) {
      details += `   Edge ${edge.id}: ${from} → ${to}\n`;
    }
  }
  details += `   Edge NUEVO: ${sourceNodeId} → ${targetNodeId}\n\n`;

  // Agregar resumen
  details += `💡 RESUMEN:\n`;
  details += `   El nodo ${targetNodeId} ya tiene un camino que llega a ${sourceNodeId}.\n`;
  details += `   Al conectar ${sourceNodeId} → ${targetNodeId}, se crearía un ciclo.\n`;
  details += `   Longitud del ciclo: ${circularPath.length + 1} nodos\n`;

  return {
    path: circularPath,
    details,
  };
}

/**
 * Función de utilidad para debuggear dependencias circulares
 * Útil para llamar desde la consola del navegador o desde el código
 */
export function debugCircularDependency(
  sourceNodeId: string,
  targetNodeId: string,
  existingEdges: Edge[],
  allNodes?: Node[]
): void {
  console.log("🔍 DEBUGGING DEPENDENCIA CIRCULAR");
  console.log("==================================");
  console.log(`Intentando conectar: ${sourceNodeId} → ${targetNodeId}`);
  console.log(`Total de edges existentes: ${existingEdges.length}`);
  console.log(`Total de nodos: ${allNodes?.length || "N/A"}`);

  // Verificar si es el mismo nodo
  if (sourceNodeId === targetNodeId) {
    console.log("❌ ERROR: No se puede conectar un nodo consigo mismo");
    return;
  }

  // Verificar si el target es un sink
  if (allNodes) {
    const targetNode = allNodes.find((node) => node.id === targetNodeId);
    if (targetNode && (targetNode.data as { type?: string })?.type === "sink") {
      console.log("✅ SEGURO: Los nodos sink no pueden crear ciclos");
      return;
    }
  }

  // Buscar el camino circular
  const circularPath = findCircularPath(
    sourceNodeId,
    targetNodeId,
    existingEdges,
    allNodes
  );

  if (circularPath) {
    console.log("🚨 DEPENDENCIA CIRCULAR ENCONTRADA!");
    console.log(circularPath.details);

    // Análisis adicional
    console.log("\n🔍 ANÁLISIS DETALLADO:");
    console.log("   Longitud del ciclo:", circularPath.path.length + 1);
    console.log(
      "   Nodos únicos en el ciclo:",
      new Set([...circularPath.path, sourceNodeId]).size
    );

    // Verificar si hay nodos duplicados en el ciclo
    const cycleNodes = [...circularPath.path, sourceNodeId];
    const duplicates = cycleNodes.filter(
      (item, index) => cycleNodes.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      console.log("   ⚠️  Nodos duplicados en el ciclo:", duplicates);
    }
  } else {
    console.log("✅ SEGURO: No se detectaron dependencias circulares");

    // Mostrar el grafo actual para referencia
    console.log("\n📊 GRAFO ACTUAL:");
    const adjacencyMap = new Map<string, string[]>();
    existingEdges.forEach((edge) => {
      if (edge.source && edge.target) {
        if (!adjacencyMap.has(edge.source)) {
          adjacencyMap.set(edge.source, []);
        }
        adjacencyMap.get(edge.source)!.push(edge.target);
      }
    });

    adjacencyMap.forEach((targets, source) => {
      console.log(`   ${source} → [${targets.join(", ")}]`);
    });
  }

  console.log("==================================");
}

/**
 * Valida si se pueden eliminar los nodos sink seleccionados según las reglas específicas
 */
export function validateSinkDeletion(
  nodesToDelete: {
    id: string;
    data: {
      type?: string;
      sinkConfig?: { sinkType?: string; position?: number };
    };
  }[],
  allNodes: {
    id: string;
    data: {
      type?: string;
      sinkConfig?: { sinkType?: string; position?: number };
    };
  }[]
): { isValid: boolean; error?: string } {
  // Identificar nodos sink en la selección
  const sinkNodesToDelete = nodesToDelete.filter(
    (node) => node.data.type === "sink"
  );

  if (sinkNodesToDelete.length === 0) {
    return { isValid: true }; // No hay nodos sink, no hay problema
  }

  // Regla 1: No se puede eliminar el nodo de eliminación
  const eliminationNode = sinkNodesToDelete.find(
    (node) => node.data.sinkConfig?.sinkType === "disqualification"
  );

  if (eliminationNode) {
    return {
      isValid: false,
      error: "No se puede eliminar el nodo de eliminación.",
    };
  }

  // Regla 2: Solo se pueden eliminar podios contiguos desde el mayor
  const podiumNodesToDelete = sinkNodesToDelete.filter(
    (node) => node.data.sinkConfig?.sinkType === "podium"
  );

  if (podiumNodesToDelete.length > 0) {
    // Obtener todos los podios existentes ordenados por posición
    const allPodiums = allNodes
      .filter(
        (node) =>
          node.data.type === "sink" &&
          node.data.sinkConfig?.sinkType === "podium" &&
          node.data.sinkConfig?.position
      )
      .map((node) => ({
        id: node.id,
        position: node.data.sinkConfig!.position!,
      }))
      .sort((a, b) => a.position - b.position);

    // Obtener posiciones de los podios a eliminar
    const positionsToDelete = podiumNodesToDelete
      .map((node) => node.data.sinkConfig?.position)
      .filter((pos): pos is number => pos !== undefined)
      .sort((a, b) => a - b);

    // Verificar que no se está eliminando el primer podio
    if (positionsToDelete.includes(1)) {
      return {
        isValid: false,
        error: "No se puede eliminar el primer podio.",
      };
    }

    // Obtener la posición máxima de todos los podios
    const maxPosition = Math.max(...allPodiums.map((p) => p.position));

    // Verificar que se está eliminando desde el mayor (para cualquier cantidad)
    const maxPositionToDelete = Math.max(...positionsToDelete);

    if (maxPositionToDelete !== maxPosition) {
      return {
        isValid: false,
        error: "Solo se puede eliminar desde el podio con mayor número.",
      };
    }

    // Verificar que las posiciones sean contiguas desde el final (para múltiples)
    if (positionsToDelete.length > 1) {
      const expectedPositions: number[] = [];
      for (
        let i = maxPosition;
        i > maxPosition - positionsToDelete.length;
        i--
      ) {
        expectedPositions.push(i);
      }
      expectedPositions.reverse(); // [max-n+1, max-n+2, ..., max]

      const positionsMatch = positionsToDelete.every(
        (pos, index) => pos === expectedPositions[index]
      );

      if (!positionsMatch) {
        return {
          isValid: false,
          error:
            "Solo se pueden eliminar podios contiguos desde el mayor número hacia abajo.",
        };
      }
    }
  }

  return { isValid: true };
}
