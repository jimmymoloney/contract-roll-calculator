# Contract Roll Calculator — three agreement types

See **`app-guide.md`** for the full app (one spreadsheet, Dashboard, Accounts, Settings).  
Term length, escalation %, and the extra months on competitor payout are editable under **Settings** (defaults below).

## Agreement types

### Print Management
- Capital in click rates (`Rental Capital B/W` / `Colour`) + copy costs.
- Escalation every 6 months from start: **6% on the whole total**; extra dollars onto service; capital fixed.
- **Overs** (lifetime extras) × capital rates reduce **internal** payout only. Example: 1000 colour × 9.8¢ = **$98**.
- Internal = capital monthly × remaining − overs credit.  
- External = current total × (remaining **+ 1**).

### Print Advantage
- **Fixed rental** + copy costs (e.g. $100 + 1000 B/W @ 0.5¢ + 1000 colour @ 5¢ = $55 service → **$155** total).
- Escalation every 6 months from start: **6% on service only**. First uplift: $55 × 1.06 = **$58.30** → total **$158.30** (rental stays $100).
- Overs do **not** reduce internal payout.
- Internal = fixed rental × remaining.  
- External = current total × (remaining **+ 1**).

### Rental
- Monthly minimum = **fixed rental only**. No included volume in the minimum.
- Copy costs on the sheet are **pay-as-you-go** and not part of buyout minimum.
- No service escalation on the minimum.
- Internal = rental × remaining.  
- External = rental × (remaining **+ 1**).
- Risk compares competitor replica to rental only (base service floor = 0).

## Shared for all types
- Factor rate, My COG, Competitor COG.
- Latest safe roll month = last month before competitor replica monthly ≤ current minimum.
- GP = max principal from monthly room − internal payout − My COG.

## Customer quick-select
Populate from the shared spreadsheet (`Customer` column recommended). Selecting a row sets type and fields; you can still edit afterwards.
