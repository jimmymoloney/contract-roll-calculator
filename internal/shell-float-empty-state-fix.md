---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Shell refine — empty state + floating glass

## Cause of empty-state bug
`.empty-state { display: flex }` overrode the HTML `hidden` attribute, so “No spreadsheet loaded” stayed visible even when KPIs and the sidebar showed 20 deals.

## Fix
- Global `[hidden] { display: none !important; }`
- `.empty-state:not([hidden]) { display: flex; }`
- `AppShell.setEmptyState(isEmpty, contentId)` used by Dashboard and Accounts

## Files changed
| File | What |
|------|------|
| `docs/app.css` | `[hidden]` fix; floating sidebar/top bar (16px gaps, 24px radius, blur 24px, shadow); content offset; Help/nav pill styles |
| `docs/shell.js` | Help under Settings with thin divider; `setEmptyState` helper |
| `docs/index.html` | Wire `AppShell.setEmptyState(..., "dashContent")` |
| `docs/accounts-to-roll.html` | Wire `AppShell.setEmptyState(..., "accountsContent")` |

**Untouched:** `pm-calc.js` (`93af26bf…`), `sheet-store.js`, `settings.js`, Data/Calculator business logic.

Roll calculator has no empty-state overlay (status line only) — no change needed.

## Verified
- Load sample path → empty hidden, content shown, sidebar “20 deals”
- Clear path → empty shown again, content hidden

Commit: `316dc6c`

## How to open Dashboard for the user
1. In a real browser (Chrome / Edge / Safari), open:
   - `/cursor/stores/self/index.html`
   - or from the repo: `docs/index.html`
2. If no data: use **Load sample data** on the empty state, or go to **Data** → Load sample.
3. Confirm: empty message gone; KPIs visible; sidebar shows deal count.
4. Sidebar **Clear** → empty state returns.
