import { siteContent } from '../content/siteContent';
import { SECTIONS } from './sections';
import { THEMES, THEME_ORDER } from './themes';
import { copyEmail, navigateTo, openResume } from './navigation';
import { shutdown } from './power';
import { useStore } from '../store/useStore';

/** Everything the command palette can do. The terminal shares the same actions. */
export interface Command {
  id: string;
  group: 'Sections' | 'Projects' | 'Theme' | 'Settings' | 'Links';
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
      group: 'Sections',
      label: `${sec.ref} — ${sec.label}`,
      hint: sec.hardware,
      keywords: `${sec.id} ${sec.hardware} navigate jump`,
      run: () => navigateTo(sec.id),
    }),
  );
  siteContent.projects.forEach((p, i) =>
    cmds.push({
      id: `project-${p.id}`,
      group: 'Projects',
      label: p.title,
      hint: p.tech.slice(0, 3).join(' · '),
      keywords: `${p.id} project open ${p.tech.join(' ')}`,
      run: () => s().openProject(i),
    }),
  );
  THEME_ORDER.forEach((id) =>
    cmds.push({
      id: `theme-${id}`,
      group: 'Theme',
      label: `Theme — ${THEMES[id].label}`,
      keywords: `color palette light dark ${id}`,
      run: () => s().setTheme(id),
    }),
  );
  cmds.push(
    { id: 'sound', group: 'Settings', label: 'Toggle sound', keywords: 'audio mute volume', run: () => s().setSound(!s().sound) },
    { id: 'terminal', group: 'Settings', label: 'Open terminal', hint: '`', keywords: 'console shell cli', run: () => s().setTerminal(true) },
    {
      id: 'simple',
      group: 'Settings',
      label: 'Plain page (no 3D)',
      keywords: 'accessibility 2d fast recruiter plain',
      run: () => {
        s().setSimpleView(!s().simpleView);
        window.scrollTo(0, 0);
      },
    },
    { id: 'achievements', group: 'Settings', label: 'Inspection log (achievements)', keywords: 'trophies secrets', run: () => s().setAchievementsOpen(true) },
    { id: 'reboot', group: 'Settings', label: 'Power off and reboot', keywords: 'power restart off', run: () => shutdown() },
    { id: 'resume', group: 'Links', label: 'Résumé (PDF)', keywords: 'cv pdf', run: () => openResume() },
    { id: 'copy-email', group: 'Links', label: 'Copy email address', hint: siteContent.contact.email, keywords: 'contact mail clipboard', run: () => copyEmail() },
    { id: 'contact', group: 'Links', label: 'Say hi', keywords: 'message form hire', run: () => navigateTo('contact') },
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
