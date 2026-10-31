import { siteContent, type SocialLink } from '../content/siteContent';
import { useStore } from '../store/useStore';
import { scrollToSectionId } from '../hooks/useScrollProgress';
import { ui } from '../content/uiStrings';

/** Navigate to a section in whichever view is active (3D journey or Simple View). */
export function navigateTo(id: string) {
  const s = useStore.getState();
  s.setMenu(false);
  if (s.simpleView || !s.webglOk) {
    const el = document.getElementById(`sv-${id}`);
    el?.scrollIntoView({ behavior: s.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    (el?.querySelector('h2, h1') as HTMLElement | null)?.focus?.({ preventScroll: true });
    return;
  }
  scrollToSectionId(id);
}

/** Relative paths resolve against Vite's base, so this works under /carlos-portfolio/ too. */
export const resumeHref = () =>
  /^(https?:)?\/\//.test(siteContent.resumeUrl) ? siteContent.resumeUrl : `${import.meta.env.BASE_URL}${siteContent.resumeUrl.replace(/^\//, '')}`;

export function openResume() {
  window.open(resumeHref(), '_blank', 'noopener,noreferrer');
}

/** Go back to the very start (Home) in either view. */
export function goHome() {
  const s = useStore.getState();
  s.setMenu(false);
  if (s.simpleView || !s.webglOk) {
    window.scrollTo({ top: 0, behavior: s.reducedMotion ? 'auto' : 'smooth' });
    (document.getElementById('sv-hero-title') as HTMLElement | null)?.focus?.({ preventScroll: true });
    return;
  }
  scrollToSectionId('hero');
}

/** "Plug in" a social link: mark it connected, toast, and open it. */
export function openSocial(social: SocialLink) {
  const s = useStore.getState();
  s.plugIn(social.id);
  s.toast({ tone: 'success', title: `Opening ${social.label}`, body: social.handle });
  if (social.url.startsWith('mailto:')) window.location.href = social.url;
  else window.open(social.url, '_blank', 'noopener,noreferrer');
}

/** Copies the email address. Returns whether it worked; `toast` also shows a message. */
export async function copyEmail({ toast = false } = {}) {
  const email = siteContent.contact.email;
  let ok = false;
  try {
    await navigator.clipboard.writeText(email);
    ok = true;
  } catch {
    // older browsers / non-secure pages
    try {
      const t = document.createElement('textarea');
      t.value = email;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      ok = document.execCommand('copy');
      t.remove();
    } catch {
      ok = false;
    }
  }
  if (toast) useStore.getState().toast({ tone: ok ? 'success' : 'warn', title: ok ? ui.contact.copied : ui.contact.copyFailed, body: email });
  return ok;
}
