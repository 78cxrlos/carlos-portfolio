import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SECTIONS, SECTION_COUNT, sectionProgress } from '../lib/sections';
import { damp } from '../lib/rng';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';

/** Shared with Effects: depth of field autofocuses on whatever the camera looks at. */
export const focusTarget = new THREE.Vector3();

const INTRO_FROM = new THREE.Vector3(0, 95, 6);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * CAMERA PATH
 * -----------
 * Two centripetal Catmull-Rom splines are built from the stations in
 * lib/sections.ts: one for camera positions, one for look-at targets.
 * `CatmullRomCurve3.getPoint(t)` is parametrised by control-point index
 * (not arc length), so station i lands exactly at t = i/(N-1) — the same
 * value the scroll progress has when section i is centered.
 *
 * Each frame:
 *  1. camT follows the scroll progress through a slightly under-damped
 *     spring (like a camera on a slider rig: it has mass, eases out, and
 *     settles with the smallest overshoot). Reduced motion: camT jumps
 *     straight to the active station — no flight at all.
 *  2. Narrow/portrait screens pull the camera back along its view direction
 *     so wide objects still fit.
 *  3. Stations with an HTML panel pan the frame (camera AND target together,
 *     so perspective is unchanged) so the object sits beside the panel on
 *     desktop or above the bottom sheet on mobile.
 *  4. Subtle pointer parallax, plus a tiny "handheld" drift whose amplitude
 *     follows the rig's speed — it breathes while moving and settles when
 *     the camera is parked.
 *  5. During the boot "drop", the result is blended with a point high above
 *     the board.
 */
export function CameraRig() {
  const { camera, size, scene } = useThree();
  const curves = useMemo(() => {
    const cam = new THREE.CatmullRomCurve3(SECTIONS.map((s) => new THREE.Vector3(...s.cam)), false, 'centripetal');
    const look = new THREE.CatmullRomCurve3(SECTIONS.map((s) => new THREE.Vector3(...s.look)), false, 'centripetal');
    return { cam, look };
  }, []);
  const panelWeights = useMemo(() => SECTIONS.map((s) => (s.panelSide === 'none' ? 0 : 1)), []);

  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      pan: new THREE.Vector3(),
      parallax: new THREE.Vector2(),
      smoothLook: new THREE.Vector3(0, 0, 0),
      vel: 0,
      drift: 0,
    }),
    [],
  );

  useFrame((state, dt) => {
    const s = useStore.getState();
    const d = Math.min(dt, 0.1);
    const target = s.reducedMotion ? sectionProgress(s.section) : runtime.scroll;
    if (s.reducedMotion) {
      runtime.camT = target;
      v.vel = 0;
    } else {
      // spring: stiffness K, damping a touch under critical (tiny overshoot)
      const K = 9;
      const C = 2 * Math.sqrt(K) * 0.92;
      const steps = 2;
      const h = d / steps;
      for (let i = 0; i < steps; i++) {
        v.vel += ((target - runtime.camT) * K - v.vel * C) * h;
        runtime.camT += v.vel * h;
      }
    }
    const t = THREE.MathUtils.clamp(runtime.camT, 0, 1);

    curves.cam.getPoint(t, v.pos);
    curves.look.getPoint(t, v.look);

    const aspect = size.width / Math.max(1, size.height);
    v.dir.subVectors(v.pos, v.look);
    const dist = v.dir.length();
    const k = aspect < 1.5 ? THREE.MathUtils.clamp(1.5 / aspect, 1, 2.3) : 1;
    if (k > 1) v.pos.copy(v.look).addScaledVector(v.dir, k);
    // keep fog proportional so pulled-back mobile views don't drown in it
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = 55 * k;
      scene.fog.far = 150 * k;
    }

    // panel-aware framing
    const f = t * (SECTION_COUNT - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(SECTION_COUNT - 1, i0 + 1);
    const w = THREE.MathUtils.lerp(panelWeights[i0], panelWeights[i1], f - i0);
    v.dir.normalize();
    v.right.crossVectors(UP, v.dir).normalize(); // camera-right
    v.up.crossVectors(v.dir, v.right).normalize(); // camera-up
    const curDist = v.pos.distanceTo(v.look);
    if (size.width >= 900) v.pan.copy(v.right).multiplyScalar(-curDist * 0.2 * w);
    else v.pan.copy(v.up).multiplyScalar(-curDist * 0.16 * w);
    v.pos.add(v.pan);
    v.look.add(v.pan);

    // subtle parallax toward the mouse
    v.parallax.x += (runtime.pointer.x - v.parallax.x) * damp(1.8, d);
    v.parallax.y += (runtime.pointer.y - v.parallax.y) * damp(1.8, d);
    const pAmt = s.reducedMotion || s.isTouch ? 0 : dist * 0.012;
    v.pos.addScaledVector(v.right, v.parallax.x * pAmt).addScaledVector(v.up, v.parallax.y * pAmt * 0.6);
    // handheld drift: amplitude rises with rig speed, decays slowly when parked
    v.drift += (Math.min(1, Math.abs(v.vel) * 10) - v.drift) * damp(v.drift < Math.abs(v.vel) * 10 ? 4 : 0.8, d);
    if (!s.reducedMotion) {
      const et = state.clock.elapsedTime;
      const amp = dist * 0.0035 * (0.25 + v.drift);
      v.pos.addScaledVector(v.right, (Math.sin(et * 0.9) + Math.sin(et * 2.3 + 1.3) * 0.4) * amp);
      v.pos.addScaledVector(v.up, (Math.sin(et * 1.1 + 0.5) + Math.sin(et * 2.9) * 0.35) * amp * 0.7);
    }

    // boot drop
    if (runtime.intro < 1) {
      const e = 1 - Math.pow(1 - runtime.intro, 3);
      v.pos.lerpVectors(INTRO_FROM, v.pos, e);
    }

    camera.position.copy(v.pos);
    v.smoothLook.lerp(v.look, s.reducedMotion ? 1 : damp(6, d));
    camera.lookAt(v.smoothLook);
    focusTarget.copy(v.smoothLook);

    const cam = camera as THREE.PerspectiveCamera;
    const fov = aspect < 1 ? 55 : 45;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    runtime.time = state.clock.elapsedTime;
  });
  return null;
}
