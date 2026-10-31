import { useEffect, useRef, useState } from 'react';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { copyEmail, openSocial } from '../lib/navigation';
import { playSound } from '../hooks/useSound';
import { IconChat, IconCheck, IconCopy, IconExternal, IconMail, IconPhone } from './Icons';

/** Big, obvious ways to get in touch. Call / WhatsApp appear when set in siteContent.contact. */
export function ContactButtons() {
  const c = siteContent.contact;
  return (
    <div className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      <a className="btn btn-solid btn-big" href={`mailto:${c.email}`} onClick={() => playSound('click')}>
        <IconMail width={20} height={20} /> {ui.contact.emailMe}
      </a>
      {c.whatsapp && (
        <a className="btn btn-big" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => playSound('click')}>
          <IconChat width={20} height={20} /> {ui.contact.whatsapp}
        </a>
      )}
      {c.phone && (
        <a className="btn btn-big" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} onClick={() => playSound('click')}>
          <IconPhone width={20} height={20} /> {ui.contact.call} <span className="sr-only">{c.phone}</span>
        </a>
      )}
    </div>
  );
}

/** The address as plain, selectable text, with a Copy button and a visible result. */
export function EmailCopy() {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const email = siteContent.contact.email;
  return (
    <div>
      <p className="label">{ui.contact.emailLabel}</p>
      <div className="mt-1 flex flex-wrap items-stretch gap-2">
        <span className="flex min-h-[48px] min-w-0 flex-1 select-all items-center break-all border border-ink px-3 font-mono text-[17px]">{email}</span>
        <button
          type="button"
          className="btn"
          aria-label={ui.contact.copyLabel}
          onClick={async () => {
            playSound('click');
            const ok = await copyEmail();
            setState(ok ? 'ok' : 'fail');
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setState('idle'), 6000);
          }}
        >
          {state === 'ok' ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />} {ui.contact.copy}
        </button>
      </div>
      <p className="mt-1 min-h-[1.6em] text-[16px] font-semibold" role="status">
        {state === 'ok' ? ui.contact.copied : state === 'fail' ? ui.contact.copyFailed : ''}
      </p>
    </div>
  );
}

/** Other profiles (GitHub, LinkedIn…). */
export function SocialList({ plugged = [] }: { plugged?: string[] }) {
  const socials = siteContent.contact.socials.filter((s) => !s.url.startsWith('mailto:'));
  if (!socials.length) return null;
  return (
    <div>
      <h3 className="label mb-1">{ui.contact.othersTitle}</h3>
      <ul className="border-t border-ink">
        {socials.map((s) => (
          <li key={s.id} className="border-b border-ink/40">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                playSound('plug');
                openSocial(s);
              }}
              className="flex min-h-[48px] items-center gap-3 py-1 text-[18px] underline decoration-ink/40 underline-offset-4 hover:decoration-accent"
            >
              <span className="font-semibold">{s.label}</span>
              <span className="min-w-0 truncate text-[16px] text-muted no-underline">{s.handle}</span>
              <IconExternal width={14} height={14} className="ml-auto shrink-0" />
              {plugged.includes(s.id) && <span className="sr-only">(connected on the board)</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
