# Inside the Machine

A 3D portfolio laid out on a circuit board sitting on a workbench under a desk lamp. It starts at a power switch, boots like a BIOS, then the camera moves across the board on a slider rig, past the CPU, RAM, drives and data bus to the network port. Each part of the board is one portfolio section.

Every 3D object is built in code: geometry, instancing, GLSL shaders and canvas textures. There are no model, texture, HDR or audio files, so the 3D scene works offline. The only network requests are for Google Fonts, and the page falls back to system fonts if those fail.

**Stack:** Vite · React 18 · TypeScript · React Three Fiber · drei · @react-three/postprocessing · three · GSAP (ScrollTrigger + ScrollTo) · Zustand · Tailwind CSS · Web Audio API.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Requires Node 18+.

---

## Replace the content

**All personal content lives in [`src/content/siteContent.ts`](src/content/siteContent.ts).** The 3D scene, the HTML panels, the terminal, the command palette and the Simple View all read from it. Nothing personal is hardcoded anywhere else. A comment at the top of the file explains every field.

| Field | Where it shows up |
|---|---|
| `person` | Hero title, navbar logo, BIOS log, CPU heat-spreader label, footer |
| `about.intro` / `about.facts` | About panel. Each fact (up to 8) becomes a clickable **CPU core** |
| `skills` | Each category becomes a **RAM stick** and a filter button. Each skill becomes a chip, its marking showing `level` (1–5) |
| `projects` | Each one becomes a **drive** standing in the rack, plus a datasheet panel. Optional `partNo`, `status`, `specs`, `revisions` fill the datasheet |
| `experience` | Each entry becomes a **carriage** riding the rail on the data bus, plus a timeline item |
| `contact.socials` | Each one becomes a draggable **plug** at the network port |
| `contact.formEndpoint` | Leave it empty to open a `mailto:` draft. Set it to a Formspree/Getform/API URL to POST JSON |
| `resumeUrl` | Every Resume button. Replace `public/resume.pdf` (currently a placeholder) |
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

No pure black or pure white is used anywhere. For small orange *text* on paper, the theme uses a darker `accentText` (`#B33A0C`, 5:1 contrast on bone).

### Themes

There are two, and both keep the same board:

- **Bench:** daylight. Paper UI (bone sheets with ink), a brighter lamp, a lighter bench.
- **Night shift:** a dark UI (`#1C1A17` sheets with bone text), a dimmer and warmer lamp, a near-black bench.

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
- **Buttons:** offset-shadow buttons that press down (`.btn`, `.btn-solid`, `.btn-quiet`).
- **Projects:** open as component datasheets with a part number, a specs table, "absolute maximum ratings" for the stack, a revision history and figures. Use the optional `partNo`, `status`, `specs` and `revisions` fields in `siteContent.ts`.
- **Toasts:** small printed labels.
- **Achievements:** an inspection log with ink "PASSED" stamps.
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
- `#journey` is a tall spacer element (120vh per section, `VH_PER_SECTION` in `App.tsx`). GSAP ScrollTrigger maps its scroll progress (0–1) to `runtime.scroll` and snaps gently to the nearest station.
- Every frame the camera eases toward that value (exponential damping), so fast flicks still give a smooth flight. It then:
  - pulls back on narrow or portrait screens
  - pans so the object sits beside the HTML panel (or above the mobile bottom sheet)
  - adds mouse parallax and an idle sway
  - blends in the boot "drop" from high above the board
- With `prefers-reduced-motion`, the camera jumps straight to the active station with no flight.

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
  components/                ← DOM layer (Navbar, HUD, panels, terminal, palette, SimpleView…)
  hooks/                     ← useScrollProgress, useKeyboard, useTheme, useSound, usePerformance
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

Routing is hash-based (`#/`, `#/simple`; unknown hash routes show the kernel-panic 404), so any static host works.

**GitHub Pages (set up):** `.github/workflows/deploy.yml` builds the site and publishes `dist/` on every push to `main`. The repo is `78cxrlos/78cxrlos.github.io`, so the site is served at **https://78cxrlos.github.io/**.

- One-time setup: in the repo, go to **Settings → Pages → Source: GitHub Actions**.
- To host from a project repo instead (`https://78cxrlos.github.io/<repo>/`), set `base: '/<repo>/'` in `vite.config.ts`, change `resumeUrl` to `'resume.pdf'`, and update the absolute `og:image` / `og:url` in `index.html`.

**Vercel / Netlify:** import the repo. `vercel.json` and `netlify.toml` are included (build `npm run build`, output `dist`).

Share `https://78cxrlos.github.io/#/simple` with recruiters for the fast plain version.

---

## Things to try

- Press SW1 or hit <kbd>Enter</kbd> to boot. Skip is top right, or press <kbd>Esc</kbd>.
- Scroll, use <kbd>↑</kbd>/<kbd>↓</kbd>, or click the reference designators on the rail.
- <kbd>Ctrl/⌘ K</kbd> opens the index (fuzzy search). <kbd>`</kbd> opens the terminal (Tab completes, ↑/↓ for history).
- Click the board: a signal edge runs out through the copper from where you clicked.
- Throw the loose screws.
- Click a CPU core. Hold the CPU until it throttles. Watch the red fault LED and the fan.
- Hover chips on the RAM sticks. Filter by area and the other sticks reseat themselves.
- Hover a drive to lift it out of the rack, click it for its datasheet. Hover a carriage on the rail to stop it.
- Drag a plug into its port and watch the jack's link LEDs come on. Click a fan to spin it up and watch it coast down.
- Switch between Bench and Night shift. Turn the sound on for clicks, relays and fan hum.
- Easter eggs: the Konami code, an unmarked chip in a far corner of the board, and `sudo` in the terminal.
- Power off at the very end.
