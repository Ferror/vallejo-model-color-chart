/**
 * RGB (0–255) ↔ HSL (h 0–360, s/l 0–1)
 */

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{ h: number, s: number, l: number }}
 */
export function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
}

/**
 * @param {string} rgb - "r,g,b"
 * @returns {{ r: number, g: number, b: number } | null}
 */
export function parseRgbString(rgb) {
  if (!rgb || typeof rgb !== 'string') return null;
  const parts = rgb.split(',').map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [r, g, b] = parts;
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  return { r, g, b };
}

/** @typedef {'tone' | 'tint' | 'shade' | 'pure'} PaintZone */

/**
 * PRD zone order: center (tone) → inner (tint) → outer (shade) → middle (pure)
 * @param {number} s - saturation 0–1
 * @param {number} l - lightness 0–1
 * @returns {PaintZone}
 */
export function getPaintZone(s, l) {
  if (s < 0.25) return 'tone';
  if (l > 0.7) return 'tint';
  if (l < 0.35) return 'shade';
  return 'pure';
}

/**
 * Normalized radius 0 (center) .. 1 (edge) for wheel placement
 * @param {PaintZone} zone
 * @returns {number}
 */
export function zoneToRadiusNorm(zone) {
  switch (zone) {
    case 'tone':
      return 0.12;
    case 'tint':
      return 0.32;
    case 'pure':
      return 0.52;
    case 'shade':
      return 0.78;
    default:
      return 0.52;
  }
}
