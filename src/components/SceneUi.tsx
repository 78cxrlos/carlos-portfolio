import { Component, useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ui } from '../content/uiStrings';
import { useStore } from '../store/useStore';

/** One consistent label for 3D objects: on hover, or after touch-and-hold. */
export function SceneTooltip() {
  const tip = useStore((s) => s.sceneTip);
  if (!tip) return null;
  return (
    <div className="scene-tip" role="tooltip" style={{ left: Math.max(90, Math.min(window.innerWidth - 90, tip.x)), top: Math.max(110, tip.y) }}>
      {tip.text}
    </div>
  );
}

/**
 * Reduced motion: the camera cuts between sections instead of flying. A short
 * fade softens each cut so nothing jumps.
 */
export function MotionFade() {
  const section = useStore((s) => s.section);
  const reduced = useStore((s) => s.reducedMotion);
  const el = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!reduced || !el.current) return;
    gsap.fromTo(el.current, { opacity: 0.85 }, { opacity: 0, duration: 0.45, ease: 'power1.out' });
  }, [section, reduced]);
  return <div ref={el} aria-hidden className="pointer-events-none fixed inset-0 z-[5] bg-bg opacity-0" />;
}

/** If the 3D scene crashes, say so plainly and offer a way forward. */
export class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error(err);
    useStore.setState({ sceneReady: true }); // let the loading screen go away
  }
  render() {
    if (!this.state.failed) return <div key={this.state.attempt}>{this.props.children}</div>;
    return (
      <div className="fixed inset-0 z-[91] grid place-items-center bg-bg px-4" role="alert">
        <div className="sheet w-full max-w-[520px] p-6 sm:p-8">
          <p className="font-serif text-[22px] leading-[1.5]">{ui.errors.scene}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-solid" onClick={() => useStore.getState().setSimpleView(true)}>
              {ui.errors.useSimple}
            </button>
            <button type="button" className="btn" onClick={() => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))}>
              {ui.errors.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
