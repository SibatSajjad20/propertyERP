# User guide

Sardar's Mall ERP is the inventory ledger for the mall. Sign in, find a unit, mark it sold or reverse a sale, import a spreadsheet, and export a copy of the books.

## Sign in

1. Open the ERP address in a browser.
2. Enter the email and password given to you.
3. Choose **Sign in**.

If the password was set by an administrator, you may be asked to choose a new one before you can work. If you see “Invalid email or password”, check the email spelling and try again. After several failed attempts, wait a minute.

Press **Ctrl+K** (or **⌘K** on a Mac) at any time to jump to a unit code or a page.

## Find a unit

1. Open **Inventory**.
2. Type a unit code, unit number, or owner into the search box.
3. Narrow the list with Floor, Category, Status, or Missing gross.
4. Click a row to open the side panel, or use the row menu for **View details**.

On a phone, the table keeps the unit code, floor, status, and price. Swipe sideways to see the rest, or open the unit page.

The command palette is the fastest path: **Ctrl+K**, type `GF-S12`, Enter.

## Sell a unit

Sales staff, inventory managers, and administrators can sell.

1. Open an **Available** unit that is sellable.
2. Choose **Mark as Sold**.
3. Enter a booking reference. A note is optional.
4. Confirm. The asking price is frozen as the sold price.

If someone else changed the unit while you had it open, you will be asked to reload and try again.

## Reverse a sale

Only an **Administrator** can reverse.

1. Open a **Sold** unit.
2. Choose **Reverse sale**.
3. Write a reason of at least 10 characters.
4. Confirm. The unit becomes Available again. The booking reference stays in history.

## Import

Inventory managers and administrators.

1. Open **Import**.
2. Choose an `.xlsx` file. Column names should include unit code, unit number, floor, category, net area, and rate. Gross area is optional.
3. Review the preview counts.
4. Choose **Commit import**.

Rules in short:

- Blank or `-` unit codes get a generated code.
- Missing gross area is allowed.
- Gross smaller than net is imported with a warning.
- **Sold** units are skipped unless an administrator ticks overwrite.

## Export

- **Inventory → Export** downloads the current filtered list as `.xlsx`.
- Administrators can also choose **Full export** on Users or Import. That workbook has properties, blocks, floors, categories, units, status history, rate history, users (no passwords), audit log, and import batches.

## Users

Administrators only (**Users** in the sidebar).

- **New user** — name, email, role, temporary password. They must change the password on first sign-in.
- **Edit role** — Administrator, Inventory Manager, or Sales.
- **Disable** — they cannot sign in; open sessions are closed.
- **Reset password** — sets a temporary password.

Roles:

- **Sales** — see inventory, sell units, export the list.
- **Inventory manager** — also create and edit units, manage floors/blocks, import.
- **Administrator** — also reverse sales, manage users, read the audit log, full export.

## If the page says the database is waking

The hosted database sleeps when idle. Wait a few seconds and choose **Try again**.
