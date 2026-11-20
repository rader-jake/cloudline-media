// Generates web-ready brand + placeholder media from the files in /assets-src.
// Run with: npm run images
// Replace the placeholder media in /public/media with real Cloudline footage/stills
// whenever it's available (see README → "Replacing media").
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/brand", { recursive: true });
mkdirSync("public/media", { recursive: true });

const LOGO = "assets-src/logo-original.webp";

/**
 * Converts the logo (dark ink on white) into a transparent version for dark backgrounds:
 * white background -> transparent, black ink -> white, blue gradient -> bright sky blue.
 */
async function logoForDark(input, output, extract) {
  let img = sharp(input);
  if (extract) img = img.extract(extract);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const a = data[i * 4 + 3];
    // source may be transparent already; otherwise derive alpha from whiteness
    const alpha = a < 255 ? a : 255 - min;
    // smooth blend: neutral ink -> white, brand blue -> bright sky blue
    const t = Math.max(0, Math.min(1, (b - r - 20) / 120));
    const R = Math.round(255 + (70 - 255) * t);
    const G = Math.round(255 + (185 - 255) * t);
    const B = 255;
    out[i * 4] = R; out[i * 4 + 1] = G; out[i * 4 + 2] = B;
    out[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(a < 255 ? alpha : alpha * 1.15)));
  }
  const rawPng = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await sharp(rawPng)
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

// Full logo, light-on-dark (nav/footer)
await logoForDark(LOGO, "public/brand/logo-light.png", { left: 430, top: 80, width: 1150, height: 520 });
// Original logo, trimmed, for white backgrounds (emails)
const darkCrop = await sharp(LOGO).extract({ left: 430, top: 80, width: 1150, height: 520 }).png().toBuffer();
const darkTrim = await sharp(darkCrop).trim().png().toBuffer();
await sharp(darkTrim).resize({ width: 600 }).png().toFile("public/brand/logo-dark.png");
// Mark only (cloud + drone) for favicon / compact uses
await logoForDark(LOGO, "public/brand/mark-light.png", { left: 610, top: 85, width: 840, height: 280 });

// Favicon / apple icon: mark on navy square
const mark = await sharp("public/brand/mark-light.png").resize({ width: 400 }).toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#06111B" } })
  .composite([{ input: mark, gravity: "center" }])
  .png().toFile("src/app/icon.png");
await sharp("src/app/icon.png").resize(180).toFile("src/app/apple-icon.png");

// Placeholder imagery cropped from the provided brand/reference materials.
const REF = "assets-src/reference.webp";
const SKY = "assets-src/brand-sky.webp";
const crop = (src, box, out, width) =>
  sharp(src).extract(box).toBuffer().then((b) => sharp(b).resize({ width, kernel: "lanczos3" }).modulate({ saturation: 1.05 }).webp({ quality: 82 }).toFile(out));

await crop(REF, { left: 560, top: 92, width: 638, height: 360 }, "public/media/hero-estate.webp", 1600);
await crop(REF, { left: 76, top: 594, width: 506, height: 178 }, "public/media/timelapse-roof.webp", 1000);
await crop(REF, { left: 616, top: 594, width: 506, height: 178 }, "public/media/estate-aerial.webp", 1000);
await crop(REF, { left: 34, top: 1130, width: 440, height: 148 }, "public/media/drone-closeup.webp", 900);
await crop(SKY, { left: 0, top: 800, width: 1536, height: 224 }, "public/media/skyline-sunset.webp", 1920);
await crop(SKY, { left: 1100, top: 0, width: 436, height: 520 }, "public/media/sky-clouds.webp", 900);

// Social share image
const logo = await sharp("public/brand/logo-light.png").resize({ width: 760 }).toBuffer();
await sharp(SKY).resize(1200, 630, { fit: "cover", position: "bottom" }).modulate({ brightness: 0.55 })
  .composite([{ input: logo, gravity: "center" }]).jpeg({ quality: 85 }).toFile("public/og.jpg");

console.log("Images generated.");
