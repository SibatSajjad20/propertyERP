import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, nextOfKin } from "@/db/schema/sales";
import { ValidationError } from "@/lib/errors";

export type SalesTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ClientUpsertInput = {
  fullName: string;
  relationPrefix: "S/O" | "W/O";
  relationName: string;
  cnic: string;
  phone: string;
  phoneOffice?: string | null;
  phoneRes?: string | null;
  mobile2?: string | null;
  email?: string | null;
  homeAddress: string;
  postalAddress: string;
};

export type KinUpsertInput = {
  name: string;
  relationPrefix: "S/O" | "D/O" | "W/O";
  relationName: string;
  relation: string;
  cnic?: string | null;
  phone: string;
  address?: string | null;
};

export async function upsertClientAndKin(
  tx: SalesTx,
  clientData: ClientUpsertInput,
  kinData?: KinUpsertInput | null,
) {
  let [client] = await tx
    .select()
    .from(clients)
    .where(eq(clients.cnic, clientData.cnic.trim()))
    .limit(1);

  if (!client) {
    [client] = await tx
      .insert(clients)
      .values({
        fullName: clientData.fullName.trim(),
        relationPrefix: clientData.relationPrefix,
        relationName: clientData.relationName.trim(),
        cnic: clientData.cnic.trim(),
        phone: clientData.phone.trim(),
        phoneOffice: clientData.phoneOffice?.trim() || null,
        phoneRes: clientData.phoneRes?.trim() || null,
        mobile2: clientData.mobile2?.trim() || null,
        email: clientData.email?.trim() || null,
        homeAddress: clientData.homeAddress.trim(),
        postalAddress: clientData.postalAddress.trim(),
      })
      .returning();
  } else {
    [client] = await tx
      .update(clients)
      .set({
        fullName: clientData.fullName.trim(),
        relationPrefix: clientData.relationPrefix,
        relationName: clientData.relationName.trim(),
        phone: clientData.phone.trim(),
        phoneOffice: clientData.phoneOffice?.trim() || null,
        phoneRes: clientData.phoneRes?.trim() || null,
        mobile2: clientData.mobile2?.trim() || null,
        email: clientData.email?.trim() || null,
        homeAddress: clientData.homeAddress.trim(),
        postalAddress: clientData.postalAddress.trim(),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, client.id))
      .returning();
  }

  let kin: typeof nextOfKin.$inferSelect | null = null;

  if (kinData && client) {
    const [existingKin] = await tx
      .select()
      .from(nextOfKin)
      .where(eq(nextOfKin.clientId, client.id))
      .limit(1);

    if (existingKin) {
      const [updated] = await tx
        .update(nextOfKin)
        .set({
          name: kinData.name.trim(),
          relationPrefix: kinData.relationPrefix,
          relationName: kinData.relationName.trim(),
          relation: kinData.relation.trim(),
          cnic: kinData.cnic?.trim() || null,
          phone: kinData.phone.trim(),
          address: kinData.address?.trim() || null,
        })
        .where(eq(nextOfKin.id, existingKin.id))
        .returning();
      kin = updated ?? existingKin;
    } else {
      const [inserted] = await tx
        .insert(nextOfKin)
        .values({
          clientId: client.id,
          name: kinData.name.trim(),
          relationPrefix: kinData.relationPrefix,
          relationName: kinData.relationName.trim(),
          relation: kinData.relation.trim(),
          cnic: kinData.cnic?.trim() || null,
          phone: kinData.phone.trim(),
          address: kinData.address?.trim() || null,
        })
        .returning();
      kin = inserted ?? null;
    }
  } else if (client) {
    const [existingKin] = await tx
      .select()
      .from(nextOfKin)
      .where(eq(nextOfKin.clientId, client.id))
      .limit(1);
    kin = existingKin ?? null;
  }

  if (!client) {
    throw new ValidationError("Failed to save client details");
  }

  return { client, kin };
}
