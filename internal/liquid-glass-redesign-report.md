---
cursor:
  subagentId: "bc-0e9ff07c-f2bc-5a40-ab9d-bf3091819cfb"
---

# Liquid Glass shell redesign

## Verdict
Layout/styling shell applied across all pages. Calculation, parse, and settings persistence logic untouched. Smoke checks passed.

## Files touched
| File | Change |
|------|--------|
| `docs/app.css` | Rewritten — Liquid Glass, sidebar, panels, empty states, dropzone |
| `docs/shell.js` | **New** — fixed sidebar, top bar, data-status card (Replace / Clear) |
| `docs/data.html` | **New** — all upload / sample / clear / format UI |
| `docs/index.html` | Shell + empty state; upload UI removed |
| `docs/accounts-to-roll.html` | Shell + empty state; upload UI removed |
| `docs/roll-calculator.html` | Shell; upload UI removed; customer select kept |
| `docs/settings.html` | Shell; save / clear wired as before |

## Logic files untouched (hashes)
| File | SHA-256 |
|------|---------|
| `pm-calc.js` | `93af26bfccb77a952de7c16dacdbbc38dc132741904e1d24800403b607bb950e` |
| `sheet-store.js` | `ec87ce31680dfe3cd22b69540db601adbad7c299369a8604b56dbadaf1a52bff` |
| `settings.js` | `98430d7372def97c434308a360ef3bf9ed61345e46b163392c60eb98bc8f31f2` |
| `sample-data.js` | `b6c98a6ba09be70fce5ffaf02a01ce7e1d6d48c28ce92c6368ea20c99fddd05e` |

## Removed from UI
- Upload boxes on Home / Accounts / Calculator
- Yellow Cursor file-preview warnings
- “Load the user test CSV” / “Download the user test CSV” entry points (`sample-test still on disk)
- “If Load sample fails…” helper text
- Google Fonts / IBM Plex links from HTML (system stack only; unused font files left on disk)

## Verified
- No `fonts.google` links in HTML/CSS
- Sample load → 20 rows → `SheetStore.meta()` updates
- Calc from shared row still returns safe month
- Settings save + `clearAllData` restore defaults; meta clears
- Commit: `c12ae93` — *Liquid Glass shell: sidebar, Data page, empty states*
