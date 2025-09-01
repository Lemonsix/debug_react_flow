import type {
  TournamentGraph,
  EsportType,
  GraphNode,
  GraphEdge,
} from "../types";

export type TournamentTemplate = {
  id: string;
  name: string;
  description: string;
  category: "eliminacion" | "eliminacion-doble";
  participants: number;
  esports: EsportType[];
  generateGraph: (esport: EsportType) => TournamentGraph;
};

function validateInboundCapacity(nodes: GraphNode[], edges: GraphEdge[]) {
  const cap = new Map(
    nodes.map((n) => [
      n.id,
      n.capacity ??
        (n.config && "places" in n.config ? n.config.places : undefined) ??
        Infinity,
    ])
  );
  const inbound = new Map<string, number>();
  for (const e of edges) {
    if (e.toNode) {
      inbound.set(e.toNode, (inbound.get(e.toNode) ?? 0) + 1);
    }
  }
  const violations = [...inbound.entries()].filter(
    ([id, count]) => count > (cap.get(id) ?? Infinity)
  );
  return violations; // [[nodeId, inboundEdges], ...]
}

// Función helper para crear nodos de match
function createMatchNode(
  id: string,
  capacity: number,
  x: number,
  y: number,
  title?: string
) {
  // Parámetros x, y no se usan para permitir ELK layout automático
  void x;
  void y;
  return {
    id,
    type: "match" as const,
    capacity,
    slots: Array.from({ length: capacity }, (_, i) => ({
      index: i,
      participantId: undefined,
      sourceNodeId: undefined,
      sourceOutcome: undefined,
    })),
    status: "empty" as const,
    editable: true,
    config: {
      capacity,
      modalidad: "online" as const,
      title,
    },
    // No definir posición fija para permitir ELK layout
    // position: { x, y },
  };
}

// Función helper para crear nodos de eliminación
function createEliminationNode(
  id: string,
  x: number,
  y: number,
  title?: string
) {
  // Parámetros x, y no se usan para permitir ELK layout automático
  void x;
  void y;
  return {
    id,
    type: "sink" as const,
    slots: [] as {
      index: number;
      participantId?: string;
      sourceNodeId?: string;
      sourceOutcome?: string;
    }[],
    status: "empty" as const,
    editable: false,
    config: {
      sinkType: "eliminacion" as const,
      reason: title || "Eliminado",
    },
    // No definir posición fija para permitir ELK layout
    // position: { x, y },
  };
}

// Función helper para crear un nodo de eliminación único
function createSingleEliminationNode(x: number, y: number) {
  return createEliminationNode("eliminacion", x, y, "Eliminado");
}

// Función helper para crear nodos de podio
function createPodiumNode(id: string, places: number, x: number, y: number) {
  // Parámetros x, y no se usan para permitir ELK layout automático
  void x;
  void y;
  return {
    id,
    type: "sink" as const,
    slots: [] as {
      index: number;
      participantId?: string;
      sourceNodeId?: string;
      sourceOutcome?: string;
    }[],
    status: "empty" as const,
    editable: false,
    config: {
      sinkType: "podium" as const,
      places,
    },
    // No definir posición fija para permitir ELK layout
    // position: { x, y },
  };
}

// Función helper para crear edges
function createEdge(
  id: string,
  fromNode: string,
  toNode: string,
  outcome: string,
  isDefault: boolean = false,
  targetHandle?: string
) {
  return {
    id,
    fromNode,
    toNode,
    outcome,
    condition: isDefault
      ? {
          field: "default" as const,
          operator: ">=" as const,
          value: 0 as const,
        }
      : { field: "score" as const, operator: ">" as const, value: 0 as const },
    editable: true,
    isDefault,
    ...(targetHandle && { targetHandle }),
  };
}

export const TOURNAMENT_TEMPLATES: TournamentTemplate[] = [
  // ELIMINACIÓN DIRECTA
  {
    id: "eliminacion-4",
    name: "Eliminación Directa - 4 Equipos",
    description:
      "Torneo de eliminación directa para 4 equipos con podio de 3 posiciones",
    category: "eliminacion",
    participants: 4,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      const nodes = [
        // Semifinal 1
        createMatchNode("semifinal-1", 2, 200, 100, "Semifinal 1"),
        // Semifinal 2
        createMatchNode("semifinal-2", 2, 200, 300, "Semifinal 2"),
        // Final
        createMatchNode("final", 2, 400, 200, "Final"),
        // Match por el 3er lugar
        createMatchNode("tercer-lugar", 2, 400, 400, "3er Lugar"),
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 600, 200),
        // Nodo único de eliminación para el perdedor de la final
        createSingleEliminationNode(200, 500),
      ];

      const edges = [
        // Semifinal 1 → Final (ganador) - Edge NO default
        createEdge("edge-1", "semifinal-1", "final", "Ganador", false),
        // Semifinal 2 → Final (ganador) - Edge NO default
        createEdge("edge-2", "semifinal-2", "final", "Ganador", false),
        // Semifinal 1 → 3er Lugar (perdedor) - Edge default
        createEdge("edge-3", "semifinal-1", "tercer-lugar", "Perdedor", true),
        // Semifinal 2 → 3er Lugar (perdedor) - Edge default
        createEdge("edge-4", "semifinal-2", "tercer-lugar", "Perdedor", true),
        // Final → Podio (1er lugar) - Edge NO default
        createEdge(
          "edge-5",
          "final",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Final → Podio (2do lugar) - Edge default
        createEdge(
          "edge-6",
          "final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // 3er Lugar → Podio (3er lugar) - Edge NO default
        createEdge(
          "edge-7",
          "tercer-lugar",
          "podium",
          "Ganador",
          false,
          "sink-podium-2"
        ),
        // 3er Lugar → Eliminación (perdedor) - Edge default
        createEdge("edge-8", "tercer-lugar", "eliminacion", "Perdedor", true),
      ];

      // Validar capacity antes de retornar
      const violations = validateInboundCapacity(nodes, edges);
      if (violations.length > 0) {
        console.warn("Capacity violations detected:", violations);
      }

      return {
        version: 1,
        tournamentId: `template-eliminacion-4-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Eliminación Directa - 4 Equipos",
        },
      };
    },
  },

  {
    id: "eliminacion-8",
    name: "Eliminación Directa - 8 Equipos",
    description:
      "Torneo de eliminación directa para 8 equipos con podio de 3 posiciones",
    category: "eliminacion",
    participants: 8,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      const nodes = [
        // Cuartos de final
        createMatchNode("cuartos-1", 2, 100, 50, "Cuartos 1"),
        createMatchNode("cuartos-2", 2, 100, 200, "Cuartos 2"),
        createMatchNode("cuartos-3", 2, 100, 350, "Cuartos 3"),
        createMatchNode("cuartos-4", 2, 100, 500, "Cuartos 4"),
        // Semifinales
        createMatchNode("semifinal-1", 2, 350, 125, "Semifinal 1"),
        createMatchNode("semifinal-2", 2, 350, 425, "Semifinal 2"),
        // Final
        createMatchNode("final", 2, 600, 275, "Final"),
        // Match por el 3er lugar
        createMatchNode("tercer-lugar", 2, 600, 500, "3er Lugar"),
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 800, 275),
        // Nodo único de eliminación para el perdedor de la final
        createSingleEliminationNode(100, 700),
      ];

      const edges = [
        // Cuartos → Semifinales (ganadores) - Edges NO default
        createEdge("edge-1", "cuartos-1", "semifinal-1", "Ganador", false),
        createEdge("edge-2", "cuartos-2", "semifinal-1", "Ganador", false),
        createEdge("edge-3", "cuartos-3", "semifinal-2", "Ganador", false),
        createEdge("edge-4", "cuartos-4", "semifinal-2", "Ganador", false),
        // Semifinales → Final (ganadores) - Edges NO default
        createEdge("edge-5", "semifinal-1", "final", "Ganador", false),
        createEdge("edge-6", "semifinal-2", "final", "Ganador", false),
        // Semifinales → 3er Lugar (perdedores) - Edges default
        createEdge("edge-7", "semifinal-1", "tercer-lugar", "Perdedor", true),
        createEdge("edge-8", "semifinal-2", "tercer-lugar", "Perdedor", true),
        // Final → Podio (1er lugar) - Edge NO default
        createEdge(
          "edge-9",
          "final",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Final → Podio (2do lugar) - Edge default
        createEdge(
          "edge-10",
          "final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // 3er Lugar → Podio (3er lugar) - Edge NO default
        createEdge(
          "edge-11",
          "tercer-lugar",
          "podium",
          "Ganador",
          false,
          "sink-podium-2"
        ),
        // Cuartos → Eliminación (perdedores)
        createEdge("edge-12", "cuartos-1", "eliminacion", "Perdedor", true),
        createEdge("edge-13", "cuartos-2", "eliminacion", "Perdedor", true),
        createEdge("edge-14", "cuartos-3", "eliminacion", "Perdedor", true),
        createEdge("edge-15", "cuartos-4", "eliminacion", "Perdedor", true),
        // 3er Lugar → Eliminación (perdedor)
        createEdge("edge-16", "tercer-lugar", "eliminacion", "Perdedor", true),
      ];

      // Validar capacity antes de retornar
      const violations = validateInboundCapacity(nodes, edges);
      if (violations.length > 0) {
        console.warn("Capacity violations detected:", violations);
      }

      return {
        version: 1,
        tournamentId: `template-eliminacion-8-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Eliminación Directa - 8 Equipos",
        },
      };
    },
  },

  {
    id: "eliminacion-16",
    name: "Eliminación Directa - 16 Equipos",
    description:
      "Torneo de eliminación directa para 16 equipos con podio de 3 posiciones",
    category: "eliminacion",
    participants: 16,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      const nodes = [
        // Octavos de final
        ...Array.from({ length: 8 }, (_, i) =>
          createMatchNode(
            `octavos-${i + 1}`,
            2,
            50,
            50 + i * 80,
            `Octavos ${i + 1}`
          )
        ),
        // Cuartos de final
        ...Array.from({ length: 4 }, (_, i) =>
          createMatchNode(
            `cuartos-${i + 1}`,
            2,
            250,
            100 + i * 160,
            `Cuartos ${i + 1}`
          )
        ),
        // Semifinales
        createMatchNode("semifinal-1", 2, 450, 180, "Semifinal 1"),
        createMatchNode("semifinal-2", 2, 450, 340, "Semifinal 2"),
        // Final
        createMatchNode("final", 2, 650, 260, "Final"),
        // Match por el 3er lugar
        createMatchNode("tercer-lugar", 2, 650, 450, "3er Lugar"),
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 800, 260),
        // Nodo único de eliminación para el perdedor de la final
        createSingleEliminationNode(50, 750),
      ];

      const edges = [
        // Octavos → Cuartos (ganadores) - Edges NO default
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-octavos-${i + 1}`,
            `octavos-${i + 1}`,
            `cuartos-${Math.floor(i / 2) + 1}`,
            "Ganador",
            false
          )
        ),
        // Cuartos → Semifinales (ganadores) - Edges NO default
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-cuartos-${i + 1}`,
            `cuartos-${i + 1}`,
            `semifinal-${Math.floor(i / 2) + 1}`,
            "Ganador",
            false
          )
        ),
        // Semifinales → Final (ganadores) - Edges NO default
        createEdge(
          "edge-semifinal-1",
          "semifinal-1",
          "final",
          "Ganador",
          false
        ),
        createEdge(
          "edge-semifinal-2",
          "semifinal-2",
          "final",
          "Ganador",
          false
        ),
        // Semifinales → 3er Lugar (perdedores) - Edges default
        createEdge(
          "edge-tercer-lugar-sf1",
          "semifinal-1",
          "tercer-lugar",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-tercer-lugar-sf2",
          "semifinal-2",
          "tercer-lugar",
          "Perdedor",
          true
        ),
        // Final → Podio (1er lugar) - Edge NO default
        createEdge(
          "edge-final-1",
          "final",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Final → Podio (2do lugar) - Edge default
        createEdge(
          "edge-final-2",
          "final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // 3er Lugar → Podio (3er lugar) - Edge NO default
        createEdge(
          "edge-tercer-lugar-1",
          "tercer-lugar",
          "podium",
          "Ganador",
          false,
          "sink-podium-2"
        ),
        // Todos los perdedores van al mismo nodo de eliminación
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-eliminacion-octavos-${i + 1}`,
            `octavos-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),
        // Cuartos → Eliminación (perdedores)
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-eliminacion-cuartos-${i + 1}`,
            `cuartos-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),
        // 3er Lugar → Eliminación (perdedor)
        createEdge(
          "edge-eliminacion-tercer-lugar",
          "tercer-lugar",
          "eliminacion",
          "Perdedor",
          true
        ),
      ];

      // Validar capacity antes de retornar
      const violations = validateInboundCapacity(nodes, edges);
      if (violations.length > 0) {
        console.warn("Capacity violations detected:", violations);
      }

      return {
        version: 1,
        tournamentId: `template-eliminacion-16-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Eliminación Directa - 16 Equipos",
        },
      };
    },
  },

  // ELIMINACIÓN DOBLE
  {
    id: "eliminacion-doble-8",
    name: "Eliminación Doble - 8 Equipos",
    description:
      "Torneo de eliminación doble para 8 equipos con podio de 3 posiciones",
    category: "eliminacion-doble",
    participants: 8,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      const nodes = [
        // Llave ganadora (izquierda)
        createMatchNode("ganadora-1", 2, 50, 50, "Ganadora 1"),
        createMatchNode("ganadora-2", 2, 50, 150, "Ganadora 2"),
        createMatchNode("ganadora-3", 2, 50, 250, "Ganadora 3"),
        createMatchNode("ganadora-4", 2, 50, 350, "Ganadora 4"),
        createMatchNode("ganadora-semi-1", 2, 200, 100, "Ganadora Semi 1"),
        createMatchNode("ganadora-semi-2", 2, 200, 300, "Ganadora Semi 2"),
        createMatchNode("ganadora-final", 2, 350, 200, "Ganadora Final"),

        // Llave perdedora (centro)
        createMatchNode("perdedora-1", 2, 500, 50, "Perdedora 1"),
        createMatchNode("perdedora-2", 2, 500, 150, "Perdedora 2"),
        createMatchNode("perdedora-3", 2, 500, 250, "Perdedora 3"),
        createMatchNode("perdedora-4", 2, 500, 350, "Perdedora 4"),
        createMatchNode("perdedora-semi-1", 2, 650, 100, "Perdedora Semi 1"),
        createMatchNode("perdedora-semi-2", 2, 650, 300, "Perdedora Semi 2"),
        createMatchNode("perdedora-final", 2, 800, 200, "Perdedora Final"),

        // Final del torneo (centro-derecha)
        createMatchNode("final-torneo", 2, 950, 200, "Final del Torneo"),

        // Podio y eliminación (extrema derecha)
        createPodiumNode("podium", 3, 1200, 200),
        createSingleEliminationNode(1200, 400),
      ];

      const edges = [
        // Llave ganadora (ganadores)
        createEdge(
          "edge-g1",
          "ganadora-1",
          "ganadora-semi-1",
          "Ganador",
          false
        ),
        createEdge(
          "edge-g2",
          "ganadora-2",
          "ganadora-semi-1",
          "Ganador",
          false
        ),
        createEdge(
          "edge-g3",
          "ganadora-3",
          "ganadora-semi-2",
          "Ganador",
          false
        ),
        createEdge(
          "edge-g4",
          "ganadora-4",
          "ganadora-semi-2",
          "Ganador",
          false
        ),
        createEdge(
          "edge-gs1",
          "ganadora-semi-1",
          "ganadora-final",
          "Ganador",
          false
        ),
        createEdge(
          "edge-gs2",
          "ganadora-semi-2",
          "ganadora-final",
          "Ganador",
          false
        ),

        // Llave ganadora (perdedores van al lower bracket)
        createEdge(
          "edge-g1-lower",
          "ganadora-1",
          "perdedora-1",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g2-lower",
          "ganadora-2",
          "perdedora-2",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g3-lower",
          "ganadora-3",
          "perdedora-3",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g4-lower",
          "ganadora-4",
          "perdedora-4",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-gs1-lower",
          "ganadora-semi-1",
          "perdedora-semi-1",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-gs2-lower",
          "ganadora-semi-2",
          "perdedora-semi-2",
          "Perdedor",
          true
        ),

        // Llave perdedora (ganadores)
        createEdge(
          "edge-p1",
          "perdedora-1",
          "perdedora-semi-1",
          "Ganador",
          false
        ),
        createEdge(
          "edge-p2",
          "perdedora-2",
          "perdedora-semi-1",
          "Ganador",
          false
        ),
        createEdge(
          "edge-p3",
          "perdedora-3",
          "perdedora-semi-2",
          "Ganador",
          false
        ),
        createEdge(
          "edge-p4",
          "perdedora-4",
          "perdedora-semi-2",
          "Ganador",
          false
        ),
        createEdge(
          "edge-ps1",
          "perdedora-semi-1",
          "perdedora-final",
          "Ganador",
          false
        ),
        createEdge(
          "edge-ps2",
          "perdedora-semi-2",
          "perdedora-final",
          "Ganador",
          false
        ),

        // Llave perdedora (perdedores van a eliminación)
        createEdge(
          "edge-p1-elim",
          "perdedora-1",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-p2-elim",
          "perdedora-2",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-p3-elim",
          "perdedora-3",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-p4-elim",
          "perdedora-4",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-ps1-elim",
          "perdedora-semi-1",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-ps2-elim",
          "perdedora-semi-2",
          "eliminacion",
          "Perdedor",
          true
        ),

        // Conexiones entre llaves
        createEdge(
          "edge-gf",
          "ganadora-final",
          "final-torneo",
          "Ganador",
          false
        ),
        createEdge(
          "edge-pf",
          "perdedora-final",
          "final-torneo",
          "Ganador",
          false
        ),

        // Final → Podio (1er lugar) - GANADOR del torneo
        createEdge(
          "edge-ft-1",
          "final-torneo",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Final → Podio (2do lugar) - PERDEDOR de la final
        createEdge(
          "edge-ft-2",
          "final-torneo",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // Perdedora Final → Podio (3er lugar) - GANADOR del lower bracket
        createEdge(
          "edge-ft-3",
          "perdedora-final",
          "podium",
          "Ganador",
          false,
          "sink-podium-2"
        ),
        // Perdedora Final → Eliminación (perdedor del lower bracket)
        createEdge(
          "edge-ft-4",
          "perdedora-final",
          "eliminacion",
          "Perdedor",
          true
        ),
      ];

      // Validar capacity antes de retornar
      const violations = validateInboundCapacity(nodes, edges);
      if (violations.length > 0) {
        console.warn("Capacity violations detected:", violations);
      }

      return {
        version: 1,
        tournamentId: `template-eliminacion-doble-8-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Eliminación Doble - 8 Equipos",
        },
      };
    },
  },

  {
    id: "eliminacion-doble-16",
    name: "Eliminación Doble - 16 Equipos",
    description:
      "Torneo de eliminación doble para 16 equipos con podio de 3 posiciones",
    category: "eliminacion-doble",
    participants: 16,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      // --- Winners Bracket (WB) ---
      const wbR16 = Array.from({ length: 8 }, (_, i) =>
        createMatchNode(`wb-r16-${i + 1}`, 2, 0, 0, `Ganadora R16 ${i + 1}`)
      );
      const wbQF = Array.from({ length: 4 }, (_, i) =>
        createMatchNode(`wb-qf-${i + 1}`, 2, 0, 0, `Ganadora QF ${i + 1}`)
      );
      const wbSF = Array.from({ length: 2 }, (_, i) =>
        createMatchNode(`wb-sf-${i + 1}`, 2, 0, 0, `Ganadora SF ${i + 1}`)
      );
      const wbFinal = createMatchNode(`wb-final`, 2, 0, 0, `Ganadora Final`);

      // --- Lower Bracket (LB) ---
      // R1: perdedores de WB R16 emparejados: (1,2)->lb-r1-1; (3,4)->lb-r1-2; (5,6)->lb-r1-3; (7,8)->lb-r1-4
      const lbR1 = Array.from({ length: 4 }, (_, i) =>
        createMatchNode(`lb-r1-${i + 1}`, 2, 0, 0, `Perdedora R1-${i + 1}`)
      );
      // R2: winner lbR1-X vs loser wbQF-X
      const lbR2 = Array.from({ length: 4 }, (_, i) =>
        createMatchNode(`lb-r2-${i + 1}`, 2, 0, 0, `Perdedora R2-${i + 1}`)
      );
      // R3: winners de lbR2 emparejados: (1,2)->lb-r3-1; (3,4)->lb-r3-2
      const lbR3 = Array.from({ length: 2 }, (_, i) =>
        createMatchNode(`lb-r3-${i + 1}`, 2, 0, 0, `Perdedora R3-${i + 1}`)
      );
      // R4: winner lbR3-1 vs loser wbSF-1; winner lbR3-2 vs loser wbSF-2
      const lbR4 = Array.from({ length: 2 }, (_, i) =>
        createMatchNode(`lb-r4-${i + 1}`, 2, 0, 0, `Perdedora R4-${i + 1}`)
      );
      const lbSF = createMatchNode(`lb-sf`, 2, 0, 0, `Perdedora SF`);
      const lbFinal = createMatchNode(`lb-final`, 2, 0, 0, `Perdedora Final`);

      // --- Grand Final & sinks ---
      const grandFinal = createMatchNode(
        `grand-final`,
        2,
        0,
        0,
        `Final del Torneo`
      );
      const podium = createPodiumNode(`podium`, 3, 0, 0);
      const eliminacion = createSingleEliminationNode(0, 0);

      const nodes = [
        ...wbR16,
        ...wbQF,
        ...wbSF,
        wbFinal,
        ...lbR1,
        ...lbR2,
        ...lbR3,
        ...lbR4,
        lbSF,
        lbFinal,
        grandFinal,
        podium,
        eliminacion,
      ];

      const edges: ReturnType<typeof createEdge>[] = [];

      // --- WB: R16 -> QF (ganadores) y perdedores bajan a LB R1 emparejados ---
      for (let i = 1; i <= 8; i++) {
        const qfIdx = Math.ceil(i / 2); // (1,2)->1 ; (3,4)->2 ; ...
        edges.push(
          createEdge(
            `e-wb-r16-${i}-to-wb-qf-${qfIdx}`,
            `wb-r16-${i}`,
            `wb-qf-${qfIdx}`,
            "Ganador",
            false
          )
        );
        const lbR1Idx = qfIdx; // mismo pairing
        edges.push(
          createEdge(
            `e-wb-r16-${i}-to-lb-r1-${lbR1Idx}`,
            `wb-r16-${i}`,
            `lb-r1-${lbR1Idx}`,
            "Perdedor",
            true
          )
        );
      }

      // --- WB: QF -> SF (ganadores) y perdedores bajan a LB R2 correspondiente ---
      for (let j = 1; j <= 4; j++) {
        const sfIdx = Math.ceil(j / 2); // (1,2)->1 ; (3,4)->2
        edges.push(
          createEdge(
            `e-wb-qf-${j}-to-wb-sf-${sfIdx}`,
            `wb-qf-${j}`,
            `wb-sf-${sfIdx}`,
            "Ganador",
            false
          )
        );
        edges.push(
          createEdge(
            `e-wb-qf-${j}-to-lb-r2-${j}`,
            `wb-qf-${j}`,
            `lb-r2-${j}`,
            "Perdedor",
            true
          )
        );
      }

      // --- WB: SF -> WB Final (ganadores) y perdedores bajan a LB R4 correspondiente ---
      for (let k = 1; k <= 2; k++) {
        edges.push(
          createEdge(
            `e-wb-sf-${k}-to-wb-final`,
            `wb-sf-${k}`,
            `wb-final`,
            "Ganador",
            false
          )
        );
        edges.push(
          createEdge(
            `e-wb-sf-${k}-to-lb-r4-${k}`,
            `wb-sf-${k}`,
            `lb-r4-${k}`,
            "Perdedor",
            true
          )
        );
      }

      // --- LB Progressión ---
      // LB R1 winners -> LB R2 (mismo índice)
      for (let i = 1; i <= 4; i++) {
        edges.push(
          createEdge(
            `e-lb-r1-${i}-to-lb-r2-${i}`,
            `lb-r1-${i}`,
            `lb-r2-${i}`,
            "Ganador",
            false
          )
        );
        edges.push(
          createEdge(
            `e-lb-r1-${i}-elim`,
            `lb-r1-${i}`,
            `eliminacion`,
            "Perdedor",
            true
          )
        );
      }

      // LB R2 winners -> LB R3 emparejados (1,2)->r3-1 ; (3,4)->r3-2); perdedores a eliminación
      edges.push(
        createEdge(
          `e-lb-r2-1-to-lb-r3-1`,
          `lb-r2-1`,
          `lb-r3-1`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-lb-r2-2-to-lb-r3-1`,
          `lb-r2-2`,
          `lb-r3-1`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-lb-r2-3-to-lb-r3-2`,
          `lb-r2-3`,
          `lb-r3-2`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-lb-r2-4-to-lb-r3-2`,
          `lb-r2-4`,
          `lb-r3-2`,
          "Ganador",
          false
        )
      );
      for (let i = 1; i <= 4; i++) {
        edges.push(
          createEdge(
            `e-lb-r2-${i}-elim`,
            `lb-r2-${i}`,
            `eliminacion`,
            "Perdedor",
            true
          )
        );
      }

      // LB R3 winners -> LB R4 correspondiente; perdedores a eliminación
      edges.push(
        createEdge(
          `e-lb-r3-1-to-lb-r4-1`,
          `lb-r3-1`,
          `lb-r4-1`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-lb-r3-2-to-lb-r4-2`,
          `lb-r3-2`,
          `lb-r4-2`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(`e-lb-r3-1-elim`, `lb-r3-1`, `eliminacion`, "Perdedor", true)
      );
      edges.push(
        createEdge(`e-lb-r3-2-elim`, `lb-r3-2`, `eliminacion`, "Perdedor", true)
      );

      // LB R4: ya reciben además los perdedores de WB SF (arriba). Winners -> LB SF; perdedores a eliminación
      edges.push(
        createEdge(`e-lb-r4-1-to-lb-sf`, `lb-r4-1`, `lb-sf`, "Ganador", false)
      );
      edges.push(
        createEdge(`e-lb-r4-2-to-lb-sf`, `lb-r4-2`, `lb-sf`, "Ganador", false)
      );
      edges.push(
        createEdge(`e-lb-r4-1-elim`, `lb-r4-1`, `eliminacion`, "Perdedor", true)
      );
      edges.push(
        createEdge(`e-lb-r4-2-elim`, `lb-r4-2`, `eliminacion`, "Perdedor", true)
      );

      // LB SF: winner -> LB Final ; loser -> eliminación
      edges.push(
        createEdge(`e-lb-sf-to-lb-final`, `lb-sf`, `lb-final`, "Ganador", false)
      );
      edges.push(
        createEdge(`e-lb-sf-elim`, `lb-sf`, `eliminacion`, "Perdedor", true)
      );

      // WB Final: winner -> Grand Final ; loser -> LB Final
      edges.push(
        createEdge(
          `e-wb-final-to-grand-final`,
          `wb-final`,
          `grand-final`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-wb-final-to-lb-final`,
          `wb-final`,
          `lb-final`,
          "Perdedor",
          true
        )
      );

      // LB Final: winner -> Grand Final ; loser -> Podio 3
      edges.push(
        createEdge(
          `e-lb-final-to-grand-final`,
          `lb-final`,
          `grand-final`,
          "Ganador",
          false
        )
      );
      edges.push(
        createEdge(
          `e-lb-final-to-podium-3`,
          `lb-final`,
          `podium`,
          "Perdedor",
          true,
          "sink-podium-2"
        )
      );

      // Grand Final -> Podio (1° ganador, 2° perdedor)
      edges.push(
        createEdge(
          `e-gf-to-podium-1`,
          `grand-final`,
          `podium`,
          "Ganador",
          false,
          "sink-podium-0"
        )
      );
      edges.push(
        createEdge(
          `e-gf-to-podium-2`,
          `grand-final`,
          `podium`,
          "Perdedor",
          true,
          "sink-podium-1"
        )
      );

      // Validar capacity antes de retornar
      const violations = validateInboundCapacity(nodes, edges);
      if (violations.length > 0) {
        console.warn("Capacity violations detected:", violations);
      }

      return {
        version: 1,
        tournamentId: `template-eliminacion-doble-16-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Eliminación Doble - 16 Equipos",
        },
      };
    },
  },
];

export function getTemplatesByCategory(
  category: TournamentTemplate["category"]
) {
  return TOURNAMENT_TEMPLATES.filter(
    (template) => template.category === category
  );
}

export function getTemplatesByEsport(esport: EsportType) {
  return TOURNAMENT_TEMPLATES.filter((template) =>
    template.esports.includes(esport)
  );
}

export function getTemplateById(id: string) {
  return TOURNAMENT_TEMPLATES.find((template) => template.id === id);
}
