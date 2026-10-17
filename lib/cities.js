// Nimrod's cities on the plain east of the river: the four of Shinar first, then upriver the four of
// Assyria, Resen between Nineveh and Calah. Each faces its gate south, toward the way the camera comes.
import { riverX } from '/song/lib/x-south.js';
const at = (dx, z, r, h, temple, yaw = Math.PI) => ({ x: riverX(z) + dx, z, r, h, temple, yaw, houses: 1 });
export const CITIES = [
  at(470, 560, 46, 10, 26, Math.PI + 0.08),   // Babel
  at(340, 650, 38, 8.5, 18, Math.PI - 0.1),   // Erech
  at(215, 600, 34, 8, 16, Math.PI + 0.12),    // Accad
  at(95, 690, 32, 7.5, 14, Math.PI - 0.05),   // Calneh
  at(230, 2520, 64, 12, 30, Math.PI),         // Nineveh
  at(95, 2690, 30, 7.5, 12, Math.PI + 0.2),   // Rehoboth-Ir
  at(250, 2870, 26, 7, 10, Math.PI - 0.15),   // Resen
  at(150, 3080, 44, 10, 22, Math.PI + 0.08),  // Calah
];
export const NAMES = ['Babel', 'Erech', 'Accad', 'Calneh', 'Nineveh', 'Rehoboth-Ir', 'Resen', 'Calah'];
