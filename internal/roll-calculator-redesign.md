---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Roll calculator redesign

## Verdict
Calculator page layout only: two columns, sticky verdict, tabbed detail card. Same field IDs, `buildRows` / `findSafe` / chart series. `pm-calc.js` still `93af26bf…`.

## Files touched
| File | Change |
|------|--------|
| `docs/roll-calculator.html` | Two-column markup, collapsible input cards, sticky results, detail tabs; JS show/hide + verdict colouring only |
| `docs/app.css` | `.calc-*` layout, affixes, sticky panel, tabs, 600px month table |

**Untouched:** `pm-calc.js`, parse/settings, other pages.

## Layout
- **Left (~58%):** Customer + agreement segmented control + info line; Contract / volumes / capital / copy / overs / new-deal cards (open by default); live capital/service/total strip; Calculate / Load example / Clear
- **Right (~42%) sticky:** Placeholder until Calculate; then coloured verdict (green/amber/red), 2×3 figures, breakdown text, Ex GST footnote
- **Full width:** Tabs — Competitor vs current | New-deal rate | Month by month (max-height 600px, safe row highlight)

## Verify
Load example → Calculate → safe month ~27 for PM sample inputs; tabs switch; Clear restores placeholder.

Commit: `ad9b051`

## Open
`/cursor/stores/self/roll-calculator.html` — Load example → Calculate.
