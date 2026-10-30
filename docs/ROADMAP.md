# Roadmap

## MVP (this scaffold)

- Auth with roles
- Property / block / floor / category / unit schema
- Inventory table and unit detail
- Status change with optimistic locking, history, audit
- Seeded Sardar's Mall + admin
- Design system

## Next

1. Excel import (SheetJS) against `docs/IMPORT_RULES.md`
2. Excel export (exceljs)
3. Rate changes + `rate_history`
4. Users admin (invite, role change) — done (`/settings/users`)
5. Customers
6. Bookings / reservations
7. Payments and receipts
8. Leasing (non-sale occupancy)
9. Background jobs for large imports (`pg-boss`)
10. Sentry in production (set `SENTRY_DSN`)
