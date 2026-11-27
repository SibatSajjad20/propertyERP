import { db } from "../src/db";
import { sql } from "drizzle-orm";
import { units } from "../src/db/schema/units";
import { clients, reservations, bookings, sales } from "../src/db/schema/sales";

async function main() {
  const statusCounts = await db
    .select({ status: units.status, count: sql`count(*)` })
    .from(units)
    .groupBy(units.status);

  const existingReservations = await db.select().from(reservations);
  const existingBookings = await db.select().from(bookings);
  const existingSales = await db.select().from(sales);
  const existingClients = await db.select().from(clients);

  console.log("Status Counts:", statusCounts);
  console.log("Existing Reservations:", existingReservations);
  console.log(
    "Existing Bookings:",
    existingBookings.map((b) => ({
      id: b.id,
      bookingNo: b.bookingNo,
      status: b.status,
      paidTotal: b.paidTotal,
      netPrice: b.netPrice,
    })),
  );
  console.log(
    "Existing Sales:",
    existingSales.map((s) => ({
      id: s.id,
      serialNo: s.serialNo,
      salePrice: s.salePrice,
      status: s.status,
    })),
  );
  console.log(
    "Existing Clients:",
    existingClients.map((c) => ({ id: c.id, name: c.fullName, cnic: c.cnic })),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
