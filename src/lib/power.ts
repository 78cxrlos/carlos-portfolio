import gsap from 'gsap';
import { useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { playSound } from '../hooks/useSound';

/**
 * Shutdown / reboot: dims every emissive in the scene (runtime.powerDown is
 * read by all shaders + lights), plays the CRT collapse overlay, then resets
 * to the boot screen at the top of the page.
 */
export function shutdown() {
  const s = useStore.getState();
  if (s.powering) return;
  const reduced = s.reducedMotion;
  s.setPowering(true);
  s.setTerminal(false);
  s.setPalette(false);
  s.openProject(null);
  playSound('powerdown');
  gsap.to(runtime, { powerDown: 1, duration: reduced ? 0.01 : 1.1, ease: 'power2.in' });
  window.setTimeout(
    () => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      runtime.scroll = 0;
      runtime.camT = 0;
      runtime.intro = 0;
      runtime.heat = 0;
      runtime.ripples.length = 0;
      const st = useStore.getState();
      st.unplugAll();
      st.selectFact(null);
      st.setSkillFilter(null);
      st.setGodMode(false);
      st.setBooted(false);
      useStore.setState({ section: 0 });
      gsap.to(runtime, { powerDown: 0, duration: 0.6, delay: 0.3 });
      window.setTimeout(() => st.setPowering(false), 500);
    },
    reduced ? 200 : 1500,
  );
}
