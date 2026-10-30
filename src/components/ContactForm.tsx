import { useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { useStore } from '../store/useStore';
import { addRipple, runtime } from '../store/runtime';
import { ANCHOR_POINTS } from '../lib/sections';
import { playSound } from '../hooks/useSound';
import { IconCheck, IconSend } from './Icons';

interface Fields {
  name: string;
  email: string;
  message: string;
}
type Errors = Partial<Record<keyof Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'A name, please. First name is fine.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'That email doesn’t look right.';
  if (f.message.trim().length < 10) e.message = 'A little more than that — ten characters or so.';
  return e;
}

/**
 * "Send packet" contact form. If `contact.formEndpoint` is set in
 * siteContent.ts it POSTs JSON there (works with Formspree & friends);
 * otherwise it opens a pre-filled mailto: draft.
 */
export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [honeypot, setHoneypot] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const packetRef = useRef<HTMLSpanElement>(null);
  const toast = useStore((s) => s.toast);

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length) {
      playSound('error');
      if (formRef.current) gsap.fromTo(formRef.current, { x: -4 }, { x: 0, duration: 0.4, ease: 'back.out(3)' });
      (formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus();
      return;
    }
    setStatus('sending');
    // the packet flies across the button
    if (packetRef.current) gsap.fromTo(packetRef.current, { x: 0, opacity: 1 }, { x: 90, opacity: 0, duration: 0.5, ease: 'power2.in' });
    try {
      const endpoint = siteContent.contact.formEndpoint;
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(fields),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        await new Promise((r) => setTimeout(r, 700));
        const subject = encodeURIComponent(`Hello from ${fields.name}`);
        const body = encodeURIComponent(`${fields.message}\n\n— ${fields.name} (${fields.email})`);
        window.location.href = `mailto:${siteContent.contact.email}?subject=${subject}&body=${body}`;
      }
      setStatus('sent');
      playSound('success');
      addRipple(ANCHOR_POINTS.port[0], ANCHOR_POINTS.port[2]);
      runtime.ledFlash = 1;
      toast({ tone: 'success', title: 'Message sent', body: siteContent.contact.formEndpoint ? 'It’s in my inbox.' : 'Your mail app should have opened with it.' });
      setFields({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
      playSound('error');
      toast({ tone: 'warn', title: 'Not sent', body: `Please email ${siteContent.contact.email} directly.` });
    }
  };

  if (status === 'sent') {
    return (
      <div className="border border-ink p-4" role="status">
        <span className="stamp text-[12px]">
          <IconCheck width={14} height={14} /> Sent
        </span>
        <p className="mt-3 font-serif text-[17px] leading-snug">Got it. I’ll write back within two working days.</p>
        <button type="button" className="btn-quiet mt-2" onClick={() => setStatus('idle')}>
          Write another
        </button>
      </div>
    );
  }

  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p id={`err-${k}`} className="mt-1 font-mono text-[11px] text-accent-text">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3" aria-label="Contact form">
      <div className={compact ? 'space-y-3' : 'grid gap-4 sm:grid-cols-[1fr_1.3fr]'}>
        <div>
          <label htmlFor="cf-name" className="caption block">
            Your name
          </label>
          <input id="cf-name" className="field" autoComplete="name" value={fields.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="cf-email" className="caption block">
            Email
          </label>
          <input id="cf-email" type="email" className="field" autoComplete="email" value={fields.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} />
          {err('email')}
        </div>
      </div>
      <div>
        <label htmlFor="cf-msg" className="caption block">
          Message
        </label>
        <textarea id="cf-msg" rows={compact ? 3 : 5} className="field resize-y" value={fields.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'err-message' : undefined} />
        {err('message')}
      </div>
      <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="company" />
      <div className="flex items-center gap-4 pt-1">
        <button type="submit" className="btn btn-solid relative overflow-hidden" disabled={status === 'sending'}>
          <span ref={packetRef} aria-hidden className="absolute left-3 h-1.5 w-3 bg-surface/80" style={{ opacity: 0 }} />
          <IconSend width={14} height={14} />
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <span className="font-mono text-[11px] text-muted">{siteContent.contact.formEndpoint ? 'Goes straight to my inbox.' : 'Opens your mail app.'}</span>
      </div>
      {status === 'error' && <p className="font-mono text-[11px] text-accent-text">That didn’t go through. Try again, or email me directly.</p>}
    </form>
  );
}
