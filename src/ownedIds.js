/**
 * Parse paint identifiers from free-form list input.
 * Accepts commas, whitespace, newlines, and optional trailing commas.
 * @param {string} text
 * @returns {string[]} unique IDs in first-seen order
 */
export function parseOwnedIdList(text) {
  if (!text || typeof text !== 'string') return [];
  const parts = text.split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < parts.length; i += 1) {
    const id = parts[i];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * @param {string} text
 * @returns {string} normalized comma-separated list for storage / textarea
 */
export function formatOwnedIdList(text) {
  return parseOwnedIdList(text).join(', ');
}
