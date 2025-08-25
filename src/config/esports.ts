import type { EsportConfiguration, EsportType } from "../types";

export const ESPORT_CONFIGS: Record<EsportType, EsportConfiguration> = {
  cs2: {
    maxTeamsPerMatch: 2,
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor",
      bo1: "Ganador BO1",
      bo3: "Ganador BO3",
      bo5: "Ganador BO5"
    },
    validationRules: {
      allowMultipleTeams: false,
      requireEvenTeams: true,
      maxMatchesPerTeam: 1
    }
  },
  valorant: {
    maxTeamsPerMatch: 2,
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor",
      bo1: "Ganador BO1",
      bo3: "Ganador BO3",
      bo5: "Ganador BO5"
    },
    validationRules: {
      allowMultipleTeams: false,
      requireEvenTeams: true,
      maxMatchesPerTeam: 1
    }
  },
  fifa: {
    maxTeamsPerMatch: 2,
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor",
      bo1: "Ganador BO1",
      bo3: "Ganador BO3",
      bo5: "Ganador BO5"
    },
    validationRules: {
      allowMultipleTeams: false,
      requireEvenTeams: true,
      maxMatchesPerTeam: 1
    }
  },
  "clash-royale": {
    maxTeamsPerMatch: 2,
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor",
      bo1: "Ganador BO1",
      bo3: "Ganador BO3",
      bo5: "Ganador BO5"
    },
    validationRules: {
      allowMultipleTeams: false,
      requireEvenTeams: true,
      maxMatchesPerTeam: 1
    }
  },
  "teamfight-tactics": {
    maxTeamsPerMatch: 2,
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor",
      bo1: "Ganador BO1",
      bo3: "Ganador BO3",
      bo5: "Ganador BO5"
    },
    validationRules: {
      allowMultipleTeams: false,
      requireEvenTeams: true,
      maxMatchesPerTeam: 1
    }
  },
  default: {
    maxTeamsPerMatch: 4, // Más flexible para otros esports
    edgeLabels: {
      winner: "Ganador",
      loser: "Perdedor"
    },
    validationRules: {
      allowMultipleTeams: true,
      requireEvenTeams: false
    }
  }
};

export function getEsportConfig(esport: EsportType): EsportConfiguration {
  return ESPORT_CONFIGS[esport] || ESPORT_CONFIGS.default;
}

export function validateMatchForEsport(
  esport: EsportType, 
  capacity: number, 
  teamCount: number
): { isValid: boolean; errors: string[] } {
  const config = getEsportConfig(esport);
  const errors: string[] = [];

  // Validar número máximo de equipos por match
  if (teamCount > config.maxTeamsPerMatch) {
    errors.push(`Este esport solo permite máximo ${config.maxTeamsPerMatch} equipos por match`);
  }

  // Validar que el número de equipos sea par si es requerido
  if (config.validationRules.requireEvenTeams && teamCount % 2 !== 0) {
    errors.push("Este esport requiere un número par de equipos por match");
  }

  // Validar que la capacidad del nodo coincida con el número de equipos
  if (capacity !== teamCount) {
    errors.push(`La capacidad del nodo (${capacity}) debe coincidir con el número de equipos (${teamCount})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
