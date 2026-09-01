import { describe, expect, it } from "vitest";
import { addDays, daysBetween, getMondayOfWeek, getWeekEndDate, getWeekdayIndex } from "./week";

describe("addDays", () => {
  it("suma días dentro del mismo mes", () => {
    expect(addDays("2026-09-01", 1)).toBe("2026-09-02");
  });

  it("cruza el límite de mes", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("acepta días negativos", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });
});

describe("daysBetween", () => {
  it("cuenta días completos entre dos fechas", () => {
    expect(daysBetween("2026-08-31", "2026-09-07")).toBe(7);
  });

  it("es 0 para la misma fecha", () => {
    expect(daysBetween("2026-09-01", "2026-09-01")).toBe(0);
  });

  it("es negativo si toDate es anterior", () => {
    expect(daysBetween("2026-09-07", "2026-08-31")).toBe(-7);
  });
});

describe("getMondayOfWeek", () => {
  it("un lunes se devuelve a sí mismo", () => {
    expect(getMondayOfWeek("2026-08-31")).toBe("2026-08-31");
  });

  it("un domingo devuelve el lunes de esa misma semana (no el siguiente)", () => {
    expect(getMondayOfWeek("2026-09-06")).toBe("2026-08-31");
  });

  it("un miércoles devuelve el lunes de esa semana", () => {
    expect(getMondayOfWeek("2026-09-02")).toBe("2026-08-31");
  });
});

describe("getWeekEndDate", () => {
  it("devuelve el domingo, 6 días después del lunes", () => {
    expect(getWeekEndDate("2026-08-31")).toBe("2026-09-06");
  });
});

describe("getWeekdayIndex", () => {
  it("lunes es 0", () => {
    expect(getWeekdayIndex("2026-08-31")).toBe(0);
  });

  it("domingo es 6", () => {
    expect(getWeekdayIndex("2026-09-06")).toBe(6);
  });

  it("miércoles es 2", () => {
    expect(getWeekdayIndex("2026-09-02")).toBe(2);
  });
});
