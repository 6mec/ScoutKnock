import { describe, expect, it } from "vitest";
import { eventData, type EventInput } from "./rules";

describe("eventData", () => {
  it("guarda só os campos previstos", () => {
    const event = {
      type: "error",
      data: { area: "auth", code: "x", email: "pessoa@example.com" },
    } as EventInput;

    expect(eventData(event)).toEqual({ area: "auth", code: "x" });
    expect(JSON.stringify(eventData(event))).not.toContain("example.com");
  });

  it("corta textos longos", () => {
    const data = eventData({
      type: "error",
      data: { area: "a".repeat(500), code: "b" },
    });

    expect(data).toMatchObject({ area: "a".repeat(80) });
  });

  it("mantém os números da busca", () => {
    expect(
      eventData({
        type: "search",
        data: {
          service: "website_creation",
          niche: "Barbearias",
          locality: "Porto",
          count: 4,
          calls: 1,
          cancelled: false,
        },
      }),
    ).toMatchObject({ count: 4, calls: 1, cancelled: false });
  });
});
