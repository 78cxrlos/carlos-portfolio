import * as THREE from 'three';
import { ANCHOR_POINTS } from '../lib/sections';

/** Vector3 versions of the layout anchors for scene components. */
export const ANCHORS = Object.fromEntries(
  Object.entries(ANCHOR_POINTS).map(([k, v]) => [k, new THREE.Vector3(...v)]),
) as Record<keyof typeof ANCHOR_POINTS, THREE.Vector3>;
