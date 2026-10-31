import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ui } from '../content/uiStrings';

/** 404: a kernel panic, written by a person. */
export function SegFault() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${ui.errors.notFoundTitle} · 404`;
  }, []);
  return (
    <main className="min-h-screen bg-bg px-4 py-16 text-ink sm:px-[8vw]">
      <div className="sheet mx-auto max-w-[640px] p-6 sm:p-8">
        <h1 className="font-serif text-[40px] leading-tight">{ui.errors.notFoundTitle}</h1>
        <p className="mt-3 text-[19px] leading-[1.6]">{ui.errors.notFoundBody}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn btn-solid btn-big">
            {ui.errors.notFoundHome}
          </Link>
          <Link to="/simple" className="btn btn-big">
            {ui.errors.notFoundSimple}
          </Link>
        </div>
        <details className="mt-8">
          <summary className="flex min-h-[44px] cursor-pointer items-center font-mono text-[15px]">{ui.errors.notFoundNerd}</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap bg-offblack p-4 font-mono text-[14px] leading-relaxed text-bone">
            {`[    0.000000] Kernel panic - not syncing: no such page: ${pathname}
[    0.000001] I looked for it. Twice. It isn't here.
[    0.000002] Possible causes:
[    0.000002]   - a typo (mine or yours, no judgement)
[    0.000003]   - an old link to a page I deleted on purpose
[    0.000004]   - cosmic rays`}
          </pre>
        </details>
      </div>
    </main>
  );
}
