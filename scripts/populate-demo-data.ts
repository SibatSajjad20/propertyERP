import { db } from "../src/db";
import { eq, and, isNull, inArray } from "drizzle-orm";
import {
  units,
  unitStatusHistory,
  unitMergeRequests,
  unitMergeSources,
} from "../src/db/schema/units";
import {
  clients,
  nextOfKin,
  reservations,
  bookings,
  installments,
  payments,
  sales,
  buybacks,
  refunds,
  receipts,
} from "../src/db/schema/sales";
import { user } from "../src/db/schema/auth";
import { auditLog } from "../src/db/schema/audit";
import { categories, floors, properties } from "../src/db/schema/property";
import { formatDecimal, parseDecimal, computeTotalPrice } from "../src/lib/money";
import { effectivePricingArea } from "../src/lib/area";
import { generateSchedule } from "../src/features/sales/calculator";
import {
  allocateBookingNumber,
  allocateDocumentNumbers,
  allocatePaymentReceiptNumber,
  allocateTokenReceiptNumber,
} from "../src/features/sales/document-numbers";

async function populate() {
  console.log("Starting demo data population...");

  // 1. Fetch Admin, Inventory Manager, Sales users
  const allUsers = await db.select().from(user);
  const adminUser = allUsers.find((u) => u.role === "ADMIN") || allUsers[0];
  const invUser = allUsers.find((u) => u.role === "INVENTORY_MANAGER") || adminUser;
  const salesUser = allUsers.find((u) => u.role === "SALES") || adminUser;

  if (!adminUser) {
    throw new Error("No admin user found. Please run seed first.");
  }

  // 2. Fetch property & floors & categories
  const [property] = await db.select().from(properties).limit(1);
  if (!property) throw new Error("No property found");

  const allFloors = await db.select().from(floors);
  const allCategories = await db.select().from(categories);

  console.log(`Property: ${property.name} (${property.id})`);
  console.log(
    `Users: Admin (${adminUser.email}), Inventory (${invUser.email}), Sales (${salesUser.email})`,
  );

  // 3. Create or find demo clients
  const DEMO_CLIENTS = [
    {
      title: "Mr",
      fullName: "Tariq Mehmood",
      relationPrefix: "S/O",
      relationName: "Mehmood Ul Hassan",
      cnic: "37405-1234567-1",
      phone: "0300-5551234",
      email: "tariq.mehmood@example.com",
      homeAddress: "House 42, Street 10, Sector F-8/3, Islamabad",
      postalAddress: "House 42, Street 10, Sector F-8/3, Islamabad",
      kin: {
        name: "Bilal Tariq",
        relationPrefix: "S/O",
        relationName: "Tariq Mehmood",
        relation: "Son",
        cnic: "37405-7654321-1",
        phone: "0300-5551235",
      },
    },
    {
      title: "Dr",
      fullName: "Ayesha Siddiqui",
      relationPrefix: "D/O",
      relationName: "Dr. Siddiq Ahmed",
      cnic: "35201-9876543-2",
      phone: "0321-4447890",
      email: "dr.ayesha@example.com",
      homeAddress: "Apartment 304, Gulberg Greens, Islamabad",
      postalAddress: "Apartment 304, Gulberg Greens, Islamabad",
      kin: {
        name: "Zainab Siddiqui",
        relationPrefix: "D/O",
        relationName: "Dr. Siddiq Ahmed",
        relation: "Sister",
        cnic: "35201-1122334-4",
        phone: "0321-4447891",
      },
    },
    {
      title: "Mr",
      fullName: "Malik Imran Khan",
      relationPrefix: "S/O",
      relationName: "Malik Amanullah",
      cnic: "61101-2345678-3",
      phone: "0333-8889900",
      email: "imran.malik@example.com",
      homeAddress: "House 18, Street 4, Sector F-7/2, Islamabad",
      postalAddress: "House 18, Street 4, Sector F-7/2, Islamabad",
      kin: {
        name: "Hamza Malik",
        relationPrefix: "S/O",
        relationName: "Malik Amanullah",
        relation: "Brother",
        cnic: "61101-3344556-5",
        phone: "0333-8889901",
      },
    },
    {
      title: "Mr",
      fullName: "Farhan Ali Shah",
      relationPrefix: "S/O",
      relationName: "Syed Ali Raza Shah",
      cnic: "37406-3456789-5",
      phone: "0345-1112233",
      email: "farhan.shah@example.com",
      homeAddress: "Villas 102, Phase 4, Bahria Town, Rawalpindi",
      postalAddress: "Villas 102, Phase 4, Bahria Town, Rawalpindi",
      kin: {
        name: "Syed Ali Raza Shah",
        relationPrefix: "S/O",
        relationName: "Syed Ghulam Shah",
        relation: "Father",
        cnic: "37406-9988776-3",
        phone: "0345-1112234",
      },
    },
    {
      title: "Ch",
      fullName: "Chaudhry Nisar Ahmed",
      relationPrefix: "S/O",
      relationName: "Chaudhry Ghulam Sarwar",
      cnic: "38403-4567890-7",
      phone: "0301-9998877",
      email: "ch.nisar@example.com",
      homeAddress: "Plot 55, Sector B, DHA Phase 2, Islamabad",
      postalAddress: "Plot 55, Sector B, DHA Phase 2, Islamabad",
      kin: {
        name: "Usman Nisar",
        relationPrefix: "S/O",
        relationName: "Chaudhry Nisar Ahmed",
        relation: "Son",
        cnic: "38403-5566778-9",
        phone: "0301-9998878",
      },
    },
    {
      title: "Mrs",
      fullName: "Zainab Bibi",
      relationPrefix: "W/O",
      relationName: "Taimoor Khan",
      cnic: "34101-5678901-8",
      phone: "0312-3334455",
      email: "zainab.bibi@example.com",
      homeAddress: "House 12, Street 35, Sector G-11/3, Islamabad",
      postalAddress: "House 12, Street 35, Sector G-11/3, Islamabad",
      kin: {
        name: "Taimoor Khan",
        relationPrefix: "S/O",
        relationName: "Sher Khan",
        relation: "Husband",
        cnic: "34101-4455667-1",
        phone: "0312-3334456",
      },
    },
    {
      title: "Mr",
      fullName: "Usman Ghani",
      relationPrefix: "S/O",
      relationName: "Abdul Ghani",
      cnic: "35202-6789012-9",
      phone: "0322-7776655",
      email: "usman.ghani@example.com",
      homeAddress: "Block B, Satellite Town, Rawalpindi",
      postalAddress: "Block B, Satellite Town, Rawalpindi",
      kin: {
        name: "Kashif Ghani",
        relationPrefix: "S/O",
        relationName: "Abdul Ghani",
        relation: "Brother",
        cnic: "35202-8899001-3",
        phone: "0322-7776656",
      },
    },
    {
      title: "Mr",
      fullName: "Bilal Tanveer",
      relationPrefix: "S/O",
      relationName: "Tanveer Ahmed",
      cnic: "36302-7890123-1",
      phone: "0334-2223344",
      email: "bilal.tanveer@example.com",
      homeAddress: "House 89, Street 15, Sector I-8/2, Islamabad",
      postalAddress: "House 89, Street 15, Sector I-8/2, Islamabad",
      kin: {
        name: "Tanveer Ahmed",
        relationPrefix: "S/O",
        relationName: "Muhammad Din",
        relation: "Father",
        cnic: "36302-1122445-7",
        phone: "0334-2223345",
      },
    },
  ];

  const clientMap = new Map<string, typeof clients.$inferSelect>();

  for (const c of DEMO_CLIENTS) {
    const [existing] = await db
      .select()
      .from(clients)
      .where(eq(clients.cnic, c.cnic))
      .limit(1);
    const clientRecord =
      existing ??
      (await db
        .insert(clients)
        .values({
          title: c.title,
          fullName: c.fullName,
          relationPrefix: c.relationPrefix,
          relationName: c.relationName,
          cnic: c.cnic,
          phone: c.phone,
          email: c.email,
          homeAddress: c.homeAddress,
          postalAddress: c.postalAddress,
        })
        .returning()
        .then(async ([inserted]) => {
          await db.insert(nextOfKin).values({
            clientId: inserted.id,
            name: c.kin.name,
            relationPrefix: c.kin.relationPrefix,
            relationName: c.kin.relationName,
            relation: c.kin.relation,
            cnic: c.kin.cnic,
            phone: c.kin.phone,
          });
          return inserted;
        }));

    clientMap.set(c.fullName, clientRecord);
    clientMap.set(`${c.title} ${c.fullName}`, clientRecord);
    clientMap.set(`${c.title}. ${c.fullName}`, clientRecord);
  }

  function getClient(name: string) {
    const clean = name.replace(/^(Mr|Mrs|Dr|Ch)\.?\s+/i, "").trim();
    const c = clientMap.get(name) || clientMap.get(clean);
    if (!c) throw new Error(`Client "${name}" not found in clientMap!`);
    return c;
  }

  console.log(`Clients ready: ${clientMap.size} clients.`);

  // Helper to fetch unit by code
  async function getUnit(code: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(and(eq(units.unitCode, code), isNull(units.archivedAt)))
      .limit(1);
    if (!unit) throw new Error(`Unit ${code} not found!`);
    return unit;
  }

  // -------------------------------------------------------------
  // 4. RESERVATIONS
  // -------------------------------------------------------------
  console.log("Creating reservations...");

  // 4a. Active Reservation on GF-S3 (Tariq Mehmood)
  const unitGfS3 = await getUnit("GF-S3");
  if (unitGfS3.status === "AVAILABLE") {
    const client = getClient("Tariq Mehmood");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const tokenNo = await allocateTokenReceiptNumber(
      db as unknown as Parameters<typeof allocateTokenReceiptNumber>[0],
      now,
    );

    await db.transaction(async (tx) => {
      await tx
        .update(units)
        .set({
          status: "RESERVED",
          bookingRef: `RES-${unitGfS3.unitCode}`,
          version: unitGfS3.version + 1,
          updatedAt: now,
        })
        .where(eq(units.id, unitGfS3.id));

      await tx.insert(unitStatusHistory).values({
        unitId: unitGfS3.id,
        fromStatus: "AVAILABLE",
        toStatus: "RESERVED",
        reason: `Reserved for ${client.fullName} until ${expiresAt.toISOString().slice(0, 10)}`,
        bookingRef: `RES-${unitGfS3.unitCode}`,
        actorId: salesUser.id,
        createdAt: now,
      });

      await tx.insert(reservations).values({
        unitId: unitGfS3.id,
        clientId: client.id,
        startAt: now,
        expiresAt,
        durationDays: 7,
        status: "ACTIVE",
        tokenAmount: "100000.00",
        tokenPaymentMethod: "CASH",
        tokenReceiptNo: tokenNo,
        tokenPaidAt: now,
        notes: "Token payment received in cash at site office.",
        createdBy: salesUser.id,
      });

      await tx.insert(auditLog).values({
        actorId: salesUser.id,
        entity: "reservation",
        entityId: unitGfS3.id,
        action: "STATUS_CHANGE",
        before: { status: "AVAILABLE" },
        after: { status: "RESERVED", tokenAmount: "100000.00" },
      });
    });
    console.log(" - Reserved GF-S3 for Tariq Mehmood");
  }

  // 4b. Active Reservation expiring soon on 1F-S1 (Dr. Ayesha Siddiqui)
  const unit1fS1 = await getUnit("1F-S1");
  if (unit1fS1.status === "AVAILABLE") {
    const client = getClient("Dr. Ayesha Siddiqui");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // in 2 days!
    const tokenNo = await allocateTokenReceiptNumber(
      db as unknown as Parameters<typeof allocateTokenReceiptNumber>[0],
      now,
    );

    await db.transaction(async (tx) => {
      await tx
        .update(units)
        .set({
          status: "RESERVED",
          bookingRef: `RES-${unit1fS1.unitCode}`,
          version: unit1fS1.version + 1,
          updatedAt: now,
        })
        .where(eq(units.id, unit1fS1.id));

      await tx.insert(unitStatusHistory).values({
        unitId: unit1fS1.id,
        fromStatus: "AVAILABLE",
        toStatus: "RESERVED",
        reason: `Reserved for ${client.fullName} until ${expiresAt.toISOString().slice(0, 10)}`,
        bookingRef: `RES-${unit1fS1.unitCode}`,
        actorId: salesUser.id,
        createdAt: now,
      });

      await tx.insert(reservations).values({
        unitId: unit1fS1.id,
        clientId: client.id,
        startAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiresAt,
        durationDays: 7,
        status: "ACTIVE",
        tokenAmount: "250000.00",
        tokenPaymentMethod: "BANK_TRANSFER",
        tokenBank: "Meezan Bank Ltd",
        tokenReference: "TXN-982144",
        tokenReceiptNo: tokenNo,
        tokenPaidAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        notes: "Corporate client token transfer via online banking.",
        createdBy: salesUser.id,
      });

      await tx.insert(auditLog).values({
        actorId: salesUser.id,
        entity: "reservation",
        entityId: unit1fS1.id,
        action: "STATUS_CHANGE",
        before: { status: "AVAILABLE" },
        after: { status: "RESERVED", tokenAmount: "250000.00" },
      });
    });
    console.log(" - Reserved 1F-S1 for Dr. Ayesha Siddiqui (expiring in 2 days)");
  }

  // 4c. Cancelled Reservation history on 2F-S3
  const unit2fS3 = await getUnit("2F-S3");
  const clientImran = getClient("Malik Imran Khan");
  const pastResDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  const cancelDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const [existingCancelled] = await db
    .select()
    .from(reservations)
    .where(
      and(eq(reservations.unitId, unit2fS3.id), eq(reservations.status, "CANCELLED")),
    )
    .limit(1);

  if (!existingCancelled) {
    const tokenNo = await allocateTokenReceiptNumber(
      db as unknown as Parameters<typeof allocateTokenReceiptNumber>[0],
      pastResDate,
    );
    await db.insert(reservations).values({
      unitId: unit2fS3.id,
      clientId: clientImran.id,
      startAt: pastResDate,
      expiresAt: new Date(pastResDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      durationDays: 7,
      status: "CANCELLED",
      tokenAmount: "50000.00",
      tokenPaymentMethod: "CASH",
      tokenReceiptNo: tokenNo,
      tokenPaidAt: pastResDate,
      cancelledAt: cancelDate,
      cancelledReason:
        "Client decided to upgrade to a prime corner location on Ground floor.",
      notes: "Token refund processed per terms.",
      createdBy: salesUser.id,
    });
    console.log(" - Recorded cancelled reservation on 2F-S3");
  }

  // -------------------------------------------------------------
  // 5. DIRECT SALES & BUYBACK
  // -------------------------------------------------------------
  console.log("Creating direct sales and buyback...");

  // Helper for direct sale
  async function recordDirectSale(
    unitCode: string,
    clientName: string,
    soldMonthsAgo: number,
    paymentMethod: "BANK_TRANSFER" | "CHEQUE" | "PAY_ORDER" | "CASH",
    bank: string | null,
    chequeNo: string | null,
  ) {
    const unit = await getUnit(unitCode);
    if (unit.status !== "AVAILABLE") return;

    const client = getClient(clientName);
    const soldAt = new Date();
    soldAt.setMonth(soldAt.getMonth() - soldMonthsAgo);
    soldAt.setDate(12);

    const price = computeTotalPrice(
      unit.ratePerSqftPkr,
      effectivePricingArea(unit.grossAreaSqft, unit.netAreaSqft),
      unit.priceAdjustmentPkr,
    );

    await db.transaction(async (tx) => {
      const numbers = await allocateDocumentNumbers(tx, unit.unitCode, soldAt);

      await tx
        .update(units)
        .set({
          status: "SOLD",
          soldPricePkr: price,
          soldAt,
          soldBy: salesUser.id,
          bookingRef: numbers.applicationFormNo,
          version: unit.version + 1,
          updatedAt: soldAt,
        })
        .where(eq(units.id, unit.id));

      await tx.insert(unitStatusHistory).values({
        unitId: unit.id,
        fromStatus: "AVAILABLE",
        toStatus: "SOLD",
        soldPricePkr: price,
        reason: `Direct 100% full sale to ${client.fullName}`,
        bookingRef: numbers.applicationFormNo,
        actorId: salesUser.id,
        createdAt: soldAt,
      });

      const [saleRecord] = await tx
        .insert(sales)
        .values({
          unitId: unit.id,
          clientId: client.id,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          salePrice: price,
          soldAt,
          paymentMethod,
          bank,
          chequeNo,
          reference: chequeNo || "Full payment",
          salesAgent: salesUser.name,
          bookingOffice: "SARDAR'S MALL",
          status: "ACTIVE",
          createdBy: salesUser.id,
          createdAt: soldAt,
        })
        .returning();

      await tx.insert(receipts).values({
        saleId: saleRecord.id,
        receiptNo: numbers.applicationFormNo,
        type: "DOWN_PAYMENT",
        createdBy: salesUser.id,
        createdAt: soldAt,
      });

      await tx.insert(auditLog).values({
        actorId: salesUser.id,
        entity: "sale",
        entityId: saleRecord.id,
        action: "SALE",
        before: null,
        after: { unitCode: unit.unitCode, salePrice: price, client: client.fullName },
        createdAt: soldAt,
      });
    });
    console.log(` - Sold unit ${unitCode} to ${clientName} (${price} PKR)`);
  }

  // Record 3 direct sales in past months (Aug, Sep, Oct 2026)
  await recordDirectSale(
    "GF-S4",
    "Chaudhry Nisar Ahmed",
    3,
    "BANK_TRANSFER",
    "Habib Bank Ltd",
    "HBL-OL-889921",
  );
  await recordDirectSale(
    "1F-S2",
    "Zainab Bibi",
    2,
    "CHEQUE",
    "Bank Alfalah",
    "BAFL-CHQ-445511",
  );
  await recordDirectSale(
    "4F-O2",
    "Usman Ghani",
    1,
    "PAY_ORDER",
    "Meezan Bank Ltd",
    "PO-7788112",
  );

  // Buyback reversal on GF-S5:
  // Sold 4 months ago (July 2026) -> Bought back in current month (Nov 2026)
  const unitGfS5 = await getUnit("GF-S5");
  if (unitGfS5.status === "AVAILABLE") {
    const clientTariq = getClient("Tariq Mehmood");
    const soldAt = new Date();
    soldAt.setMonth(soldAt.getMonth() - 4);
    const price = computeTotalPrice(
      unitGfS5.ratePerSqftPkr,
      effectivePricingArea(unitGfS5.grossAreaSqft, unitGfS5.netAreaSqft),
      unitGfS5.priceAdjustmentPkr,
    );

    await db.transaction(async (tx) => {
      const numbers = await allocateDocumentNumbers(tx, unitGfS5.unitCode, soldAt);

      // Create past sale
      const [saleRecord] = await tx
        .insert(sales)
        .values({
          unitId: unitGfS5.id,
          clientId: clientTariq.id,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          salePrice: price,
          soldAt,
          paymentMethod: "BANK_TRANSFER",
          bank: "MCB Bank",
          reference: "Full payment July 2026",
          salesAgent: salesUser.name,
          bookingOffice: "SARDAR'S MALL",
          status: "BOUGHT_BACK",
          createdBy: salesUser.id,
          createdAt: soldAt,
        })
        .returning();

      // Execute buyback now (in current month, Nov 2026)
      const buybackDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      await tx.insert(buybacks).values({
        unitId: unitGfS5.id,
        clientId: clientTariq.id,
        saleId: saleRecord.id,
        originalPrice: price,
        buybackAmount: price, // 100% buyback
        method: "BANK_TRANSFER",
        bank: "Meezan Bank Ltd",
        reason:
          "Client relocated overseas; company buyback executed per developer guaranteed buyback policy.",
        paidAt: buybackDate,
        approvedBy: adminUser.id,
        createdAt: buybackDate,
      });

      // Unit status returns to AVAILABLE
      await tx
        .update(units)
        .set({
          status: "AVAILABLE",
          soldPricePkr: null,
          soldAt: null,
          soldBy: null,
          bookingRef: null,
          version: unitGfS5.version + 1,
          updatedAt: buybackDate,
        })
        .where(eq(units.id, unitGfS5.id));

      await tx.insert(unitStatusHistory).values({
        unitId: unitGfS5.id,
        fromStatus: "SOLD",
        toStatus: "AVAILABLE",
        reason: "Bought back by management under buyback guarantee policy.",
        actorId: adminUser.id,
        createdAt: buybackDate,
      });

      await tx.insert(auditLog).values({
        actorId: adminUser.id,
        entity: "unit",
        entityId: unitGfS5.id,
        action: "REVERSE_SALE",
        before: { status: "SOLD", soldPricePkr: price },
        after: { status: "AVAILABLE", buybackAmount: price },
        createdAt: buybackDate,
      });
    });
    console.log(
      ` - Executed buyback reversal on GF-S5 (populates Month Reversals on Dashboard!)`,
    );
  }

  // -------------------------------------------------------------
  // 6. BOOKINGS WITH DETAILED INSTALLMENT SCHEDULES
  // -------------------------------------------------------------
  console.log("Creating bookings with installments...");

  // Helper to create an active booking with schedule and payments
  async function createDemoBooking({
    unitCode,
    clientName,
    plan,
    installmentCount,
    monthsAgo,
    discountPercent,
    paidInstallmentsCount,
    partialInstallmentRatio,
    makeFullyPaid,
  }: {
    unitCode: string;
    clientName: string;
    plan: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL";
    installmentCount: number;
    monthsAgo: number;
    discountPercent?: number;
    paidInstallmentsCount: number;
    partialInstallmentRatio?: number; // e.g. 0.5 for 50%
    makeFullyPaid?: boolean;
  }) {
    const unit = await getUnit(unitCode);
    if (unit.status !== "AVAILABLE") return;

    const client = getClient(clientName);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    startDate.setDate(15);

    const listPricePkr = computeTotalPrice(
      unit.ratePerSqftPkr,
      effectivePricingArea(unit.grossAreaSqft, unit.netAreaSqft),
      unit.priceAdjustmentPkr,
    );

    const discountValue = discountPercent ? String(discountPercent) : "0";
    const discountType = discountPercent ? "PERCENT" : null;

    const schedule = generateSchedule({
      listPricePkr,
      discountType,
      discountValue,
      downPaymentType: "PERCENT",
      downPaymentValue: "25",
      possessionType: "PERCENT",
      possessionValue: "15",
      balloonType: "PERCENT",
      balloonValue: "10",
      plan,
      installmentCount,
      startDate,
    });

    if (!schedule.isValid) {
      console.error(`Invalid schedule for ${unitCode}:`, schedule.validationError);
      return;
    }

    await db.transaction(async (tx) => {
      const bookingNo = await allocateBookingNumber(tx, startDate);
      const numbers = await allocateDocumentNumbers(tx, unit.unitCode, startDate);
      const downPaymentReceiptNo = await allocatePaymentReceiptNumber(tx, startDate);

      const [booking] = await tx
        .insert(bookings)
        .values({
          unitId: unit.id,
          clientId: client.id,
          bookingNo,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          listPrice: listPricePkr,
          discountType,
          discountValue,
          discountReason: discountPercent
            ? "Corporate / Promotional Discount Approved by Admin"
            : null,
          netPrice: schedule.netPricePkr,
          downPaymentType: "PERCENT",
          downPaymentInputValue: "25",
          downPayment: schedule.downPaymentPkr,
          possessionType: "PERCENT",
          possessionInputValue: "15",
          possessionAmount: schedule.possessionAmountPkr,
          balloonType: "PERCENT",
          balloonInputValue: "10",
          balloonAmountPerYear: schedule.balloonAmountPerYearPkr,
          balloonTotalAmount: schedule.balloonTotalAmountPkr,
          tokenAdjustedAmount: "0.00",
          plan,
          installmentCount,
          startDate,
          status: makeFullyPaid ? "COMPLETED" : "ACTIVE",
          paidTotal: schedule.downPaymentPkr,
          salesAgent: salesUser.name,
          bookingOffice: "SARDAR'S MALL",
          createdBy: salesUser.id,
          createdAt: startDate,
          updatedAt: startDate,
        })
        .returning();

      // Insert down payment in payments table
      await tx.insert(payments).values({
        bookingId: booking.id,
        receiptNo: downPaymentReceiptNo,
        category: "DOWN_PAYMENT",
        amount: schedule.downPaymentPkr,
        surchargeAmount: "0.00",
        method: "BANK_TRANSFER",
        bank: "Meezan Bank Ltd",
        reference: "Down payment 25%",
        paidAt: startDate,
        notes: "Initial 25% down payment confirmed",
        receivedBy: salesUser.id,
        isVoided: false,
        createdAt: startDate,
      });

      // Insert all installments
      const insertedInstRows = await tx
        .insert(installments)
        .values(
          schedule.installments.map((inst) => ({
            bookingId: booking.id,
            seq: inst.seq,
            type: inst.type,
            label: inst.label,
            dueDate: inst.dueDate,
            amount: inst.amountPkr,
            paidAmount: "0.00",
            status: "PENDING" as const,
            createdAt: startDate,
            updatedAt: startDate,
          })),
        )
        .returning();

      // Now insert payments for installments to be paid
      let currentPaidTotal = parseDecimal(schedule.downPaymentPkr);

      if (makeFullyPaid) {
        // Pay all installments
        for (const inst of insertedInstRows) {
          const instReceiptNo = await allocatePaymentReceiptNumber(tx, inst.dueDate);
          const instAmountPaisa = parseDecimal(inst.amount);
          currentPaidTotal += instAmountPaisa;

          await tx.insert(payments).values({
            bookingId: booking.id,
            receiptNo: instReceiptNo,
            category:
              inst.type === "BALLOON"
                ? "BALLOON"
                : inst.type === "POSSESSION"
                  ? "POSSESSION"
                  : "INSTALLMENT",
            amount: inst.amount,
            surchargeAmount: "0.00",
            method: "BANK_TRANSFER",
            bank: "HBL",
            paidAt: inst.dueDate,
            notes: `Paid installment ${inst.label}`,
            receivedBy: salesUser.id,
            createdAt: inst.dueDate,
          });

          await tx
            .update(installments)
            .set({
              paidAmount: inst.amount,
              status: "PAID",
              receiptNos: instReceiptNo,
              paidAt: inst.dueDate,
              updatedAt: inst.dueDate,
            })
            .where(eq(installments.id, inst.id));
        }

        // Transition unit to SOLD
        await tx
          .update(units)
          .set({
            status: "SOLD",
            soldPricePkr: schedule.netPricePkr,
            soldAt: new Date(),
            soldBy: salesUser.id,
            bookingRef: bookingNo,
            version: unit.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(units.id, unit.id));

        await tx.insert(unitStatusHistory).values({
          unitId: unit.id,
          fromStatus: "AVAILABLE",
          toStatus: "SOLD",
          soldPricePkr: schedule.netPricePkr,
          reason: `100% installments completed under booking ${bookingNo}`,
          bookingRef: bookingNo,
          actorId: salesUser.id,
        });

        // Insert sale record
        await tx.insert(sales).values({
          unitId: unit.id,
          clientId: client.id,
          bookingId: booking.id,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          salePrice: schedule.netPricePkr,
          soldAt: new Date(),
          notes: `Completed booking ${bookingNo}`,
          status: "ACTIVE",
          createdBy: salesUser.id,
        });

        await tx
          .update(bookings)
          .set({
            paidTotal: formatDecimal(currentPaidTotal),
            status: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));
      } else {
        // Partially paid booking
        const sorted = [...insertedInstRows].sort((a, b) => a.seq - b.seq);
        const now = new Date();

        for (let i = 0; i < paidInstallmentsCount && i < sorted.length; i++) {
          const inst = sorted[i];
          const instReceiptNo = await allocatePaymentReceiptNumber(tx, inst.dueDate);
          const instAmountPaisa = parseDecimal(inst.amount);
          currentPaidTotal += instAmountPaisa;

          await tx.insert(payments).values({
            bookingId: booking.id,
            receiptNo: instReceiptNo,
            category:
              inst.type === "BALLOON"
                ? "BALLOON"
                : inst.type === "POSSESSION"
                  ? "POSSESSION"
                  : "INSTALLMENT",
            amount: inst.amount,
            surchargeAmount: "0.00",
            method: "CHEQUE",
            bank: "Allied Bank",
            chequeNo: `CHQ-${1000 + i}`,
            paidAt: inst.dueDate,
            notes: `Paid on time: ${inst.label}`,
            receivedBy: salesUser.id,
            createdAt: inst.dueDate,
          });

          await tx
            .update(installments)
            .set({
              paidAmount: inst.amount,
              status: "PAID",
              receiptNos: instReceiptNo,
              paidAt: inst.dueDate,
              updatedAt: inst.dueDate,
            })
            .where(eq(installments.id, inst.id));
        }

        // Partial installment if requested
        if (
          partialInstallmentRatio &&
          partialInstallmentRatio > 0 &&
          paidInstallmentsCount < sorted.length
        ) {
          const partialInst = sorted[paidInstallmentsCount];
          const fullPaisa = parseDecimal(partialInst.amount);
          const partialPaisa =
            (fullPaisa * BigInt(Math.round(partialInstallmentRatio * 100))) / 100n;
          const partialReceiptNo = await allocatePaymentReceiptNumber(
            tx,
            partialInst.dueDate,
          );
          currentPaidTotal += partialPaisa;

          await tx.insert(payments).values({
            bookingId: booking.id,
            receiptNo: partialReceiptNo,
            category: "INSTALLMENT",
            amount: formatDecimal(partialPaisa),
            surchargeAmount: "0.00",
            method: "CASH",
            paidAt: partialInst.dueDate,
            notes: `Partial payment on ${partialInst.label}`,
            receivedBy: salesUser.id,
            createdAt: partialInst.dueDate,
          });

          await tx
            .update(installments)
            .set({
              paidAmount: formatDecimal(partialPaisa),
              status: "PARTIAL",
              receiptNos: partialReceiptNo,
              paidAt: partialInst.dueDate,
              updatedAt: partialInst.dueDate,
            })
            .where(eq(installments.id, partialInst.id));
        }

        // Update remaining installments: if dueDate < now and paidAmount = 0 -> OVERDUE
        const startIndex = paidInstallmentsCount + (partialInstallmentRatio ? 1 : 0);
        for (let j = startIndex; j < sorted.length; j++) {
          const inst = sorted[j];
          if (new Date(inst.dueDate).getTime() < now.getTime()) {
            await tx
              .update(installments)
              .set({ status: "OVERDUE", updatedAt: now })
              .where(eq(installments.id, inst.id));
          }
        }

        // Update unit to BOOKED
        await tx
          .update(units)
          .set({
            status: "BOOKED",
            bookingRef: bookingNo,
            version: unit.version + 1,
            updatedAt: startDate,
          })
          .where(eq(units.id, unit.id));

        await tx.insert(unitStatusHistory).values({
          unitId: unit.id,
          fromStatus: "AVAILABLE",
          toStatus: "BOOKED",
          reason: `Booked under ${bookingNo}`,
          bookingRef: bookingNo,
          actorId: salesUser.id,
          createdAt: startDate,
        });

        await tx
          .update(bookings)
          .set({
            paidTotal: formatDecimal(currentPaidTotal),
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));
      }

      await tx.insert(auditLog).values({
        actorId: salesUser.id,
        entity: "booking",
        entityId: booking.id,
        action: "CREATE",
        before: null,
        after: { bookingNo, netPrice: schedule.netPricePkr, client: client.fullName },
        createdAt: startDate,
      });
    });

    console.log(` - Created booking for ${unitCode} (${clientName})`);
  }

  // Booking 1: GF-S7 (Malik Imran Khan, 36 months, started 6 months ago, 4 paid, 1 partial, 1 overdue)
  await createDemoBooking({
    unitCode: "GF-S7",
    clientName: "Malik Imran Khan",
    plan: "MONTHLY",
    installmentCount: 36,
    monthsAgo: 6,
    paidInstallmentsCount: 4,
    partialInstallmentRatio: 0.5,
  });

  // Booking 2: 1F-S3 (Farhan Ali Shah, Quarterly 12 installments, started 8 months ago, 1 paid, 2 overdue with surcharge!)
  await createDemoBooking({
    unitCode: "1F-S3",
    clientName: "Farhan Ali Shah",
    plan: "QUARTERLY",
    installmentCount: 12,
    monthsAgo: 8,
    paidInstallmentsCount: 1,
  });

  // Booking 3: 2F-S5 (Dr. Ayesha Siddiqui, Monthly 24 installments, started 1 month ago, 1 paid, next due in 3 days)
  await createDemoBooking({
    unitCode: "2F-S5",
    clientName: "Dr. Ayesha Siddiqui",
    plan: "MONTHLY",
    installmentCount: 24,
    monthsAgo: 1,
    paidInstallmentsCount: 1,
  });

  // Booking 4: 3F-R2 (Chaudhry Nisar Ahmed, Semi-Annual 6 installments, 5% discount, started 4 months ago)
  await createDemoBooking({
    unitCode: "3F-R2",
    clientName: "Chaudhry Nisar Ahmed",
    plan: "SEMI_ANNUAL",
    installmentCount: 6,
    monthsAgo: 4,
    discountPercent: 5,
    paidInstallmentsCount: 0,
  });

  // Booking 5: 4F-O3 (Bilal Tanveer, Monthly 24 installments, started 2 months ago, 2 paid)
  await createDemoBooking({
    unitCode: "4F-O3",
    clientName: "Bilal Tanveer",
    plan: "MONTHLY",
    installmentCount: 24,
    monthsAgo: 2,
    paidInstallmentsCount: 2,
  });

  // Booking 6: 1F-S4 (Bilal Tanveer, Completed booking, 100% paid)
  await createDemoBooking({
    unitCode: "1F-S4",
    clientName: "Bilal Tanveer",
    plan: "QUARTERLY",
    installmentCount: 4,
    monthsAgo: 14,
    paidInstallmentsCount: 4,
    makeFullyPaid: true,
  });

  // Booking 7: GF-S8 (Returned Booking with Refund)
  const unitGfS8 = await getUnit("GF-S8");
  if (unitGfS8.status === "AVAILABLE") {
    const clientUsman = getClient("Usman Ghani");
    const bookedAt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const returnedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const listPrice = computeTotalPrice(
      unitGfS8.ratePerSqftPkr,
      effectivePricingArea(unitGfS8.grossAreaSqft, unitGfS8.netAreaSqft),
      unitGfS8.priceAdjustmentPkr,
    );
    const downPaymentPaisa = (parseDecimal(listPrice) * 25n) / 100n;
    const downPaymentPkr = formatDecimal(downPaymentPaisa);
    const deductionPaisa = (downPaymentPaisa * 10n) / 100n; // 10% penalty
    const deductionPkr = formatDecimal(deductionPaisa);
    const refundPaisa = downPaymentPaisa - deductionPaisa;
    const refundAmountPkr = formatDecimal(refundPaisa);

    await db.transaction(async (tx) => {
      const bookingNo = await allocateBookingNumber(tx, bookedAt);
      const numbers = await allocateDocumentNumbers(tx, unitGfS8.unitCode, bookedAt);
      const downReceipt = await allocatePaymentReceiptNumber(tx, bookedAt);

      const [booking] = await tx
        .insert(bookings)
        .values({
          unitId: unitGfS8.id,
          clientId: clientUsman.id,
          bookingNo,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          listPrice,
          netPrice: listPrice,
          downPayment: downPaymentPkr,
          possessionAmount: formatDecimal((parseDecimal(listPrice) * 15n) / 100n),
          plan: "MONTHLY",
          installmentCount: 24,
          startDate: bookedAt,
          status: "RETURNED",
          paidTotal: downPaymentPkr,
          salesAgent: salesUser.name,
          bookingOffice: "SARDAR'S MALL",
          createdBy: salesUser.id,
          createdAt: bookedAt,
          updatedAt: returnedAt,
        })
        .returning();

      await tx.insert(payments).values({
        bookingId: booking.id,
        receiptNo: downReceipt,
        category: "DOWN_PAYMENT",
        amount: downPaymentPkr,
        surchargeAmount: "0.00",
        method: "BANK_TRANSFER",
        bank: "Meezan Bank Ltd",
        paidAt: bookedAt,
        receivedBy: salesUser.id,
        createdAt: bookedAt,
      });

      // Insert refund record
      await tx.insert(refunds).values({
        bookingId: booking.id,
        unitId: unitGfS8.id,
        clientId: clientUsman.id,
        paidTotal: downPaymentPkr,
        deduction: deductionPkr,
        refundAmount: refundAmountPkr,
        method: "BANK_TRANSFER",
        bank: "Meezan Bank Ltd",
        reason:
          "Client encountered financial hardship, requested cancellation under refund policy with 10% deduction.",
        paidAt: returnedAt,
        approvedBy: adminUser.id,
        createdAt: returnedAt,
      });

      await tx.insert(unitStatusHistory).values({
        unitId: unitGfS8.id,
        fromStatus: "BOOKED",
        toStatus: "AVAILABLE",
        reason: `Booking ${bookingNo} returned with Rs ${refundAmountPkr} refund`,
        actorId: adminUser.id,
        createdAt: returnedAt,
      });

      await tx.insert(auditLog).values({
        actorId: adminUser.id,
        entity: "booking",
        entityId: booking.id,
        action: "STATUS_CHANGE",
        before: { status: "ACTIVE" },
        after: { status: "RETURNED", refundAmountPkr, deductionPkr },
        createdAt: returnedAt,
      });
    });
    console.log(` - Recorded returned booking on GF-S8 with refund`);
  }

  // -------------------------------------------------------------
  // 7. UNIT MERGES & UNIT MERGE REQUESTS
  // -------------------------------------------------------------
  console.log("Creating unit merges and merge requests...");

  // 7a. Pending Merge Request 1: 2F-S1 + 2F-S2
  const unit2fS1 = await getUnit("2F-S1");
  const unit2fS2 = await getUnit("2F-S2");
  const floor2 = allFloors.find((f) => f.id === unit2fS1.floorId)!;
  const catShop = allCategories.find((c) => c.name === "Shop") || allCategories[0];

  const [existingMerge1] = await db
    .select()
    .from(unitMergeRequests)
    .where(eq(unitMergeRequests.proposedUnitCode, "2F-S1-S2-M"))
    .limit(1);

  if (
    !existingMerge1 &&
    unit2fS1.status === "AVAILABLE" &&
    unit2fS2.status === "AVAILABLE"
  ) {
    const netArea = (
      parseFloat(unit2fS1.netAreaSqft) + parseFloat(unit2fS2.netAreaSqft)
    ).toFixed(2);
    const grossArea = (
      parseFloat(unit2fS1.grossAreaSqft || unit2fS1.netAreaSqft) +
      parseFloat(unit2fS2.grossAreaSqft || unit2fS2.netAreaSqft)
    ).toFixed(2);
    const avgRate = unit2fS1.ratePerSqftPkr;

    const sourceSnapshot = [
      {
        id: unit2fS1.id,
        unitCode: unit2fS1.unitCode,
        unitNumber: unit2fS1.unitNumber,
        floorId: unit2fS1.floorId,
        floorName: floor2.name,
        categoryId: unit2fS1.categoryId,
        categoryName: catShop.name,
        netAreaSqft: unit2fS1.netAreaSqft,
        grossAreaSqft: unit2fS1.grossAreaSqft,
        ratePerSqftPkr: unit2fS1.ratePerSqftPkr,
        priceAdjustmentPkr: unit2fS1.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit2fS1.ratePerSqftPkr,
          unit2fS1.netAreaSqft,
          "0",
        ),
      },
      {
        id: unit2fS2.id,
        unitCode: unit2fS2.unitCode,
        unitNumber: unit2fS2.unitNumber,
        floorId: unit2fS2.floorId,
        floorName: floor2.name,
        categoryId: unit2fS2.categoryId,
        categoryName: catShop.name,
        netAreaSqft: unit2fS2.netAreaSqft,
        grossAreaSqft: unit2fS2.grossAreaSqft,
        ratePerSqftPkr: unit2fS2.ratePerSqftPkr,
        priceAdjustmentPkr: unit2fS2.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit2fS2.ratePerSqftPkr,
          unit2fS2.netAreaSqft,
          "0",
        ),
      },
    ];

    await db.transaction(async (tx) => {
      const [req] = await tx
        .insert(unitMergeRequests)
        .values({
          propertyId: property.id,
          status: "PENDING",
          proposedUnitCode: "2F-S1-S2-M",
          proposedUnitNumber: "S1-S2-M",
          targetFloorId: floor2.id,
          targetCategoryId: catShop.id,
          proposedNetAreaSqft: netArea,
          proposedGrossAreaSqft: grossArea,
          proposedRatePerSqftPkr: avgRate,
          proposedPriceAdjustmentPkr: "0.00",
          reason:
            "Prospective retail anchor tenant requested combined luxury boutique showroom.",
          proofStoragePath: "merge-proofs/demo-layout-boutique.pdf",
          proofMimeType: "application/pdf",
          proofFileName: "demo-layout-boutique.pdf",
          sourceUnitsSnapshot: sourceSnapshot,
          requestedBy: invUser.id,
        })
        .returning();

      for (const s of sourceSnapshot) {
        await tx.insert(unitMergeSources).values({
          mergeRequestId: req.id,
          sourceUnitId: s.id,
          unitCode: s.unitCode,
          unitNumber: s.unitNumber,
          floorName: s.floorName,
          categoryName: s.categoryName,
          netAreaSqft: s.netAreaSqft,
          grossAreaSqft: s.grossAreaSqft,
          ratePerSqftPkr: s.ratePerSqftPkr,
          computedPricePkr: s.computedPricePkr,
        });
      }

      await tx.insert(auditLog).values({
        actorId: invUser.id,
        entity: "unit_merge",
        entityId: req.id,
        action: "CREATE",
        before: null,
        after: { proposedUnitCode: "2F-S1-S2-M", status: "PENDING" },
      });
    });
    console.log(" - Created PENDING merge request for 2F-S1 + 2F-S2");
  }

  // 7b. Pending Merge Request 2: 4F-O4 + 4F-O5
  const unit4fO4 = await getUnit("4F-O4");
  const unit4fO5 = await getUnit("4F-O5");
  const floor4 = allFloors.find((f) => f.id === unit4fO4.floorId)!;
  const catOffice = allCategories.find((c) => c.name === "Office") || allCategories[0];

  const [existingMerge2] = await db
    .select()
    .from(unitMergeRequests)
    .where(eq(unitMergeRequests.proposedUnitCode, "4F-O4-O5-M"))
    .limit(1);

  if (
    !existingMerge2 &&
    unit4fO4.status === "AVAILABLE" &&
    unit4fO5.status === "AVAILABLE"
  ) {
    const netArea = (
      parseFloat(unit4fO4.netAreaSqft) + parseFloat(unit4fO5.netAreaSqft)
    ).toFixed(2);
    const grossArea = (
      parseFloat(unit4fO4.grossAreaSqft || unit4fO4.netAreaSqft) +
      parseFloat(unit4fO5.grossAreaSqft || unit4fO5.netAreaSqft)
    ).toFixed(2);

    const sourceSnapshot = [
      {
        id: unit4fO4.id,
        unitCode: unit4fO4.unitCode,
        unitNumber: unit4fO4.unitNumber,
        floorId: unit4fO4.floorId,
        floorName: floor4.name,
        categoryId: unit4fO4.categoryId,
        categoryName: catOffice.name,
        netAreaSqft: unit4fO4.netAreaSqft,
        grossAreaSqft: unit4fO4.grossAreaSqft,
        ratePerSqftPkr: unit4fO4.ratePerSqftPkr,
        priceAdjustmentPkr: unit4fO4.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit4fO4.ratePerSqftPkr,
          unit4fO4.netAreaSqft,
          "0",
        ),
      },
      {
        id: unit4fO5.id,
        unitCode: unit4fO5.unitCode,
        unitNumber: unit4fO5.unitNumber,
        floorId: unit4fO5.floorId,
        floorName: floor4.name,
        categoryId: unit4fO5.categoryId,
        categoryName: catOffice.name,
        netAreaSqft: unit4fO5.netAreaSqft,
        grossAreaSqft: unit4fO5.grossAreaSqft,
        ratePerSqftPkr: unit4fO5.ratePerSqftPkr,
        priceAdjustmentPkr: unit4fO5.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit4fO5.ratePerSqftPkr,
          unit4fO5.netAreaSqft,
          "0",
        ),
      },
    ];

    await db.transaction(async (tx) => {
      const [req] = await tx
        .insert(unitMergeRequests)
        .values({
          propertyId: property.id,
          status: "PENDING",
          proposedUnitCode: "4F-O4-O5-M",
          proposedUnitNumber: "O4-O5-M",
          targetFloorId: floor4.id,
          targetCategoryId: catOffice.id,
          proposedNetAreaSqft: netArea,
          proposedGrossAreaSqft: grossArea,
          proposedRatePerSqftPkr: unit4fO4.ratePerSqftPkr,
          proposedPriceAdjustmentPkr: "0.00",
          reason: "Corporate software company requested combined double executive suite.",
          proofStoragePath: "merge-proofs/demo-layout-executive-suite.pdf",
          proofMimeType: "application/pdf",
          proofFileName: "demo-layout-executive-suite.pdf",
          sourceUnitsSnapshot: sourceSnapshot,
          requestedBy: salesUser.id,
        })
        .returning();

      for (const s of sourceSnapshot) {
        await tx.insert(unitMergeSources).values({
          mergeRequestId: req.id,
          sourceUnitId: s.id,
          unitCode: s.unitCode,
          unitNumber: s.unitNumber,
          floorName: s.floorName,
          categoryName: s.categoryName,
          netAreaSqft: s.netAreaSqft,
          grossAreaSqft: s.grossAreaSqft,
          ratePerSqftPkr: s.ratePerSqftPkr,
          computedPricePkr: s.computedPricePkr,
        });
      }
    });
    console.log(" - Created PENDING merge request for 4F-O4 + 4F-O5");
  }

  // 7c. Approved & Completed Merged Unit: 1F-S25 + 1F-S26 -> 1F-S25-S26-M
  const unit1fS25 = await getUnit("1F-S25");
  const unit1fS26 = await getUnit("1F-S26");
  const floor1 = allFloors.find((f) => f.id === unit1fS25.floorId)!;

  const [existingApprovedMerge] = await db
    .select()
    .from(unitMergeRequests)
    .where(eq(unitMergeRequests.proposedUnitCode, "1F-S25-S26-M"))
    .limit(1);

  if (
    !existingApprovedMerge &&
    unit1fS25.status === "AVAILABLE" &&
    unit1fS26.status === "AVAILABLE"
  ) {
    const netArea = (
      parseFloat(unit1fS25.netAreaSqft) + parseFloat(unit1fS26.netAreaSqft)
    ).toFixed(2);
    const grossArea = (
      parseFloat(unit1fS25.grossAreaSqft || unit1fS25.netAreaSqft) +
      parseFloat(unit1fS26.grossAreaSqft || unit1fS26.netAreaSqft)
    ).toFixed(2);
    const avgRate = unit1fS25.ratePerSqftPkr;
    const now = new Date();

    const sourceSnapshot = [
      {
        id: unit1fS25.id,
        unitCode: unit1fS25.unitCode,
        unitNumber: unit1fS25.unitNumber,
        floorId: unit1fS25.floorId,
        floorName: floor1.name,
        categoryId: unit1fS25.categoryId,
        categoryName: "Shop",
        netAreaSqft: unit1fS25.netAreaSqft,
        grossAreaSqft: unit1fS25.grossAreaSqft,
        ratePerSqftPkr: unit1fS25.ratePerSqftPkr,
        priceAdjustmentPkr: unit1fS25.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit1fS25.ratePerSqftPkr,
          unit1fS25.netAreaSqft,
          "0",
        ),
      },
      {
        id: unit1fS26.id,
        unitCode: unit1fS26.unitCode,
        unitNumber: unit1fS26.unitNumber,
        floorId: unit1fS26.floorId,
        floorName: floor1.name,
        categoryId: unit1fS26.categoryId,
        categoryName: "Shop",
        netAreaSqft: unit1fS26.netAreaSqft,
        grossAreaSqft: unit1fS26.grossAreaSqft,
        ratePerSqftPkr: unit1fS26.ratePerSqftPkr,
        priceAdjustmentPkr: unit1fS26.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit1fS26.ratePerSqftPkr,
          unit1fS26.netAreaSqft,
          "0",
        ),
      },
    ];

    await db.transaction(async (tx) => {
      // 1. Create the new merged unit in units table
      const [mergedUnit] = await tx
        .insert(units)
        .values({
          propertyId: property.id,
          unitCode: "1F-S25-S26-M",
          unitNumber: "S25-S26-M",
          floorId: floor1.id,
          categoryId: unit1fS25.categoryId,
          netAreaSqft: netArea,
          grossAreaSqft: grossArea,
          ratePerSqftPkr: avgRate,
          priceAdjustmentPkr: "0.00",
          status: "AVAILABLE",
          isSellable: true,
          isMergedUnit: true,
          notes: "Merged from 1F-S25 + 1F-S26 for expansive retail corner flagship.",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 2. Archive the 2 source units
      await tx
        .update(units)
        .set({
          mergedIntoUnitId: mergedUnit.id,
          archivedAt: now,
          isSellable: false,
          notes: `Merged into ${mergedUnit.unitCode} on ${now.toISOString().slice(0, 10)}`,
          updatedAt: now,
        })
        .where(inArray(units.id, [unit1fS25.id, unit1fS26.id]));

      // 3. Create merge request record marked APPROVED
      const [req] = await tx
        .insert(unitMergeRequests)
        .values({
          propertyId: property.id,
          status: "APPROVED",
          proposedUnitCode: "1F-S25-S26-M",
          proposedUnitNumber: "S25-S26-M",
          targetFloorId: floor1.id,
          targetCategoryId: unit1fS25.categoryId,
          proposedNetAreaSqft: netArea,
          proposedGrossAreaSqft: grossArea,
          proposedRatePerSqftPkr: avgRate,
          proposedPriceAdjustmentPkr: "0.00",
          reason: "Approved merge for anchor retail flagship tenant.",
          proofStoragePath: "merge-proofs/approved-arch-drawing-1f.pdf",
          proofMimeType: "application/pdf",
          proofFileName: "approved-arch-drawing-1f.pdf",
          sourceUnitsSnapshot: sourceSnapshot,
          resultingUnitId: mergedUnit.id,
          requestedBy: invUser.id,
          reviewedBy: adminUser.id,
          reviewedAt: now,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .returning();

      // 4. Create sources
      for (const s of sourceSnapshot) {
        await tx.insert(unitMergeSources).values({
          mergeRequestId: req.id,
          sourceUnitId: s.id,
          mergedUnitId: mergedUnit.id,
          unitCode: s.unitCode,
          unitNumber: s.unitNumber,
          floorName: s.floorName,
          categoryName: s.categoryName,
          netAreaSqft: s.netAreaSqft,
          grossAreaSqft: s.grossAreaSqft,
          ratePerSqftPkr: s.ratePerSqftPkr,
          computedPricePkr: s.computedPricePkr,
        });
      }

      // 5. Audit log
      await tx.insert(auditLog).values({
        actorId: adminUser.id,
        entity: "unit_merge",
        entityId: mergedUnit.id,
        action: "UNIT_MERGE_APPROVE",
        before: null,
        after: {
          mergedUnitCode: mergedUnit.unitCode,
          sourceUnits: ["1F-S25", "1F-S26"],
        },
        createdAt: now,
      });
    });
    console.log(" - Executed and APPROVED merge: 1F-S25 + 1F-S26 -> 1F-S25-S26-M");
  }

  // 7d. Rejected Merge Request: 3F-R3 + 3F-R4
  const unit3fR3 = await getUnit("3F-R3");
  const unit3fR4 = await getUnit("3F-R4");
  const floor3 = allFloors.find((f) => f.id === unit3fR3.floorId)!;

  const [existingRejected] = await db
    .select()
    .from(unitMergeRequests)
    .where(eq(unitMergeRequests.proposedUnitCode, "3F-R3-R4-M"))
    .limit(1);

  if (!existingRejected) {
    const netArea = (
      parseFloat(unit3fR3.netAreaSqft) + parseFloat(unit3fR4.netAreaSqft)
    ).toFixed(2);
    const grossArea = (
      parseFloat(unit3fR3.grossAreaSqft || unit3fR3.netAreaSqft) +
      parseFloat(unit3fR4.grossAreaSqft || unit3fR4.netAreaSqft)
    ).toFixed(2);
    const now = new Date();

    const sourceSnapshot = [
      {
        id: unit3fR3.id,
        unitCode: unit3fR3.unitCode,
        unitNumber: unit3fR3.unitNumber,
        floorId: unit3fR3.floorId,
        floorName: floor3.name,
        categoryId: unit3fR3.categoryId,
        categoryName: "Food Court",
        netAreaSqft: unit3fR3.netAreaSqft,
        grossAreaSqft: unit3fR3.grossAreaSqft,
        ratePerSqftPkr: unit3fR3.ratePerSqftPkr,
        priceAdjustmentPkr: unit3fR3.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit3fR3.ratePerSqftPkr,
          unit3fR3.netAreaSqft,
          "0",
        ),
      },
      {
        id: unit3fR4.id,
        unitCode: unit3fR4.unitCode,
        unitNumber: unit3fR4.unitNumber,
        floorId: unit3fR4.floorId,
        floorName: floor3.name,
        categoryId: unit3fR4.categoryId,
        categoryName: "Food Court",
        netAreaSqft: unit3fR4.netAreaSqft,
        grossAreaSqft: unit3fR4.grossAreaSqft,
        ratePerSqftPkr: unit3fR4.ratePerSqftPkr,
        priceAdjustmentPkr: unit3fR4.priceAdjustmentPkr,
        computedPricePkr: computeTotalPrice(
          unit3fR4.ratePerSqftPkr,
          unit3fR4.netAreaSqft,
          "0",
        ),
      },
    ];

    await db.transaction(async (tx) => {
      const [req] = await tx
        .insert(unitMergeRequests)
        .values({
          propertyId: property.id,
          status: "REJECTED",
          proposedUnitCode: "3F-R3-R4-M",
          proposedUnitNumber: "R3-R4-M",
          targetFloorId: floor3.id,
          targetCategoryId: unit3fR3.categoryId,
          proposedNetAreaSqft: netArea,
          proposedGrossAreaSqft: grossArea,
          proposedRatePerSqftPkr: unit3fR3.ratePerSqftPkr,
          proposedPriceAdjustmentPkr: "0.00",
          reason: "Request to merge restaurant spaces for a mega banquet buffet.",
          proofStoragePath: "merge-proofs/restaurant-proposal.pdf",
          proofMimeType: "application/pdf",
          proofFileName: "restaurant-proposal.pdf",
          sourceUnitsSnapshot: sourceSnapshot,
          requestedBy: salesUser.id,
          reviewedBy: adminUser.id,
          reviewedAt: now,
          rejectionReason:
            "Structural load-bearing partition and central HVAC exhaust shaft cannot be modified per civil & MEP engineering report.",
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .returning();

      for (const s of sourceSnapshot) {
        await tx.insert(unitMergeSources).values({
          mergeRequestId: req.id,
          sourceUnitId: s.id,
          unitCode: s.unitCode,
          unitNumber: s.unitNumber,
          floorName: s.floorName,
          categoryName: s.categoryName,
          netAreaSqft: s.netAreaSqft,
          grossAreaSqft: s.grossAreaSqft,
          ratePerSqftPkr: s.ratePerSqftPkr,
          computedPricePkr: s.computedPricePkr,
        });
      }

      await tx.insert(auditLog).values({
        actorId: adminUser.id,
        entity: "unit_merge",
        entityId: req.id,
        action: "UNIT_MERGE_REJECT",
        before: { status: "PENDING" },
        after: {
          status: "REJECTED",
          rejectionReason: "Structural load-bearing partition cannot be modified",
        },
        createdAt: now,
      });
    });
    console.log(" - Recorded REJECTED merge request on 3F-R3 + 3F-R4");
  }

  console.log("Demo data population finished successfully!");
}

populate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error populating data:", err);
    process.exit(1);
  });
