import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SECTION_COUNT, sectionIndexById, sectionProgress } from '../lib/sections';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export const JOURNEY_ID = 'journey';

function journeyMetrics() {
  const el = document.getElementById(JOURNEY_ID);
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = Math.max(1, el.offsetHeight - window.innerHeight);
  return { top, range };
}

/** Smoothly fly the camera to section `i` by scrolling the page. */
export function scrollToSection(i: number, opts: { instant?: boolean } = {}) {
  const m = journeyMetrics();
  const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, i));
  if (!m) return;
  const y = m.top + sectionProgress(clamped) * m.range;
  const reduced = useStore.getState().reducedMotion;
  const distance = Math.abs(clamped - useStore.getState().section);
  gsap.to(window, {
    scrollTo: { y, autoKill: true },
    duration: opts.instant || reduced ? 0 : Math.min(2.2, 0.9 + distance * 0.3),
    ease: 'power2.inOut',
    overwrite: true,
  });
}

export function scrollToSectionId(id: string) {
  const i = sectionIndexById(id);
  if (i >= 0) scrollToSection(i);
}

/**
 * Drives `runtime.scroll` (0..1) from the page scroll position through
 * ScrollTrigger and keeps the active section index in the store. The camera
 * reads runtime.scroll and applies its own damping (see CameraRig).
 */
export function useScrollProgress(enabled: boolean) {
  const setSection = useStore((s) => s.setSection);

  useEffect(() => {
    if (!enabled) return;
    const el = document.getElementById(JOURNEY_ID);
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        runtime.scroll = self.progress;
        setSection(Math.round(self.progress * (SECTION_COUNT - 1)));
      },
      // Gently settle on the nearest station after the user stops scrolling.
      snap: {
        snapTo: 1 / (SECTION_COUNT - 1),
        duration: { min: 0.25, max: 0.8 },
        delay: 0.25,
        ease: 'power1.inOut',
      },
    });
    runtime.scroll = st.progress;
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('resize', refresh);
      st.kill();
    };
  }, [enabled, setSection]);

  // Achievement: visited every section.
  const visited = useStore((s) => s.visited);
  const unlock = useStore((s) => s.unlock);
  useEffect(() => {
    if (visited.length >= SECTION_COUNT) unlock('tourist');
  }, [visited, unlock]);
}
