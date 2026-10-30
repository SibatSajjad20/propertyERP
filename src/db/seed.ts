import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { db } from "./index";
import { account, user } from "./schema/auth";
import { blocks, categories, floors, properties } from "./schema/property";
import type { UserRole } from "./schema/enums";
import { SARDARS_MALL_FLOORS } from "../features/structure/floor-labels";

const DEFAULT_CATEGORIES = [
  { name: "Shop", isSellableDefault: true },
  { name: "Food Court", isSellableDefault: true },
  { name: "Kiosk", isSellableDefault: true },
  { name: "Office", isSellableDefault: true },
  { name: "Amenities", isSellableDefault: false },
  { name: "Meeting Room", isSellableDefault: false },
] as const;

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

function envOr(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

async function ensureUser(spec: SeedUser) {
  const email = spec.email.toLowerCase();
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (!existing) {
    const userId = randomUUID();
    const passwordHash = await hashPassword(spec.password);
    await db.insert(user).values({
      id: userId,
      name: spec.name,
      email,
      emailVerified: true,
      role: spec.role,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
    return;
  }

  if (existing.role !== spec.role) {
    await db.update(user).set({ role: spec.role }).where(eq(user.id, existing.id));
  }
}

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Administrator";

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const [existingProperty] = await db
    .select()
    .from(properties)
    .where(eq(properties.name, "Sardar's Mall"))
    .limit(1);

  let propertyId = existingProperty?.id;
  if (!propertyId) {
    const [created] = await db
      .insert(properties)
      .values({ name: "Sardar's Mall" })
      .returning();
    if (!created) {
      throw new Error("Failed to create property");
    }
    propertyId = created.id;
  }

  const [existingBlock] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.propertyId, propertyId))
    .limit(1);

  let blockId = existingBlock?.id;
  if (!blockId) {
    const [created] = await db
      .insert(blocks)
      .values({ propertyId, name: "Main" })
      .returning();
    if (!created) {
      throw new Error("Failed to create block");
    }
    blockId = created.id;
  }

  const existingFloors = await db
    .select()
    .from(floors)
    .where(eq(floors.blockId, blockId));
  const existingLevels = new Set(existingFloors.map((row) => row.level));
  const missingFloors = SARDARS_MALL_FLOORS.filter(
    (item) => !existingLevels.has(item.level),
  );
  if (missingFloors.length > 0) {
    await db.insert(floors).values(
      missingFloors.map((item) => ({
        blockId,
        name: item.name,
        level: item.level,
      })),
    );
  }

  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.propertyId, propertyId));
  const existingNames = new Set(existingCategories.map((row) => row.name));

  const missing = DEFAULT_CATEGORIES.filter((item) => !existingNames.has(item.name));
  if (missing.length > 0) {
    await db.insert(categories).values(
      missing.map((item) => ({
        propertyId,
        name: item.name,
        isSellableDefault: item.isSellableDefault,
      })),
    );
  }

  await ensureUser({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: "ADMIN",
  });

  await ensureUser({
    email: envOr("INVENTORY_EMAIL", "inventory@sardarsmall.local"),
    password: envOr("INVENTORY_PASSWORD", "ChangeMe_Inventory_2026!"),
    name: envOr("INVENTORY_NAME", "Inventory Manager"),
    role: "INVENTORY_MANAGER",
  });

  await ensureUser({
    email: envOr("SALES_EMAIL", "sales@sardarsmall.local"),
    password: envOr("SALES_PASSWORD", "ChangeMe_Sales_2026!"),
    name: envOr("SALES_NAME", "Sales"),
    role: "SALES",
  });

  console.log("Seed complete.");
  console.log(`Property: Sardar's Mall (${propertyId})`);
  console.log(`Floors: Ground, 1st–10th on Main`);
  console.log(`Admin: ${adminEmail.toLowerCase()}`);
}

seed()
  .then(async () => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
