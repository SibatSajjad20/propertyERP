import "server-only";

import { PgBoss } from "pg-boss";
import { logger } from "./logger";

const globalForBoss = globalThis as unknown as {
  boss?: PgBoss;
  bossStarted?: Promise<PgBoss>;
};

export async function getBoss(): Promise<PgBoss> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForBoss.bossStarted) {
    const boss = new PgBoss({
      connectionString: url,
      application_name: "sardars-mall-erp",
    });
    boss.on("error", (error: unknown) => {
      logger.error({ err: error }, "pg-boss error");
    });
    globalForBoss.boss = boss;
    globalForBoss.bossStarted = boss.start().then(() => boss);
  }

  return globalForBoss.bossStarted;
}
