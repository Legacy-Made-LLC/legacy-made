import type { CustomerInfo } from "react-native-purchases";

import { hasActiveEntitlement } from "./revenuecat";

function customerInfoWith(
  active: Record<string, { isActive: boolean }>,
): CustomerInfo {
  return {
    entitlements: { active },
  } as unknown as CustomerInfo;
}

describe("hasActiveEntitlement", () => {
  it("returns false when customerInfo is null", () => {
    expect(hasActiveEntitlement(null, "individual")).toBe(false);
  });

  it("returns true when the entitlement is active", () => {
    const info = customerInfoWith({ individual: { isActive: true } });
    expect(hasActiveEntitlement(info, "individual")).toBe(true);
  });

  it("returns false when the entitlement is missing", () => {
    const info = customerInfoWith({});
    expect(hasActiveEntitlement(info, "individual")).toBe(false);
  });

  it("returns false when the entitlement exists but is inactive", () => {
    const info = customerInfoWith({ individual: { isActive: false } });
    expect(hasActiveEntitlement(info, "individual")).toBe(false);
  });

  it("does not match unrelated entitlement ids", () => {
    const info = customerInfoWith({ family: { isActive: true } });
    expect(hasActiveEntitlement(info, "individual")).toBe(false);
  });
});
