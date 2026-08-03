import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D6A4F"/>
      <stop offset="50%" stop-color="#40916C"/>
      <stop offset="100%" stop-color="#95D5B2"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 120 C256 120 200 180 200 240 C200 280 224 300 256 300 C288 300 312 280 312 240 C312 180 256 120 256 120Z"/>
    <path d="M256 300 L256 380"/>
    <path d="M220 380 L292 380"/>
    <path d="M180 200 Q256 160 332 200"/>
  </g>
</svg>
`;

async function generateIcons() {
  const iconsDir = join(process.cwd(), "public", "icons");
  await mkdir(iconsDir, { recursive: true });

  const buffer = Buffer.from(svg);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of sizes) {
    const png = await sharp(buffer).resize(size, size).png().toBuffer();
    await writeFile(join(iconsDir, name), png);
  }

  await writeFile(join(iconsDir, "icon.svg"), svg.trim());
  console.log("PWA icons generated.");
}

generateIcons().catch((error) => {
  console.error(error);
  process.exit(1);
});
