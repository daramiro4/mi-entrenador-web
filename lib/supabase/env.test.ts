import { describe, expect, it } from "vitest";
import { missingSupabaseVars, requireSupabaseEnv, supabaseEnvMessage } from "./env";

describe("variables de Supabase", () => {
  it("detecta cuáles faltan (undefined, vacío o solo espacios)", () => {
    expect(missingSupabaseVars("https://x.supabase.co", "k")).toEqual([]);
    expect(missingSupabaseVars(undefined, "k")).toEqual(["NEXT_PUBLIC_SUPABASE_URL"]);
    expect(missingSupabaseVars("u", "  ")).toEqual(["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
    expect(missingSupabaseVars("", undefined)).toEqual(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
  });

  it("requireSupabaseEnv lanza un mensaje con el nombre de la variable, sin valores", () => {
    expect(() => requireSupabaseEnv(undefined, "secreto-123")).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    try {
      requireSupabaseEnv(undefined, "secreto-123");
    } catch (e) {
      expect(String(e)).not.toContain("secreto-123");
    }
  });

  it("devuelve los valores cuando están", () => {
    expect(requireSupabaseEnv("u", "k")).toEqual({ url: "u", key: "k" });
  });

  it("el mensaje indica dónde corregirlo", () => {
    expect(supabaseEnvMessage(["A"])).toMatch(/Vercel/);
  });
});
