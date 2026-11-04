import { describe, expect, it } from "vitest";
import { signupsOpen } from "./personal-mode";

describe("modo pessoal", () => {
  it("os registos só abrem com true", () => {
    expect(signupsOpen({})).toBe(false);
    expect(signupsOpen({ SIGNUPS_ENABLED: "1" })).toBe(false);
    expect(signupsOpen({ SIGNUPS_ENABLED: "true" })).toBe(true);
  });
});
