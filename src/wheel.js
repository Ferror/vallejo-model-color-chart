/**
 * 12-segment color wheel background + polar plotting helpers
 */

const SEGMENT_LABELS = [
  'Red',
  'Red-Orange',
  'Orange',
  'Yellow-Orange',
  'Yellow',
  'Yellow-Green',
  'Green',
  'Blue-Green',
  'Blue',
  'Blue-Violet',
  'Violet',
  'Red-Violet',
];

/**
 * Hue 0° at top (12 o'clock): subtract 90° from standard math angle
 * @param {number} hueDeg - 0–360
 * @param {number} radiusPx
 * @param {number} cx
 * @param {number} cy
 * @returns {{ x: number, y: number }}
 */
export function hueRadiusToCanvas(hueDeg, radiusPx, cx, cy) {
  const rad = ((hueDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radiusPx * Math.cos(rad),
    y: cy + radiusPx * Math.sin(rad),
  };
}

/**
 * @typedef {'dark' | 'light'} Theme
 */

/**
 * @param {Theme} theme
 */
function wheelPalette(theme) {
  if (theme === 'light') {
    return {
      segmentSat: 42,
      segmentLight: 86,
      segmentStroke: 'rgba(40,40,55,0.14)',
      guideStroke: 'rgba(40,40,55,0.08)',
      labelFill: 'rgba(40,40,55,0.72)',
    };
  }
  return {
    segmentSat: 35,
    segmentLight: 18,
    segmentStroke: 'rgba(255,255,255,0.12)',
    guideStroke: 'rgba(255,255,255,0.06)',
    labelFill: 'rgba(220,220,230,0.75)',
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} maxRadius - outer radius of wheel (pixels)
 * @param {Theme} [theme='dark']
 */
export function draw12SegmentWheel(ctx, cx, cy, maxRadius, theme = 'dark') {
  const segmentCount = 12;
  const step = (2 * Math.PI) / segmentCount;
  const palette = wheelPalette(theme);

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < segmentCount; i += 1) {
    const start = i * step - Math.PI / 2;
    const end = start + step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxRadius, start, end);
    ctx.closePath();
    const hue = (i * 360) / segmentCount;
    ctx.fillStyle = `hsl(${hue} ${palette.segmentSat}% ${palette.segmentLight}%)`;
    ctx.fill();
    ctx.strokeStyle = palette.segmentStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Inner ring guides (subtle)
  const guides = [0.25, 0.45, 0.65, 0.9];
  ctx.strokeStyle = palette.guideStroke;
  guides.forEach((t) => {
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * t, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.restore();

  // Labels outside wheel
  ctx.save();
  ctx.fillStyle = palette.labelFill;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelR = maxRadius + 22;
  for (let i = 0; i < segmentCount; i += 1) {
    const mid = (i + 0.5) * step - Math.PI / 2;
    const lx = cx + labelR * Math.cos(mid);
    const ly = cy + labelR * Math.sin(mid);
    const text = SEGMENT_LABELS[i];
    ctx.fillText(text, lx, ly);
  }
  ctx.restore();
}

export { SEGMENT_LABELS };
