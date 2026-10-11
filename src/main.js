import './style.css';
import { parsePaintsCsv } from './csvParser.js';
import {
  parseRgbString,
  rgbToHsl,
  getPaintZone,
  zoneToRadiusNorm,
} from './colorUtils.js';
import { draw12SegmentWheel, hueRadiusToCanvas } from './wheel.js';
import { formatOwnedIdList, parseOwnedIdList } from './ownedIds.js';

/** @typedef {'all' | 'owned' | 'highlight'} ViewMode */
/** @typedef {'dark' | 'light'} Theme */

const OWNED_STORAGE_KEY = 'ownedPaintIds';

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const buttons = document.querySelectorAll('[data-mode]');
const themeToggle = document.getElementById('theme-toggle');
const ownedForm = document.getElementById('owned-form');
const ownedIdsInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('owned-ids'));
const ownedStatus = document.getElementById('owned-status');

let viewMode = /** @type {ViewMode} */ ('all');
let theme = /** @type {Theme} */ (
  document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
);
let paints = [];
/** @type {Set<string>} */
let ownedIds = new Set();
let hovered = null;

function loadOwnedIdsFromStorage() {
  try {
    const raw = localStorage.getItem(OWNED_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(parseOwnedIdList(raw));
  } catch (_) {
    return new Set();
  }
}

function saveOwnedIdsToStorage(ids) {
  try {
    localStorage.setItem(OWNED_STORAGE_KEY, [...ids].join(', '));
  } catch (_) {
    /* ignore */
  }
}

function applyOwnedFlags() {
  for (let i = 0; i < paints.length; i += 1) {
    paints[i].owned = ownedIds.has(paints[i].number);
  }
}

function updateOwnedStatus(unknown = []) {
  const matched = paints.filter((p) => p.owned).length;
  if (!ownedIds.size) {
    ownedStatus.textContent = 'No owned paints set';
    return;
  }
  const parts = [`${matched} matched`];
  if (unknown.length) parts.push(`${unknown.length} unknown`);
  ownedStatus.textContent = parts.join(' · ');
}

function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function syncThemeToggle() {
  const nextLabel = theme === 'dark' ? 'Light' : 'Dark';
  themeToggle.textContent = nextLabel;
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );
}

function setTheme(next) {
  theme = next;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch (_) {
    /* ignore */
  }
  syncThemeToggle();
  draw();
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(400, Math.floor(rect.width));
  const h = Math.max(400, Math.floor(rect.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function buildPlottablePaints(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const { name, number, rgb } = rows[i];
    const parsed = parseRgbString(rgb);
    if (!parsed) {
      console.warn('Skipping row (invalid rgb):', name || rgb);
      continue;
    }
    const { r, g, b } = parsed;
    const { h, s, l } = rgbToHsl(r, g, b);
    const zone = getPaintZone(s, l);
    const rNorm = zoneToRadiusNorm(zone);
    out.push({
      name,
      number,
      r,
      g,
      b,
      owned: ownedIds.has(number),
      hue: h,
      zone,
      rNorm,
    });
  }
  return out;
}

function setOwnedFromInput(text) {
  const ids = parseOwnedIdList(text);
  ownedIds = new Set(ids);
  ownedIdsInput.value = formatOwnedIdList(text);
  saveOwnedIdsToStorage(ownedIds);
  applyOwnedFlags();

  const known = new Set(paints.map((p) => p.number));
  const unknown = ids.filter((id) => !known.has(id));
  updateOwnedStatus(unknown);
  hovered = null;
  tooltip.hidden = true;
  draw();
}

function getWheelGeometry() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.38;
  return { cx, cy, maxRadius, w, h };
}

function paintVisible(p) {
  if (viewMode === 'all' || viewMode === 'highlight') return true;
  return p.owned;
}

function draw() {
  const { cx, cy, maxRadius, w, h } = getWheelGeometry();
  ctx.fillStyle = cssVar('--canvas-bg', theme === 'light' ? '#f7f7fa' : '#121218');
  ctx.fillRect(0, 0, w, h);

  draw12SegmentWheel(ctx, cx, cy, maxRadius, theme);

  for (let i = 0; i < paints.length; i += 1) {
    const p = paints[i];
    if (!paintVisible(p)) continue;

    const radiusPx = p.rNorm * maxRadius;
    const { x, y } = hueRadiusToCanvas(p.hue, radiusPx, cx, cy);

    const isHighlight = viewMode === 'highlight' && p.owned;
    const baseR = p.owned ? 4.5 : 3.5;
    const dotR = isHighlight ? baseR + 1.5 : baseR;

    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.fill();

    if (p.owned || isHighlight) {
      const ownedStroke =
        theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(40,40,50,0.9)';
      const highlightStroke =
        theme === 'light' ? 'rgba(20,20,30,0.9)' : 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = isHighlight ? highlightStroke : ownedStroke;
      ctx.lineWidth = isHighlight ? 2 : 1.2;
      ctx.stroke();
    }

    if (hovered === p) {
      ctx.strokeStyle =
        theme === 'light' ? 'rgba(180,120,0,0.95)' : 'rgba(255,220,100,0.95)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function findPaintAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const { cx, cy, maxRadius } = getWheelGeometry();

  for (let i = paints.length - 1; i >= 0; i -= 1) {
    const p = paints[i];
    if (!paintVisible(p)) continue;
    const radiusPx = p.rNorm * maxRadius;
    const { x, y } = hueRadiusToCanvas(p.hue, radiusPx, cx, cy);
    const baseR = p.owned ? 4.5 : 3.5;
    const dotR = viewMode === 'highlight' && p.owned ? baseR + 1.5 : baseR;
    const dx = mx - x;
    const dy = my - y;
    if (dx * dx + dy * dy <= (dotR + 4) * (dotR + 4)) return p;
  }
  return null;
}

function onPointerMove(e) {
  const next = findPaintAt(e.clientX, e.clientY);
  if (next !== hovered) {
    hovered = next;
    draw();
    if (hovered) {
      tooltip.hidden = false;
      const label = hovered.number
        ? `${hovered.number} ${hovered.name}`
        : hovered.name;
      tooltip.textContent = `${label} — RGB ${hovered.r},${hovered.g},${hovered.b}`;
      tooltip.style.left = `${e.clientX + 12}px`;
      tooltip.style.top = `${e.clientY + 12}px`;
    } else {
      tooltip.hidden = true;
    }
  } else if (hovered) {
    tooltip.style.left = `${e.clientX + 12}px`;
    tooltip.style.top = `${e.clientY + 12}px`;
  }
}

function onPointerLeave() {
  hovered = null;
  tooltip.hidden = true;
  draw();
}

async function loadCsv() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/paints.csv`);
  if (!res.ok) throw new Error(`Failed to load paints: ${res.status}`);
  const text = await res.text();
  const rows = parsePaintsCsv(text);
  paints = buildPlottablePaints(rows);
  const known = new Set(paints.map((p) => p.number));
  const unknown = [...ownedIds].filter((id) => !known.has(id));
  updateOwnedStatus(unknown);
  draw();
}

function setMode(mode) {
  viewMode = mode;
  buttons.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });
  hovered = null;
  tooltip.hidden = true;
  draw();
}

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    if (mode === 'all' || mode === 'owned' || mode === 'highlight') setMode(mode);
  });
});

themeToggle.addEventListener('click', () => {
  setTheme(theme === 'dark' ? 'light' : 'dark');
});

ownedForm.addEventListener('submit', (e) => {
  e.preventDefault();
  setOwnedFromInput(ownedIdsInput.value);
});

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseleave', onPointerLeave);

ownedIds = loadOwnedIdsFromStorage();
ownedIdsInput.value = [...ownedIds].join(', ');
syncThemeToggle();
resizeCanvas();
loadCsv().catch((err) => {
  console.error(err);
  ctx.fillStyle = theme === 'light' ? '#b33' : '#e88';
  ctx.font = '14px system-ui';
  ctx.fillText(String(err.message), 16, 32);
});
