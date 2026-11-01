import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { buildSeedSql } from "./seed";

const FILE = "supabase/migrations/20261101100200_seed_strength_library.sql";

describe("seed de la biblioteca", () => {
  it("el SQL versionado coincide con la biblioteca en código (UPDATE_SEED=1 para regenerar)", () => {
    const sql = buildSeedSql();
    if (process.env.UPDATE_SEED === "1") writeFileSync(FILE, sql);
    expect(readFileSync(FILE, "utf8")).toBe(sql);
  });
});
