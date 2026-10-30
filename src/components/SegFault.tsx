import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

/** 404: a kernel panic, written by a person. */
export function SegFault() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = '404 · Kernel panic';
  }, []);
  return (
    <main className="min-h-screen bg-offblack px-6 py-16 font-mono text-[13px] leading-relaxed text-bone/85 sm:px-[8vw]">
      <pre className="whitespace-pre-wrap">
        {`[    0.000000] Kernel panic - not syncing: no such page: ${pathname}
[    0.000001] I looked for it. Twice. It isn't here.
[    0.000002] Possible causes:
[    0.000002]   - a typo (mine or yours, no judgement)
[    0.000003]   - an old link to a page I deleted on purpose
[    0.000004]   - cosmic rays
[    0.000005] Call trace:
[    0.000005]   router_lookup+0x404/0x404
[    0.000006]   visitor_click+0x1/0x1
[    0.000007] ---[ end Kernel panic - please press a button below ]---`}
      </pre>
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link to="/" className="border border-bone/80 px-4 py-2.5 text-[12px] uppercase tracking-[0.08em] text-bone shadow-[2px_2px_0_0_rgba(233,228,216,0.8)] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          Reboot to the board
        </Link>
        <Link to="/simple" className="text-[12px] uppercase tracking-[0.08em] text-bone/70 underline decoration-[#FF5A1F] decoration-2 underline-offset-4 hover:text-bone">
          Plain page
        </Link>
      </div>
    </main>
  );
}
