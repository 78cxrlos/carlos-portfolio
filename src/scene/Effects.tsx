import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import { useStore, type Quality } from '../store/useStore';
import { focusTarget } from './CameraRig';
import { stationProximity } from './helpers';

/**
 * Post-processing is deliberately restrained:
 *   Bloom      very low strength, thresholded so only the LED lenses (which
 *              are drawn above 1.0 with toneMapped=false) bloom at all.
 *   DoF        high quality only, and only while the camera is parked on a
 *              section (bokeh scales up as it arrives, back to 0 between
 *              stations and on the overview shots).
 *   Vignette   faint, like a lens.
 * Tier 0 (low) renders nothing here.
 */
function FocusDoF() {
  const ref = useRef<DepthOfFieldEffect>(null);
  useFrame(() => {
    const fx = ref.current;
    if (!fx) return;
    fx.target?.copy(focusTarget);
    const section = useStore.getState().section;
    const parked = section > 0 && section < 6 ? stationProximity(section) : 0;
    fx.bokehScale = parked * parked * 1.6;
  });
  return <DepthOfField ref={ref} target={[0, 0, 0]} worldFocusRange={10} bokehScale={0} />;
}

export function Effects({ quality }: { quality: Quality }) {
  const isMobile = useStore((s) => s.isMobile);
  if (quality === 0) return null;
  const high = quality === 2 && !isMobile;
  return (
    <EffectComposer multisampling={high ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.98} luminanceSmoothing={0.02} radius={0.35} />
      {high ? <FocusDoF /> : <></>}
      <Vignette eskil={false} offset={0.3} darkness={0.5} />
    </EffectComposer>
  );
}
