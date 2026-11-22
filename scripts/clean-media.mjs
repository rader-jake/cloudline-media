// Produces the redesign's image set from the existing illustrative media.
//   node scripts/clean-media.mjs
// - roof-clean.webp: removes the play-button icon baked into the roof crop (diffusion inpaint)
// - estate-frame.webp: tighter 3:2 frame of the estate from the full-resolution hero image
import sharp from "sharp";

async function inpaintPlayIcon(src, out, { cx, cy, rOuter, rInner }) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const px = new Float32Array(data);
  const idx = (x, y) => (y * w + x) * c;
  const lum = (i) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];

  // 1. Undo the translucent dark disc inside the ring by matching brightness to just outside it.
  let inSum = 0, inN = 0, outSum = 0, outN = 0;
  for (let y = cy - rOuter - 12; y <= cy + rOuter + 12; y++)
    for (let x = cx - rOuter - 12; x <= cx + rOuter + 12; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d > rInner - 10 && d < rInner - 3) { inSum += lum(idx(x, y)); inN++; }
      if (d > rOuter + 3 && d < rOuter + 10) { outSum += lum(idx(x, y)); outN++; }
    }
  const gain = Math.min(1.6, Math.max(1, outSum / outN / (inSum / inN)));
  for (let y = cy - rInner; y <= cy + rInner; y++)
    for (let x = cx - rInner; x <= cx + rInner; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= rInner + 2) continue;
      // soft edge so the correction doesn't leave a visible disc boundary
      const t = Math.min(1, Math.max(0, (rInner + 2 - d) / 6));
      const gi = 1 + (gain - 1) * t;
      const i = idx(x, y);
      for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, px[i + k] * gi);
    }

  // 2. Mask = the ring + bright (white) play-triangle pixels inside the disc.
  const mask = new Uint8Array(w * h);
  for (let y = cy - rOuter - 5; y <= cy + rOuter + 5; y++)
    for (let x = cx - rOuter - 5; x <= cx + rOuter + 5; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const d = Math.hypot(x - cx, y - cy);
      const i = idx(x, y);
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const whiteish = Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
      const inTriangle = x >= cx - 16 && x <= cx + 22 && y >= cy - 22 && y <= cy + 22;
      if ((d >= rInner - 3 && d <= rOuter + 4) || (d < rInner && (whiteish || inTriangle))) mask[y * w + x] = 1;
    }
  // grow mask by 2px to catch anti-aliased edges
  for (let pass = 0; pass < 2; pass++) {
    const grown = mask.slice();
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++)
        if (!mask[y * w + x] && (mask[y * w + x - 1] || mask[y * w + x + 1] || mask[(y - 1) * w + x] || mask[(y + 1) * w + x])) grown[y * w + x] = 1;
    mask.set(grown);
  }

  // 3. Diffusion inpaint: repeatedly average masked pixels from their neighbours.
  for (let iter = 0; iter < 400; iter++)
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        if (!mask[y * w + x]) continue;
        const i = idx(x, y);
        for (let k = 0; k < 3; k++)
          px[i + k] = (px[idx(x - 1, y) + k] + px[idx(x + 1, y) + k] + px[idx(x, y - 1) + k] + px[idx(x, y + 1) + k]) / 4;
      }

  // 4. Re-add fine grain over the patched area so it doesn't look smeared.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const n = rand() * 6;
      const i = idx(x, y);
      for (let k = 0; k < 3; k++) px[i + k] = Math.max(0, Math.min(255, px[i + k] + n));
    }

  await sharp(Buffer.from(Uint8ClampedArray.from(px)), { raw: { width: w, height: h, channels: c } })
    .webp({ quality: 82 })
    .toFile(out);
}

await inpaintPlayIcon("public/media/timelapse-roof.webp", "public/media/roof-clean.webp", { cx: 503, cy: 190, rOuter: 50, rInner: 44 });

await sharp("public/media/hero-estate.webp")
  .extract({ left: 260, top: 170, width: 1080, height: 720 })
  .webp({ quality: 82 })
  .toFile("public/media/estate-frame.webp");

console.log("done");
