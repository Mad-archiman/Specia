const sharp = require('sharp');
const { existsSync, renameSync } = require('fs');
const { join } = require('path');

const assetsDir = join(__dirname, '..', 'assets');
const scale = 3;

async function upscale(file) {
  const input = join(assetsDir, file);
  if (!existsSync(input)) return;
  const meta = await sharp(input).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const nw = Math.round(w * scale);
  const nh = Math.round(h * scale);
  const output = input.replace('.png', '-upscaled.png');
  await sharp(input)
    .resize(nw, nh, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(output);
  console.log(`${file}: ${w}x${h} -> ${nw}x${nh}`);
  renameSync(output, input);
  console.log('Replaced', file);
}

async function main() {
  try {
    await upscale('logo.png');
    await upscale('logo-light.png');
    console.log('Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
