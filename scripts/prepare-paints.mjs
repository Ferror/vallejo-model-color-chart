/**
 * Build public/data/paints.csv from the Vallejo Model Color catalog.
 * Source: https://github.com/Ferror/vallejo-model-color-data
 * Generated paints.csv is not committed.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceUrl =
  'https://raw.githubusercontent.com/Ferror/vallejo-model-color-data/master/vallejo-model-color-all-paints.csv';
const outDir = path.join(root, 'public', 'data');
const outPath = path.join(outDir, 'paints.csv');

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\r') {
      cells.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Failed to fetch catalog (${response.status}): ${sourceUrl}`);
}
const text = await response.text();
const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
if (lines.length < 2) {
  throw new Error(`Catalog empty or missing header: ${sourceUrl}`);
}

const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
const keep = ['number', 'english_name', 'spanish_name', 'rgb'];
const indexes = keep.map((col) => header.indexOf(col));
const missing = keep.filter((_, i) => indexes[i] === -1);
if (missing.length) {
  throw new Error(`Catalog missing columns: ${missing.join(', ')}`);
}

const outLines = [keep.join(',')];
for (let i = 1; i < lines.length; i += 1) {
  const cells = parseCsvLine(lines[i]);
  const row = indexes.map((idx) => escapeCsvCell((cells[idx] ?? '').trim()));
  outLines.push(row.join(','));
}

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${outLines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outLines.length - 1} paints → ${path.relative(root, outPath)}`);
