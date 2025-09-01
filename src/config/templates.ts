import type { TournamentGraph, EsportType } from "../types";

export type TournamentTemplate = {
  id: string;
  name: string;
  description: string;
  category: "eliminacion" | "eliminacion-doble";
  participants: number;
  esports: EsportType[];
  generateGraph: (esport: EsportType) => TournamentGraph;
};

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

        // Llave ganadora (perdedores van a eliminación)
        createEdge(
          "edge-g1-elim",
          "ganadora-1",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g2-elim",
          "ganadora-2",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g3-elim",
          "ganadora-3",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-g4-elim",
          "ganadora-4",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-gs1-elim",
          "ganadora-semi-1",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-gs2-elim",
          "ganadora-semi-2",
          "eliminacion",
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

        // Final → Podio (1er lugar)
        createEdge(
          "edge-ft-1",
          "final-torneo",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Ganadora Final → Podio (2do lugar)
        createEdge(
          "edge-ft-2",
          "ganadora-final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // Perdedora Final → Podio (3er lugar)
        createEdge(
          "edge-ft-3",
          "perdedora-final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-2"
        ),
      ];

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
      const nodes = [
        // Llave ganadora (izquierda) - 16 equipos
        ...Array.from({ length: 8 }, (_, i) =>
          createMatchNode(
            `ganadora-${i + 1}`,
            2,
            50,
            30 + i * 60,
            `Ganadora ${i + 1}`
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createMatchNode(
            `ganadora-semi-${i + 1}`,
            2,
            200,
            60 + i * 150,
            `Ganadora Semi ${i + 1}`
          )
        ),
        createMatchNode("ganadora-final", 2, 350, 300, "Ganadora Final"),

        // Llave perdedora (centro) - 16 equipos
        ...Array.from({ length: 8 }, (_, i) =>
          createMatchNode(
            `perdedora-${i + 1}`,
            2,
            500,
            30 + i * 60,
            `Perdedora ${i + 1}`
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createMatchNode(
            `perdedora-semi-${i + 1}`,
            2,
            650,
            60 + i * 150,
            `Perdedora Semi ${i + 1}`
          )
        ),
        createMatchNode("perdedora-final", 2, 800, 300, "Perdedora Final"),

        // Final del torneo (centro-derecha)
        createMatchNode("final-torneo", 2, 950, 300, "Final del Torneo"),

        // Podio y eliminación (extrema derecha)
        createPodiumNode("podium", 3, 1200, 300),
        createSingleEliminationNode(1200, 500),
      ];

      const edges = [
        // Llave ganadora (ganadores)
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-g${i + 1}`,
            `ganadora-${i + 1}`,
            `ganadora-semi-${Math.floor(i / 2) + 1}`,
            "Ganador",
            false
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-gs${i + 1}`,
            `ganadora-semi-${i + 1}`,
            "ganadora-final",
            "Ganador",
            false
          )
        ),

        // Llave ganadora (perdedores van a eliminación)
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-g${i + 1}-elim`,
            `ganadora-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-gs${i + 1}-elim`,
            `ganadora-semi-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),

        // Llave perdedora (ganadores)
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-p${i + 1}`,
            `perdedora-${i + 1}`,
            `perdedora-semi-${Math.floor(i / 2) + 1}`,
            "Ganador",
            false
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-ps${i + 1}`,
            `perdedora-semi-${i + 1}`,
            "perdedora-final",
            "Ganador",
            false
          )
        ),

        // Llave perdedora (perdedores van a eliminación)
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-p${i + 1}-elim`,
            `perdedora-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-ps${i + 1}-elim`,
            `perdedora-semi-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
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

        // Final → Podio (1er lugar)
        createEdge(
          "edge-ft-1",
          "final-torneo",
          "podium",
          "Ganador",
          false,
          "sink-podium-0"
        ),
        // Ganadora Final → Podio (2do lugar)
        createEdge(
          "edge-ft-2",
          "ganadora-final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-1"
        ),
        // Perdedora Final → Podio (3er lugar)
        createEdge(
          "edge-ft-3",
          "perdedora-final",
          "podium",
          "Perdedor",
          true,
          "sink-podium-2"
        ),
      ];

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
