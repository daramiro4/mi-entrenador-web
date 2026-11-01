import { describe, expect, it } from "vitest";
import {
  getActivityTypeCircleClass,
  getActivityTypeLabel,
  getFtpMethodColorClass,
  getFtpMethodLabel,
} from "./labels";

describe("getActivityTypeLabel", () => {
  it("mapea un tipo conocido", () => {
    expect(getActivityTypeLabel("cycling")).toBe("Ciclismo");
  });

  it("cae a Otro para un tipo desconocido", () => {
    expect(getActivityTypeLabel("swimming")).toBe("Otro");
  });
});

describe("getActivityTypeCircleClass", () => {
  it("mapea un tipo conocido", () => {
    expect(getActivityTypeCircleClass("strength")).toBe("bg-fog/15 border-fog text-paper");
  });

  it("cae a la clase de Otro para un tipo desconocido", () => {
    expect(getActivityTypeCircleClass("swimming")).toBe(getActivityTypeCircleClass("other"));
  });
});

describe("getFtpMethodLabel", () => {
  it("mapea un método conocido", () => {
    expect(getFtpMethodLabel("ramp_test")).toBe("Ramp test");
  });

  it("cae a Otro para null o desconocido", () => {
    expect(getFtpMethodLabel(null)).toBe("Otro");
    expect(getFtpMethodLabel("otro_metodo")).toBe("Otro");
  });
});

describe("getFtpMethodColorClass", () => {
  it("mapea un método conocido", () => {
    expect(getFtpMethodColorClass("manual")).toBe("text-paper border-paper");
  });

  it("cae a fog para null o desconocido", () => {
    expect(getFtpMethodColorClass(null)).toBe("text-fog border-fog");
    expect(getFtpMethodColorClass("otro_metodo")).toBe("text-fog border-fog");
  });
});
