// Renders the Ironwood Roasters brand assets from the cropped emblem.
// Run: node .brand/build-assets.mjs   (from the repo root)
//
// Source: .brand/_emblem-crop.png — the top-left "emblem/badge" cell cropped out
// of the Gemini logo sheet (a near-black seal on cream). This script:
//   1. lifts the cream background to transparency (keeps the dark linework),
//   2. tints the linework to Ironwood's dark-roast brown (#1f130b),
//   3. renders the favicon / PWA / apple-touch set + a 1200x630 OG share card.
//
// Two emblem renders are produced: a transparent one (for icons that sit on the
// dark header / cream footer) and a cream-disc one (for the OG card + apple
// touch icon, which want an opaque tile).
import sharp from "sharp";
import { readFileSync } from "node:fs";

const BROWN     = { r: 0x1f, g: 0x13, b: 0x0b }; // #1f130b dark roast — the emblem ink
const CREAM_RGB = { r: 0xfa, g: 0xf2, b: 0xe9 }; // #faf2e9 cream — emblem on dark
const CREAM  = "#faf2e9";                      // warm cream background
const BURNT  = "#bf5a2e";                      // burnt orange accent
const BRASS  = "#caa15e";                      // warm brass

const SRC = ".brand/_emblem-crop.png";

// ── 1. Build a transparent, brand-brown emblem from the crop ──────────────
// The crop is dark line-art on cream. Use the image's own luminance as an alpha
// mask: dark ink → opaque, cream → transparent. Then flood the visible pixels
// with the brown so the whole mark is exactly #1f130b.
// Emblem as transparent line-art in an arbitrary ink colour. The source crop is
// dark ink on cream; luminance → alpha (ink opaque, cream transparent), then a
// solid ink plate is masked by it. `ink` is an {r,g,b}. Used for both the cream
// on-dark mark and the brown on-light mark.
async function emblem(px, ink) {
  const base = await sharp(SRC).resize(px, px, { fit: "contain", background: CREAM }).toBuffer();
  const alpha = await sharp(base)
    .greyscale()
    .threshold(190)            // ink → 0 (black), cream → 255 (white)
    .negate()                  // ink → 255 (opaque), cream → 0 (transparent)
    .raw()
    .toBuffer();
  return sharp({
    create: { width: px, height: px, channels: 3, background: ink },
  })
    .joinChannel(alpha, { raw: { width: px, height: px, channels: 1 } })
    .png()
    .toBuffer();
}

const brownEmblem = (px) => emblem(px, BROWN);       // on light surfaces
const creamEmblem = (px) => emblem(px, CREAM_RGB);   // on the dark header/footer

// ── 2. Emblem on a cream disc (opaque tile for apple-touch + OG) ──────────
async function creamTile(px) {
  const emblem = await brownEmblem(Math.round(px * 0.86));
  const pad = Math.round((px - Math.round(px * 0.86)) / 2);
  return sharp({
    create: { width: px, height: px, channels: 4, background: CREAM },
  })
    .composite([{ input: emblem, left: pad, top: pad }])
    .png()
    .toBuffer();
}

const out = [];

// ── Favicons / PWA / Apple touch ──────────────────────────────────────────
// SVG favicon: not vector (source is raster), but a PNG-in-SVG keeps the <link>
// rel="icon" type="image/svg+xml" slot filled with a crisp scalable-ish mark.
await sharp(await brownEmblem(64)).resize(32, 32).webp({ quality: 92 }).toFile("public/favicon-32.webp"); out.push("favicon-32.webp");
await sharp(await brownEmblem(192)).webp({ quality: 90 }).toFile("public/icon-192.webp"); out.push("icon-192.webp");
await sharp(await brownEmblem(512)).webp({ quality: 90 }).toFile("public/icon-512.webp"); out.push("icon-512.webp");
await sharp(await brownEmblem(512)).png().toFile("public/icon-512.png"); out.push("icon-512.png");
// Apple touch icon wants an opaque PNG (iOS adds its own rounding).
await sharp(await creamTile(180)).png().toFile("public/apple-touch-icon.png"); out.push("apple-touch-icon.png");

// ── OG / social share card, 1200x630 ──────────────────────────────────────
// Emblem left, wordmark + tagline right, meta strip + CONCEPT BUILD tag at foot.
// Text drawn as SVG (no browser) so faces fall back to generic serif/sans —
// fine for a raster share card.
// Emblem sits in the upper-left; wordmark + location to its right on the same
// baseline band; tagline spans the full width BELOW the emblem so nothing
// overlaps; meta strip at the foot.
const OG_EMBLEM = 232;
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <text x="392" y="212" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#1f130b">Ironwood Roasters</text>
  <text x="396" y="256" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" letter-spacing="5.5" fill="${BURNT}">ASHEVILLE · NORTH CAROLINA</text>
  <text x="100" y="428" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#1f130b">Small-batch coffee, roasted a few blocks from where you drink it.</text>
  <rect x="100" y="498" width="1000" height="1.6" fill="${BURNT}" opacity=".35"/>
  <text x="100" y="546" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="3.2" fill="${BURNT}">ROASTED ON ROBERTS STREET · SINCE 2014</text>
  <text x="1100" y="546" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="3.2" fill="${BRASS}">CONCEPT BUILD</text>
</svg>`;
const emblemForOg = await brownEmblem(OG_EMBLEM);
const cardBuf = await sharp(Buffer.from(card), { density: 150 }).resize(1200, 630).png().toBuffer();
const ogComposed = await sharp(cardBuf)
  .composite([{ input: emblemForOg, left: 100, top: 96 }])
  .toBuffer();
await sharp(ogComposed).png().toFile("public/og-image.png"); out.push("og-image.png");
await sharp(ogComposed).webp({ quality: 88 }).toFile("public/og-image.webp"); out.push("og-image.webp");

// ── On-site marks (header + footer are BOTH --color-dark, so the site mark is
//    the CREAM colourway). A brown copy is kept for any light-surface use. ──
await sharp(await creamEmblem(512)).png().toFile("public/emblem-cream.png"); out.push("public/emblem-cream.png");
await sharp(await brownEmblem(512)).png().toFile("public/emblem-brown.png"); out.push("public/emblem-brown.png");
// `emblem.png` = the default site mark (cream, for the dark header/footer).
await sharp(await creamEmblem(512)).png().toFile("public/emblem.png"); out.push("public/emblem.png");
await sharp(await creamEmblem(512)).png().toFile(".brand/emblem.png"); out.push(".brand/emblem.png");

console.log("wrote:", out.join(", "));
