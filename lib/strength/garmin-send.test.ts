import { describe, expect, it } from "vitest";
import { parseServiceResponse, strengthServiceConfig } from "./garmin-send";

const BOT = "https://mi-entrenador-garmin.vercel.app/api/send_workout";

describe("strengthServiceConfig", () => {
  it("deriva la URL de fuerza de la de bici y usa el secreto compartido", () => {
    expect(strengthServiceConfig({ GARMIN_SEND_SERVICE_URL: BOT, GARMIN_SEND_SECRET: "s" })).toEqual({
      url: "https://mi-entrenador-garmin.vercel.app/api/send_strength",
      secret: "s",
    });
    expect(strengthServiceConfig({ GARMIN_SEND_SERVICE_URL: `${BOT}/`, GARMIN_SEND_SECRET: "s" })?.url).toMatch(/send_strength$/);
  });

  it("la URL explícita tiene prioridad", () => {
    expect(strengthServiceConfig({ GARMIN_STRENGTH_SERVICE_URL: "https://x.test/api/send_strength", GARMIN_SEND_SERVICE_URL: BOT, GARMIN_SEND_SECRET: "s" })?.url).toBe(
      "https://x.test/api/send_strength"
    );
  });

  it("sin secreto o sin URL: no hay configuración", () => {
    expect(strengthServiceConfig({ GARMIN_SEND_SERVICE_URL: BOT })).toBeNull();
    expect(strengthServiceConfig({ GARMIN_SEND_SECRET: "s" })).toBeNull();
    expect(strengthServiceConfig({ GARMIN_SEND_SERVICE_URL: BOT, GARMIN_SEND_SECRET: "  " })).toBeNull();
  });

  it("no inventa la URL si la de bici tiene otra forma", () => {
    expect(strengthServiceConfig({ GARMIN_SEND_SERVICE_URL: "https://x.test/otra-ruta", GARMIN_SEND_SECRET: "s" })).toBeNull();
  });
});

describe("parseServiceResponse", () => {
  it("éxito: id de Garmin como texto y fecha programada", () => {
    expect(parseServiceResponse(200, true, { ok: true, workout_id: 987654, scheduled_for: "2026-11-05" })).toEqual({
      ok: true,
      garminId: "987654",
      scheduledFor: "2026-11-05",
    });
    expect(parseServiceResponse(200, true, { ok: true })).toEqual({ ok: true, garminId: undefined, scheduledFor: null });
  });

  it("error: usa el mensaje del servicio o el código HTTP", () => {
    expect(parseServiceResponse(502, false, { ok: false, error: "login rechazado" })).toEqual({ ok: false, error: "login rechazado", status: 502 });
    expect(parseServiceResponse(401, false, {})).toEqual({ ok: false, error: "El servicio de Garmin respondió 401", status: 401 });
    expect(parseServiceResponse(200, true, { ok: false, error: "raro" })).toMatchObject({ ok: false, error: "raro" });
  });
});
