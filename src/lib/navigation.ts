import { siteContent, type SocialLink } from '../content/siteContent';
import { useStore } from '../store/useStore';
import { scrollToSectionId } from '../hooks/useScrollProgress';

/** Navigate to a section in whichever view is active (3D journey or Simple View). */
export function navigateTo(id: string) {
  const s = useStore.getState();
  if (s.simpleView || !s.webglOk) {
    const el = document.getElementById(`sv-${id}`);
    el?.scrollIntoView({ behavior: s.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    (el?.querySelector('h2, h1') as HTMLElement | null)?.focus?.({ preventScroll: true });
    return;
  }
  scrollToSectionId(id);
}

export function openResume() {
  // Relative paths resolve against Vite's base, so this works under /carlos-portfolio/ too.
  const url = /^(https?:)?\/\//.test(siteContent.resumeUrl) ? siteContent.resumeUrl : `${import.meta.env.BASE_URL}${siteContent.resumeUrl.replace(/^\//, '')}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** "Plug in" a social link: mark it connected, toast, and open it. */
export function openSocial(social: SocialLink) {
  const s = useStore.getState();
  s.plugIn(social.id);
  s.toast({ tone: 'success', title: `Linked · ${social.label}`, body: `Opening ${social.handle}` });
  if (social.url.startsWith('mailto:')) window.location.href = social.url;
  else window.open(social.url, '_blank', 'noopener,noreferrer');
}

export async function copyEmail() {
  const email = siteContent.contact.email;
  try {
    await navigator.clipboard.writeText(email);
    useStore.getState().toast({ tone: 'success', title: 'Copied', body: email });
  } catch {
    useStore.getState().toast({ tone: 'warn', title: 'Copy failed', body: email });
  }
}
