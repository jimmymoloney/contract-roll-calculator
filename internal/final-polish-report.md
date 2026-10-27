---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Final polish report

## What we did
1. **Settings** — Grouped glass cards (Defaults / Contract rules / Clear all data); desktop label-left / input-right rows; **Saved** toast on save, field change, reset, and clear (same `AppSettings.save` / clear APIs).
2. **Help** — New `help.html` with App + Calculator guides as readable solid panels; sidebar **Help** opens it (active state). Raw `.md` files remain on disk for reference but are not linked from the UI.
3. **Footers** — No guide links on page footers (plain notes only).
4. **Money display** — `AppShell.formatMoney` (delegates to `PMCalc.money`: `$`, commas, **2 decimals**, leading `-` for negatives). Dashboard + Accounts table use it; Calculator already used `C.money` with the same rules.
5. **Transitions** — Content fade-in; card/button hover lift; smoother calc collapsible open.
6. **Spacing** — CSS vars `--space-1…4` (8 / 16 / 24 / 32); card radius kept at 24px.
7. **Light/dark** — Existing `prefers-color-scheme` paths retained; hint/desc contrast nudged up; solid Help article uses ink/muted for AA-friendlier reading.

## Couldn’t fully do / still inconsistent
- **Background stays “night glass”** even in light mode (gradient navy→violet→teal). Light scheme mainly adjusts glass/solid panel tokens, not a bright white page chrome — by product design, not a full light theme swap.
- **Chart canvas** axis labels are plain numbers, not `$x.xx` formatted money.
- **Dashboard MoM/YoY** money now shows 2 decimals (was whole dollars) — intentional consistency; looks busier in KPI tiles.
- **Settings auto-saves on every field `change`** plus Save button — can feel chatty; toast is the feedback.
- **`.md` guides** not auto-synced into `help.html`; edit Help HTML (or both) if docs change.
- **Compact sidebar** still icon-only under 1100px; Help label hides with other nav labels.
- Did not run a full visual WCAG audit in a browser; contrast fixes are best-effort in CSS.

## Files touched
| File | Notes |
|------|--------|
| `docs/settings.html` | Restyled form + toast wiring |
| `docs/help.html` | **New** Help view |
| `docs/shell.js` | Help nav link, `formatMoney`, `toast` |
| `docs/app.css` | Spacing, fade/hover, toast, settings rows, help layout |
| `docs/index.html` | Dashboard `money()` → `AppShell.formatMoney` |
| `docs/accounts-to-roll.html` | Table money → `AppShell.formatMoney` |

**Untouched:** `pm-calc.js`, SheetStore parse, Settings persistence keys/semantics (save/load/clear APIs only).

## Hash
`pm-calc.js` SHA-256 still starts **`93af26bf`**.

## Commit
`a14e0f6` — `shell v5 - final polish`

## Verify
1. Open `settings.html` → change a value → toast **Saved**; Save / Reset / Clear still work.
2. Sidebar **Help** → `help.html`; switch App / Calculator sections.
3. Load sample → Dashboard / Accounts / Calculator still compute as before.
