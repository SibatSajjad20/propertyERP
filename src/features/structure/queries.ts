import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, floors, properties } from "@/db/schema/property";

export async function getStructureTree() {
  const allProperties = await db.select().from(properties).orderBy(properties.name);
  const allBlocks = await db.select().from(blocks).orderBy(blocks.name);
  const allFloors = await db.select().from(floors).orderBy(floors.name);

  return allProperties.map((property) => ({
    ...property,
    blocks: allBlocks
      .filter((block) => block.propertyId === property.id)
      .map((block) => ({
        ...block,
        floors: allFloors.filter((floor) => floor.blockId === block.id),
      })),
  }));
}

export async function getDefaultProperty() {
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.name, "Sardar's Mall"))
    .limit(1);
  return property ?? null;
}
