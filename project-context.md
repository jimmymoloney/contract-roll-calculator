# Contract Roll Calculator — portfolio context

Static offline web app for photocopier / print-management sales: shared spreadsheet, dashboard, accounts-to-roll flash list, and roll timing calculator. Plain English UI. No AI features. Fictional sample customers only (e.g. Acme Legal).

## Pages (top-level `index.html`)

| File | Role |
|------|------|
| `index.html` | Dashboard — KPIs, MoM, YoY, roll pipeline |
| `accounts-to-roll.html` | Priority buckets, search, row → calculator |
| `roll-calculator.html` | Print Management / Advantage / Rental timing |
| `data.html` | Upload, sample load, clear, format help |
| `settings.html` | Defaults & payout rules (browser localStorage) |
| `help.html` | In-app guides |

Shared: `pm-calc.js`, `sheet-store.js`, `settings.js`, `sample-data.js`, `shell.js`, `app.css`, `vendor/` (SheetJS).

## Settings-driven defaults

Factor rate, My COG, Competitor COG, new-deal service ¢, contract term, escalation %, escalation every N months, early-termination extra months, roll-soon window. Sample CSV may include illustrative row values (e.g. factor 2.165); code fallbacks use Settings.
