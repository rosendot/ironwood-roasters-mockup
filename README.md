# Ironwood Roasters — concept mockup

A six-page Astro site for **Ironwood Roasters**, a fictional small-batch coffee
roaster in Asheville, NC. Built by Atlas Studio as a portfolio piece — this is a
**concept build, not a client site**. No such business exists; the address,
phone, partner cafés, and testimonials are invented.

The site footer says so on every page, and links back to atlasstudio.dev.

> **No invented credentials.** Nothing here carries a license or registration
> number — a roaster needs no trade license, so the design source didn't
> generate one. Re-check with:
> `grep -rioE "licen[sc]e #|permit #|#[0-9]{5,}" --include=*.html dist/`

Ported from the Atlas Studio design system in Claude Design (project
`5b78c5e0-3edd-4692-abc2-b097220f4fd1`) and rebuilt as a real deployable Astro
project.

## Stack

- **Astro 5**, static output — no server routes, no framework islands
- Plain CSS: [`src/styles/tokens.css`](src/styles/tokens.css) (Atlas design
  tokens) + [`src/styles/ironwood.css`](src/styles/ironwood.css) (the
  burnt-sienna brand theme). Everything else reads `var(--token)`.
- One vanilla `<script>` in the layout drives every interactive piece
- Deploys to Cloudflare Pages

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview   # serve the built output
npm run deploy    # wrangler pages deploy dist
```

## Deploying

Cloudflare Pages. Connect this repo in the dashboard (**Workers & Pages** →
**Create** → **Pages** → **Connect to Git**) with framework preset **Astro**,
build command `npm run build`, output directory `dist` — then pushes to `main`
auto-deploy.

For a one-off CLI deploy instead: `wrangler login`, then `npm run deploy`.

## Pages

| Route | Sections |
|-------|----------|
| `/` | Video hero · 3 pillars · 4 category cards · process steps · logo wall · testimonials · CTA |
| `/coffee/` | Crumb bar · filterable 8-product shop grid · 2 alternating rows · CTA |
| `/wholesale/` | Crumb strip · split hero · 3 pillars · logo marquee · 3 program cards · sticky FAQ · inquiry form |
| `/our-craft/` | Crumb bar · founder spotlight · 3 craft rows · stats · 4-person team grid · CTA |
| `/journal/` | Crumb bar · 6 blog cards · CTA |
| `/visit/` | Crumb bar · Google map + details · 8-photo lightbox gallery · live hours card · quick-action bar · footer CTA |

## Images

The Claude Design source used `<image-slot>` — a drag-and-drop authoring
element backed by a sidecar file and the `window.omelette` bridge. That runtime
doesn't exist outside the design canvas, so every slot was replaced with
[`ImageSlot.astro`](src/components/ImageSlot.astro): a plain div rendering a
textured placeholder captioned with the photo that belongs there.

There are **42 slots** across the six pages. To drop in a real photo, pass
`src` (and `alt`):

```astro
<ImageSlot src="/photos/roaster.jpg" alt="The drum roaster mid-batch" />
```

The placeholder styling falls away automatically once `src` is set. Put files
in `public/` and reference them by absolute path.

The home hero slot is captioned as a **looping video** in the design. Swapping
in a real `<video>` there means editing the hero block in
[`index.astro`](src/pages/index.astro) — `ironwood.css` already styles
`.hero-video video` for it.

## Interactive pieces

All vanilla JS in one `<script>` in [`Layout.astro`](src/layouts/Layout.astro),
ported from the design's shared `ironwood.js`. Each block no-ops on pages
without its markup, so one script serves all six routes.

- **Header** — shadow on scroll, hamburger drawer under 720px
- **Announcement bar** — dismissible, remembered per visitor via `localStorage`
- **Shop filter tabs** (`/coffee/`) — filter the product grid by category
- **Sticky FAQ** (`/wholesale/`) — click a question, the answer panel updates
- **Lightbox** (`/visit/`) — click a photo, arrow keys and Escape work
- **Live hours card** (`/visit/`) — computes open/closed from the visitor's
  clock and highlights today's row
- **Logo marquee** (`/wholesale/`) — CSS animation, pauses on hover, static
  under `prefers-reduced-motion`

Both forms (wholesale inquiry, newsletter signup) carry `data-visual` and are
**demo only** — submit is prevented; there's no backend.

## Notes

- Content lives in frontmatter arrays at the top of each page, so copy edits
  don't mean touching markup.
- The partner café list is shared between the home logo wall and the wholesale
  marquee via [`src/data/wholesale-partners.ts`](src/data/wholesale-partners.ts).
- The header marks its own active tab from the current route — pages don't
  hand-mark nav links.
- Fonts are Bitter + Work Sans, loaded from Google Fonts by an `@import` in
  `ironwood.css`.
- `/visit/` embeds a real Google Maps iframe (no API key needed for the
  `?output=embed` form).
