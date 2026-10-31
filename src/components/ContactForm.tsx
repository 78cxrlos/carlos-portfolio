import { useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
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
  if (f.name.trim().length < 1) e.name = ui.form.errName;
  if (!EMAIL_RE.test(f.email.trim())) e.email = ui.form.errEmail;
  if (f.message.trim().length < 10) e.message = ui.form.errMessage;
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
      setFields({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
      playSound('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="border-2 border-ink p-4" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <p className="flex items-center gap-2 font-serif text-[22px] font-semibold">
          <IconCheck width={22} height={22} /> {ui.form.sentTitle}
        </p>
        <p className="mt-2 text-[18px] leading-[1.6]">{siteContent.contact.formEndpoint ? ui.form.sentBodyEndpoint : ui.form.sentBodyMail}</p>
        <button type="button" className="btn mt-3" onClick={() => setStatus('idle')}>
          {ui.form.another}
        </button>
      </div>
    );
  }

  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p id={`err-${k}`} className="mt-1 text-[16px] font-semibold text-accent-text">
        {errors[k]}
      </p>
    ) : null;

  const field = (k: keyof Fields, label: string, input: JSX.Element) => (
    <div>
      <label htmlFor={`cf-${k}`} className="label">
        {label}
      </label>
      {input}
      {err(k)}
    </div>
  );
  const aria = (k: keyof Fields) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `err-${k}` : undefined });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4" aria-label={ui.contact.formTitle}>
      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        {field('name', ui.form.name, <input id="cf-name" className="field" autoComplete="name" value={fields.name} onChange={set('name')} {...aria('name')} />)}
        {field('email', ui.form.email, <input id="cf-email" type="email" inputMode="email" className="field" autoComplete="email" value={fields.email} onChange={set('email')} {...aria('email')} />)}
      </div>
      {field('message', ui.form.message, <textarea id="cf-message" rows={compact ? 4 : 6} className="field resize-y" value={fields.message} onChange={set('message')} {...aria('message')} />)}
      <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="company" />
      <p className="text-[16px] leading-[1.5] text-muted">{siteContent.contact.formEndpoint ? ui.form.viaEndpoint : ui.form.viaMailApp}</p>
      <button type="submit" className="btn btn-solid btn-big relative w-full overflow-hidden sm:w-auto" disabled={status === 'sending'}>
        <span ref={packetRef} aria-hidden className="absolute left-3 h-1.5 w-3 bg-surface/80" style={{ opacity: 0 }} />
        <IconSend width={18} height={18} />
        {status === 'sending' ? ui.form.sending : ui.form.send}
      </button>
      {status === 'error' && (
        <p className="border-2 border-accent-text p-3 text-[17px] font-semibold text-accent-text" role="alert">
          {ui.form.failed(siteContent.contact.email)}
        </p>
      )}
    </form>
  );
}
