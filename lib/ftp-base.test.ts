import { describe, expect, it } from "vitest";
import { resolveBaseFtp, validateProvisionalFtp } from "./ftp-base";

describe("validateProvisionalFtp", () => {
  it("acepta números razonables y redondea", () => {
    expect(validateProvisionalFtp("208")).toEqual({ ok: true, value: 208 });
    expect(validateProvisionalFtp("207,6")).toEqual({ ok: true, value: 208 });
  });
  it("rechaza vacío, texto y fuera de rango", () => {
    expect(validateProvisionalFtp("").ok).toBe(false);
    expect(validateProvisionalFtp("abc").ok).toBe(false);
    expect(validateProvisionalFtp("50").ok).toBe(false);
    expect(validateProvisionalFtp("900").ok).toBe(false);
  });
});

describe("resolveBaseFtp", () => {
  const z2Notes = { reacclimatization_discount_pct: -0.15, effective_ftp_watts: 213 };
  it("el FTP medido manda y aplica el descuento de reaclimatación solo en z2", () => {
    expect(resolveBaseFtp({ measured: 200, provisional: 208, sessionType: "z2", notes: z2Notes })).toEqual({ watts: 170, source: "measured" });
    expect(resolveBaseFtp({ measured: 200, provisional: null, sessionType: "quality", notes: z2Notes })?.watts).toBe(200);
  });
  it("el provisional va sin descuento y gana al valor legado del objetivo", () => {
    expect(resolveBaseFtp({ measured: null, provisional: 208, sessionType: "z2", notes: z2Notes })).toEqual({ watts: 208, source: "provisional" });
  });
  it("el FTP de Garmin se usa sin descuento, pero el provisional del usuario lo supera", () => {
    expect(resolveBaseFtp({ measured: null, provisional: null, garmin: 208, sessionType: "z2", notes: z2Notes })).toEqual({ watts: 208, source: "garmin" });
    expect(resolveBaseFtp({ measured: null, provisional: 200, garmin: 208, sessionType: "z2", notes: z2Notes })?.watts).toBe(200);
    expect(resolveBaseFtp({ measured: 190, provisional: 200, garmin: 208, sessionType: "z2", notes: null })?.source).toBe("measured");
  });
  it("sin nada mejor usa el legado y lo marca como estimación del objetivo", () => {
    expect(resolveBaseFtp({ measured: null, provisional: null, sessionType: "z2", notes: z2Notes })).toEqual({ watts: 213, source: "goal_estimate" });
    expect(resolveBaseFtp({ measured: null, provisional: null, sessionType: "z2", notes: null })).toBeNull();
  });
});
