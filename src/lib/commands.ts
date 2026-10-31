import { siteContent } from '../content/siteContent';
import { SECTIONS } from './sections';
import { THEMES, THEME_ORDER } from './themes';
import { copyEmail, navigateTo, openResume } from './navigation';
import { requestShutdown } from './power';
import { useStore } from '../store/useStore';

/** Everything the command palette can do. The terminal shares the same actions. */
export interface Command {
  id: string;
  group: 'Go to' | 'Projects' | 'Colours' | 'Settings' | 'Links' | 'Extras';
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
}

export function buildCommands(): Command[] {
  const s = useStore.getState;
  const cmds: Command[] = [];
  SECTIONS.forEach((sec) =>
    cmds.push({
      id: `go-${sec.id}`,
      group: 'Go to',
      label: sec.title,
      hint: sec.caption,
      keywords: `${sec.id} ${sec.hardware} navigate jump`,
      run: () => navigateTo(sec.id),
    }),
  );
  siteContent.projects.forEach((p, i) =>
    cmds.push({
      id: `project-${p.id}`,
      group: 'Projects',
      label: `Project: ${p.title}`,
      hint: p.tech.slice(0, 3).join(' · '),
      keywords: `${p.id} project open ${p.tech.join(' ')}`,
      run: () => s().openProject(i),
    }),
  );
  THEME_ORDER.forEach((id) =>
    cmds.push({
      id: `theme-${id}`,
      group: 'Colours',
      label: `${THEMES[id].label} colours`,
      keywords: `color palette light dark ${id}`,
      run: () => s().setTheme(id),
    }),
  );
  cmds.push(
    {
      id: 'simple',
      group: 'Settings',
      label: s().simpleView ? 'Switch to interactive 3D version' : 'Switch to the simple version',
      keywords: 'accessibility 2d fast recruiter plain simple 3d',
      run: () => {
        s().setSimpleView(!s().simpleView);
        window.scrollTo(0, 0);
      },
    },
    { id: 'help', group: 'Settings', label: 'Help: how to use this site', keywords: 'help guide instructions', run: () => s().setHelp(true) },
    { id: 'tour', group: 'Settings', label: 'Start the guided tour', keywords: 'tour onboarding tips', run: () => s().setTour(true) },
    { id: 'text-bigger', group: 'Settings', label: 'Make text larger', keywords: 'font size zoom accessibility', run: () => s().setPrefs({ textSize: Math.min(4, s().prefs.textSize + 1) }) },
    { id: 'contrast', group: 'Settings', label: 'Turn high contrast on or off', keywords: 'accessibility colour', run: () => s().setPrefs({ highContrast: !s().prefs.highContrast }) },
    { id: 'motion', group: 'Settings', label: 'Turn reduce motion on or off', keywords: 'accessibility animation dizzy', run: () => s().setPrefs({ motion: s().reducedMotion ? 'full' : 'reduce' }) },
    { id: 'sound', group: 'Settings', label: 'Turn sound on or off', keywords: 'audio mute volume', run: () => s().setSound(!s().sound) },
    { id: 'resume', group: 'Links', label: 'Download my CV', keywords: 'cv pdf resume', run: () => openResume() },
    { id: 'copy-email', group: 'Links', label: 'Copy my email address', hint: siteContent.contact.email, keywords: 'contact mail clipboard', run: () => copyEmail({ toast: true }) },
    { id: 'contact', group: 'Links', label: 'Contact me', keywords: 'message form hire email', run: () => navigateTo('contact') },
    { id: 'terminal', group: 'Extras', label: 'Open the terminal', hint: 'key: `', keywords: 'console shell cli', run: () => s().setTerminal(true) },
    { id: 'achievements', group: 'Extras', label: 'Things to try (with clues)', keywords: 'achievements trophies secrets clues fun', run: () => s().setAchievementsOpen(true) },
    { id: 'reboot', group: 'Extras', label: 'Turn off the board', keywords: 'power restart off reboot', run: () => requestShutdown() },
  );
  siteContent.contact.socials.forEach((so) =>
    cmds.push({
      id: `social-${so.id}`,
      group: 'Links',
      label: `Open ${so.label}`,
      hint: so.handle,
      keywords: 'social link',
      run: () => (so.url.startsWith('mailto:') ? (window.location.href = so.url) : window.open(so.url, '_blank', 'noopener,noreferrer')),
    }),
  );
  return cmds;
}
