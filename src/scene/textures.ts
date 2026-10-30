import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';
import { PALETTE } from '../lib/themes';

/**
 * Canvas-generated textures — everything that would normally be a photo
 * scan is drawn here: solder mask, copper under the mask, silkscreen, gold
 * pads, fingerprints, scratches, dust, brushed aluminium, chip markings,
 * workbench, ruler, handwriting. Callers own (and dispose) the textures.
 */

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const HAND = 'Caveat, "Segoe Print", cursive';

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d')! };
}

function tex(c: HTMLCanvasElement, color = true, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/** Height canvas (grayscale, 128 = flat) -> tangent-space normal map. */
function heightToNormal(h: HTMLCanvasElement, strength = 2.5) {
  const w = h.width;
  const hh = h.height;
  const src = h.getContext('2d')!.getImageData(0, 0, w, hh).data;
  const { c, ctx } = makeCanvas(w, hh);
  const out = ctx.createImageData(w, hh);
  const at = (x: number, y: number) => src[((Math.min(hh - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) << 2)] / 255;
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) << 2;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return tex(c, false);
}

type P = [number, number];

/**
 * The motherboard: matte green solder mask, copper traces visible as slightly
 * raised lighter lines under the mask, bone silkscreen, gold ENIG test pads,
 * and the marks of being handled (fingerprints, scratches, dust).
 */
export function createBoardTextures(opts: { boardW: number; boardD: number; traces: { pts: P[]; width: number }[]; logo: string; testPoints: P[] }) {
  const { boardW, boardD } = opts;
  const W = 2048;
  const H = Math.round((W * boardD) / boardW);
  const px = W / boardW;
  const rnd = mulberry32(11);
  const toPx = (x: number, z: number): P => [(x + boardW / 2) * px, (z + boardD / 2) * px];

  const col = makeCanvas(W, H);
  const rough = makeCanvas(W, H);
  const metal = makeCanvas(W, H);
  const HS = 0.5; // height map at half resolution (faster normal generation)
  const height = makeCanvas(Math.round(W * HS), Math.round(H * HS));
  const C = col.ctx;
  const R = rough.ctx;
  const M = metal.ctx;
  const Hh = height.ctx;

  // --- base layers
  C.fillStyle = PALETTE.pcb;
  C.fillRect(0, 0, W, H);
  R.fillStyle = 'rgb(160,160,160)'; // ~0.63 roughness
  R.fillRect(0, 0, W, H);
  M.fillStyle = '#000';
  M.fillRect(0, 0, W, H);
  Hh.fillStyle = 'rgb(128,128,128)';
  Hh.fillRect(0, 0, height.c.width, height.c.height);

  // mask thickness variation: soft blotches of the lighter green + roughness noise
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 10 + rnd() * 70;
    C.fillStyle = rnd() > 0.5 ? `rgba(22,80,62,${rnd() * 0.12})` : `rgba(6,30,22,${rnd() * 0.12})`;
    C.beginPath();
    C.arc(x, y, r, 0, Math.PI * 2);
    C.fill();
    const v = 140 + rnd() * 40;
    R.fillStyle = `rgba(${v},${v},${v},0.25)`;
    R.beginPath();
    R.arc(x, y, r, 0, Math.PI * 2);
    R.fill();
  }

  // ground pour hatch in a couple of empty regions (copper under mask)
  const pour = (x0: number, z0: number, x1: number, z1: number) => {
    const [a, b] = toPx(x0, z0);
    const [c2, d] = toPx(x1, z1);
    C.fillStyle = 'rgba(30,92,64,0.28)';
    C.fillRect(a, b, c2 - a, d - b);
    Hh.fillStyle = 'rgb(134,134,134)';
    Hh.fillRect(a * HS, b * HS, (c2 - a) * HS, (d - b) * HS);
  };
  pour(-31, 15, -20, 21.5);
  pour(19, -21.5, 31, -15);

  // --- copper traces under the mask
  const stroke = (ctx: CanvasRenderingContext2D, pts: P[], width: number, scale = 1) => {
    ctx.lineWidth = width * px * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([x, z], i) => {
      const [X, Y] = toPx(x, z);
      if (i === 0) ctx.moveTo(X * scale, Y * scale);
      else ctx.lineTo(X * scale, Y * scale);
    });
    ctx.stroke();
  };
  C.strokeStyle = 'rgba(46,112,74,0.85)';
  R.strokeStyle = 'rgb(118,118,118)';
  Hh.strokeStyle = 'rgb(165,165,165)';
  for (const t of opts.traces) {
    stroke(C, t.pts, t.width);
    stroke(R, t.pts, t.width);
    stroke(Hh, t.pts, t.width, HS);
  }
  // a hint of copper colour at the very centre of wide traces
  C.strokeStyle = 'rgba(184,105,58,0.10)';
  for (const t of opts.traces) if (t.width > 0.11) stroke(C, t.pts, t.width * 0.35);

  // --- gold ENIG: test points + mounting-hole rings
  const goldDisc = (x: number, z: number, r: number, ring = false) => {
    const [X, Y] = toPx(x, z);
    for (const [ctx, fill] of [
      [C, PALETTE.gold],
      [R, 'rgb(70,70,70)'],
      [M, '#fff'],
    ] as const) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(X, Y, r * px, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ring) {
      C.fillStyle = '#0b0a09';
      C.beginPath();
      C.arc(X, Y, r * px * 0.6, 0, Math.PI * 2);
      C.fill();
      M.fillStyle = '#000';
      M.beginPath();
      M.arc(X, Y, r * px * 0.6, 0, Math.PI * 2);
      M.fill();
    }
  };
  const holes: P[] = [
    [-31, -20.5],
    [31, -20.5],
    [-31, 20.5],
    [31, 20.5],
    [0, -20.5],
    [0, 20.5],
  ];
  holes.forEach(([x, z]) => goldDisc(x, z, 0.9, true));

  // --- silkscreen (bone, slightly off-white, a little uneven)
  const SILK = '#DAD5C8';
  C.fillStyle = SILK;
  C.strokeStyle = SILK;
  R.fillStyle = 'rgb(205,205,205)';
  C.textBaseline = 'middle';
  const label = (text: string, x: number, z: number, size = 0.5, align: CanvasTextAlign = 'left', rot = 0) => {
    const [X, Y] = toPx(x, z);
    C.save();
    C.translate(X, Y);
    C.rotate(rot);
    C.globalAlpha = 0.82 + rnd() * 0.12;
    C.font = `500 ${Math.round(size * px)}px ${MONO}`;
    C.textAlign = align;
    C.fillText(text, 0, 0);
    C.restore();
  };
  const outline = (x: number, z: number, w: number, d: number, pin1 = true) => {
    const [X, Y] = toPx(x - w / 2, z - d / 2);
    C.globalAlpha = 0.75;
    C.lineWidth = 2;
    C.strokeRect(X, Y, w * px, d * px);
    if (pin1) {
      C.beginPath();
      C.arc(X - 6, Y - 6, 3, 0, Math.PI * 2);
      C.fill();
    }
    C.globalAlpha = 1;
  };

  label('INSIDE THE MACHINE', -31.2, -21.2, 0.75);
  label('REV 2.3', -16.5, -21.2, 0.75);
  label('2026-01  ·  4 LAYER  ·  1.6 mm', 30.8, 21.6, 0.42, 'right');
  label('U1', -21.6, -13.6, 0.6);
  outline(-16, -8, 10.4, 10.4);
  label('U2  DIMM A1–B2', -7.6, -15.2, 0.5);
  label('U3  PCIE_X16', 6, -10.4, 0.5);
  label('J4–J9  M.2', 6.2, 3.6, 0.5);
  label('BUS1', -30.4, 9.7, 0.5);
  label('P1  LAN / USB / HDMI', 23.2, 7.4, 0.48);
  label('SW1', -28.6, 16, 0.5);
  label('D1 PWR', -25.2, 17.2, 0.36);
  label('VRM', -26.4, -12.6, 0.45);
  label('R12', -9.2, 6.8, 0.36);
  label('C4', 4.2, 7.1, 0.36);
  label('R7', -12.5, 2.2, 0.36, 'left', Math.PI / 2);
  label('L2', -24.4, -4.2, 0.36);
  label('Y1 25MHz', 20.5, -13.2, 0.36);
  label('+12V', -29.8, -15, 0.42);
  label('GND', -29.8, -13.6, 0.42);
  label('↑ THIS SIDE UP', 9, 21.6, 0.42);
  label('NO USER SERVICEABLE PARTS. PROBABLY.', -31, 21.7, 0.36);
  // test points with labels
  opts.testPoints.forEach(([x, z], i) => {
    goldDisc(x, z, 0.28);
    label(`TP${i + 1}`, x + 0.45, z, 0.34);
  });
  // random reference designators, slightly rotated sometimes
  for (let i = 0; i < 36; i++) {
    const x = (rnd() - 0.5) * (boardW - 8);
    const z = (rnd() - 0.5) * (boardD - 8);
    const prefix = ['C', 'R', 'R', 'C', 'L', 'Q', 'D'][Math.floor(rnd() * 7)];
    label(`${prefix}${Math.floor(rnd() * 90 + 10)}`, x, z, 0.3, 'left', rnd() > 0.8 ? Math.PI / 2 : 0);
  }
  // tiny logo: initials in a box
  {
    const [X, Y] = toPx(25.4, 15.4);
    C.globalAlpha = 0.9;
    C.lineWidth = 2;
    C.strokeRect(X, Y, 2.2 * px, 1.3 * px);
    C.font = `600 ${Math.round(0.72 * px)}px ${MONO}`;
    C.textAlign = 'center';
    C.fillText(opts.logo, X + 1.1 * px, Y + 0.68 * px);
    C.globalAlpha = 1;
  }

  // --- handling marks
  // fingerprints: concentric ridges of lower roughness (oil) + faint colour lift
  const fingerprint = (x: number, z: number, s: number, rot: number) => {
    const [X, Y] = toPx(x, z);
    for (const [ctx, style, sc] of [
      [R, 'rgba(95,95,95,0.5)', 1],
      [C, 'rgba(120,150,130,0.05)', 1],
    ] as const) {
      ctx.save();
      ctx.translate(X * sc, Y * sc);
      ctx.rotate(rot);
      ctx.strokeStyle = style;
      ctx.lineWidth = 1.6;
      for (let k = 1; k < 16; k++) {
        ctx.beginPath();
        ctx.ellipse(Math.sin(k) * 1.5, k * 0.4, k * s * 0.75, k * s, 0, rnd() * 0.6, Math.PI * 2 - rnd() * 0.8);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
  fingerprint(-6, 4, 3.2, 0.4);
  fingerprint(20, 9, 2.8, -0.9);
  fingerprint(-26, 5, 3, 1.6);
  // scratches: thin bright lines (mask scuffed)
  for (let i = 0; i < 26; i++) {
    const [X, Y] = [rnd() * W, rnd() * H];
    const len = 20 + rnd() * 120;
    const a = rnd() * Math.PI;
    const x2 = X + Math.cos(a) * len;
    const y2 = Y + Math.sin(a) * len;
    C.strokeStyle = 'rgba(150,180,160,0.18)';
    C.lineWidth = 1;
    C.beginPath();
    C.moveTo(X, Y);
    C.lineTo(x2, y2);
    C.stroke();
    R.strokeStyle = 'rgba(220,220,220,0.6)';
    R.beginPath();
    R.moveTo(X, Y);
    R.lineTo(x2, y2);
    R.stroke();
    Hh.strokeStyle = 'rgba(100,100,100,0.7)';
    Hh.beginPath();
    Hh.moveTo(X * HS, Y * HS);
    Hh.lineTo(x2 * HS, y2 * HS);
    Hh.stroke();
  }
  // dust specks
  for (let i = 0; i < 900; i++) {
    const X = rnd() * W;
    const Y = rnd() * H;
    const r = rnd() * 1.6 + 0.3;
    C.fillStyle = `rgba(210,200,180,${0.08 + rnd() * 0.2})`;
    C.beginPath();
    C.arc(X, Y, r, 0, Math.PI * 2);
    C.fill();
    R.fillStyle = 'rgba(240,240,240,0.7)';
    R.fillRect(X, Y, r, r);
  }

  return {
    map: tex(col.c),
    roughnessMap: tex(rough.c, false),
    metalnessMap: tex(metal.c, false),
    normalMap: heightToNormal(height.c, 3),
  };
}

/**
 * Brushed / machined aluminium. `circular` draws lathe marks (a heat
 * spreader); otherwise straight brushing along X. Returns color + roughness.
 */
export function createMetalTextures(opts: { base?: string; circular?: boolean; seed?: number; size?: number } = {}) {
  const S = opts.size ?? 512;
  const rnd = mulberry32(opts.seed ?? 3);
  const col = makeCanvas(S, S);
  const rough = makeCanvas(S, S);
  col.ctx.fillStyle = opts.base ?? PALETTE.aluminum;
  col.ctx.fillRect(0, 0, S, S);
  rough.ctx.fillStyle = 'rgb(95,95,95)';
  rough.ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1600; i++) {
    const v = rnd();
    const light = v > 0.5;
    col.ctx.strokeStyle = light ? `rgba(255,255,255,${rnd() * 0.06})` : `rgba(0,0,0,${rnd() * 0.07})`;
    const g = Math.floor(70 + rnd() * 70);
    rough.ctx.strokeStyle = `rgba(${g},${g},${g},0.35)`;
    col.ctx.lineWidth = rough.ctx.lineWidth = rnd() * 1.2 + 0.3;
    if (opts.circular) {
      const r = rnd() * S * 0.75;
      for (const ctx of [col.ctx, rough.ctx]) {
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const y = rnd() * S;
      const x0 = rnd() * S;
      const len = S * (0.2 + rnd() * 0.8);
      for (const ctx of [col.ctx, rough.ctx]) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + len, y + (rnd() - 0.5) * 2);
        ctx.stroke();
      }
    }
  }
  // a few deeper machining marks / handling scratches
  for (let i = 0; i < 8; i++) {
    rough.ctx.strokeStyle = 'rgba(200,200,200,0.6)';
    col.ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    const x = rnd() * S;
    const y = rnd() * S;
    const a = rnd() * Math.PI;
    for (const ctx of [col.ctx, rough.ctx]) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 60, y + Math.sin(a) * 60);
      ctx.stroke();
    }
  }
  const map = tex(col.c, true, true);
  const roughnessMap = tex(rough.c, false, true);
  return { map, roughnessMap };
}

/** Laser-etched marking on a black plastic package (or on metal if bg given). */
export function createMarkingTexture(opts: { lines: string[]; w?: number; h?: number; bg?: string; fg?: string; pin1?: boolean; size?: number }) {
  const w = opts.w ?? 256;
  const h = opts.h ?? 256;
  const { c, ctx } = makeCanvas(w, h);
  ctx.fillStyle = opts.bg ?? PALETTE.plastic;
  ctx.fillRect(0, 0, w, h);
  // slight surface texture
  const rnd = mulberry32(w + h + opts.lines.join('').length);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.025})`;
    ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
  }
  ctx.fillStyle = opts.fg ?? 'rgba(200,196,186,0.72)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const size = (opts.size ?? 0.13) * h;
  opts.lines.forEach((l, i) => {
    ctx.font = `${i === 0 ? 600 : 400} ${Math.round(i === 0 ? size : size * 0.78)}px ${MONO}`;
    ctx.fillText(l, w * 0.1, h * 0.18 + i * size * 1.25);
  });
  if (opts.pin1 !== false) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(w * 0.12, h * 0.85, Math.min(w, h) * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  return tex(c);
}

/** Printed paper label (drive stickers, carriage tags, QC sticker). */
export function createPaperLabel(opts: {
  w?: number;
  h?: number;
  lines: { text: string; size: number; weight?: number; font?: 'mono' | 'serif' | 'hand'; color?: string }[];
  stripe?: string;
  paper?: string;
  border?: boolean;
  align?: 'left' | 'center';
  barcode?: boolean;
}) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 512;
  const { c, ctx } = makeCanvas(w, h);
  const rnd = mulberry32(opts.lines.map((l) => l.text).join('').length * 31 + w);
  ctx.fillStyle = opts.paper ?? PALETTE.bone;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(60,50,30,${rnd() * 0.05})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.5, 1.5);
  }
  if (opts.stripe) {
    ctx.fillStyle = opts.stripe;
    ctx.fillRect(0, 0, w * 0.06, h);
  }
  if (opts.border) {
    ctx.strokeStyle = 'rgba(18,17,16,0.8)';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeRect(w * 0.1, h * 0.06, w * 0.84, h * 0.88);
  }
  const align = opts.align ?? 'left';
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const x = align === 'center' ? w / 2 : w * 0.14;
  let y = h * 0.12;
  for (const line of opts.lines) {
    const fam = line.font === 'serif' ? 'Newsreader, Georgia, serif' : line.font === 'hand' ? HAND : MONO;
    ctx.fillStyle = line.color ?? PALETTE.offBlack;
    ctx.font = `${line.weight ?? 500} ${Math.round(line.size * h)}px ${fam}`;
    const words = line.text.split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > w * 0.76 && cur) {
        ctx.fillText(cur, x, y);
        y += line.size * h * 1.15;
        cur = word;
      } else cur = test;
    }
    ctx.fillText(cur, x, y);
    y += line.size * h * 1.35;
  }
  if (opts.barcode) {
    ctx.fillStyle = PALETTE.offBlack;
    let bx = w * 0.14;
    while (bx < w * 0.86) {
      const bw = 1 + Math.floor(rnd() * 4);
      if (rnd() > 0.35) ctx.fillRect(bx, h * 0.8, bw, h * 0.1);
      bx += bw + 1 + Math.floor(rnd() * 3);
    }
  }
  return tex(c);
}

/** Handwriting on masking tape / sticky note, with torn edges baked into alpha. */
export function createHandwrittenTexture(opts: { lines: string[]; paper: string; w?: number; h?: number; torn?: boolean; size?: number; ink?: string }) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 160;
  const { c, ctx } = makeCanvas(w, h);
  const rnd = mulberry32(opts.lines.join('').length * 17);
  ctx.fillStyle = opts.paper;
  if (opts.torn) {
    // jagged short ends, like tape torn by hand
    ctx.beginPath();
    ctx.moveTo(8, 0);
    for (let y = 0; y <= h; y += 8) ctx.lineTo(4 + rnd() * 10, y);
    ctx.lineTo(w - 8, h);
    for (let y = h; y >= 0; y -= 8) ctx.lineTo(w - 4 - rnd() * 10, y);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = `rgba(80,60,30,${rnd() * 0.06})`;
    ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
  }
  ctx.fillStyle = opts.ink ?? '#23211f';
  ctx.textBaseline = 'middle';
  const size = (opts.size ?? 0.42) * Math.min(h, w * 0.4);
  ctx.font = `600 ${Math.round(size)}px ${HAND}`;
  opts.lines.forEach((l, i) => {
    ctx.save();
    ctx.translate(w * 0.08, (h / (opts.lines.length + 1)) * (i + 1));
    ctx.rotate((rnd() - 0.5) * 0.05);
    ctx.fillText(l, 0, 0);
    ctx.restore();
  });
  ctx.globalCompositeOperation = 'source-over';
  return tex(c);
}

/** Dark, worn workbench top: warm, with grain and the odd ring stain. */
export function createBenchTexture(base: string) {
  const S = 1024;
  const rnd = mulberry32(77);
  const col = makeCanvas(S, S);
  const rough = makeCanvas(S, S);
  col.ctx.fillStyle = base;
  col.ctx.fillRect(0, 0, S, S);
  rough.ctx.fillStyle = 'rgb(200,200,200)';
  rough.ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const y = rnd() * S;
    col.ctx.strokeStyle = rnd() > 0.5 ? `rgba(255,230,200,${rnd() * 0.035})` : `rgba(0,0,0,${rnd() * 0.08})`;
    col.ctx.lineWidth = 1 + rnd() * 3;
    col.ctx.beginPath();
    col.ctx.moveTo(0, y);
    for (let x = 0; x <= S; x += 64) col.ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 6 + (rnd() - 0.5) * 2);
    col.ctx.stroke();
  }
  // a coffee ring and some wear
  col.ctx.strokeStyle = 'rgba(30,18,8,0.25)';
  col.ctx.lineWidth = 6;
  col.ctx.beginPath();
  col.ctx.arc(S * 0.8, S * 0.26, 70, 0.3, Math.PI * 1.85);
  col.ctx.stroke();
  for (let i = 0; i < 40; i++) {
    rough.ctx.fillStyle = `rgba(150,150,150,${rnd() * 0.4})`;
    rough.ctx.beginPath();
    rough.ctx.arc(rnd() * S, rnd() * S, 20 + rnd() * 80, 0, Math.PI * 2);
    rough.ctx.fill();
  }
  const map = tex(col.c, true, true);
  const roughnessMap = tex(rough.c, false, true);
  return { map, roughnessMap };
}

/** Steel ruler: mm ticks and cm numbers. */
export function createRulerTexture(lengthCm: number) {
  const pxPerMm = 8;
  const w = lengthCm * 10 * pxPerMm + 40;
  const h = 96;
  const { c, ctx } = makeCanvas(w, h);
  ctx.fillStyle = '#B9B8B2';
  ctx.fillRect(0, 0, w, h);
  const rnd = mulberry32(5);
  for (let i = 0; i < 400; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${rnd() * 0.08})`;
    const y = rnd() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#1c1b19';
  ctx.font = `500 22px ${MONO}`;
  ctx.textAlign = 'center';
  for (let mm = 0; mm <= lengthCm * 10; mm++) {
    const x = 20 + mm * pxPerMm;
    const len = mm % 10 === 0 ? 34 : mm % 5 === 0 ? 24 : 14;
    ctx.fillRect(x - 1, 0, 2, len);
    if (mm % 10 === 0 && mm > 0) ctx.fillText(String(mm / 10), x, 54);
  }
  ctx.font = `500 14px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText('STAINLESS · 300 mm', 30, 82);
  return tex(c);
}
