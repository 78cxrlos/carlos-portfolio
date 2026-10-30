import { useLayoutEffect, useRef, type ElementType } from 'react';
import gsap from 'gsap';
import { useStore } from '../store/useStore';
import { DUR, EASE } from '../lib/motion';

/**
 * Masked line reveal: each line slides up from behind its own clipping box.
 * Pass explicit lines (array, or a string with "\n"). Replays when
 * `trigger` changes. Reduced motion renders the text in place.
 */
export function RevealText({
  text,
  as: Tag = 'span',
  className = '',
  id,
  tabIndex,
  delay = 0,
  trigger,
}: {
  text: string | string[];
  as?: ElementType;
  className?: string;
  id?: string;
  tabIndex?: number;
  delay?: number;
  trigger?: unknown;
}) {
  const reduced = useStore((s) => s.reducedMotion);
  const ref = useRef<HTMLElement>(null);
  const lines = Array.isArray(text) ? text : text.split('\n');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const inner = el.querySelectorAll('.reveal-line > span');
    const tw = gsap.fromTo(inner, { yPercent: 108 }, { yPercent: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.07, delay });
    return () => {
      tw.kill();
    };
  }, [reduced, delay, trigger, text]);

  return (
    <Tag ref={ref} id={id} tabIndex={tabIndex} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="reveal-line">
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
