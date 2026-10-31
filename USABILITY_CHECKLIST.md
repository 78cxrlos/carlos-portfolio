# Usability checklist

Ten tasks a first-time visitor should complete **without help**, on a phone or a computer, in either version. Each task lists the route a newcomer would take and where it lives in the code. After it comes what could still confuse someone.

Try these with a real person who has never seen the site. Give them the task only, not the steps, and note where they hesitate.

---

## The 5-second test

Can someone who has never used a 3D website tell, within 5 seconds…

| Question | Answer on screen | Where |
|---|---|---|
| **What is this site?** | The welcome screen shows the name, the words "Welcome to my portfolio" and one plain sentence about the work. | `Welcome.tsx`, `person.plainIntro` |
| **Where do I click next?** | Two big buttons, each with a one-line description, and "Not sure? Choose Simple." In the 3D version, a dark **Next: About** button sits bottom right and the tour points at it. | `Welcome.tsx`, `HUD.tsx`, `Help.tsx` (Tour) |
| **How do I get out?** | **Home** (top left) and **Back to top** are always there. **Simple version** is always in the top bar. Every panel has a big **Close** button. | `Navbar.tsx`, `HUD.tsx`, `Dialog.tsx` |

---

## The 10 tasks

### 1. Find out who this person is and what they do
- **Route:** the welcome screen (name and one sentence). Then the Home panel or the top of the Simple View (role, location, status).
- **Code:** `Welcome.tsx`, `SectionPanels.tsx` → `Hero`, `SimpleView.tsx` (`#sv-hero`).
- **Could still confuse:** the content still contains `[check]` placeholders that visitors can see, for example "Nairobi, Kenya [check]". **Remove these from `siteContent.ts` before publishing.**

### 2. Find the contact details (email address)
- **Route:** **Contact** in the top menu (or **Menu → Contact**), or **Contact me** on the Home panel. The address is shown as text with a **Copy** button, and "Copied! You can now paste it…" appears under it.
- **Code:** `ContactBlock.tsx` (`ContactButtons`, `EmailCopy`).
- **Could still confuse:** the **Call** and **WhatsApp** buttons stay hidden until `contact.phone` and `contact.whatsapp` are filled in.

### 3. Send a message
- **Route:** Contact → "Or send me a message here". The form has three labelled boxes and a **Send message** button. Each empty or wrong box gets one plain error under it, and a visible thank-you replaces the form.
- **Code:** `ContactForm.tsx`, wording in `uiStrings.ts → form`.
- **Could still confuse:** `contact.formEndpoint` is empty, so **Send message** opens the visitor's email app instead of sending. The form says so before you press it. Someone without a mail app set up will see nothing happen. **Set `formEndpoint` (e.g. Formspree) to fix this.**

### 4. Open a project and read about it
- **Route:** **Projects** in the top menu, or **Menu → All projects**. Every project is listed with a **See this project** button. The panel has **Previous project / Next project** and a big **Close**. In 3D you can also click a drive, which shows a "Click a drive to see a project" label the first time and a tooltip with the project name on hover.
- **Code:** `SectionPanels.tsx` → `Projects`, `SimpleView.tsx` (`#sv-projects`), `ProjectPanel.tsx`, `scene/Storage.tsx`.
- **Could still confuse:** no project has screenshots yet, so each panel shows "Screenshot coming soon" boxes, which can look unfinished. Add images to `gallery`.

### 5. Read the skills
- **Route:** **Skills** in the top menu. Every skill is listed with filled squares *and* the words "4 of 5". A sentence explains the scale. The **Show skills for** buttons filter the list.
- **Code:** `SectionPanels.tsx` → `Skills`, `SimpleView.tsx` (`#sv-skills`).
- **Could still confuse:** nothing known.

### 6. See work experience
- **Route:** **Experience** in the top menu. Every job and school entry is shown in full: dates, title, place, summary and highlights. Nothing is hidden behind hover any more.
- **Code:** `SectionPanels.tsx` → `Experience`, `SimpleView.tsx` (`#sv-experience`).
- **Could still confuse:** nothing known.

### 7. Download the CV
- **Route:** **Menu → Download my CV**. It is also on the Home panel, the end panel and in the Simple View's header buttons and footer, and in the top bar on very wide screens.
- **Code:** `Navbar.tsx` → `CvLink`.
- **Could still confuse:** `public/resume.pdf` is still a placeholder. Replace it.

### 8. Switch to the simple version (and back)
- **Route:** **Simple version** in the top bar (on phones the button says **Simple**), the welcome screen, **Help**, **Menu → Version**, or **Use the simple version instead** while loading. To go back: **3D version** in the top bar, or the "Want to explore?" box at the end of the Simple View. The choice is remembered.
- **Code:** `Navbar.tsx` → `ViewSwitch`, `store/useStore.ts` (`setSimpleView`, `itm:view`).
- **Could still confuse:** on narrow phones the top-bar buttons are shortened to **Simple** / **3D**. They are explained on the welcome screen and in the tour, and the full wording is in the Menu.

### 9. Make the text bigger (or the colours stronger)
- **Route:** **Accessibility** in the top bar (on phones: **Menu → Accessibility**). **A+** makes text larger, **A** resets it and **A-** makes it smaller. **High contrast** and **Reduce motion** are on/off switches with words. Choices are saved on this device.
- **Code:** `Settings.tsx`, `hooks/useTheme.ts` (applies the root font size and `data-contrast`), `postcss.config.js` (all font sizes in rem, 14px minimum).
- **Could still confuse:** on phones the Accessibility controls are inside **Menu**, not in the top bar, because the bar has no room. They sit under a clear "Accessibility" heading.

### 10. Go back to the start
- **Route:** **Home** (the name or initials, top left) at all times. **Back to top** is in the 3D bottom bar, and the last **Next** button becomes **Back to top**. In the Simple View, a floating **Back to top** button appears after you scroll and there is another in the footer.
- **Code:** `lib/navigation.ts` → `goHome`, `HUD.tsx`, `SimpleView.tsx` → `BackToTop`.
- **Could still confuse:** nothing known.

---

## Bonus: find the fun extras

- **Route:** the **Things to try** and **Terminal** buttons in a corner of the screen, the "Just for fun" box at the end of the page, or **Menu → Extras, just for fun**. Each item in Things to try says how to do it. Secret items give a clue first, with **Show a bigger hint** for the exact steps. In the terminal, tap a command instead of typing, or type `todo` for the list.
- **Code:** `Extras.tsx`, `Achievements.tsx`, `Terminal.tsx`, wording in `uiStrings.ts → extras`.
- **Could still confuse:** below 900px wide in the 3D version (and below 1320px in the Simple View) the corner buttons are hidden to keep the text clear. The same buttons are in the Menu and in the "Just for fun" box at the end.

## Other places that could still confuse someone

- **3D on phones.** The text panel and the bottom bar leave a small window onto the board. **Hide the text to see the board ↓** helps. Phones are steered to the Simple View, which is the better experience there.
- **Keyboard in 3D.** The arrow keys move between sections. When focus is inside a text panel, they scroll the panel instead. This is listed in **Help → With a keyboard**.
- **Screen readers.** The 3D view only puts the current section's panel on the page. The Simple View has every section at once with proper headings, tables and landmarks, so it is the recommended version for screen-reader users.
- **The welcome screen has no Close button.** This is on purpose: it is a choice, not a pop-up. Either button gets you in, and the choice is remembered.
- **Slow devices.** A weak device may still choose the 3D version and find it sluggish. The top-bar switch is always one tap away.

---

## Automated checks (run on 31 Oct 2026)

- **axe-core 4.11** (WCAG 2.0/2.1/2.2 A and AA plus best practices) was run in Chrome on 15 screens: the welcome screen (desktop and phone), the Simple View (normal, large text with high contrast, and phone), the Accessibility popover, Menu, the project panel, Help, both tours, the loading screen, 3D Home, 3D Projects, 3D Contact and the 404 page. **Result: 0 violations.**
- **Tap targets:** every visible button and link in the Simple View is at least 44×44px.
- **Phone layout:** at 375×667 (portrait) and 667×375 (landscape) there is no horizontal scrolling.
- **Next-only walk:** pressing only **Next section** in the 3D version visits all 7 sections in order and ends with **Back to top**.
- **Contrast:** `npm run check:contrast` checks 33 colour pairs, covering both themes in normal and high-contrast mode plus the fixed board, terminal and start-up colours. **All pass WCAG AA** (4.5:1 for text, 3:1 for focus rings). It runs before every `npm run build`.
- **Timing:** on a real GPU (Intel Iris Plus, dev server) the 3D version loaded in about 4.7 s and the start-up animation took about 3.5 s.
