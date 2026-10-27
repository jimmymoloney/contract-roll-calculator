---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Accounts to roll redesign

## Verdict
Accounts page UI only: segmented tabs, search, soon-window control, amber needs-review bar, one sortable full-width table with row → calculator. Bucket math unchanged. `pm-calc.js` still `93af26bf…`.

## Files touched
| File | Change |
|------|--------|
| `docs/accounts-to-roll.html` | New toolbar + single table + review alert; same `analyse` / `snapshotAt` / `priorityBucket` |
| `docs/app.css` | Accounts toolbar, segments, review alert, sortable table styles |

**Untouched:** `pm-calc.js`, `sheet-store.js`, `settings.js`, Dashboard (still links `?bucket=now|soon|build`).

## Behaviour
- Tabs: Roll now / Roll soon / Build relationship / All — live counts
- Search filters by account name (client-side)
- Soon window input re-runs existing analyse on change (no Refresh button)
- Needs review: amber bar “N rows need review · View”; hidden when zero (sample has 2)
- Columns: Account, Type, Elapsed, Latest safe, Until risk, Internal now, External (+1), GP now, Priority — no Open column
- Row click / Enter → same calculator URL as before
- `?bucket=` honours `now|soon|build` plus aliases `roll-now`, `roll-soon`, `build-relationship`

## Verify (sample)
Counts 6 / 6 / 6 (+ 2 review). Search “acme” → Acme Legal. Soon window 1 reshuffles soon/build.

Commit: `a3160ef`

## Open
`/cursor/stores/self/accounts-to-roll.html` (optionally `?bucket=now`).
