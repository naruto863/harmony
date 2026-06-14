import { beforeEach, describe, expect, it } from "vitest";
import { clearTokens, getAccessToken, getRefreshToken, setTokens, TOKEN_STORAGE_POLICY } from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("centralizes token reads, writes, and cleanup in localStorage", () => {
    setTokens("access-token", "refresh-token");

    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("documents the accepted localStorage risk and migration target", () => {
    expect(TOKEN_STORAGE_POLICY.current).toBe("localStorage");
    expect(TOKEN_STORAGE_POLICY.acceptedRisk).toContain("tokenStorage.ts");
    expect(TOKEN_STORAGE_POLICY.migrationTarget).toContain("httpOnly Cookie");
  });
});
