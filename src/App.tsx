import { useState } from "react";
import TournamentEditor from "./TournamentEditor";
import type { TournamentGraph, EsportType } from "./types";
import "@xyflow/react/dist/style.css";

// Función para generar un grafo inicial vacío
function createInitialGraph(): TournamentGraph {
  return {
    version: 1,
    tournamentId: `tournament-${Date.now()}`,
    phaseId: `phase-${Date.now()}`,
    esport: "cs2",
    nodes: [],
    edges: [],
    editable: true,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      author: "Tournament Designer",
      description: "New tournament configuration",
    },
  };
}

export default function App() {
  const [currentGraph, setCurrentGraph] = useState<TournamentGraph>(
    createInitialGraph()
  );

  const handleGraphChange = (updatedGraph: TournamentGraph) => {
    setCurrentGraph(updatedGraph);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        
        {/* Esport Selector */}
      
          <label htmlFor="esport-select" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Esport:
          </label>
                      <select
              id="esport-select"
              value={currentGraph.esport}
              onChange={(e) => {
                const newEsport = e.target.value as EsportType;
                setCurrentGraph(prev => ({
                  ...prev,
                  esport: newEsport
                }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cs2">CS2</option>
              <option value="valorant">Valorant</option>
              <option value="fifa">FIFA</option>
              <option value="clash-royale">Clash Royale</option>
              <option value="teamfight-tactics">Teamfight Tactics</option>
              <option value="fortnite">Fortnite</option>
            </select>
      </div>

      {/* Main Content - Usar solo TournamentEditor */}
      <TournamentEditor
        graph={currentGraph}
        onGraphChange={handleGraphChange}
        editable={true}
        esport={currentGraph.esport}
      />
    </div>
  );
}
