# Inside the Machine

A 3D portfolio laid out on a circuit board sitting on a workbench under a desk lamp. The camera moves across the board past the CPU, RAM, drives and data bus to the network port. Each part of the board is one portfolio section.

**Content first, 3D second.** Every piece of information can be reached with plain buttons, text links and normal scrolling. A first-time visitor chooses between the interactive 3D version and a simple, large-text page, and can switch at any time. The terminal, search, draggable parts, easter eggs and hold-to-overclock are optional extras. Nobody needs them to use the site. See [USABILITY_CHECKLIST.md](USABILITY_CHECKLIST.md) for the tasks a first-time visitor should be able to do without help.

Every 3D object is built in code: geometry, instancing, GLSL shaders and canvas textures. There are no model, texture, HDR or audio files, so the 3D scene works offline. The only network requests are for Google Fonts, and the page falls back to system fonts if those fail.

**Stack:** Vite · React 18 · TypeScript · React Three Fiber · drei · @react-three/postprocessing · three · GSAP (ScrollTrigger + ScrollTo) · Zustand · Tailwind CSS · Web Audio API.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # contrast check + type-check + production build into dist/
npm run check:contrast   # WCAG AA contrast check for both themes on its own
npm run preview    # serve the production build
```

Requires Node 18+.

---

## Replace the content

**All personal content lives in [`src/content/siteContent.ts`](src/content/siteContent.ts).** The 3D scene, the HTML panels, the terminal, the command palette and the Simple View all read from it. Nothing personal is hardcoded anywhere else. A comment at the top of the file explains every field.

**All interface wording lives in [`src/content/uiStrings.ts`](src/content/uiStrings.ts).** This covers buttons, menu labels, the help panel, the tour, form messages and error messages. It is written at about a 6th-grade reading level: short sentences, buttons that say what they do, and hardware words only as small captions next to a plain label. Please keep that style when you edit it.

| Field | Where it shows up |
|---|---|
| `person` | Welcome screen, hero, navbar logo, start-up log, CPU heat-spreader label, footer. `plainIntro` is the one plain sentence shown on the welcome screen |
| `about.intro` / `about.facts` | About panel. Each fact (up to 8) becomes a clickable **CPU core** |
| `skills` | Each category becomes a **RAM stick** and a filter button. Each skill becomes a chip, its marking showing `level` (1–5) |
| `projects` | Each one becomes a **drive** standing in the rack, plus a datasheet panel. Optional `partNo`, `status`, `specs`, `revisions` fill the datasheet |
| `experience` | Each entry becomes a **carriage** riding the rail on the data bus, plus a timeline item |
| `contact.email` | Shown as text with a **Copy** button, plus a big **Email me** button |
| `contact.phone` / `contact.whatsapp` | Optional. When set, big **Call** and **WhatsApp** buttons appear. Both are empty for now, so the buttons are hidden |
| `contact.socials` | Each one becomes a draggable **plug** at the network port and a link in "Other places to find me" |
| `contact.formEndpoint` | Leave it empty to open a `mailto:` draft. Set it to a Formspree/Getform/API URL to POST JSON |
| `resumeUrl` | Every **Download my CV** button (menu, home panel, end panel, Simple View footer). Replace `public/resume.pdf` (currently a placeholder) |
| `easterEggs` | Text shown by the hidden secrets |
| `bench` | Handwriting on the tape and sticky note, the QC serial, the logo initials in the silkscreen |
| `footerNote` | One dry line in the footer |

Also update:

- **`index.html`**: the static `<title>`, description and Open Graph tags. Crawlers don't run JS, so these need to be set by hand.
- **`public/og-image.png`**: add a 1200×630 share image (referenced from `index.html`).
- **`public/favicon.svg`**: replace if you like.

### Add a project

Append an object to `projects` in `siteContent.ts`:

```ts
{
  id: 'my-new-thing',                 // used by the terminal: `open my-new-thing`
  title: 'My New Thing',
  summary: 'One line.',
  description: ['Paragraph one.', 'Paragraph two.'],
  tech: ['React', 'Rust'],
  color: '#C9A24B',                   // label sticker stripe — keep it muted
  year: '2026',
  role: 'Creator',
  links: { live: 'https://…', repo: 'https://…' },
  gallery: ['/shots/my-new-thing-1.png'], // files in /public; leave [] for generated placeholders
}
```

A new drive appears in the rack automatically, spaced 2.2 units apart. Around 6–8 projects fit the GPU station framing. Beyond that, widen the camera station (see below) or reduce `SPACING` in `src/scene/Storage.tsx`.

---

## Art direction

**"A real board on a real workbench."** The goal is a photograph of actual hardware, not a hologram:

- **Materials:**
  - matte green solder mask with copper traces visible under it as slightly raised lines
  - gold ENIG test pads
  - brushed and machined aluminium, black plastic connectors, tan and brown ceramic capacitors
  - fingerprints, scratches and dust baked into canvas roughness and normal maps
- **Lighting:** one warm desk lamp (spot light with soft PCF shadows), a cool weak fill and a dim ambient. No colored rim lights. Tone mapping is AgX.
- **Glow:** only LEDs glow. There are seven small status LEDs (`StatusLeds` in `src/scene/Board.tsx`), each with its own color and blink pattern, and each means something:
  - power
  - CPU heartbeat
  - drive activity (the one orange LED)
  - bus clock
  - thermal fault
  - network link
  - memory access
- **Bloom:** strength 0.45 with luminance threshold 0.98, so only the LED lenses bloom (`src/scene/Effects.tsx`).
- **Traces:** static copper. A signal edge runs along them only when the camera arrives at a section or you click the board. That's the overlay shader in `src/scene/shaders.ts`.
- **Imperfections:**
  - parts slightly rotated or off-grid
  - masking tape with handwriting, a sticky note and a QC sticker
  - Kapton tape over a corner
  - silkscreen (R12, C4, U1, REV 2.3, TP1–TP9, your initials)
  - a steel ruler and a screwdriver on the bench
  - All of this lives in `src/scene/Props.tsx` and `createBoardTextures()`. The text comes from `siteContent.bench`.
- **Depth of field:** subtle, high quality only, and active only while the camera is parked on a section.

## Palette

Exactly one system, defined in [`src/lib/themes.ts`](src/lib/themes.ts):

| Token | Hex | Use |
|---|---|---|
| off-black | `#121110` | ink, night background |
| bone | `#E9E4D8` | paper, text over the scene |
| PCB green | `#0F3B2E` / `#16503E` | solder mask |
| gold | `#C9A24B` | ENIG pads, contacts |
| copper | `#B8693A` | traces, labels |
| safety orange | `#FF5A1F` | the **only** accent: active states, link underlines, the drive-activity LED |

No pure black or pure white is used, except in **High contrast** mode (`HIGH_CONTRAST` in `themes.ts`). For small orange *text* on paper, the theme uses a darker `accentText` (`#B33A0C`, 4.7:1 on bone). `npm run check:contrast` prints every pair and its ratio.

### Themes

There are two, and both keep the same board:

- **Light** (`bench`): daylight. Paper UI (bone sheets with ink), a brighter lamp, a lighter bench.
- **Dark** (`night`): a dark UI (`#1C1A17` sheets with bone text), a dimmer and warmer lamp, a near-black bench.

The choice is saved in `localStorage` (`itm:theme`). Each theme sets the UI colors (`bg`, `surface`, `ink`, `muted`, `overlay`, `accent`, `accentText`) and the lighting (`lamp`, `lampColor`, `fill`, `ambient`, `exposure`, `bench`).

To adjust:
1. Edit the values in `THEMES`.
2. `useThemeSync` writes them to CSS variables (`--surface`, `--ink`, …).
3. Tailwind exposes them as `bg-surface`, `text-ink`, `text-accent-text`, `border-ink/40` and so on (`tailwind.config.js`).

To add a theme, add it to `ThemeId`, `THEMES` and `THEME_ORDER`. The toggle, palette and terminal pick it up.

## Typography

Loaded from Google Fonts in `index.html`:

- **Newsreader:** headlines and body. It's an editorial serif, set large with tight tracking (`tracking-tightest`, −0.045em) for headlines.
- **IBM Plex Mono:** labels, data, tables and schematic-style captions ("FIG. 02 — MEMORY", "Note 3").
- **Caveat:** handwriting, used only inside canvas textures (tape, sticky note).

To change them, swap the `<link>` in `index.html` and the `fontFamily` entries in `tailwind.config.js` (`serif`, `mono`, `hand`). Canvas textures read the same family names at the top of `src/scene/textures.ts` (`MONO`, `HAND`).

## UI language

- **Sheets:** panels are flat printed datasheets (`.sheet` in `src/styles/index.css`) with a 1px ink border, two corner registration marks, and paper grain. The grain is only on paper surfaces, never full-screen.
- **Buttons:** offset-shadow buttons that press down (`.btn`, `.btn-solid`, `.btn-big`, `.btn-quiet`), written in sentence case so they're easy to read.
- **Projects:** open as component datasheets with a part number, a specs table, "absolute maximum ratings" for the stack, a revision history and figures. Use the optional `partNo`, `status`, `specs` and `revisions` fields in `siteContent.ts`.
- **Toasts:** small printed labels.
- **Achievements:** a list with ink "Found" stamps (Menu → Achievements).
- **Cursor:** the system one. Interactive 3D objects switch it to `pointer`, `grab` or `grabbing`.
- **Motion:** one vocabulary (`src/lib/motion.ts`), using power3.out and the occasional gentle overshoot.
  - Text reveals are masked line slides (`RevealText`).
  - The camera is a spring on a slider rig, with a tiny handheld drift that settles when parked.
  - Fans have inertia: they spin up in about a second and coast down slowly.
- **Sound:** off by default. Everything is synthesized and quiet: a mechanical key click, a relay tick and a low fan hum (`src/lib/audio.ts`).

---

## How the scroll / camera path works

Stations are defined in [`src/lib/sections.ts`](src/lib/sections.ts):

```ts
{ id: 'about', label: 'About', hardware: 'CPU', cam: [-15, 8.5, 3.5], look: [-16, 0.6, -8], panelSide: 'left' }
```

- `cam` is where the camera sits. `look` is the point it looks at.
- [`CameraRig.tsx`](src/scene/CameraRig.tsx) builds two centripetal Catmull-Rom splines, one through every `cam` and one through every `look`. Both are sampled with `getPoint(t)`, which is indexed by control point, so station *i* lands exactly at `t = i / (N-1)`.
- `#journey` is a tall spacer element (120vh per section, `VH_PER_SECTION` in `App.tsx`). GSAP ScrollTrigger maps its scroll progress (0–1) to `runtime.scroll`. There is **no scroll snapping or scroll-jacking**: the page scrolls exactly as the visitor scrolls it.
- The **Next section / Back** buttons and the progress dots call `scrollToSection(i)`, which scrolls the page with a slow `sine.inOut` ease (1.5–3.2 s).
- Every frame the camera follows that value through a slow, critically damped spring (no overshoot). It then:
  - pulls back on narrow or portrait screens
  - pans so the object sits beside the text panel (or above it on phones)
  - adds a very small mouse parallax (mouse only, never on touch). The old handheld sway was removed to avoid motion sickness.
  - blends in the start-up "drop" from above the board
- With reduced motion (OS setting, the **Reduce motion** switch, or the default on touch devices), the camera cuts to each station and a short fade (`MotionFade`) softens the cut.

To add a section: add a station to `SECTIONS`, a panel component to `PANELS` in `SectionPanels.tsx`, and optionally a 3D component in `Scene.tsx`. Hardware positions live in `ANCHOR_POINTS` (same file).

---

## Project structure

```
src/
  content/siteContent.ts     ← all personal content
  scene/                     ← R3F world (lazy-loaded chunk)
    Scene.tsx                  Canvas, PerformanceMonitor, lazy sections
    CameraRig.tsx              spline camera
    Board.tsx Traces.tsx       PCB, instanced parts, animated trace shader
    Cpu.tsx Ram.tsx Gpu.tsx Storage.tsx DataBus.tsx NetworkPort.tsx Parts.tsx Fan.tsx
    Particles.tsx Lights.tsx Effects.tsx
    shaders.ts textures.ts helpers.tsx anchors.ts
  content/uiStrings.ts       ← all interface wording (buttons, help, tour, errors)
  components/                ← DOM layer: Welcome, Navbar, HUD (bottom bar), SectionPanels,
                               SimpleView, Help (help panel + tour), Dialog, Settings,
                               ContactBlock, ProjectPanel, terminal, palette…
  hooks/                     ← useScrollProgress, useKeyboard, useTheme, useSound, usePerformance, useModal
scripts/check-contrast.mjs   ← WCAG AA check, runs before every build
  store/                     ← Zustand store (UI state) + runtime.ts (per-frame mutable state)
  lib/                       ← sections, themes, commands, fuzzy search, audio synth, power
```

Performance notes:

- Repeated parts are instanced (capacitors, resistors, chips, pins, vias, LEDs, bus packets).
- All traces are a single merged mesh with one shader.
- Dust particles move entirely in the vertex shader.
- DPR is capped at 1.75, or 1.5 on mobile.
- drei `PerformanceMonitor` steps quality down from high to medium (bloom only) to low (no post-processing, fewer particles).
- Rendering pauses when the tab is hidden.
- The Simple View never downloads three.js, because the scene is code-split.

---

## Deploy

Routing is hash-based (`#/`, `#/simple`; unknown hash routes show a friendly "Page not found" page), so any static host works.

**GitHub Pages (set up):** `.github/workflows/deploy.yml` builds the site and publishes `dist/` on every push to `main`. The repo is `78cxrlos/carlos-portfolio`, so the site is served at **https://78cxrlos.github.io/carlos-portfolio/** (`base` in `vite.config.ts`).

- One-time setup: in the repo, go to **Settings → Pages → Source: GitHub Actions**.
- If you rename the repo or move to a domain root, update `base` in `vite.config.ts` and the absolute `og:image` / `og:url` in `index.html`.

**Vercel / Netlify:** import the repo. `vercel.json` and `netlify.toml` are included (build `npm run build`, output `dist`).

Share `https://78cxrlos.github.io/carlos-portfolio/#/simple` with recruiters for the fast plain version.

---

## How visitors use it

**First visit.** A welcome screen shows the name, one plain sentence and two big buttons: **Explore the interactive version** and **View the simple version**. Simple is listed first and marked "Recommended for this device" on:
- small touch screens
- devices with a weak GPU or little memory (software renderers, old mobile GPUs, ≤ 2 GB RAM or ≤ 2 CPU cores)
- `prefers-reduced-motion`
- slow or data-saver connections

The choice is remembered (`localStorage` key `itm:view`). `#/simple` is a shareable link straight to the Simple View.

**3D version.**
- A loading screen shows a percentage and always offers **Use the simple version instead**. After 15 seconds it adds a plain "taking longer than usual" message.
- A start-up animation of about 3 seconds follows, with a big **Skip** button (or Esc). It plays once per visit and is skipped entirely when motion is reduced.
- A 4-step tour runs on the first visit. It is skippable and can be replayed from **Menu → How to use this site** or from **Help**.
- A fixed bar at the bottom has **Back**, **Next section**, "Section 2 of 7: About", clickable labelled dots and **Back to top**. Pressing **Next section** alone walks through the whole site.
- Interactive parts of the board show a word label with a pulsing outline the first time ("Click a drive to see a project"). They also have a tooltip on hover, or on touch-and-hold for the drives.

**Simple View.**
- It is a single column with large text, and has small effects that keep it lively without hiding anything:
  - a reading-progress bar under the menu
  - an animated circuit in the header, a nod to the board
  - count-up numbers (projects, skills, places) that jump to their sections
  - sections that ease in as you scroll, with an accent rule drawing under each heading
  - skill bars that fill, fact and project cards that lift under the mouse, project colour stripes and tech tags
  - a timeline whose dots light up
- Everything is CSS keyed to `html[data-motion='full']` (the `.sv-*` and `[data-reveal]` rules in `index.css`). With **Reduce motion** on, or the OS setting, the page is static and fully visible.
- Touch devices keep these gentle effects by default. Only the 3D camera defaults to reduced motion on touch (`computeGentleMotion` vs `computeReducedMotion` in the store).

**Everywhere.**
- The top menu shows plain labels (Home, About, Skills, Projects, Experience, Contact) with the hardware word as a small caption.
- **Help** opens short instructions for mouse, touch and keyboard. Pressing <kbd>?</kbd> opens it too.
- **Accessibility** holds the text-size control (A- / A / A+, 90–150%), **High contrast** and **Reduce motion**, plus Light/Dark colours and sound. These choices are saved in `itm:prefs`.
- **Menu** holds everything: all sections, all projects, the version switch, Download my CV, accessibility, and the extras.
- Every panel closes with a big **Close** button, by tapping outside, or with Esc. While a panel is open only the panel scrolls.
- Turning the board off asks for confirmation first.

**Readability.**
- Body text is 18px with a line height of 1.6.
- A PostCSS step (`postcss.config.js`) turns every font size into rem, so the text-size control scales all text, and raises anything under 14px to 14px.
- Buttons are at least 48px tall and every tap target is at least 44×44px.
- Keyboard focus shows a thick ring.
- `npm run build` fails if any theme colour pair drops below WCAG AA (`scripts/check-contrast.mjs`).

**If something fails.**
- No WebGL: the Simple View opens with a short explanation.
- If the 3D scene crashes, a plain message offers **Try again** or **Use the simple version**.
- Unknown links show a friendly "Page not found" page.

### Extras (optional, never needed)

Two labelled buttons sit in a free corner of the screen: **Things to try 3/15** and **Terminal**. In the 3D version they are bottom right on wider screens. In the Simple View they are bottom left on very wide screens. They are also in **Menu → Extras, just for fun** and in a "Just for fun" box at the end of both versions.

- **Things to try** is a checklist of 15 fun things to do on the site, each with a plain "how to do it" line, a Done / Not yet stamp and, where useful, a **Take me there** button. 3D-only items say so in the Simple View.
  - The three **secret** ones (the Konami code, the mystery chip, `sudo` in the terminal) show only a gentle **clue**. A **Show a bigger hint** button reveals the exact steps for anyone who gets stuck.
  - All wording, clues and answers are in `ui.extras.items` in `src/content/uiStrings.ts`. Reorder, reword or remove items there.
  - Progress is saved in `localStorage` (`itm:achievements`).
- **Terminal** (or <kbd>`</kbd>): type commands like on an old computer. A row of **tap to run** buttons (help, about, projects, contact, todo) means nobody has to know what to type.
  - `todo` lists the checklist with clues. `hint <name>` (for example `hint chip`) prints the exact answer for a secret.
  - Tab completes and ↑/↓ recall history.
- <kbd>Ctrl/⌘ K</kbd> opens search (also in **Menu → Search the site**).
- Things to find on the board:
  - Click the board: a signal runs out through the copper from where you clicked.
  - Throw the loose screws. Drag a plug into its port. Click a fan to spin it up.
  - In About, open "Just for fun: overclock the processor" and press and hold. Holding the CPU on the board does the same.
  - The mystery chip is in the far back-right corner of the board. It has an invisible, larger click area so it's fair to hit.
- Turn the board off at the very end. It asks first.
