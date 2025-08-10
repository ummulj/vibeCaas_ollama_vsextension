#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  const svgPath = path.resolve(__dirname, '../media/icon.svg');
  const outPng = path.resolve(__dirname, '../media/icon.png');
  const buf = fs.readFileSync(svgPath);
  await sharp(buf).png({ quality: 90 }).resize(256, 256).toFile(outPng);
  console.log('Exported', outPng);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

