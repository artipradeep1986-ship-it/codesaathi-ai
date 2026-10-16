import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

const resDir = path.resolve('android/app/src/main/res');

for (const { folder, size } of sizes) {
  const targetDir = path.join(resDir, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const resvg = new Resvg(svgBuffer, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), pngBuffer);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), pngBuffer);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), pngBuffer);

  console.log(`Generated ${size}x${size} icons for ${folder}`);
}

console.log('All CodeSaathi AI mobile icons generated successfully!');
