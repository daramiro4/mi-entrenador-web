import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  safeNextPath,
  userHasPassword,
  translateAuthError,
  validateLogin,
  validateNewPassword,
} from "./auth-validation";

describe("validateLogin", () => {
  it("exige email y contraseña", () => {
    expect(validateLogin("", "x")).toBe("Escribe tu email.");
    expect(validateLogin("no-es-email", "x")).toBe("El email no parece válido.");
    expect(validateLogin("a@b.co", "")).toBe("Escribe tu contraseña.");
  });
  it("acepta credenciales bien formadas (con espacios en el email)", () => {
    expect(validateLogin(" a@b.co ", "secreto")).toBeNull();
  });
});

describe("validateNewPassword", () => {
  it("rechaza contraseñas cortas", () => {
    expect(validateNewPassword("a".repeat(MIN_PASSWORD_LENGTH - 1), "a".repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(/al menos/);
  });
  it("rechaza confirmación distinta", () => {
    expect(validateNewPassword("12345678", "12345679")).toBe("Las contraseñas no coinciden.");
  });
  it("acepta contraseña válida confirmada", () => {
    expect(validateNewPassword("12345678", "12345678")).toBeNull();
  });
});

describe("translateAuthError", () => {
  it("traduce credenciales inválidas y límites", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("Email o contraseña incorrectos.");
    expect(translateAuthError("email rate limit exceeded")).toMatch(/Demasiados intentos/);
    expect(translateAuthError("Signups not allowed for otp")).toMatch(/No existe/);
  });
  it("no filtra mensajes desconocidos", () => {
    expect(translateAuthError("boom internal 500")).toMatch(/No se ha podido/);
  });
});

describe("safeNextPath", () => {
  it("solo permite rutas internas", () => {
    expect(safeNextPath("/auth/reset")).toBe("/auth/reset");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("userHasPassword", () => {
  it("solo true si la marca es exactamente true", () => {
    expect(userHasPassword({ user_metadata: { has_password: true } })).toBe(true);
    expect(userHasPassword({ user_metadata: {} })).toBe(false);
    expect(userHasPassword({ user_metadata: { has_password: "true" } })).toBe(false);
    expect(userHasPassword({ user_metadata: null })).toBe(false);
    expect(userHasPassword({})).toBe(false);
  });
});
