/**
 * ============================================================================
 *  SITE CONTENT — the ONLY file you need to edit to make this portfolio yours.
 * ============================================================================
 *
 *  Everything personal (name, text, projects, skills, links) lives here and is
 *  consumed by both the 3D experience and the Simple View. Nothing personal is
 *  hardcoded anywhere else.
 *
 *  Filled in from your repos and projects. Anything marked [check] was
 *  inferred and needs confirming (or deleting) before you publish.
 *
 *  FIELDS
 *  ------
 *  meta         SEO: page <title>, meta description, site URL (used for OG tags
 *               at runtime). Also update index.html for crawlers without JS.
 *  person       name        Shown in the hero, navbar logo, footer.
 *               initials    Short logo text (2-3 chars).
 *               title       Your role, e.g. "Full-Stack Engineer".
 *               tagline     One-line pitch under your name in the hero.
 *               plainIntro  ONE plain sentence about what you do, shown on the
 *                           welcome screen and at the top of the page. Keep it
 *                           simple enough for anyone to understand.
 *               location    Free text, shown in About.
 *               availability  Short status line (e.g. "Open to new roles").
 *  about        intro       Paragraphs shown in the About / CPU section.
 *               facts       Each fact becomes a clickable CPU core (4–8 works
 *                           best; 8 fills the die). `label` is the short core
 *                           name, `detail` is revealed on click.
 *  skills       Array of categories. Each category becomes one RAM stick and a
 *               filter button. Each skill becomes one memory block.
 *                 level: 1–5 (1 = learning, 5 = expert). Drives block glow.
 *  projects     Each project becomes a floating data cartridge above a drive.
 *               id          URL-safe unique id (used by terminal `open <id>`).
 *               title, summary (one line), description (paragraphs),
 *               tech        Array of technology names.
 *               color       Hex color for the cartridge + panel accent.
 *               year, role  Short meta strings.
 *               links       Optional { live, repo, caseStudy } URLs.
 *               gallery     Array of image URLs. Leave empty to show
 *                           generated placeholder frames.
 *               partNo, status, specs, revisions   Optional datasheet extras
 *                           shown in the project panel (part number, current
 *                           status, a small spec table and a revision history).
 *               color       Label-sticker color. Keep it muted (paper, kraft,
 *                           gold, copper, sage) — the UI has one accent only.
 *  experience   Timeline entries (jobs AND education). `kind` picks the icon
 *               ('work' | 'education'). Shown as packets on the data bus.
 *  contact      email       Shown as text with a Copy button, plus "Email me".
 *               phone       Optional. International format, e.g. "+254712345678".
 *                           Shows a big "Call" button. Leave "" to hide it.
 *               whatsapp    Optional. Digits only with country code, e.g.
 *                           "254712345678". Shows a "WhatsApp" button. "" hides it.
 *               formEndpoint  Optional POST endpoint (Formspree, Getform, your
 *                           API...). If empty, the form opens a mailto: draft.
 *               socials     Each becomes a draggable plug at the network port.
 *                           `kind` picks the connector style.
 *  resumeUrl    Link for every "Download my CV" button. Put a PDF in /public and use
 *               "resume.pdf" (resolved against the site's base path), or a full URL.
 *  easterEggs   Text revealed by the hidden secrets (keep it fun).
 *  bench        Handwritten / printed bits on the board: the masking-tape
 *               label, the sticky note, the QC sticker serial and the tiny
 *               logo text printed in the silkscreen.
 *  footerNote   One dry line in the footer.
 *
 *  The words of the interface itself (buttons, help, error messages) are in
 *  uiStrings.ts next to this file.
 * ============================================================================
 */

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface SkillCategory {
  id: string;
  label: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string[];
  tech: string[];
  color: string;
  year: string;
  role: string;
  links: { live?: string; repo?: string; caseStudy?: string };
  gallery: string[];
  partNo?: string;
  status?: string;
  specs?: { label: string; value: string }[];
  revisions?: { rev: string; date: string; note: string }[];
}

export interface ExperienceEntry {
  kind: 'work' | 'education';
  title: string;
  org: string;
  period: string;
  location?: string;
  summary: string;
  highlights: string[];
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  handle: string;
  kind: 'rj45' | 'usbc' | 'hdmi' | 'usba';
}

export interface SiteContent {
  meta: { title: string; description: string; siteUrl: string };
  person: {
    name: string;
    initials: string;
    title: string;
    tagline: string;
    plainIntro: string;
    location: string;
    availability: string;
  };
  about: {
    intro: string[];
    facts: { label: string; detail: string }[];
  };
  skills: SkillCategory[];
  projects: Project[];
  experience: ExperienceEntry[];
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    formEndpoint: string;
    socials: SocialLink[];
  };
  resumeUrl: string;
  easterEggs: {
    konami: string;
    hiddenChip: string;
    sudo: string;
  };
  bench: {
    tapeLabel: string;
    stickyNote: string[];
    qcSerial: string;
    logo: string;
  };
  footerNote: string;
}

export const siteContent: SiteContent = {
  meta: {
    title: 'Mark Chege — full-stack developer',
    description:
      'Mark Chege builds web apps end to end — Flask or Express behind, React in front — and spends his spare time breaking them on purpose. Projects, experience and contact details.',
    siteUrl: 'https://78cxrlos.github.io/carlos-portfolio/',
  },

  person: {
    name: 'Mark Chege',
    initials: 'MC',
    title: 'Full-stack developer, Python and React',
    tagline: 'I build web apps end to end: Flask or Express behind, React in front. Lately I break them on purpose, too.',
    plainIntro: 'I am a web developer. I build websites and web apps, from the parts you see to the parts behind the scenes.',
    location: 'Nairobi, Kenya [check]',
    availability: 'Open to junior roles and internships [check]',
  },

  about: {
    intro: [
      'I trained as a software engineer at Moringa School in 2024 and have been shipping since: group projects first, then client work, now an internal product at a company.',
      'Most of what I write is Python and TypeScript. I like APIs with clear validation, forms that tell you what went wrong, and pulling the latest migrations before touching anything. In the evenings I work through security labs, because knowing how things break makes me build them better.',
    ],
    facts: [
      { label: 'Core 0 · Start', detail: 'Moringa School, April 2024. My first repo was a plain HTML and JavaScript page: ten commits in five days.' },
      { label: 'Core 1 · Now', detail: 'Building a CV builder: an Express and MySQL API with a React front end, shipped through Azure Pipelines and Docker.' },
      { label: 'Core 2 · Tools', detail: 'Python and Flask for APIs, React and TypeScript for the front, PostgreSQL or MySQL underneath, DBeaver open in another window.' },
      { label: 'Core 3 · Rule', detail: 'Pull the latest migrations before you change a model. A group project taught me that the hard way.' },
      { label: 'Core 4 · Learning', detail: 'Offensive security: Burp Suite, nmap, sqlmap, OverTheWire Bandit and OWASP Juice Shop.' },
      { label: 'Core 5 · Defence', detail: 'Blue-team labs too — packet captures, log hunts, a RAT or two. Same skills, other side of the table.' },
      { label: 'Core 6 · School', detail: 'Also studying at USIU-Africa, where group reports are their own kind of merge conflict. [check: programme]' },
      { label: 'Core 7 · Odd fact', detail: 'I keep a folder of C experiments that have no names. Everything is called a.out.' },
    ],
  },

  // Levels are my estimate from your repos — adjust them, they are yours to rate.
  skills: [
    {
      id: 'frontend',
      label: 'Frontend',
      skills: [
        { name: 'JavaScript', level: 4 },
        { name: 'React', level: 4 },
        { name: 'TypeScript', level: 3 },
        { name: 'HTML & CSS', level: 4 },
        { name: 'Tailwind', level: 3 },
        { name: 'Vite', level: 3 },
      ],
    },
    {
      id: 'backend',
      label: 'Backend',
      skills: [
        { name: 'Python', level: 4 },
        { name: 'Flask', level: 4 },
        { name: 'SQLAlchemy', level: 3 },
        { name: 'PostgreSQL', level: 3 },
        { name: 'Express', level: 3 },
        { name: 'MySQL', level: 3 },
        { name: 'Django', level: 2 },
        { name: 'FastAPI', level: 2 },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      skills: [
        { name: 'Git', level: 4 },
        { name: 'Linux', level: 3 },
        { name: 'Docker', level: 2 },
        { name: 'Azure DevOps', level: 2 },
        { name: 'Go', level: 1 },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      skills: [
        { name: 'Burp Suite', level: 3 },
        { name: 'Nmap', level: 3 },
        { name: 'OWASP Top 10', level: 3 },
        { name: 'sqlmap', level: 2 },
        { name: 'Wireshark', level: 2 },
        { name: 'Bash', level: 3 },
      ],
    },
  ],

  projects: [
    {
      id: 'btx-capital',
      title: 'BTX Capital',
      summary: 'Company website with its own admin panel for news and enquiries.',
      description: [
        'A public site for BTX Capital — services, about, news and contact — plus a private admin dashboard where staff log in, publish news articles and read messages from the contact form.',
        'The front end is React 19 with TypeScript and Tailwind 4. Behind it is a Flask API with SQLAlchemy models for admin users, articles and contact messages. Roughly fifty commits over ten months, most of them small. [check: add a live link and outcome]',
      ],
      tech: ['React', 'TypeScript', 'Tailwind', 'Flask', 'SQLAlchemy'],
      color: '#E9E4D8',
      year: '2025',
      role: 'Full-stack developer',
      links: { repo: 'https://github.com/78cxrlos/btx-capital' },
      gallery: [],
      partNo: 'ITM-P01',
      status: 'Delivered',
      specs: [
        { label: 'Commits', value: '~50' },
        { label: 'Duration', value: 'Sep 2025 – Jul 2026' },
        { label: 'Parts', value: 'Site + admin + API' },
      ],
      revisions: [
        { rev: 'A', date: '2025-09', note: 'Landing page, services, contact' },
        { rev: 'B', date: '2026-01', note: 'Flask API, admin login, news' },
        { rev: 'C', date: '2026-07', note: 'Dashboard polish, fixes' },
      ],
    },
    {
      id: 'cv-builder',
      title: 'CV Builder',
      summary: 'An internal tool that turns a form into a CV. Auth first, then everything else.',
      description: [
        'Part of a small team building a CV generator. I work on an Express and MySQL API structured by role — controllers, services, validators — with an OpenAPI spec and Jest tests, plus the React front end.',
        'It ships as Docker images through Azure Pipelines. The repo is private, so there is no public link. [check: what you can say publicly]',
      ],
      tech: ['Express', 'MySQL', 'React', 'Docker', 'Azure Pipelines', 'Jest'],
      color: '#C9A24B',
      year: '2026',
      role: 'Developer',
      links: {},
      gallery: [],
      partNo: 'ITM-P02',
      status: 'In progress',
      specs: [
        { label: 'API', value: 'OpenAPI 3' },
        { label: 'Deploy', value: 'Docker + Azure' },
      ],
    },
    {
      id: 'farmart',
      title: 'Farmart',
      summary: 'A marketplace for farm animals. I worked on the Flask and PostgreSQL backend.',
      description: [
        'Moringa group project: farmers list animals, buyers browse and order. I wrote much of the backend — models, migrations and routes in Flask with PostgreSQL — and the README that tells everyone to pull migrations first.',
        'Twenty-one commits in one week of November 2024. [check: your exact part]',
      ],
      tech: ['Python', 'Flask', 'PostgreSQL', 'Flask-Migrate'],
      color: '#B8693A',
      year: '2024',
      role: 'Backend, group project',
      links: { repo: 'https://github.com/nmogoko/farmart-backend' },
      gallery: [],
      partNo: 'ITM-P03',
      status: 'Done',
      specs: [
        { label: 'Commits (mine)', value: '21' },
        { label: 'Team', value: 'Moringa group' },
      ],
    },
    {
      id: 'eatopia',
      title: 'Eatopia',
      summary: 'Restaurant order management: the menu, the orders, and who approves them.',
      description: [
        'Customers browse the menu and place orders; the restaurant owner approves or declines them, adds dishes and gets notified when something comes in.',
        'Built with Django, with separate API, backend and frontend apps in one project.',
      ],
      tech: ['Python', 'Django', 'REST API'],
      color: '#8FA394',
      year: '2024',
      role: 'Developer',
      links: { repo: 'https://github.com/78cxrlos/Eatopia' },
      gallery: [],
      partNo: 'ITM-P04',
      status: 'Done',
    },
    {
      id: 'urban-wardrobe',
      title: 'Urban Wardrobe',
      summary: 'A clothing shop front end, built by five people in React.',
      description: [
        'An online store for streetwear — browse, filter, look at things you can’t afford. Built with Gyzelle, Brian, Owen and Derrick in React and Vite.',
        'It’s still live on GitHub Pages.',
      ],
      tech: ['React', 'Vite', 'JavaScript', 'CSS'],
      color: '#A69C8A',
      year: '2024',
      role: 'Frontend, group project',
      links: { live: 'https://78cxrlos.github.io/Group-project/', repo: 'https://github.com/78cxrlos/Group-project' },
      gallery: [],
      partNo: 'ITM-P05',
      status: 'Live',
    },
    {
      id: 'late-show',
      title: 'Late Show API',
      summary: 'A Flask API for episodes, guests and who appeared when.',
      description: [
        'Episodes have many guests through appearances, and every appearance has a rating that must be between 1 and 5. The API validates that and says so politely when it isn’t.',
        'A small project, but it’s where many-to-many relationships stopped confusing me.',
      ],
      tech: ['Python', 'Flask', 'SQLAlchemy'],
      color: '#5E6B63',
      year: '2024',
      role: 'Solo',
      links: { repo: 'https://github.com/78cxrlos/Late-show' },
      gallery: [],
      partNo: 'ITM-P06',
      status: 'Done',
    },
  ],

  experience: [
    {
      kind: 'work',
      title: 'Software Developer',
      org: 'ERP Tohama [check: company name]',
      period: '2026 — now',
      summary: 'Building a CV builder: Express and MySQL API, React front end, Docker and Azure Pipelines.',
      highlights: ['Auth module with validation and tests', 'Containerised deploys through Azure DevOps'],
    },
    {
      kind: 'work',
      title: 'Full-stack Developer',
      org: 'BTX Capital',
      period: '2025 — 2026',
      summary: 'Designed and built the company website and its admin dashboard.',
      highlights: ['React + TypeScript site, Flask API', 'Admin panel for news and contact messages'],
    },
    {
      kind: 'education',
      title: 'Software Engineering (full-time)',
      org: 'Moringa School',
      period: '2024',
      location: 'Nairobi',
      summary: 'Five phases from HTML to full-stack: JavaScript, React, Python, Flask, SQL, and a lot of group projects.',
      highlights: ['Farmart, Eatopia, Urban Wardrobe', 'Code challenges in Flask and SQLAlchemy'],
    },
    {
      kind: 'education',
      title: 'Undergraduate studies [check: degree]',
      org: 'USIU-Africa',
      period: '[check] — now',
      location: 'Nairobi',
      summary: 'Studying alongside work.',
      highlights: ['Group research reports and presentations'],
    },
  ],

  contact: {
    email: 'mrkcarlos576@gmail.com',
    // [check] add your numbers to show the "Call" and "WhatsApp" buttons.
    phone: '',
    whatsapp: '',
    formEndpoint: '',
    socials: [
      { id: 'github', label: 'GitHub', url: 'https://github.com/78cxrlos', handle: '@78cxrlos', kind: 'usbc' },
      { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle', handle: '[check] add your LinkedIn', kind: 'rj45' },
      { id: 'email', label: 'Email', url: 'mailto:mrkcarlos576@gmail.com', handle: 'mrkcarlos576@gmail.com', kind: 'hdmi' },
    ],
  },

  resumeUrl: 'resume.pdf',

  easterEggs: {
    konami: 'Cheat accepted. The board now runs at its rated clock, which is to say, the same.',
    hiddenChip: 'No markings on this one. I found it in a lab writeup and decided it was mine now. It works. I don’t know what it does.',
    sudo: 'You are not in the sudoers file. This incident will be logged, and I do read the logs — it’s a security habit.',
  },

  bench: {
    tapeLabel: 'rev 2.3 — do not reflow',
    stickyNote: ['pull migrations', 'renew lab VPN', 'USIU report'],
    qcSerial: 'SN 0423-117',
    logo: 'MC',
  },

  footerNote: 'Assembled by hand in Nairobi. Mostly bug-free.',
};
