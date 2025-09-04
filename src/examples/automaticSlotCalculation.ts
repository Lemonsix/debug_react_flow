import type { GraphNode, GraphEdge } from "../types";
import {
  calculateTeamCount,
  calculateEliminationSlots,
  calculateSinkSlots,
  validateSlotConfiguration,
} from "../utils/slotManagement";

/**
 * Ejemplo de cálculo automático de slots de eliminación
 */

// Ejemplo de grafo de torneo de eliminación directa de 8 equipos
const exampleNodes: GraphNode[] = [
  // Matches iniciales (4 matches de 2 equipos cada uno = 8 equipos total)
  {
    id: "cuartos-1",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  {
    id: "cuartos-2",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  {
    id: "cuartos-3",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  {
    id: "cuartos-4",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  // Matches intermedios (no son iniciales)
  {
    id: "semifinal-1",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  {
    id: "semifinal-2",
    type: "match",
    capacity: 2,
    slots: [],
    status: "empty",
    editable: false,
    config: {
      capacity: 2,
      modalidad: "online",
    },
  },
  // Nodo de podio con 3 posiciones
  {
    id: "podium",
    type: "sink",
    slots: [
      {
        index: 0,
        participantId: undefined,
        sourceNodeId: undefined,
        sourceOutcome: undefined,
      },
      {
        index: 1,
        participantId: undefined,
        sourceNodeId: undefined,
        sourceOutcome: undefined,
      },
      {
        index: 2,
        participantId: undefined,
        sourceNodeId: undefined,
        sourceOutcome: undefined,
      },
    ],
    status: "empty",
    editable: false,
    config: {
      sinkType: "podium",
      places: 3,
      slots: 3,
    },
  },
  // Nodo de eliminación (slots calculados automáticamente)
  {
    id: "eliminacion",
    type: "sink",
    slots: [], // Se calculará automáticamente
    status: "empty",
    editable: false,
    config: {
      sinkType: "eliminacion",
      reason: "Eliminado",
      slots: 0, // Se calculará automáticamente
    },
  },
];

const exampleEdges: GraphEdge[] = [
  // Conexiones entre matches (simplificadas para el ejemplo)
  {
    id: "edge-1",
    fromNode: "cuartos-1",
    toNode: "semifinal-1",
    outcome: "Ganador",
  },
  {
    id: "edge-2",
    fromNode: "cuartos-2",
    toNode: "semifinal-1",
    outcome: "Ganador",
  },
  {
    id: "edge-3",
    fromNode: "cuartos-3",
    toNode: "semifinal-2",
    outcome: "Ganador",
  },
  {
    id: "edge-4",
    fromNode: "cuartos-4",
    toNode: "semifinal-2",
    outcome: "Ganador",
  },
  {
    id: "edge-5",
    fromNode: "semifinal-1",
    toNode: "podium",
    outcome: "Ganador",
  },
  {
    id: "edge-6",
    fromNode: "semifinal-2",
    toNode: "podium",
    outcome: "Ganador",
  },
  {
    id: "edge-7",
    fromNode: "semifinal-1",
    toNode: "eliminacion",
    outcome: "Perdedor",
  },
  {
    id: "edge-8",
    fromNode: "semifinal-2",
    toNode: "eliminacion",
    outcome: "Perdedor",
  },
];

/**
 * Demuestra el cálculo automático de slots
 */
export function demonstrateAutomaticSlotCalculation() {
  console.log("=== DEMOSTRACIÓN DE CÁLCULO AUTOMÁTICO DE SLOTS ===\n");

  // 1. Calcular cantidad de equipos
  const teamCount = calculateTeamCount(exampleNodes, exampleEdges);
  console.log(`1. Cantidad de equipos calculada: ${teamCount}`);
  console.log("   (4 matches iniciales × 2 equipos cada uno = 8 equipos)\n");

  // 2. Calcular slots de eliminación necesarios
  const eliminationSlots = calculateEliminationSlots(
    exampleNodes,
    exampleEdges
  );
  console.log(`2. Slots de eliminación necesarios: ${eliminationSlots}`);
  console.log("   (8 equipos - 3 slots del podio = 5 slots de eliminación)\n");

  // 3. Calcular estadísticas completas
  const stats = calculateSinkSlots(exampleNodes, exampleEdges);
  console.log("3. Estadísticas completas:");
  console.log(`   - Equipos totales: ${stats.teamCount}`);
  console.log(`   - Slots del podio: ${stats.podiumSlots}`);
  console.log(`   - Slots de eliminación: ${stats.eliminationSlots}`);
  console.log(
    `   - Total de slots: ${stats.podiumSlots + stats.eliminationSlots}\n`
  );

  // 4. Validar configuración
  const validation = validateSlotConfiguration(exampleNodes, exampleEdges);
  console.log("4. Validación de configuración:");
  console.log(`   - Válida: ${validation.isValid}`);
  console.log(
    `   - Errores: ${
      validation.errors.length > 0 ? validation.errors.join(", ") : "Ninguno"
    }`
  );
  console.log(
    `   - Advertencias: ${
      validation.warnings.length > 0
        ? validation.warnings.join(", ")
        : "Ninguna"
    }`
  );
  console.log("\n   Estadísticas de validación:");
  console.log(`   - Equipos: ${validation.stats.teamCount}`);
  console.log(`   - Slots del podio: ${validation.stats.podiumSlots}`);
  console.log(
    `   - Slots de eliminación: ${validation.stats.eliminationSlots}`
  );
  console.log(
    `   - Slots totales en sinks: ${validation.stats.totalSinkSlots}\n`
  );

  // 5. Mostrar fórmula aplicada
  console.log("5. Fórmula aplicada:");
  console.log(`   Slots de eliminación = Equipos totales - Slots del podio`);
  console.log(`   ${eliminationSlots} = ${teamCount} - ${stats.podiumSlots}\n`);

  // 6. Mostrar distribución de equipos
  console.log("6. Distribución de equipos en el torneo:");
  console.log(
    `   - Equipos que llegan al podio: ${stats.podiumSlots} (${Math.round(
      (stats.podiumSlots / teamCount) * 100
    )}%)`
  );
  console.log(
    `   - Equipos eliminados: ${stats.eliminationSlots} (${Math.round(
      (stats.eliminationSlots / teamCount) * 100
    )}%)`
  );
  console.log(`   - Total: ${teamCount} equipos (100%)\n`);

  return {
    teamCount,
    eliminationSlots,
    stats,
    validation,
  };
}

/**
 * Ejemplo de diferentes configuraciones de torneo
 */
export function demonstrateDifferentTournamentConfigurations() {
  console.log("=== DIFERENTES CONFIGURACIONES DE TORNEO ===\n");

  const configurations = [
    { name: "Eliminación Directa 4 equipos", teams: 4, podiumSlots: 3 },
    { name: "Eliminación Directa 8 equipos", teams: 8, podiumSlots: 3 },
    { name: "Eliminación Directa 16 equipos", teams: 16, podiumSlots: 3 },
    { name: "Torneo con podio de 5 lugares", teams: 8, podiumSlots: 5 },
    { name: "Torneo con podio de 1 lugar", teams: 4, podiumSlots: 1 },
  ];

  configurations.forEach((config, index) => {
    const eliminationSlots = Math.max(0, config.teams - config.podiumSlots);
    const podiumPercentage = Math.round(
      (config.podiumSlots / config.teams) * 100
    );
    const eliminationPercentage = Math.round(
      (eliminationSlots / config.teams) * 100
    );

    console.log(`${index + 1}. ${config.name}:`);
    console.log(`   - Equipos: ${config.teams}`);
    console.log(
      `   - Slots del podio: ${config.podiumSlots} (${podiumPercentage}%)`
    );
    console.log(
      `   - Slots de eliminación: ${eliminationSlots} (${eliminationPercentage}%)`
    );
    console.log(
      `   - Fórmula: ${eliminationSlots} = ${config.teams} - ${config.podiumSlots}\n`
    );
  });
}

// Ejecutar demostración si se ejecuta directamente
if (typeof window === "undefined") {
  demonstrateAutomaticSlotCalculation();
  console.log("\n" + "=".repeat(50) + "\n");
  demonstrateDifferentTournamentConfigurations();
}
