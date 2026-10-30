# Permissions

Roles: `ADMIN`, `INVENTORY_MANAGER`, `SALES`. Enforced in server actions and pages. The proxy only checks that a session cookie exists.

| Action                | ADMIN | INVENTORY_MANAGER | SALES |
| --------------------- | ----- | ----------------- | ----- |
| `dashboard.read`      | Y     | Y                 | Y     |
| `units.read`          | Y     | Y                 | Y     |
| `units.manage`        | Y     | Y                 | N     |
| `units.change_status` | Y     | Y                 | Y     |
| `units.sell`          | Y     | N                 | Y     |
| `units.reverse_sale`  | Y     | N                 | N     |
| `units.update_rate`   | Y     | Y                 | N     |
| `units.import`        | Y     | Y                 | N     |
| `structure.read`      | Y     | Y                 | Y     |
| `structure.manage`    | Y     | Y                 | N     |
| `users.read`          | Y     | N                 | N     |
| `users.manage`        | Y     | N                 | N     |
| `audit.read`          | Y     | N                 | N     |

`units.manage` covers create, update, and archive of unit records. SALES is read-only on `/inventory`. Rate, area, and adjustment on a `SOLD` unit stay locked unless the actor is ADMIN.

Reverse sale requires a non-empty reason. Sale freezes `sold_price_pkr`. Re-import must not overwrite `SOLD` without ADMIN.

`structure.manage` covers create, update, and archive of properties, blocks, and floors. Archive is refused when active units remain. SALES is read-only on `/structure`.

Matrix source: `src/lib/permissions.ts`.
