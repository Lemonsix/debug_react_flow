import { useState } from "react";
import TournamentEditor from "./TournamentEditor";
import TemplateSelector from "./components/TemplateSelector";
import TemplateConfirmModal from "./components/TemplateConfirmModal";
import type { TournamentGraph, EsportType } from "./types";
import type { TournamentTemplate } from "./config/templates";
import "@xyflow/react/dist/style.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button";
import { Plus, X } from "lucide-react";

// Función para generar un grafo inicial vacío
function createInitialGraph(): TournamentGraph {
  return {
    version: 1,
    tournamentId: `tournament-${Date.now()}`,
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TournamentTemplate | null>(null);

  const handleGraphChange = (updatedGraph: TournamentGraph) => {
    setCurrentGraph(updatedGraph);
  };

  const handleTemplateSelect = (template: TournamentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleTemplateConfirm = (template: TournamentTemplate) => {
    const newGraph = template.generateGraph(currentGraph.esport);
    setCurrentGraph(newGraph);
    setShowTemplates(false);
    setSelectedTemplate(null);

    // Resetear el estado de edición para que todos los nodos estén en modo no-editable
    // Esto se hace a través de un callback que se ejecutará después del render
    setTimeout(() => {
      // Forzar un re-render del TournamentEditor para resetear el estado interno
      setCurrentGraph((prev) => ({ ...prev }));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6 space-y-4">
        {/* Esport Selector */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label
              htmlFor="esport-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Seleccionar Esport:
            </label>
            <Select
              value={currentGraph.esport}
              onValueChange={(newEsport: EsportType) => {
                setCurrentGraph((prev) => ({
                  ...prev,
                  esport: newEsport,
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
                <SelectItem value="teamfight-tactics">
                  Teamfight Tactics
                </SelectItem>
                <SelectItem value="fortnite">Fortnite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón de Templates */}
          <div className="ml-4">
            <Button
              onClick={() => setShowTemplates(!showTemplates)}
              variant={showTemplates ? "outline" : "default"}
              className="flex items-center space-x-2"
            >
              {showTemplates ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Ocultar Templates</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Ver Templates</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Selector de Templates */}
        {showTemplates && (
          <TemplateSelector
            esport={currentGraph.esport}
            onTemplateSelect={handleTemplateSelect}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          />
        )}
      </div>

      {/* Main Content - Usar solo TournamentEditor */}
      <TournamentEditor
        graph={currentGraph}
        onGraphChange={handleGraphChange}
        editable={true}
        esport={currentGraph.esport}
      />

      {/* Modal de Confirmación de Template */}
      <TemplateConfirmModal
        template={selectedTemplate}
        esport={currentGraph.esport}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onConfirm={handleTemplateConfirm}
      />
    </div>
  );
}
