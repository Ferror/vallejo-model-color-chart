/**
 * Parse paints CSV. Supports either:
 *   name,rgb[,owned]
 *   number,english_name,spanish_name,rgb[,owned]
 * Owned is optional — the UI owns that state.
 * Handles quoted fields with commas.
 */

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\r') {
      cells.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseOwned(raw) {
  if (raw === undefined || raw === '') return false;
  const s = String(raw).trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return false;
}

function firstHeaderIndex(header, names) {
  for (let i = 0; i < names.length; i += 1) {
    const idx = header.indexOf(names[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * @param {string} text - full CSV text
 * @returns {{ name: string, number: string, rgb: string, owned: boolean }[]}
 */
export function parsePaintsCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = firstHeaderIndex(header, ['english_name', 'name']);
  const rgbIdx = header.indexOf('rgb');
  const ownedIdx = header.indexOf('owned');
  const numberIdx = header.indexOf('number');
  if (nameIdx === -1 || rgbIdx === -1) {
    console.warn('CSV: expected columns english_name|name, rgb');
    return [];
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const name = cells[nameIdx]?.replace(/^"|"$/g, '') ?? '';
    const number = numberIdx === -1 ? '' : (cells[numberIdx]?.replace(/^"|"$/g, '') ?? '');
    const rgb = (cells[rgbIdx] ?? '').replace(/^"|"$/g, '');
    const owned = ownedIdx === -1 ? false : parseOwned(cells[ownedIdx]);
    rows.push({ name, number, rgb, owned });
  }
  return rows;
}
