import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { siteContent } from './content/siteContent';
import { SECTION_COUNT } from './lib/sections';
import { useStore } from './store/useStore';
import { runtime } from './store/runtime';
import { useThemeSync } from './hooks/useTheme';
import { useSoundSync } from './hooks/useSound';
import { usePerformance } from './hooks/usePerformance';
import { useKeyboard } from './hooks/useKeyboard';
import { JOURNEY_ID, useScrollProgress } from './hooks/useScrollProgress';
import { Navbar } from './components/Navbar';
import { HUD } from './components/HUD';
import { SectionPanels } from './components/SectionPanels';
import { ProjectPanel } from './components/ProjectPanel';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { Achievements } from './components/Achievements';
import { SecretModal } from './components/SecretModal';
import { PowerDownOverlay } from './components/PowerDownOverlay';
import { Toasts } from './components/Toasts';
import { Loader } from './components/Loader';
import { BootSequence } from './components/BootSequence';
import { SimpleView } from './components/SimpleView';
import { SegFault } from './components/SegFault';
import { Welcome } from './components/Welcome';
import { HelpPanel, Tour } from './components/Help';
import { ConfirmDialog } from './components/Dialog';
import { ExtrasDock } from './components/Extras';
import { MotionFade, SceneErrorBoundary, SceneTooltip } from './components/SceneUi';

// three.js and the whole scene are code-split: Simple View never downloads them.
const Scene = lazy(() => import('./scene/Scene'));

/** vh of scroll per section — more = slower, more cinematic flight. */
const VH_PER_SECTION = 120;

/**
 * The 3D version: loading screen (with a way out) → short start-up animation
 * (skippable, once per visit) → the board, with a fixed Back / Next bar.
 */
function Journey() {
  const booted = useStore((s) => s.booted);
  const sceneReady = useStore((s) => s.sceneReady);
  const [initiallyBooted] = useState(() => useStore.getState().booted);
  useScrollProgress(true);

  // Revisit in the same tab: skip the boot drop entirely.
  useEffect(() => {
    if (initiallyBooted) runtime.intro = 1;
  }, [initiallyBooted]);

  // Returning visitors in the same tab still get the tour if they never saw it.
  useEffect(() => {
    const s = useStore.getState();
    if (initiallyBooted && sceneReady && !s.tourSeen) s.setTour(true);
  }, [initiallyBooted, sceneReady]);

  return (
    <>
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </SceneErrorBoundary>
      <MotionFade />
      <div id={JOURNEY_ID} aria-hidden style={{ height: `${100 + (SECTION_COUNT - 1) * VH_PER_SECTION}vh` }} />
      <SectionPanels />
      <HUD />
      <SceneTooltip />
      <Loader />
      {sceneReady && !booted && <BootSequence />}
    </>
  );
}

function Machine() {
  const simpleView = useStore((s) => s.simpleView);
  const webglOk = useStore((s) => s.webglOk);
  const welcomeOpen = useStore((s) => s.welcomeOpen);
  const simple = simpleView || !webglOk;

  // Warm the 3D download while the visitor reads the welcome screen (not on slow/weak devices).
  useEffect(() => {
    if (welcomeOpen && !useStore.getState().simpleReason && webglOk) void import('./scene/Scene');
  }, [welcomeOpen, webglOk]);

  return (
    <>
      <Navbar />
      {welcomeOpen ? <Welcome /> : simple ? <SimpleView /> : <Journey />}
      {!welcomeOpen && <ExtrasDock />}
      <HelpPanel />
      <Tour />
      <ConfirmDialog />
      <ProjectPanel />
      <Terminal />
      <CommandPalette />
      <Achievements />
      <SecretModal />
      <PowerDownOverlay />
    </>
  );
}

/** `#/simple` is a shareable link straight to the Simple View (e.g. for recruiters). */
function SimpleRoute() {
  const setSimpleView = useStore((s) => s.setSimpleView);
  useEffect(() => setSimpleView(true), [setSimpleView]);
  return <Navigate to="/" replace />;
}

function SkipLink() {
  const welcomeOpen = useStore((s) => s.welcomeOpen);
  if (welcomeOpen) return null; // the welcome screen is already just the main content
  return (
    <a
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector<HTMLElement>('#main h1, #main h2, #main');
        target?.setAttribute('tabindex', '-1');
        target?.focus();
      }}
      className="sr-only z-[100] border-2 border-ink bg-surface px-4 py-3 font-mono text-[16px] text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      Skip to main content
    </a>
  );
}

export default function App() {
  useThemeSync();
  useSoundSync();
  usePerformance();
  useKeyboard();

  useEffect(() => {
    document.title = siteContent.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', siteContent.meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', siteContent.meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', siteContent.meta.description);
  }, []);

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkipLink />
      <Routes>
        <Route path="/" element={<Machine />} />
        <Route path="/simple" element={<SimpleRoute />} />
        <Route path="*" element={<SegFault />} />
      </Routes>
      <Toasts />
    </HashRouter>
  );
}
