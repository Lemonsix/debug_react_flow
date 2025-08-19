import TournamentGraphView from './TournamentGraphView';
import { sampleGraph } from './data.sample';
import '@xyflow/react/dist/style.css';


export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <TournamentGraphView graph={sampleGraph} />
    </div>
  );
}
