import { describe, expect, it } from "vitest";
import { eq, desc } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { sales, bookings, clients } from "@/db/schema/sales";
import { units, unitPricing } from "@/db/schema/units";
import { floors, categories } from "@/db/schema/property";

describe("sold report query", () => {
  it("compiles unitPricing references with table qualification", () => {
    const qb = new QueryBuilder();
    const q = qb
      .select({
        saleId: sales.id,
        unitId: units.id,
        unitCode: units.unitCode,
        floorName: floors.name,
        categoryName: categories.name,
        netAreaSqft: units.netAreaSqft,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        salePrice: sales.salePrice,
        soldDate: sales.soldAt,
        saleStatus: sales.status,
        bookingId: sales.bookingId,
        bookingListPrice: bookings.listPrice,
        bookingDiscount: bookings.discountValue,
        unitAskingPrice: unitPricing.computedPricePkr,
      })
      .from(sales)
      .innerJoin(units, eq(sales.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(bookings, eq(sales.bookingId, bookings.id))
      .leftJoin(unitPricing, eq(units.id, unitPricing.unitId))
      .orderBy(desc(sales.soldAt));

    const sqlStr = q.toSQL().sql;

    expect(sqlStr).toContain('"unit_pricing"."unit_id"');
    expect(sqlStr).toContain('"unit_pricing"."computed_price_pkr"');
    expect(sqlStr).not.toContain('on "units"."id" = "unit_id"');
    expect(sqlStr).not.toContain(', "computed_price_pkr" from');
  });
});
