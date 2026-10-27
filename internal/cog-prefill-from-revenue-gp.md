---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# COG prefill from Revenue − GP

## Change
On Roll calculator customer select (`fillFromRow`), **My COG** and **Competitor COG** both set to `Revenue − GP` from the sheet row (rounded to 2 decimals). True difference kept (can be negative). If revenue/gp missing, Settings defaults. Manual edit after select still allowed. Clear / Load example unchanged.

## Files
- `docs/roll-calculator.html` only (`fillFromRow` + removed `min="0"` on COG inputs)

## Untouched
- `pm-calc.js` — hash still `93af26bf…` (no formula changes)
- `sheet-store.js` — rows already expose `revenue` / `gp`

## Sample check
Acme Legal: revenue 18500, GP 4200 → both COGs **14300**.

Commit: `10a790f`
