/**
 * ============================================================================
 *  UI STRINGS — every button, label, hint and message the interface shows.
 * ============================================================================
 *
 *  Personal content (your name, projects, skills…) lives in siteContent.ts.
 *  This file holds the words of the interface itself, so you can reword any
 *  of it without touching a component.
 *
 *  Writing rules used here (please keep them when you edit):
 *   - Short sentences. Plain words. About a 6th-grade reading level.
 *   - Buttons say what they do ("Send message", not "Submit").
 *   - Hardware words (CPU, boot, packet…) are only ever a small caption or a
 *     playful extra, always next to a plain label.
 *   - Error messages say what happened and what to do next.
 * ============================================================================
 */

export interface ExtraItem {
  label: string;
  /** How to do it (shown for normal items, and for secrets once found). */
  task?: string;
  secret?: boolean;
  /** Secrets only: a gentle nudge. */
  clue?: string;
  /** Secrets only: the exact steps, behind "Show a bigger hint". */
  answer?: string;
  /** Section id for the "Take me there" button. */
  section?: string;
  needs3d?: boolean;
}

export interface SectionCopy {
  /** Plain menu label. Always shown first. */
  label: string;
  /** Small hardware caption shown under the plain label. */
  caption: string;
  /** Heading of the section panel. */
  title: string;
  /** One sentence telling the visitor what this section is. */
  intro: string;
}

export const ui = {
  sections: {
    hero: { label: 'Home', caption: 'Circuit board', title: 'Welcome', intro: 'This is the start.' },
    about: { label: 'About', caption: 'CPU', title: 'About me', intro: 'Who I am and how I work.' },
    skills: { label: 'Skills', caption: 'Memory', title: 'My skills', intro: 'The tools and languages I use, and how well I know each one.' },
    projects: { label: 'Projects', caption: 'Drives', title: 'My projects', intro: 'Things I have built. Pick one to read more about it.' },
    experience: { label: 'Experience', caption: 'Data bus', title: 'My experience', intro: 'Where I have worked and studied.' },
    contact: { label: 'Contact', caption: 'Network port', title: 'Contact me', intro: 'The easiest ways to reach me.' },
    shutdown: { label: 'The end', caption: 'Power switch', title: 'Thanks for visiting', intro: 'You have seen everything.' },
  } satisfies Record<string, SectionCopy>,

  welcome: {
    eyebrow: 'Welcome to my portfolio',
    interactive: 'Explore the interactive version',
    interactiveNote: 'A 3D trip across a computer circuit board. Best on a computer with a mouse.',
    simple: 'View the simple version',
    simpleNote: 'A normal web page with large text. Fast and easy to read.',
    recommended: 'Recommended for this device',
    notSure: 'Not sure? Choose Simple. You can switch any time.',
  },

  loading: {
    title: 'Loading the interactive version. This can take a moment on slow connections.',
    percent: (n: number) => `${n}% loaded`,
    useSimple: 'Use the simple version instead',
    slow: 'This is taking longer than usual. You can keep waiting, or use the simple version.',
  },

  boot: {
    title: 'Starting up',
    explain: 'A short start-up animation, like a computer turning on. It is just for fun.',
    skip: 'Skip',
    skipLabel: 'Skip the start-up animation',
  },

  nav: {
    mainLabel: 'Main menu',
    home: 'Home',
    homeLabel: (name: string) => `${name}. Go to the start of the page`,
    menu: 'Menu',
    closeMenu: 'Close menu',
    help: 'Help',
    helpLabel: 'Help: how to use this site',
    accessibility: 'Accessibility',
    cv: 'Download my CV',
    toSimple: 'Simple version',
    toSimpleShort: 'Simple',
    to3dShort: '3D',
    toSimpleLong: 'Switch to the simple version',
    to3d: '3D version',
    to3dLong: 'Switch to interactive 3D version',
    tour: 'How to use this site',
    allProjects: 'All projects',
    sectionsHeading: 'Go to a section',
    viewHeading: 'Version',
    extrasHeading: 'Extras, just for fun',
    search: 'Search the site',
    searchHint: (key: string) => `Shortcut: ${key} + K`,
    terminal: 'Open the terminal',
    terminalHint: 'Type commands, like on an old computer. Type help to start.',
    achievements: (n: number, total: number) => `Things to try (${n} of ${total} done)`,
    achievementsHint: 'A checklist of fun extras, with clues for the secret ones',
    themeHeading: 'Colours',
    sound: 'Sound',
    on: 'On',
    off: 'Off',
  },

  a11y: {
    title: 'Accessibility',
    textSize: 'Text size',
    smaller: 'A-',
    smallerLabel: 'Make text smaller',
    reset: 'A',
    resetLabel: 'Reset text to normal size',
    larger: 'A+',
    largerLabel: 'Make text larger',
    current: (pct: number) => `Now ${pct}%`,
    highContrast: 'High contrast',
    highContrastNote: 'Stronger colours and thicker lines.',
    reduceMotion: 'Reduce motion',
    reduceMotionNote: 'Fewer moving parts. The camera jumps instead of flying.',
    saved: 'Your choices are saved on this device.',
  },

  progress: {
    of: (i: number, n: number) => `Section ${i} of ${n}`,
    back: 'Back',
    next: 'Next section',
    nextTo: (label: string) => `Next: ${label}`,
    backTo: (label: string) => `Back: ${label}`,
    top: 'Back to top',
    goTo: (label: string) => `Go to ${label}`,
    dotsLabel: 'All sections',
  },

  panel: {
    show: 'Show the text ↑',
    hide: 'Hide the text to see the board ↓',
  },

  hero: {
    based: 'Based in',
    status: 'Status',
    start: 'Start: About me',
    projects: 'See my projects',
    contact: 'Contact me',
    howTo: 'Press “Next section” at the bottom of the screen, or scroll, to move through the site.',
  },

  about: {
    factsTitle: 'A few facts about me',
    factsNote: 'Each fact is also one of the eight cores on the processor chip. Pick a fact to light up its core.',
    showOnChip: 'Show on the chip',
    shownOnChip: 'Shown on the chip',
    extraTitle: 'Just for fun: overclock the processor',
    extraExplain: '“Overclocking” means making a processor run faster than normal. It gets hot. Press and hold the button to try it. It does nothing to your device.',
    hold: 'Press and hold to overclock',
    temp: 'Temperature',
    state: 'State',
    states: { idle: 'Resting', boost: 'Speeding up', hot: 'Too hot, slowing down' },
  },

  skills: {
    legend: 'The squares show how well I know each skill, from 1 (still learning) to 5 (expert).',
    level: (n: number) => `${n} of 5`,
    filterLabel: 'Show skills for',
    all: 'All',
    boardTip: 'Tip: point at a chip on the memory sticks, or tap it, to see its name.',
    colSkill: 'Skill',
    colLevel: 'Level',
  },

  projects: {
    listTitle: (n: number) => `All projects (${n})`,
    open: 'See this project',
    openLabel: (title: string) => `See this project: ${title}`,
    boardTip: 'You can also click a drive in the rack on the board.',
  },

  experience: {
    school: 'School',
    work: 'Work',
    boardTip: 'Each moving carriage on the rail is one job or school. Point at one, or tap it, to stop it.',
  },

  contact: {
    lead: 'Email is the best way to reach me. I answer within two working days.',
    emailMe: 'Email me',
    whatsapp: 'WhatsApp',
    call: 'Call',
    emailLabel: 'My email address',
    copy: 'Copy',
    copyLabel: 'Copy my email address',
    copied: 'Copied! You can now paste it into your email app.',
    copyFailed: 'Could not copy. Please select the address and copy it yourself.',
    formTitle: 'Or send me a message here',
    othersTitle: 'Other places to find me',
    plugTip: 'Just for fun: you can also drag a cable into a port on the board.',
  },

  form: {
    name: 'Your name',
    email: 'Your email address',
    message: 'Your message',
    send: 'Send message',
    sending: 'Sending…',
    viaMailApp: 'When you press “Send message”, your email app opens with your message ready. Then press Send in your email app.',
    viaEndpoint: 'Your message comes straight to my inbox.',
    errName: 'Please type your name.',
    errEmail: 'Please type a full email address, like name@example.com.',
    errMessage: 'Please write a short message (at least 10 letters).',
    sentTitle: 'Thank you! Your message is ready.',
    sentBodyEndpoint: 'Your message was sent. I will write back within two working days.',
    sentBodyMail: 'Your email app should have opened with your message. Please press Send there. I will write back within two working days.',
    another: 'Write another message',
    failed: (email: string) => `Something went wrong and your message was not sent. Please try again, or email me at ${email}.`,
  },

  project: {
    counter: (i: number, n: number) => `Project ${i} of ${n}`,
    prev: 'Previous project',
    next: 'Next project',
    close: 'Close',
    closeLabel: 'Close this project',
    about: 'About this project',
    details: 'Details',
    year: 'Year',
    role: 'My role',
    status: 'Status',
    tools: 'Tools I used',
    main: 'Main',
    also: 'Also used',
    screenshots: 'Screenshots',
    noScreenshot: 'Screenshot coming soon',
    history: 'History',
    colItem: 'Item',
    colValue: 'Value',
    colTool: 'Tool',
    colUse: 'How much',
    colVersion: 'Version',
    colDate: 'Date',
    colChange: 'What changed',
    live: 'Open the live website',
    repo: 'See the code on GitHub',
    caseStudy: 'Read the case study',
    keys: 'Tip: use the arrow keys to see other projects. Press Esc to close.',
  },

  end: {
    body: 'You reached the end. Thank you for looking around. You can go back to the top, download my CV, or get in touch.',
    top: 'Back to top',
    contact: 'Contact me',
    powerOff: 'Turn off the board (just for fun)',
    confirmTitle: 'Turn off the board?',
    confirmBody: 'This plays a short “power off” animation and takes you back to the start. Nothing is lost.',
    confirmYes: 'Yes, turn it off',
    confirmNo: 'No, stay here',
    halted: 'The board is off. Starting again…',
  },

  help: {
    title: 'How to use this site',
    intro: 'Everything on this site can be reached with normal buttons. The 3D parts are extras.',
    mouseTitle: 'With a mouse',
    mouse: [
      'Press “Next section” at the bottom of the screen, or scroll down.',
      'Click a word in the top menu to jump to that part.',
      'Click anything with a “Click” label, or a button on the panels.',
    ],
    touchTitle: 'With a touch screen',
    touch: [
      'Tap “Next section” at the bottom, or swipe up.',
      'Tap “Menu” at the top to see every part of the site.',
      'Tap things to open them. Touch and hold to see a label.',
    ],
    keysTitle: 'With a keyboard',
    keys: [
      'Arrow keys or Page Up / Page Down move between sections.',
      'Tab moves between buttons. Enter presses them.',
      'Esc closes any open window.',
    ],
    stuck: 'Lost? Press “Home” at the top to go back to the start.',
    simpleTitle: 'Prefer a plain page?',
    simpleBody: 'The simple version has all the same content, with large text and no 3D.',
    startTour: 'Start the guided tour',
    close: 'Close',
  },

  tour: {
    stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
    next: 'Next tip',
    done: 'Got it, let’s start',
    skip: 'Skip the tour',
    steps3d: [
      { title: 'How to move', body: 'Press “Next section” at the bottom of the screen to move forward. You can also scroll. Press “Back” to go back.' },
      { title: 'What you can click', body: 'Buttons on the panels always work. Parts of the board you can click show a small “Click” label and an outline.' },
      { title: 'How to open a project', body: 'Choose “Projects” in the top menu, then press “See this project” next to any project.' },
      { title: 'Prefer a simple page?', body: 'Press “Simple version” at the top for a normal page with large text. You can come back any time.' },
    ],
    stepsSimple: [
      { title: 'How to move', body: 'Scroll down to read. Or choose a part in the top menu to jump straight to it.' },
      { title: 'What you can click', body: 'Anything that looks like a button or an underlined link can be clicked or tapped.' },
      { title: 'How to open a project', body: 'In “My projects”, press “See this project” to read more.' },
      { title: 'Want the 3D version?', body: 'Press “3D version” at the top to explore the site as a computer circuit board.' },
    ],
  },

  hints: {
    clickToOpen: 'Click to open',
    tapToOpen: 'Tap to open',
    cpu: 'Click a core to light up a fact',
    ram: 'Point at a chip to see a skill',
    drive: 'Click a drive to see a project',
    bus: 'Point at a carriage to stop it',
    plug: 'Drag a cable into a port, or click it',
    parts: 'Just for fun: pick up a screw and throw it',
    driveTip: (title: string) => `${title}. Click to see this project`,
    coreTip: 'Processor. Click a core to read a fact',
    fanTip: 'Fan. Click to spin it faster',
    screwTip: 'Loose screw. Drag to throw it (just for fun)',
  },

  dialog: {
    close: 'Close',
  },

  errors: {
    scene: 'Something went wrong with the 3D version. Try again, or use the simple version.',
    tryAgain: 'Try again',
    useSimple: 'Use the simple version',
    noWebgl: 'Your browser cannot show 3D here, so we opened the simple version. It has all the same content.',
    notFoundTitle: 'Page not found',
    notFoundBody: 'This page does not exist. The link may be old or have a typo.',
    notFoundHome: 'Go to the home page',
    notFoundSimple: 'Open the simple version',
    notFoundNerd: 'For the curious: what a computer would say',
  },

  palette: {
    title: 'Search the site',
    placeholder: 'Type a section, project or setting…',
    empty: 'Nothing found. Try “projects” or “contact”.',
    keys: '↑ ↓ to choose · Enter to open · Esc to close',
    count: (n: number) => `${n} results`,
  },

  /**
   * "Things to try" — the checklist of fun extras (achievements).
   * `task` says how to do it. Secret items show `clue` first, and `answer`
   * only when the visitor asks for a bigger hint (or after they find it).
   * `section` adds a "Take me there" button; `needs3d` marks 3D-only items.
   * The order here is the order of the list.
   */
  extras: {
    title: 'Things to try',
    caption: 'Just for fun. None of this is needed to use the site.',
    progress: (n: number, total: number) => `${n} of ${total} done`,
    button: 'Things to try',
    buttonCount: (n: number, total: number) => `${n}/${total}`,
    buttonLabel: (n: number, total: number) => `Things to try: ${n} of ${total} done`,
    terminal: 'Terminal',
    terminalLabel: 'Open the terminal (just for fun)',
    funTitle: 'Just for fun',
    funBody: 'Type commands in the terminal, or work through a list of hidden things to find.',
    secret: 'Secret',
    clue: 'Clue',
    biggerHint: 'Show a bigger hint',
    hideHint: 'Hide the bigger hint',
    only3d: 'Only in the 3D version',
    goThere: 'Take me there',
    done: 'Done',
    notYet: 'Not yet',
    toast: 'You found one!',
    toastBody: (n: number, total: number) => `${n} of ${total} things done. See the list under “Things to try”.`,
    items: {
      booted: { label: 'Powered on', task: 'Open the 3D version of the site.' },
      tourist: { label: 'Full tour', task: 'Visit all 7 sections. Pressing “Next section” all the way to the end does it.' },
      inspector: { label: 'Curious', task: 'Open any project by pressing “See this project”.', section: 'projects' },
      hacker: { label: 'Command line', task: 'Open the terminal with the “Terminal” button, then type help and press Enter.' },
      search: { label: 'Finder', task: 'Open “Search the site” from the Menu (or press Ctrl + K) and type a word.' },
      night: { label: 'Night owl', task: 'Switch the colours to Dark in the Accessibility menu.' },
      sound: { label: 'Turn it up', task: 'Turn the sound on in the Accessibility menu, then click around. It is quiet.' },
      plugged: { label: 'Connected', task: 'Open one of my profiles from “Contact me”. On the board you can also drag a cable into its port.', section: 'contact' },
      signal: { label: 'Signal sent', task: 'Click an empty spot on the green board and watch a signal run along the copper lines.', section: 'hero', needs3d: true },
      fan: { label: 'Cool breeze', task: 'Click a fan on the board to make it spin faster. There is one next to the processor.', section: 'about', needs3d: true },
      tosser: { label: 'Dropped a screw', task: 'On the Home view, drag one of the loose silver screws, then let go while still moving to throw it.', section: 'hero', needs3d: true },
      overclock: { label: 'Too hot', task: 'In “About me”, open “Just for fun: overclock the processor”, then press and hold the button until it gets too hot.', section: 'about', needs3d: true },
      konami: {
        label: 'Cheat code',
        secret: true,
        clue: 'Old video games had a famous secret code. It works here too, on a keyboard. It starts with the up arrow, twice.',
        answer: 'On a keyboard, press these keys one after another: ↑ ↑ ↓ ↓ ← → ← → B A. Click on an empty part of the page first, not in a text box.',
      },
      chip: {
        label: 'Mystery chip',
        secret: true,
        needs3d: true,
        section: 'shutdown',
        clue: 'One small black chip on the board has no writing on it. It hides in a corner, far away from all the other parts.',
        answer: 'Go to “The end” (the last section), where you can see the whole board. Click the plain black chip in the far top-right corner of the board.',
      },
      sudo: {
        label: 'Nice try',
        secret: true,
        clue: 'Computer experts type one short magic word to ask for special powers. Try asking the terminal.',
        answer: 'Open the terminal, type sudo and press Enter.',
      },
    } satisfies Record<string, ExtraItem>,
  },

  toast: {
    dismiss: 'Close this message',
  },

  footer: {
    top: 'Back to top',
  },

  simple: {
    stats: {
      projects: 'Projects',
      skills: 'Skills',
      places: 'Places I have worked and studied',
      go: (n: number, what: string, title: string) => `${n} ${what.toLowerCase()}. Go to ${title}`,
    },
    switchNote: 'Want to explore? Try the 3D version, where my work sits on a computer circuit board.',
  },
} as const;
