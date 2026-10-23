import { writeFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

// qrcode.react emits one horizontal rectangle per run of dark modules.
export function writeQrVideo(path: string, code: string) {
  const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, {
    value: code,
    size: 320,
    marginSize: 4,
    level: 'M',
  }));
  const size = Number(svg.match(/viewBox="0 0 (\d+) \d+"/)?.[1]);
  const pathData = svg.match(/<path fill="#000000" d="([^"]+)"/)?.[1];
  if (!size || !pathData) throw new Error('Could not generate QR video fixture');

  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const runs = /M(\d+)[ ,](\d+)\s*h(\d+)v1H\d+z/g;
  let run: RegExpExecArray | null;
  let runCount = 0;
  let cursor = 0;
  while ((run = runs.exec(pathData))) {
    if (run.index !== cursor) throw new Error('Unrecognized QR module path');
    cursor = runs.lastIndex;
    const x = Number(run[1]);
    const y = Number(run[2]);
    const length = Number(run[3]);
    for (let column = x; column < x + length; column++) modules[y][column] = true;
    runCount++;
  }
  if (!runCount || cursor !== pathData.length) {
    throw new Error('Could not parse QR modules');
  }

  const width = 640;
  const height = 480;
  const scale = Math.floor(400 / size);
  const left = Math.floor((width - size * scale) / 2);
  const top = Math.floor((height - size * scale) / 2);
  const yPlane = Buffer.alloc(width * height, 235);
  for (let row = 0; row < height; row++) {
    const moduleY = Math.floor((row - top) / scale);
    if (moduleY < 0 || moduleY >= size) continue;
    for (let column = 0; column < width; column++) {
      const moduleX = Math.floor((column - left) / scale);
      if (moduleX >= 0 && moduleX < size && modules[moduleY][moduleX]) {
        yPlane[row * width + column] = 16;
      }
    }
  }
  const chroma = Buffer.alloc(width * height / 4, 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), yPlane, chroma, chroma]);
  const header = Buffer.from(`YUV4MPEG2 W${width} H${height} F15:1 Ip A1:1 C420jpeg\n`);
  writeFileSync(path, Buffer.concat([header, frame, frame, frame]));
}
