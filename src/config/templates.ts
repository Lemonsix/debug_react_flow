import type { TournamentGraph, EsportType } from "../types";

export type TournamentTemplate = {
  id: string;
  name: string;
  description: string;
  category: "eliminacion" | "suizo" | "eliminacion-doble";
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
    position: { x, y },
  };
}

// Función helper para crear nodos de eliminación
function createEliminationNode(
  id: string,
  x: number,
  y: number,
  title?: string
) {
  return {
    id,
    type: "sink" as const,
    capacity: 0,
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
    position: { x, y },
  };
}

// Función helper para crear un nodo de eliminación único
function createSingleEliminationNode(x: number, y: number) {
  return createEliminationNode("eliminacion", x, y, "Eliminado");
}

// Función helper para crear nodos de podio
function createPodiumNode(id: string, places: number, x: number, y: number) {
  return {
    id,
    type: "sink" as const,
    capacity: 0,
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
    position: { x, y },
  };
}

// Función helper para crear edges
function createEdge(
  id: string,
  fromNode: string,
  toNode: string,
  outcome: string,
  isDefault: boolean = false
) {
  return {
    id,
    fromNode,
    toNode,
    outcome,
    condition: {
      operator: ">=" as const,
      value: 0,
      field: isDefault ? ("default" as const) : ("score" as const),
    },
    editable: true,
    isDefault,
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
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 600, 200),
        // Nodo único de eliminación para todos los perdedores
        createSingleEliminationNode(200, 400),
      ];

      const edges = [
        // Semifinal 1 → Final (ganador) - Edge default
        createEdge("edge-1", "semifinal-1", "final", "Ganador", true),
        // Semifinal 2 → Final (ganador) - Edge default
        createEdge("edge-2", "semifinal-2", "final", "Ganador", true),
        // Final → Podio (1er lugar) - Edge default
        createEdge("edge-3", "final", "podium", "Ganador", true),
        // Todos los perdedores van al mismo nodo de eliminación
        createEdge("edge-4", "semifinal-1", "eliminacion", "Perdedor", true),
        createEdge("edge-5", "semifinal-2", "eliminacion", "Perdedor", true),
        createEdge("edge-6", "final", "eliminacion", "Perdedor", true),
        // Perdedores → Podio (2do y 3er lugar)
        createEdge("edge-7", "eliminacion", "podium", "2do Lugar", false),
        createEdge("edge-8", "eliminacion", "podium", "3er Lugar", false),
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
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 800, 275),
        // Nodo único de eliminación para todos los perdedores
        createSingleEliminationNode(100, 650),
      ];

      const edges = [
        // Cuartos → Semifinales (ganadores) - Edges default
        createEdge("edge-1", "cuartos-1", "semifinal-1", "Ganador", true),
        createEdge("edge-2", "cuartos-2", "semifinal-1", "Ganador", true),
        createEdge("edge-3", "cuartos-3", "semifinal-2", "Ganador", true),
        createEdge("edge-4", "cuartos-4", "semifinal-2", "Ganador", true),
        // Semifinales → Final (ganadores) - Edges default
        createEdge("edge-5", "semifinal-1", "final", "Ganador", true),
        createEdge("edge-6", "semifinal-2", "final", "Ganador", true),
        // Final → Podio (1er lugar) - Edge default
        createEdge("edge-7", "final", "podium", "Ganador", true),
        // Todos los perdedores van al mismo nodo de eliminación
        createEdge("edge-8", "cuartos-1", "eliminacion", "Perdedor", true),
        createEdge("edge-9", "cuartos-2", "eliminacion", "Perdedor", true),
        createEdge("edge-10", "cuartos-3", "eliminacion", "Perdedor", true),
        createEdge("edge-11", "cuartos-4", "eliminacion", "Perdedor", true),
        // Semifinales → Eliminación (perdedores)
        createEdge("edge-12", "semifinal-1", "eliminacion", "Perdedor", true),
        createEdge("edge-13", "semifinal-2", "eliminacion", "Perdedor", true),
        // Final → Eliminación (perdedor)
        createEdge("edge-14", "final", "eliminacion", "Perdedor", true),
        // Perdedores → Podio (2do y 3er lugar)
        createEdge("edge-15", "eliminacion", "podium", "2do Lugar", false),
        createEdge("edge-16", "eliminacion", "podium", "3er Lugar", false),
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
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 800, 260),
        // Nodo único de eliminación para todos los perdedores
        createSingleEliminationNode(50, 700),
      ];

      const edges = [
        // Octavos → Cuartos (ganadores) - Edges default
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-octavos-${i + 1}`,
            `octavos-${i + 1}`,
            `cuartos-${Math.floor(i / 2) + 1}`,
            "Ganador",
            true
          )
        ),
        // Cuartos → Semifinales (ganadores) - Edges default
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-cuartos-${i + 1}`,
            `cuartos-${i + 1}`,
            `semifinal-${Math.floor(i / 2) + 1}`,
            "Ganador",
            true
          )
        ),
        // Semifinales → Final (ganadores) - Edges default
        createEdge("edge-semifinal-1", "semifinal-1", "final", "Ganador", true),
        createEdge("edge-semifinal-2", "semifinal-2", "final", "Ganador", true),
        // Final → Podio (1er lugar) - Edge default
        createEdge("edge-final-1", "final", "podium", "Ganador", true),
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
        // Semifinales → Eliminación (perdedores)
        createEdge(
          "edge-eliminacion-sf1",
          "semifinal-1",
          "eliminacion",
          "Perdedor",
          true
        ),
        createEdge(
          "edge-eliminacion-sf2",
          "semifinal-2",
          "eliminacion",
          "Perdedor",
          true
        ),
        // Final → Eliminación (perdedor)
        createEdge(
          "edge-eliminacion-final",
          "final",
          "eliminacion",
          "Perdedor",
          true
        ),
        // Perdedores → Podio (2do y 3er lugar)
        createEdge(
          "edge-eliminacion-sf1-podio",
          "eliminacion",
          "podium",
          "2do Lugar"
        ),
        createEdge(
          "edge-eliminacion-sf2-podio",
          "eliminacion",
          "podium",
          "3er Lugar"
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

  // SISTEMA SUIZO
  {
    id: "suizo-16",
    name: "Sistema Suizo - 16 Equipos",
    description:
      "Torneo con sistema suizo para 16 equipos con podio de 3 posiciones",
    category: "suizo",
    participants: 16,
    esports: ["cs2", "valorant", "fifa", "clash-royale", "teamfight-tactics"],
    generateGraph: (esport: EsportType) => {
      const nodes = [
        // Rondas del sistema suizo
        ...Array.from({ length: 4 }, (_, round) =>
          createMatchNode(
            `ronda-${round + 1}`,
            2,
            150 + round * 120,
            200,
            `Ronda ${round + 1}`
          )
        ),
        // Final
        createMatchNode("final", 2, 650, 200, "Final"),
        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 800, 200),
        // Matches de consolación para equipos con mismo score
        ...Array.from({ length: 3 }, (_, i) =>
          createMatchNode(
            `consolacion-${i + 1}`,
            2,
            150 + i * 120,
            400,
            `Consolación ${i + 1}`
          )
        ),
        // Nodo único de eliminación para todos los perdedores
        createSingleEliminationNode(650, 400),
      ];

      const edges = [
        // Rondas → Final (ganadores) - Edges default
        ...Array.from({ length: 4 }, (_, round) =>
          createEdge(
            `edge-ronda-${round + 1}`,
            `ronda-${round + 1}`,
            "final",
            "Ganador",
            true
          )
        ),
        // Final → Podio (1er lugar) - Edge default
        createEdge("edge-final-1", "final", "podium", "Ganador", true),
        // Rondas → Matches de consolación (perdedores)
        ...Array.from({ length: 4 }, (_, round) =>
          createEdge(
            `edge-ronda-${round + 1}-consolacion`,
            `ronda-${round + 1}`,
            `consolacion-${Math.min(round + 1, 3)}`,
            "Perdedor",
            true
          )
        ),
        // Todos los perdedores van al mismo nodo de eliminación
        createEdge(
          "edge-final-eliminacion",
          "final",
          "eliminacion",
          "Perdedor",
          true
        ),
        // Consolación → Eliminación (perdedores)
        ...Array.from({ length: 3 }, (_, i) =>
          createEdge(
            `edge-consolacion-${i + 1}-eliminacion`,
            `consolacion-${i + 1}`,
            "eliminacion",
            "Perdedor",
            true
          )
        ),
        // Perdedores → Podio (2do y 3er lugar)
        createEdge(
          "edge-eliminacion-final-podio",
          "eliminacion",
          "podium",
          "2do Lugar"
        ),
        createEdge(
          "edge-eliminacion-consolacion-1-podio",
          "eliminacion",
          "podium",
          "3er Lugar"
        ),
      ];

      return {
        version: 1,
        tournamentId: `template-suizo-16-${Date.now()}`,
        esport,
        nodes,
        edges,
        editable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: "Template System",
          description: "Sistema Suizo - 16 Equipos",
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
        // Llave ganadora
        createMatchNode("ganadora-1", 2, 100, 50, "Ganadora 1"),
        createMatchNode("ganadora-2", 2, 100, 150, "Ganadora 2"),
        createMatchNode("ganadora-3", 2, 100, 250, "Ganadora 3"),
        createMatchNode("ganadora-4", 2, 100, 350, "Ganadora 4"),
        createMatchNode("ganadora-semi-1", 2, 250, 100, "Ganadora Semi 1"),
        createMatchNode("ganadora-semi-2", 2, 250, 300, "Ganadora Semi 2"),
        createMatchNode("ganadora-final", 2, 400, 200, "Ganadora Final"),

        // Llave perdedora
        createMatchNode("perdedora-1", 2, 500, 50, "Perdedora 1"),
        createMatchNode("perdedora-2", 2, 500, 150, "Perdedora 2"),
        createMatchNode("perdedora-3", 2, 500, 250, "Perdedora 3"),
        createMatchNode("perdedora-4", 2, 500, 350, "Perdedora 4"),
        createMatchNode("perdedora-semi-1", 2, 650, 100, "Perdedora Semi 1"),
        createMatchNode("perdedora-semi-2", 2, 650, 300, "Perdedora Semi 2"),
        createMatchNode("perdedora-final", 2, 800, 200, "Perdedora Final"),

        // Final del torneo
        createMatchNode("final-torneo", 2, 600, 200, "Final del Torneo"),

        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 900, 200),
      ];

      const edges = [
        // Llave ganadora
        createEdge("edge-g1", "ganadora-1", "ganadora-semi-1", "Ganador"),
        createEdge("edge-g2", "ganadora-2", "ganadora-semi-1", "Ganador"),
        createEdge("edge-g3", "ganadora-3", "ganadora-semi-2", "Ganador"),
        createEdge("edge-g4", "ganadora-4", "ganadora-semi-2", "Ganador"),
        createEdge("edge-gs1", "ganadora-semi-1", "ganadora-final", "Ganador"),
        createEdge("edge-gs2", "ganadora-semi-2", "ganadora-final", "Ganador"),

        // Llave perdedora
        createEdge("edge-p1", "perdedora-1", "perdedora-semi-1", "Ganador"),
        createEdge("edge-p2", "perdedora-2", "perdedora-semi-1", "Ganador"),
        createEdge("edge-p3", "perdedora-3", "perdedora-semi-2", "Ganador"),
        createEdge("edge-p4", "perdedora-4", "perdedora-semi-2", "Ganador"),
        createEdge(
          "edge-ps1",
          "perdedora-semi-1",
          "perdedora-final",
          "Ganador"
        ),
        createEdge(
          "edge-ps2",
          "perdedora-semi-2",
          "perdedora-final",
          "Ganador"
        ),

        // Conexiones entre llaves
        createEdge("edge-gf", "ganadora-final", "final-torneo", "Ganador"),
        createEdge("edge-pf", "perdedora-final", "final-torneo", "Ganador"),

        // Final → Podio (1er lugar)
        createEdge("edge-ft-1", "final-torneo", "podium", "Ganador"),
        // Ganadora Final → Podio (2do lugar)
        createEdge("edge-ft-2", "ganadora-final", "podium", "Perdedor"),
        // Perdedora Final → Podio (3er lugar)
        createEdge("edge-ft-3", "perdedora-final", "podium", "Perdedor"),
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
        // Llave ganadora (simplificada para 16 equipos)
        ...Array.from({ length: 8 }, (_, i) =>
          createMatchNode(
            `ganadora-${i + 1}`,
            2,
            100,
            50 + i * 50,
            `Ganadora ${i + 1}`
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createMatchNode(
            `ganadora-semi-${i + 1}`,
            2,
            250,
            100 + i * 120,
            `Ganadora Semi ${i + 1}`
          )
        ),
        createMatchNode("ganadora-final", 2, 400, 220, "Ganadora Final"),

        // Llave perdedora (simplificada para 16 equipos)
        ...Array.from({ length: 8 }, (_, i) =>
          createMatchNode(
            `perdedora-${i + 1}`,
            2,
            500,
            50 + i * 50,
            `Perdedora ${i + 1}`
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createMatchNode(
            `perdedora-semi-${i + 1}`,
            2,
            650,
            100 + i * 120,
            `Perdedora Semi ${i + 1}`
          )
        ),
        createMatchNode("perdedora-final", 2, 800, 220, "Perdedora Final"),

        // Final del torneo
        createMatchNode("final-torneo", 2, 600, 220, "Final del Torneo"),

        // Podio único con 3 posiciones
        createPodiumNode("podium", 3, 900, 220),
      ];

      const edges = [
        // Llave ganadora
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-g${i + 1}`,
            `ganadora-${i + 1}`,
            `ganadora-semi-${Math.floor(i / 2) + 1}`,
            "Ganador"
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-gs${i + 1}`,
            `ganadora-semi-${i + 1}`,
            "ganadora-final",
            "Ganador"
          )
        ),

        // Llave perdedora
        ...Array.from({ length: 8 }, (_, i) =>
          createEdge(
            `edge-p${i + 1}`,
            `perdedora-${i + 1}`,
            `perdedora-semi-${Math.floor(i / 2) + 1}`,
            "Ganador"
          )
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createEdge(
            `edge-ps${i + 1}`,
            `perdedora-semi-${i + 1}`,
            "perdedora-final",
            "Ganador"
          )
        ),

        // Conexiones entre llaves
        createEdge("edge-gf", "ganadora-final", "final-torneo", "Ganador"),
        createEdge("edge-pf", "perdedora-final", "final-torneo", "Ganador"),

        // Final → Podio (1er lugar)
        createEdge("edge-ft-1", "final-torneo", "podium", "Ganador"),
        // Ganadora Final → Podio (2do lugar)
        createEdge("edge-ft-2", "ganadora-final", "podium", "Perdedor"),
        // Perdedora Final → Podio (3er lugar)
        createEdge("edge-ft-3", "perdedora-final", "podium", "Perdedor"),
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
