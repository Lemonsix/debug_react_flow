import TournamentGraphView from "./TournamentGraphView";
import { sampleGraph } from "./data.sample";
import "@xyflow/react/dist/style.css";

export default function App() {
  return (
    <div>
      <TournamentGraphView graph={sampleGraph} />
    </div>
  );
}
