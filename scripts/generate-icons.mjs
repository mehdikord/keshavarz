/**
 * Generates every PWA raster asset from the app's sprout mark:
 *   - manifest icons (`any` + `maskable`), Apple touch icon, favicon.ico
 *   - monochrome notification badge, app-shortcut icons
 *   - iOS launch screens (apple-touch-startup-image) for every supported device
 *
 * Run: npm run generate:icons
 */
import sharp from "sharp";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const ICONS_DIR = join(ROOT, "public", "icons");
const SHORTCUTS_DIR = join(ICONS_DIR, "shortcuts");
const SPLASH_DIR = join(ROOT, "public", "splash");

/** Brand palette — mirrors `AppSplash` / `SproutMark`. */
const C = {
  deep: "#071d14",
  forest: "#0f3324",
  moss: "#1f5a40",
  stem: "#d8f3dc",
  leaf: "#74c69d",
  leafAlt: "#b7e4c7",
  soil: "rgba(216,243,220,0.25)",
  glow: "rgba(255,214,140,0.16)",
};

/**
 * Static sprout from `SproutMark` (viewBox 0 0 120 120). Its visible bounds are
 * x 30–90, y 32–99, so it is re-centred on (60, 65.5) before scaling.
 */
function sprout({ cx, cy, scale, mono = false }) {
  const stem = mono ? "#fff" : C.stem;
  const leaf = mono ? "#fff" : C.leaf;
  const leafAlt = mono ? "#fff" : C.leafAlt;
  // The soil shadow reads as a solid blob in a one-colour silhouette.
  const soil = mono ? "" : `<ellipse cx="60" cy="94" rx="30" ry="5" fill="${C.soil}"/>`;
  return `
  <g transform="translate(${cx} ${cy}) scale(${scale}) translate(-60 -65.5)">
    ${soil}
    <path d="M60 92 C 60 78 59 66 60 48" fill="none" stroke="${stem}" stroke-width="5" stroke-linecap="round"/>
    <path d="M59.5 68 C 46 67 37 57 38 44 C 51 45 59.5 54 59.5 68Z" fill="${leaf}"/>
    <path d="M60.5 58 C 74 57 83 46 82 32 C 69 34 60.5 43 60.5 58Z" fill="${leafAlt}"/>
  </g>`;
}

/** Deep-field background with the warm sunrise glow used across the heroes. */
function field(size, { rx = 0 } = {}) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${C.moss}"/>
      <stop offset="0.55" stop-color="${C.forest}"/>
      <stop offset="1" stop-color="${C.deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.55">
      <stop offset="0" stop-color="${C.glow}"/>
      <stop offset="1" stop-color="rgba(255,214,140,0)"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#glow)"/>`;
}

function svgDoc(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

/** `any` icon: rounded tile, mark at ~60% height. */
function anyIconSvg(size = 512) {
  const s = size / 512;
  return svgDoc(size, size, field(size, { rx: 112 * s }) + sprout({ cx: size / 2, cy: size * 0.51, scale: 4.5 * s }));
}

/**
 * `maskable` icon: full-bleed, mark inside the 80% safe-zone circle so any
 * launcher mask (circle, squircle, teardrop) keeps it intact.
 */
function maskableIconSvg(size) {
  const s = size / 512;
  return svgDoc(size, size, field(size) + sprout({ cx: size / 2, cy: size * 0.51, scale: 3.6 * s }));
}

/** Apple touch icon: opaque full-bleed square — iOS applies its own corner mask. */
function appleIconSvg(size = 180) {
  const s = size / 180;
  return svgDoc(size, size, field(size) + sprout({ cx: size / 2, cy: size * 0.51, scale: 1.55 * s }));
}

/** Android status-bar badge: white silhouette on transparent (system tints it). */
function badgeSvg(size = 96) {
  return svgDoc(size, size, sprout({ cx: size / 2, cy: size / 2, scale: (size * 0.8) / 67, mono: true }));
}

/** Lucide glyphs (24×24, stroke) used for manifest shortcuts. */
const SHORTCUT_GLYPHS = {
  search: `<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`,
  requests: `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
  inbox: `<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,
  dashboard: `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`,
};

function shortcutSvg(glyph, size = 192) {
  const glyphSize = size * 0.46;
  const offset = (size - glyphSize) / 2;
  return svgDoc(
    size,
    size,
    field(size) +
      `<g transform="translate(${offset} ${offset}) scale(${glyphSize / 24})" fill="none" stroke="${C.stem}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`,
  );
}

/**
 * iOS launch screen: matches the first frame of `AppSplash` (the same radial
 * field, before the sprout grows in) so cold start hands off without a flash.
 */
function splashSvg(width, height) {
  const cx = width / 2;
  const cy = height * 0.3;
  return svgDoc(
    width,
    height,
    `<defs>
      <radialGradient id="bg" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1"
        gradientTransform="translate(${cx} ${cy}) scale(${width * 1.2} ${height * 0.8})">
        <stop offset="0" stop-color="${C.moss}"/>
        <stop offset="0.55" stop-color="${C.forest}"/>
        <stop offset="1" stop-color="${C.deep}"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>`,
  );
}

const png = (svg, size) => {
  const image = sharp(Buffer.from(svg));
  return (size ? image.resize(size, size) : image).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
};

/** Packs PNG frames into a multi-resolution .ico (PNG-compressed entries). */
function toIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const entries = [];
  let offset = 6 + frames.length * 16;
  for (const { size, data } of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

async function generate() {
  await rm(SPLASH_DIR, { recursive: true, force: true });
  await Promise.all([mkdir(SHORTCUTS_DIR, { recursive: true }), mkdir(SPLASH_DIR, { recursive: true })]);

  const anySvg = anyIconSvg(512);
  await writeFile(join(ICONS_DIR, "icon.svg"), anySvg);
  await writeFile(join(ICONS_DIR, "icon-192.png"), await png(anySvg, 192));
  await writeFile(join(ICONS_DIR, "icon-512.png"), await png(anySvg, 512));
  await writeFile(join(ICONS_DIR, "icon-maskable-192.png"), await png(maskableIconSvg(192)));
  await writeFile(join(ICONS_DIR, "icon-maskable-512.png"), await png(maskableIconSvg(512)));
  await writeFile(join(ICONS_DIR, "apple-touch-icon.png"), await png(appleIconSvg(180)));
  await writeFile(join(ICONS_DIR, "badge-96.png"), await png(badgeSvg(96)));

  const favicon = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(anySvg, size) })));
  await writeFile(join(ROOT, "src", "app", "favicon.ico"), toIco(favicon));

  for (const [name, glyph] of Object.entries(SHORTCUT_GLYPHS)) {
    await writeFile(join(SHORTCUTS_DIR, `${name}.png`), await png(shortcutSvg(glyph)));
  }

  const screens = JSON.parse(await readFile(join(ROOT, "src", "lib", "pwa", "apple-splash-screens.json"), "utf8"));
  const seen = new Set();
  for (const { width, height, ratio } of screens) {
    const w = width * ratio;
    const h = height * ratio;
    for (const [pw, ph] of [
      [w, h],
      [h, w],
    ]) {
      const file = `apple-splash-${pw}x${ph}.png`;
      if (seen.has(file)) continue;
      seen.add(file);
      await writeFile(join(SPLASH_DIR, file), await png(splashSvg(pw, ph)));
    }
  }

  console.log(`PWA assets generated: 7 icons, favicon.ico, ${Object.keys(SHORTCUT_GLYPHS).length} shortcuts, ${seen.size} launch screens.`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
