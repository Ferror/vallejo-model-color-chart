# 🎨 Color Wheel UI – MVP Project Plan

## 1. Project Overview

Build a simple frontend web application that visualizes a **12-segment color wheel** and plots paints from a CSV dataset (Vallejo Model Color paints).

The app should:
- Render a **12-part color wheel**
- Plot paints as points based on RGB values
- Support filtering/highlighting **owned paints**
- Use radial distance to represent:
  - Tint
  - Tone
  - Shade
  - Pure color

This is an **MVP pet project**:
- No need for perfection
- Focus on simplicity and clarity
- No tests required

---

## 2. Tech Stack & Constraints

- Language: JavaScript (ES6+)
- Framework: Vanilla JS (no frameworks preferred)
- Rendering: HTML5 Canvas (preferred)
- Data: CSV file (static)
- Deployment: GitHub Pages via GitHub Actions
- No backend
- No authentication

---

## 3. Data Model

### CSV Format @vallejo-model-color-all-paints

name,rgb,owned


### Example


Flat Red,"255,0,0",true
Dark Blue,"10,20,200",false


### Rules

- `rgb` is a **single string column**: `"r,g,b"`
- Parse into integers
- Missing or invalid RGB → **skip row**
- `owned`:
  - boolean (`true/false`) or `1/0`

---

## 4. Core Features

### 4.1 Color Wheel

- 12 equal segments (30° each)
- Segments represent:
  - Red
  - Red-Orange
  - Orange
  - Yellow-Orange
  - Yellow
  - Yellow-Green
  - Green
  - Blue-Green
  - Blue
  - Blue-Violet
  - Violet
  - Red-Violet

---

### 4.2 Color Mapping Logic

#### Step 1: RGB → HSL

- Convert parsed RGB into HSL
- Extract:
  - Hue (H)
  - Saturation (S)
  - Lightness (L)

---

#### Step 2: Angle Mapping


angle = hue (0–360°)


---

#### Step 3: Radius Mapping (4 Zones)

| Zone        | Condition                | Meaning        |
|-------------|-------------------------|----------------|
| Center      | S < 0.25                | Tone           |
| Inner ring  | L > 0.7                 | Tint           |
| Middle ring | otherwise               | Pure color     |
| Outer ring  | L < 0.35                | Shade          |

### Logic


if (s < 0.25) → center
else if (l > 0.7) → inner ring
else if (l < 0.35) → outer ring
else → middle ring


---

## 5. Paint Plotting

Each paint:
- Position:
  - Angle → from Hue
  - Radius → from zone logic
- Render as:
  - Small circle (3–6px)

### Visual Rules

- Dot color = actual RGB
- Overlapping points allowed

---

## 6. Interaction

### Required

- Toggle modes:
  - Show all paints
  - Show only owned paints
  - Highlight owned paints

### Owned Paint Styling

- Larger dot OR
- Different stroke (outline)

---

### Optional (Nice to Have)

- Hover tooltip:
  - Paint name
  - RGB value

---

## 7. UI Layout


[ Toggle: All | Owned | Highlight ]

    ( Color Wheel Canvas )

- Centered layout
- Minimal styling
- Prefer dark background (better color visibility)

---

## 8. CSV Handling

- Load CSV from static file (`/data/paints.csv`)
- Parse on app load
- Skip invalid rows
- Log errors in console (optional)

---

## 9. File Structure


/src
main.js
colorUtils.js
wheel.js
csvParser.js

/index.html
/styles.css
/data/paints.csv


---

## 10. Implementation Steps

1. Setup HTML + Canvas
2. Draw 12-segment wheel
3. Load and parse CSV
4. Parse RGB string → numbers
5. Convert RGB → HSL
6. Map:
   - Hue → angle
   - S/L → radius
7. Plot points
8. Add toggle for `owned`

---

## 11. Behavior Rules

- Missing RGB → skip
- Invalid format → skip
- No collision handling
- No performance optimization required

---

## 12. Deployment

- Use GitHub Pages
- Use GitHub Actions:
  - On push to main → deploy static files

---

## 13. Non-Goals

- No backend
- No editing paints
- No persistence
- No advanced color theory accuracy
- No tests
- No animations
- No responsiveness (optional later)

---

## 14. Future Ideas (Out of Scope)

- Color similarity detection
- Paint comparison
- Search/filter UI
- Dynamic CSV upload
- Smooth radial gradients instead of rings

---

## 15. Key Decisions Summary

- RGB stored as **single CSV column**
- Missing RGB → skip
- Radius represents:
  - Tint / Tone / Shade / Pure
- Fixed radial zones (not continuous)
- Canvas rendering
- Simple MVP-first approach

---