import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { blocks, floors, properties } from "@/db/schema/property";
import { units } from "@/db/schema/units";

export type StructureProperty = {
  id: string;
  name: string;
};

export type StructureBlock = {
  id: string;
  name: string;
  floorCount: number;
};

export type StructureFloor = {
  id: string;
  name: string;
  level: number;
  unitCount: number;
};

export type StructureScreenData = {
  properties: StructureProperty[];
  selectedProperty: StructureProperty | null;
  blocks: StructureBlock[];
  selectedBlock: StructureBlock | null;
  floors: StructureFloor[];
};

export async function getStructureScreenData(
  propertyId?: string,
  blockId?: string,
): Promise<StructureScreenData> {
  const [propertyRows, blockRows, floorRows] = await Promise.all([
    db
      .select({
        id: properties.id,
        name: properties.name,
      })
      .from(properties)
      .where(isNull(properties.archivedAt))
      .orderBy(properties.name),
    db
      .select({
        id: blocks.id,
        name: blocks.name,
        propertyId: blocks.propertyId,
        floorCount: sql<number>`count(${floors.id})::int`,
      })
      .from(blocks)
      .leftJoin(floors, and(eq(floors.blockId, blocks.id), isNull(floors.archivedAt)))
      .where(isNull(blocks.archivedAt))
      .groupBy(blocks.id)
      .orderBy(blocks.name),
    db
      .select({
        id: floors.id,
        name: floors.name,
        level: floors.level,
        blockId: floors.blockId,
        unitCount: sql<number>`count(${units.id})::int`,
      })
      .from(floors)
      .leftJoin(units, and(eq(units.floorId, floors.id), isNull(units.archivedAt)))
      .where(isNull(floors.archivedAt))
      .groupBy(floors.id)
      .orderBy(floors.level, floors.name),
  ]);

  const selectedProperty =
    propertyRows.find((row) => row.id === propertyId) ??
    propertyRows.find((row) => row.name === "Sardar's Mall") ??
    propertyRows[0] ??
    null;

  if (!selectedProperty) {
    return {
      properties: [],
      selectedProperty: null,
      blocks: [],
      selectedBlock: null,
      floors: [],
    };
  }

  const blocksWithCounts: StructureBlock[] = blockRows
    .filter((row) => row.propertyId === selectedProperty.id)
    .map((row) => ({
      id: row.id,
      name: row.name,
      floorCount: Number(row.floorCount),
    }));

  const selectedBlock =
    blocksWithCounts.find((row) => row.id === blockId) ??
    blocksWithCounts.find((row) => row.name === "Main") ??
    blocksWithCounts[0] ??
    null;

  if (!selectedBlock) {
    return {
      properties: propertyRows,
      selectedProperty,
      blocks: blocksWithCounts,
      selectedBlock: null,
      floors: [],
    };
  }

  return {
    properties: propertyRows,
    selectedProperty,
    blocks: blocksWithCounts,
    selectedBlock,
    floors: floorRows
      .filter((row) => row.blockId === selectedBlock.id)
      .map((row) => ({
        id: row.id,
        name: row.name,
        level: row.level,
        unitCount: Number(row.unitCount),
      })),
  };
}
