import type {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

import {
  DEFAULT_PAYWALL_VARIANT,
  PAYWALL_VARIANTS,
  parseVariant,
  pickSubscriptionPackage,
} from "./paywall";

describe("parseVariant", () => {
  it.each(PAYWALL_VARIANTS)(
    "returns %s when given the matching string",
    (v) => {
      expect(parseVariant(v)).toBe(v);
    },
  );

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

describe("pickSubscriptionPackage", () => {
  const annual = { identifier: "$rc_annual" } as PurchasesPackage;
  const monthly = { identifier: "$rc_monthly" } as PurchasesPackage;
  const offeringWith = (packages: Partial<PurchasesOffering>) =>
    ({ annual: null, monthly: null, ...packages }) as PurchasesOffering;

  it("prefers the annual package when the offering has both", () => {
    expect(pickSubscriptionPackage(offeringWith({ annual, monthly }))).toEqual({
      pkg: annual,
      period: "year",
    });
  });

  it("falls back to monthly when the offering has no annual package", () => {
    expect(pickSubscriptionPackage(offeringWith({ monthly }))).toEqual({
      pkg: monthly,
      period: "month",
    });
  });

  it("returns null when there is no offering or no usable package", () => {
    expect(pickSubscriptionPackage(null)).toBeNull();
    expect(pickSubscriptionPackage(undefined)).toBeNull();
    expect(pickSubscriptionPackage(offeringWith({}))).toBeNull();
  });
});
