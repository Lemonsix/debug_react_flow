import type { GoBackendGraph, TournamentGraph } from './types';

// JSON real del backend de Go
export const realBackendData: GoBackendGraph = {
  "nodes": [
    {
      "id": "0045f035-1826-47d8-934b-5725e027052d",
      "phase_id": "0198c2f4-ad10-79b6-a530-859859ad237f",
      "type": "match",
      "esport": "cs2",
      "capacity": 2,
      "config": null
    },
    {
      "id": "7a66ac47-b3d0-469d-9d63-a4605fa78bed",
      "phase_id": "0198c2f4-ad10-79b6-a530-859859ad237f",
      "type": "match",
      "esport": "cs2",
      "capacity": 2,
      "config": null
    },
    {
      "id": "e75dbdff-c4b3-4503-a33c-6051efb9b71d",
      "phase_id": "0198c2f4-ad10-79b6-a530-859859ad237f",
      "type": "aggregator",
      "esport": "cs2",
      "capacity": 0,
      "config": null
    }
  ],
  "edges": [
    {
      "id": "d102c6a6-fed8-47ec-8ef6-0ef4056d76f5",
      "fromNode": "0045f035-1826-47d8-934b-5725e027052d",
      "outcome": "pos>=0",
      "toNode": "e75dbdff-c4b3-4503-a33c-6051efb9b71d"
    },
    {
      "id": "a802b23a-d616-4625-8a4b-79bd3f1e6d2f",
      "fromNode": "7a66ac47-b3d0-469d-9d63-a4605fa78bed",
      "outcome": "pos>=0",
      "toNode": "e75dbdff-c4b3-4503-a33c-6051efb9b71d"
    }
  ],
  "slots": [
    {
      "node_id": "0045f035-1826-47d8-934b-5725e027052d",
      "slot_index": 0,
      "participant_id": "01982db1-1950-77d7-846e-a926f2575c66"
    },
    {
      "node_id": "0045f035-1826-47d8-934b-5725e027052d",
      "slot_index": 1,
      "participant_id": "01986664-f543-7a35-8d7d-1624765d0252"
    },
    {
      "node_id": "7a66ac47-b3d0-469d-9d63-a4605fa78bed",
      "slot_index": 0,
      "participant_id": "01986667-eaba-7312-a092-c5e356cc63a3"
    },
    {
      "node_id": "7a66ac47-b3d0-469d-9d63-a4605fa78bed",
      "slot_index": 1,
      "participant_id": "0198666b-10fa-7db1-bb72-0048fbd283cf"
    }
  ]
};

/**
 * Conversor simple del JSON de Go al formato del componente
 * Solo transforma lo necesario, sin duplicar estructuras
 */
export function convertGoToComponent(goData: GoBackendGraph): TournamentGraph {
  return {
    version: 1,
    tournamentId: 'T-001', // Valor por defecto
    phaseId: goData.nodes[0]?.phase_id || 'unknown',
    nodes: goData.nodes.map(node => {
      // Obtener slots reales del backend para este nodo
      const nodeSlots = goData.slots?.filter(slot => slot.node_id === node.id) || [];
      
      // Crear array de slots completo basado en la capacidad
      const slots = Array.from({ length: node.capacity }, (_, index) => {
        const backendSlot = nodeSlots.find(slot => slot.slot_index === index);
        return {
          index,
          participantId: backendSlot?.participant_id,
          sourceNodeId: backendSlot?.source_node_id,
          sourceOutcome: backendSlot?.source_outcome,
        };
      });

      return {
        id: node.id,
        phaseId: node.phase_id,
        type: node.type,
        esport: node.esport,
        capacity: node.capacity,
        slots,
        status: 'pending' as const, // Estado por defecto
        config: node.config,
      };
    }),
    edges: goData.edges.map(edge => ({
      id: edge.id,
      fromNode: edge.fromNode,
      outcome: edge.outcome,
      toNode: edge.toNode,
      sink: edge.sink,
    })),
  };
}

// Datos convertidos para usar en el componente
export const sampleGraph = convertGoToComponent(realBackendData);
