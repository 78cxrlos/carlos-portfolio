/**
 * Per-frame mutable state shared between the DOM layer and the 3D scene.
 * Deliberately NOT React state: these values change 60 times a second and
 * are read inside useFrame loops, so putting them in Zustand would cause
 * needless re-renders.
 */
export interface Ripple {
  x: number;
  z: number;
  start: number; // seconds (clock.elapsedTime)
}

export const MAX_RIPPLES = 6;

export const runtime = {
  /** Raw scroll progress 0..1 written by useScrollProgress. */
  scroll: 0,
  /** Damped scroll the camera actually follows. */
  camT: 0,
  /** Pointer in normalized device coords (-1..1), for parallax. */
  pointer: { x: 0, y: 0 },
  /** CPU heat 0..1 (hold-to-overclock). */
  heat: 0,
  overclocking: false,
  /** Extra fan speed impulse, decays over time (click the GPU / fans). */
  fanBoost: 0,
  /** LED flash impulse 0..1, decays. */
  ledFlash: 0,
  /** Chip pulse impulse, decays. */
  chipPulse: 0,
  /** Intro drop (0 = high above board, 1 = at the path). */
  intro: 0,
  /** Power-down animation 0..1 (1 = screen off). */
  powerDown: 0,
  ripples: [] as Ripple[],
  /** Current R3F clock time, mirrored so DOM code can timestamp ripples. */
  time: 0,
  /** Set to true while a 3D part is being dragged (blocks touch scrolling). */
  dragging: false,
  /** clock time of the last signal pulse along the traces (see shaders.ts). */
  signalStart: -100,
};

/** Send a signal edge along every trace (section arrival, board click, …). */
export function fireSignal() {
  // don't restart a pulse that is still crossing the board
  if (runtime.time - runtime.signalStart > 1.2) runtime.signalStart = runtime.time;
}

export function addRipple(x: number, z: number) {
  fireSignal();
  runtime.ripples.push({ x, z, start: runtime.time });
  if (runtime.ripples.length > MAX_RIPPLES) runtime.ripples.shift();
}
