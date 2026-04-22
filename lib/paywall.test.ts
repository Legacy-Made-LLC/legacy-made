import {
  DEFAULT_PAYWALL_VARIANT,
  PAYWALL_VARIANTS,
  parseVariant,
} from "./paywall";

describe("parseVariant", () => {
  it.each(PAYWALL_VARIANTS)("returns %s when given the matching string", (v) => {
    expect(parseVariant(v)).toBe(v);
  });

  it("falls back to default for unknown strings", () => {
    expect(parseVariant("letter")).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant("")).toBe(DEFAULT_PAYWALL_VARIANT);
  });

  it("falls back to default for inherited Object property names", () => {
    // Prevents the `raw in VARIANTS` footgun where "toString" / "constructor"
    // would falsely match because of prototype lookup.
    expect(parseVariant("toString")).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant("constructor")).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant("hasOwnProperty")).toBe(DEFAULT_PAYWALL_VARIANT);
  });

  it("falls back to default for non-string inputs", () => {
    expect(parseVariant(null)).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant(undefined)).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant(42)).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant({})).toBe(DEFAULT_PAYWALL_VARIANT);
    expect(parseVariant(["editorial"])).toBe(DEFAULT_PAYWALL_VARIANT);
  });
});
