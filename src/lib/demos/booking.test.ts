import { describe, expect, it } from "vitest";
import { bookingByDefault, bookingMessage, checkBookingRequest, formatBookingDate, todayIn } from "./booking";

const base = { service: "Corte e barba", date: "2026-11-10", time: "15:30", name: "Rui", note: "" };

describe("pedidos de marcação", () => {
  it("valida nome, dia a partir de hoje e hora", () => {
    expect(checkBookingRequest(base, "2026-11-04")).toBeNull();
    expect(checkBookingRequest({ ...base, name: "  " }, "2026-11-04")).toBe("name");
    expect(checkBookingRequest({ ...base, date: "2026-11-03" }, "2026-11-04")).toBe("date");
    expect(checkBookingRequest({ ...base, date: "10/11/2026" }, "2026-11-04")).toBe("date");
    expect(checkBookingRequest({ ...base, time: "25:00" }, "2026-11-04")).toBe("time");
    expect(checkBookingRequest({ ...base, date: "2026-11-04" }, "2026-11-04")).toBeNull();
  });

  it("escreve o pedido com o dia por extenso", () => {
    expect(formatBookingDate("2026-11-10")).toBe("terça-feira, 10 de novembro");
    const text = bookingMessage({ ...base, note: "Primeira vez" });
    expect(text).toContain("corte e barba para terça-feira, 10 de novembro, às 15:30");
    expect(text).toContain("Rui");
    expect(text).toContain("Primeira vez");
  });

  it("sem serviço escolhido, pede um horário", () => {
    expect(bookingMessage({ ...base, service: "" })).toContain("marcar um horário para");
  });

  it("liga as marcações nos nichos onde se marca hora", () => {
    expect(bookingByDefault("barbearia")).toBe(true);
    expect(bookingByDefault("loja")).toBe(false);
  });

  it("o dia de hoje é o de Lisboa", () => {
    expect(todayIn("Europe/Lisbon", new Date("2026-11-04T23:30:00Z"))).toBe("2026-11-04");
  });
});
