/**
 * One motion vocabulary for the whole UI. Natural easing, consistent
 * durations. If something needs to move differently, it should have a
 * reason (e.g. the camera has its own spring in CameraRig).
 */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  in: 'power2.in',
  /** a gentle overshoot for things that "land" (sheets, stamps) */
  settle: 'back.out(1.4)',
} as const;

export const DUR = {
  fast: 0.18,
  base: 0.42,
  slow: 0.7,
} as const;
