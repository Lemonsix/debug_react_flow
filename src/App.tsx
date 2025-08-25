import { useState } from "react";
import TournamentEditor from "./TournamentEditor";
import type { TournamentGraph, EsportType } from "./types";
import "@xyflow/react/dist/style.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

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
          <Select
            value={currentGraph.esport}
            onValueChange={(newEsport: EsportType) => {
              setCurrentGraph(prev => ({
                ...prev,
                esport: newEsport
              }));
            }}
          >
            <SelectTrigger className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Seleccionar esport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cs2">CS2</SelectItem>
              <SelectItem value="valorant">Valorant</SelectItem>
              <SelectItem value="fifa">FIFA</SelectItem>
              <SelectItem value="clash-royale">Clash Royale</SelectItem>
              <SelectItem value="teamfight-tactics">Teamfight Tactics</SelectItem>
              <SelectItem value="fortnite">Fortnite</SelectItem>
            </SelectContent>
          </Select>
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
