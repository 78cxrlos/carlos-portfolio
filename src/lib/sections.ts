/**
 * The scroll journey. Each section is a "station" on the camera path.
 *
 * `cam` is where the camera sits, `look` is what it looks at. CameraRig builds
 * two Catmull-Rom splines (one through all `cam` points, one through all
 * `look` points) and samples both with the same parameter, so section i sits
 * exactly at t = i / (SECTIONS.length - 1). Between stations the camera glides
 * along the curve. `panelSide` tells the rig to shift the framing so the 3D
 * object isn't hidden behind the HTML panel.
 *
 * World layout (board lies on the XZ plane, top surface at y = 0):
 *   CPU (-16,-8)   RAM (-2,-10)   GPU/Storage (12,-4)
 *   Data bus along z = 12          Network port at (26, 14)
 */
export interface SectionDef {
  id: string;
  /** Short nav label. */
  label: string;
  /** Schematic reference designator shown on the rail and in captions. */
  ref: string;
  /** Headline used in panels. */
  title: string;
  /** Figure caption, like an annotation on a schematic. */
  fig: string;
  hardware: string;
  cam: [number, number, number];
  look: [number, number, number];
  panelSide: 'left' | 'none';
}

export const SECTIONS: SectionDef[] = [
  { id: 'hero', label: 'Home', ref: 'J1', title: 'Board overview', fig: 'FIG. 00 — OVERVIEW', hardware: 'Motherboard', cam: [0, 27, 31], look: [0, 0, 2], panelSide: 'none' },
  { id: 'about', label: 'About', ref: 'U1', title: 'U1 — about me', fig: 'FIG. 01 — PROCESSOR', hardware: 'CPU', cam: [-15, 8.5, 3.5], look: [-16, 0.6, -8], panelSide: 'left' },
  { id: 'skills', label: 'Skills', ref: 'U2', title: 'What I can do', fig: 'FIG. 02 — MEMORY', hardware: 'RAM', cam: [-2, 6.6, 12.5], look: [-2, 5.6, -8.6], panelSide: 'left' },
  { id: 'projects', label: 'Work', ref: 'U3', title: 'Things I’ve shipped', fig: 'FIG. 03 — STORAGE', hardware: 'Drives', cam: [12.5, 10, 16.5], look: [12.5, 1.8, -1], panelSide: 'left' },
  { id: 'experience', label: 'Experience', ref: 'BUS1', title: 'Where I’ve been', fig: 'FIG. 04 — BUS', hardware: 'Data bus', cam: [-10, 7.5, 25], look: [-10, 0.3, 12], panelSide: 'left' },
  { id: 'contact', label: 'Contact', ref: 'P1', title: 'Say hi', fig: 'FIG. 05 — I/O', hardware: 'Network port', cam: [42, 7.5, 20.5], look: [28.5, 1.4, 14], panelSide: 'left' },
  { id: 'shutdown', label: 'Power', ref: 'SW1', title: 'That’s the board.', fig: 'FIG. 06 — POWER', hardware: 'Power switch', cam: [0, 46, 42], look: [0, 0, 0], panelSide: 'none' },
];

export const SECTION_COUNT = SECTIONS.length;
export const sectionIndexById = (id: string) => SECTIONS.findIndex((s) => s.id === id);

/** Scroll progress (0..1) at which a section is centered. */
export const sectionProgress = (i: number) => i / (SECTION_COUNT - 1);

/** Hardware anchor points (plain numbers so the DOM bundle never imports three.js). */
export const ANCHOR_POINTS = {
  cpu: [-16, 0, -8],
  ram: [-2, 0, -12],
  gpu: [12, 0, -7],
  storage: [12, 0, 0.5],
  busStart: [-30, 0, 12],
  busEnd: [16, 0, 12],
  port: [27, 0, 14],
  power: [-27, 0, 18],
} as const satisfies Record<string, readonly [number, number, number]>;

export const BOARD_SIZE = { w: 66, d: 46 };
