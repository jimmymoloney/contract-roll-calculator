---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Portfolio release — Contract Roll Calculator

## Summary
App renamed to **Contract Roll Calculator**, moved to store **top-level** (`index.html` at `/cursor/stores/self/`), personal/employer refs scrubbed, James-test data removed, sample CTA + demo footer added. Fictional customers (Acme etc.) kept. **`pm-calc.js` hash still `93af26bf…`.**

## Layout
| Before | After |
|--------|--------|
| `/docs/index.html` + assets | `/index.html` + siblings at store root |
| `docs/vendor/` | `vendor/` |
| Guides in `docs/` | `app-guide.md`, `roll-calculator-guide.md`, `project-context.md` at root |
| `docs/` folder | Removed |

Open: double-click `/cursor/stores/self/index.html` in Chrome/Edge/Safari.

## Scrubbed
- Deleted `james-test-deals.csv`
- Removed `JAMES_TEST_DEALS_CSV` from `sample-data.js`
- Removed `loadJamesTestData` from `sheet-store.js`
- Rewrote `project-context.md` / `app-guide.md` (no person/employer)
- Stripped James/ABT wording from internal redesign notes
- Grep clean of ABT / James / Jimmy / james-test / loadJames in UI + source (excl. vendor)

## Rename
Sidebar brand, page `<title>`s, CSS header comment, guides → **Contract Roll Calculator**.

## Hard-codes → Settings (audit)

| Value | Where | Status |
|-------|--------|--------|
| Factor `2.0`, COG `5000`, term `60`, escalation `6%` / every `6` mo, early-term `+1`, roll-soon `6` | `settings.js` `DEFAULTS` + `pm-calc.js` cfg seed (overridden by Settings via `applyToCalc`) | **Canonical Settings defaults** — generic |
| Same numbers as HTML `value=` / JS fallbacks when `AppSettings` missing | `roll-calculator.html` inputs & `{ factorRate: 2, myCog: 5000… }` | Last-resort mirrors of Settings; live path uses `AppSettings.load()` |
| Sheet parse fallbacks factor/COG | `sheet-store.js` when column absent | Uses `AppSettings.load()`, else 2.0 / 5000 |
| Factor `2.165`, COGs in sample rows | `sample-deals.csv` / `SAMPLE_DEALS_CSV` | **OK as illustrative sample data** (not code defaults) |
| Dashboard / Accounts soon window `6` | Fallback if Settings missing | Matches Settings default |
| Help / TYPE_HELP copy mentioning “6%” / “+1” | Educational blurbs | Display copy; live rules from Settings |

**Not moved (intentionally):** Sample CSV row figures; calc formulas themselves.

## UX for first visit
- Dashboard / Accounts empty state: “Try the demo” + large **Load sample data**
- Data page: top card **New here? Load sample data** (hides once data loaded)
- Shell footer on every page: `Demo with fictional data · Data never leaves your browser`

## Incomplete / residual
- `vendor/fonts` IBM Plex files unused (system stack in CSS) — left on disk
- Light `prefers-color-scheme` still uses dark glass background (by design)
- No automated browser E2E — Node smoke with SheetJS: sample → 20 rows (Acme…)
- Follow-up after move: SheetJS error copy no longer says “docs folder”; older internal redesign notes point at root paths

## Files touched (high level)
Moved all app HTML/JS/CSS/CSV/vendor to root; edited `shell.js`, `sample-data.js`, `sheet-store.js`, empty states, guides, `project-context.md`, `app.css`; deleted james-test artifacts.

## Verify
```text
pm-calc.js → 93af26bf…
rg ABT|James|james-test → clean
index.html at store root; Load sample works
```
