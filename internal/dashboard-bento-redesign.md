---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Dashboard bento redesign

## Verdict
Dashboard-only layout refresh: date range in top bar, bento KPI grid, MoM chart + roll pipeline, deal types + YoY. Aggregate logic unchanged. `pm-calc.js` hash still `93af26bf…`.

## Files touched
| File | Change |
|------|--------|
| `docs/index.html` | Bento markup + render (GP%, pipeline, deal-type bars, MoM toggle, YoY empty) |
| `docs/app.css` | Top-bar date cluster + dashboard bento / pipeline / type-bar styles |
| `docs/shell.js` | `topbarExtra` slot before Upload data |
| `docs/accounts-to-roll.html` | Tiny `?bucket=now\|soon\|build` focus + scroll |

**Untouched:** `pm-calc.js`, `sheet-store.js` parse paths, `settings.js` semantics.

## Behaviour notes
- KPIs / deal types / MoM / YoY use existing filtered summarise / byMonth / YoY math.
- GP% = GP ÷ Revenue (display only).
- Roll pipeline uses `PMCalc.snapshotAt` + `priorityBucket` + Settings roll-soon window (same as Accounts), on **all** loaded deals.
- MoM table starts hidden; **Show table** / **Hide table** toggle.
- YoY with zero prior-year deals: single line — “No deals in the same period last year to compare” (e.g. sample filtered to 2022 only).
- Chart: rounded bars, gridlines, `Jul 26`-style labels, hover tip.

## Verify
Load sample → 20 deals, GP% ~22.9, pipeline 6 / 6 / 6, MoM chart, table collapsed. Click pipeline → Accounts bucket highlight.

Commit: `ddc6269`

## Open
`/cursor/stores/self/index.html` in Chrome / Edge / Safari.
