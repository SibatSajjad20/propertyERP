import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { db } from "./index";
import { account, user } from "./schema/auth";
import { blocks, categories, properties } from "./schema/property";

const DEFAULT_CATEGORIES = [
  { name: "Shop", isSellableDefault: true },
  { name: "Food Court", isSellableDefault: true },
  { name: "Kiosk", isSellableDefault: true },
  { name: "Office", isSellableDefault: true },
  { name: "Amenities", isSellableDefault: false },
  { name: "Meeting Room", isSellableDefault: false },
] as const;

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

  if (!existingBlock) {
    await db.insert(blocks).values({ propertyId, name: "Main" });
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

  const [existingAdmin] = await db
    .select()
    .from(user)
    .where(eq(user.email, adminEmail.toLowerCase()))
    .limit(1);

  if (!existingAdmin) {
    const userId = randomUUID();
    const passwordHash = await hashPassword(adminPassword);
    await db.insert(user).values({
      id: userId,
      name: adminName,
      email: adminEmail.toLowerCase(),
      emailVerified: true,
      role: "ADMIN",
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
  } else if (existingAdmin.role !== "ADMIN") {
    await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, existingAdmin.id));
  }

  console.log("Seed complete.");
  console.log(`Property: Sardar's Mall (${propertyId})`);
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
