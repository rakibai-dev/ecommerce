import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "@/lib/require-admin";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));

describe("requireAdmin", () => {
  beforeEach(() => {
    mocks.redirect.mockClear();
  });

  it("lets an admin through without redirecting", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { role: "ADMIN" } });

    await expect(requireAdmin()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects signed-in non-admins to /login?callbackUrl=/admin", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { role: "USER" } });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login?callbackUrl=/admin");
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects anonymous visitors", async () => {
    mocks.auth.mockResolvedValueOnce(null);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login?callbackUrl=/admin");
  });
});
