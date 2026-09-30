/**
 * Static registry of the 3D models available in the model library.
 *
 * Each model file lives at apps/web/public/models/<file>, which Next.js
 * serves automatically at /models/<file> â€” no API route needed to fetch
 * the .glb itself. This registry is just the metadata (name, subject,
 * search terms) that drives the picker UI and the search bar; the actual
 * geometry is loaded client-side by <model-viewer> from the public path.
 *
 * `id` is what gets broadcast over the wire (ClassroomEvent's
 * `ActiveModel.modelId`) â€” every client resolves it back to a full Model3D
 * via `getModel()` rather than trusting anything about the model over the
 * network beyond its id.
 */

export type ModelSubject = 'Qubits' | 'Gates' | 'Hardware' | 'Networks' | 'Waves';

export interface Model3D {
  id: string;
  name: string;
  /** Filename inside apps/web/public/models/ */
  file: string;
  subject: ModelSubject;
  /** Short line shown under the name in the picker tile. */
  description: string;
  /**
   * Attribution text for CC-licensed models, shown in a credits section.
   * Undefined for CC0 models, where no credit is legally required.
   */
  credit?: string;
}

export const MODELS_3D: Model3D[] = [
  {
    id: 'quantum-computer',
    name: 'Quantum Computer',
    file: 'quantum_computer.glb',
    subject: 'Hardware',
    description: 'The hardware behind a quantum computer.',
  },
  {
    id: 'quantum-2d-register',
    name: '2D Qubit Register',
    file: 'quantum_2d_ca_register.glb',
    subject: 'Qubits',
    description: 'A grid of qubits working as one register.',
  },
  {
    id: 'cuboctahedron-qubit',
    name: 'Cuboctahedron Qubit',
    file: 'cuboctahedron_qubit.glb',
    subject: 'Qubits',
    description: 'A qubit visualised as a cuboctahedron.',
  },
  {
    id: 'macroscopic-qubit',
    name: 'Macroscopic Qubit',
    file: 'macroscopic_quantum_qubit.glb',
    subject: 'Qubits',
    description: 'A qubit shown at a scale you can see.',
  },
  {
    id: 'quantum-cube',
    name: 'Quantum Cube',
    file: 'quantum_cube.glb',
    subject: 'Qubits',
    description: 'A cube of qubit states to explore.',
  },
  {
    id: 'cnot-gate',
    name: 'CNOT Gate',
    file: 'quantum_gate_cnot.glb',
    subject: 'Gates',
    description: 'The controlled-NOT gate that creates entanglement.',
  },
  {
    id: 'cylindrical-quantum-network',
    name: 'Cylindrical Quantum Network',
    file: 'cylindrical_quantum_network.glb',
    subject: 'Networks',
    description: 'Qubits linked together in a cylindrical network.',
  },
  {
    id: 'quantum-generator',
    name: 'Quantum Generator',
    file: 'quantum_generator.glb',
    subject: 'Hardware',
    description: 'A quantum generator device.',
  },
  {
    id: 'quantum-wave',
    name: 'Quantum Wave',
    file: 'quantum_wave.glb',
    subject: 'Waves',
    description: 'A quantum wave evolving through space and time.',
  },
  {
    id: 'quantum-discord-surface',
    name: 'Quantum Discord Surface',
    file: 'quantum_discord_surface.glb',
    subject: 'Waves',
    description: 'A surface plot of quantum discord and amplification.',
  },
  {
    id: 'quantum-ring',
    name: 'Quantum Ring',
    file: 'quantum_ring.glb',
    subject: 'Waves',
    description: 'A quantum ring structure.',
  },
  {
    id: 'quantum-knot',
    name: 'Quantum Knot',
    file: 'quantum_knot.glb',
    subject: 'Waves',
    description: 'A knotted quantum field structure.',
  },
  {
    id: 'quantum-hoops',
    name: 'Quantum Hoops',
    file: 'quantum_hoops.glb',
    subject: 'Hardware',
    description: 'Interactive quantum hoops (use the J and K keys).',
  },
];

export function getModel(id: string): Model3D | undefined {
  return MODELS_3D.find((m) => m.id === id);
}

export function modelFileUrl(model: Model3D): string {
  return `/models/${model.file}`;
}

/** Simple case-insensitive match against name, subject, and description. */
export function searchModels(query: string): Model3D[] {
  const q = query.trim().toLowerCase();
  if (!q) return MODELS_3D;
  return MODELS_3D.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q),
  );
}

