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

/** Fly the camera to section `i` by scrolling the page: slow, eased in and out. */
export function scrollToSection(i: number, opts: { instant?: boolean } = {}) {
  const m = journeyMetrics();
  const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, i));
  if (!m) return;
  const y = m.top + sectionProgress(clamped) * m.range;
  const reduced = useStore.getState().reducedMotion;
  const distance = Math.abs(clamped - useStore.getState().section);
  gsap.to(window, {
    scrollTo: { y, autoKill: true },
    duration: opts.instant || reduced ? 0 : Math.min(3.2, 1.5 + distance * 0.35),
    ease: 'sine.inOut',
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
 *
 * There is deliberately no scroll snapping or scroll-jacking: the page
 * scrolls exactly the way the visitor scrolls it.
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
