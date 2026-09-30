This is a second pass on the existing Criminal Record Management System app. Do NOT rewrite the backend, schema, API, or data logic. Only the visual layer and one new page change.

This prompt OVERRIDES the "Visual design (strict)" section of the original prompt. The new direction is a case-file / detective-bureau aesthetic: physical evidence, paper, stamps, and an investigation board. It should look designed and tasteful, not like a Halloween template.

## Theme: "Case File"
- Palette (light default): warm paper background (#EFE9DC), manila folder surfaces (#F6F0E0), ink (#1F1F1F), muted navy (#1F2D3D) for the sidebar and top bar, stamp red (#B3261E) as the accent, brass/amber (#B08D3C) for small highlights. Dark theme: charcoal (#16181C) with the same accents, desaturated.
- Paper feel via CSS only: subtle noise using an inline SVG feTurbulence data URI at low opacity, faint ruled lines or grid on the page background, slight paper-edge borders. No external image assets, no stock photos.
- Typography: headings and stamps in "Special Elite" or "Courier Prime" (typewriter), body in Inter, IDs and SQL in monospace. Load from Google Fonts with system fallbacks.
- Sidebar: navy, styled like a filing cabinet index. Nav items look like folder tabs. Add a small badge/shield logo drawn in inline SVG with the app name "Criminal Records Bureau".
- Cards look like case folders: manila color, a folder tab on the top-left showing the record type and ID ("CASE No. 201"), paper clips drawn in SVG, slight 0.5 to 1 degree rotations on dashboard cards only.
- Status badges become rubber stamps: uppercase, typewriter font, double border, slight rotation, slightly distressed opacity. OPEN (blue-ink), UNDER INVESTIGATION (amber), CLOSED (red). Add a "CLASSIFIED" or "CONFIDENTIAL" stamp on the profile page header.
- Criminal profile: layout like a police dossier. A mugshot placeholder frame (SVG silhouette plus initials, with a height-chart ruler graphic behind it, no real faces), a paper-clipped record sheet, evidence-tag styled fields (tag shape with a punch hole), and "REDACTED" black bars over the phone/address fields of the investigating officer that reveal on hover/focus.
- Empty states: "No records on file" with a small illustrated empty folder. Loading state: a thin police-light bar (red/blue alternating) under the top bar.
- Decorative extras, sparingly: evidence-bag style tags, tape strips on cards, fingerprint SVG as a faint watermark in page corners (5% opacity), caution-tape stripe used ONLY on destructive confirm dialogs, footers styled as "FORM CRB-01".

## New page: Case Board (investigation board)
Route /board, added to the sidebar.
- Corkboard background (CSS only: warm brown with noise texture, inset border like a wooden frame).
- Each criminal is a pinned card (photo-style polaroid with silhouette and initials, name, ID, crime), slightly rotated, with a push pin drawn in SVG.
- Connected by red string (SVG paths with a small sag curve) to: the investigating officer card, the court room note (yellow sticky note: "Court Room 3"), and the jail tag (index card: "Taloja Jail, Barrack 12, 3 Years"). Data comes from the existing API joins. No hardcoded nodes.
- Cards are draggable (framer-motion drag), and the strings follow in real time. Positions persist in localStorage.
- Click a card to highlight its whole chain (other strings/cards dim) and open a side panel with details and a link to the full profile.
- Filters at the top: by officer, by status, by jail location. A "Reset layout" button auto-arranges cards in a tidy grid by officer.
- Officers with zero cases show as a card with no strings. Criminals with no court/jail show a dashed empty note slot ("No court record").
- Must stay usable with 50+ criminals: pan/zoom the board (wheel + drag on background), and a minimap is not required.

## Animations (framer-motion, purposeful, 150 to 600ms)
- Page transitions: paper slides in with a slight fade and 8px translate.
- Stamps: when a status badge first appears or changes, animate a stamp slam (scale 1.6 -> 1, opacity 0 -> 1, tiny rotation settle). Play once, not on every re-render.
- Dashboard: numbers count up once on load. Bar chart bars grow from zero. Cards drop in with a staggered slight settle.
- Pushpin drop and string draw-in (stroke-dashoffset) when the Case Board loads.
- Folder tabs and sidebar items: quick hover lift/underline, and an active-tab slide.
- Typewriter effect on the profile page name/ID line, once.
- Table rows: short stagger on first load only. Do not re-animate on sort/filter/pagination.
- Drawer: slides like a sheet of paper. Delete confirm: caution-tape header slides in.
- Redacted bars: wipe reveal on hover.
- Respect prefers-reduced-motion: disable all of the above except opacity fades. Add a manual "Reduce motion" toggle in the top bar.
- No parallax, no looping background animation, no particle effects, no scroll-jacking, no glow, no neon, no gradient text.

## Hard constraints
- Data tables, forms, Query Explorer, SQL console, and Schema page must stay dense, readable, and fast. Theme them (paper colors, typewriter headings, folder tabs) but do not put decorative elements inside table cells or over SQL blocks. SQL blocks stay monospace on a plain light/dark surface.
- Text contrast must meet WCAG AA on paper backgrounds. Stamps and decor never carry information that isn't also in text.
- No emojis. No cartoon cops or gun imagery. No blood, no chalk-outline bodies. Keep it a records bureau, not a crime scene.
- No real photos or external images. All illustrations are inline SVG or CSS.
- Do not break any existing functionality. After the pass, re-verify all 10 queries in Query Explorer still return the same results, CRUD still works, and the build has zero console errors.
- Keep components reusable: add Stamp, FolderCard, EvidenceTag, Redacted, PushPin, and CaseBoard components. Put theme tokens in one place (tailwind config + CSS variables).