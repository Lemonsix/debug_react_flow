import { useState } from "react";
import TournamentEditor from "./TournamentEditor";
import TournamentGraphView from "./TournamentGraphView";
import { sampleGraph } from "./data.sample";
import type { TournamentGraph } from "./types";
import "@xyflow/react/dist/style.css";

export default function App() {
  const [currentGraph, setCurrentGraph] =
    useState<TournamentGraph>(sampleGraph);
  const [useEditor, setUseEditor] = useState(true);

  const handleGraphChange = (updatedGraph: TournamentGraph) => {
    setCurrentGraph(updatedGraph);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tournament Graph Editor
        </h1>
        <p className="text-gray-600">
          Design tournament flows with interactive nodes and conditional edges
        </p>

        {/* Toggle between editor and viewer */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setUseEditor(true)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${
                useEditor
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            📝 Editor Mode
          </button>
          <button
            onClick={() => setUseEditor(false)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${
                !useEditor
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            👁️ Viewer Mode
          </button>
        </div>
      </div>

      {/* Main Content */}
      {useEditor ? (
        <TournamentEditor
          graph={currentGraph}
          onGraphChange={handleGraphChange}
          editable={true}
        />
      ) : (
        <TournamentGraphView graph={currentGraph} />
      )}
    </div>
  );
}
