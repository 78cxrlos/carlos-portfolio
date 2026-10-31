import type { SVGProps } from 'react';

/** Minimal inline icon set (stroke icons, 24×24) — no icon font download. */
type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const IconPower = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v8" />
    <path d="M6.3 7.2a8 8 0 1 0 11.4 0" />
  </svg>
);
export const IconSound = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);
export const IconMute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </svg>
);
export const IconTerminal = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3 3-3 3M13 15h4" />
  </svg>
);
export const IconPalette = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="10" r="1.2" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
    <circle cx="16" cy="10" r="1.2" fill="currentColor" />
    <path d="M12 21a3 3 0 0 1 0-6h2a3 3 0 0 0 3-3" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const IconFile = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);
export const IconCube = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2l9 5v10l-9 5-9-5V7z" />
    <path d="M12 12l9-5M12 12v10M12 12L3 7" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </svg>
);
export const IconTrophy = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4z" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
export const IconGithub = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C6.5 2.5 5.5 2.8 5.5 2.8a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.2c0 4.6 2.8 5.7 5.5 6a3 3 0 0 0-.8 2.3V21" />
  </svg>
);
export const IconLinkedin = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export function SocialIcon({ id, ...p }: { id: string } & P) {
  if (id === 'github') return <IconGithub {...p} />;
  if (id === 'linkedin') return <IconLinkedin {...p} />;
  if (id === 'x' || id === 'twitter') return <IconX {...p} />;
  if (id === 'email') return <IconMail {...p} />;
  return <IconExternal {...p} />;
}
export const IconHelp = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.2a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.6" />
    <path d="M12 17.2v.1" />
  </svg>
);
export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19V5" />
    <path d="M6 11l6-6 6 6" />
  </svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);
export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
  </svg>
);
export const IconChat = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20l1.4-4A8 8 0 1 1 8 18.6z" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11" />
    <path d="M7 10.5l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);
export const IconAccessibility = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M5 8l7 1.5L19 8" />
    <path d="M12 9.5V14l-3 6" />
    <path d="M12 14l3 6" />
  </svg>
);
/** Larger line drawings for the Help panel. */
export const DrawMouse = (p: P) => (
  <svg {...base({ width: 56, height: 56, strokeWidth: 1.4, ...p })}>
    <rect x="7" y="3" width="10" height="17" rx="5" />
    <path d="M12 3v6" />
    <path d="M12 6v1.6" strokeWidth={2.6} />
  </svg>
);
export const DrawHand = (p: P) => (
  <svg {...base({ width: 56, height: 56, strokeWidth: 1.4, ...p })}>
    <path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M12 10V8.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.5 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16V11" />
  </svg>
);
export const DrawKeyboard = (p: P) => (
  <svg {...base({ width: 56, height: 56, strokeWidth: 1.4, ...p })}>
    <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
    <path d="M6 9.5h1M9.5 9.5h1M13 9.5h1M16.5 9.5h1M6 12.5h1M17 12.5h1M9 15.5h6" />
    <path d="M10 12.5h4" />
  </svg>
);
