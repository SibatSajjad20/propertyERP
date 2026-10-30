# Import rules

Source of truth for cleaning the Sardar's Mall Excel schedule. Implement against this file; do not invent extra heuristics in the importer.

## Cleaning

- Skip summary / total / blank rows.
- Map **Amenities** and **Meeting Room** to those categories with `is_sellable = false` (category `is_sellable_default`).
- If unit code is `-` or empty, generate a code from property + floor + unit number. Persist the generated code; do not leave `-` in the ledger.
- Normalise floor names (`Ground`, `1st`, `First`, `Level 1` → one canonical floor per block).
- Missing gross area is allowed (`null`). Never invent a gross area.
- If gross < net, import the row and record a warning. Do not fail the batch for that alone.
- Match existing units on `(property_id, unit_code)`.

## Re-import (diff mode)

- Create an `import_batches` row: original file path, raw rows jsonb, counts, warnings, errors.
- Insert missing units. Update AVAILABLE units that changed.
- Never overwrite a `SOLD` unit unless an ADMIN confirms the overwrite. Default is skip + warning.
- Do not un-archive or reverse a sale via import.

## Money

- Parse rates and areas as decimal strings. Reject floats.
- After import, live price comes from `unit_pricing`. Do not write asking price onto the unit.
