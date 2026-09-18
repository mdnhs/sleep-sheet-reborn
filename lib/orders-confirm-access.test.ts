import { describe, it, expect } from "vitest";
import { isAllowed } from "./permissions";

/**
 * POST /orders/:id/confirm-purchase asked for `orders:update`, an action that
 * does not exist: lib/permissions.ts knows read/write plus a module's named
 * extras, and expandPermissions() never yields `orders:update` for anyone. Only
 * ADMIN (blanket bypass) and MODERATOR (explicit bypass) got through, so a
 * role holding orders:write — the store's own Owner role — was refused.
 */
const OWNER = ["orders:write", "orders:read", "orders:cancel", "pos:write", "reports:read"];
const ORDER_PRINT = ["orders:read"];

const asks = (user: Parameters<typeof isAllowed>[0], action: string) =>
  isAllowed(user, "orders", action, ["MODERATOR"]);

describe("confirm-purchase access", () => {
  it("lets a role with orders:write confirm", () => {
    expect(asks({ role: "USER", permissions: OWNER }, "write")).toBe(true);
  });

  it("would have refused that same role under the old 'update' action", () => {
    expect(asks({ role: "USER", permissions: OWNER }, "update")).toBe(false);
  });

  it("still lets ADMIN and MODERATOR through", () => {
    expect(asks({ role: "ADMIN", permissions: [] }, "write")).toBe(true);
    expect(asks({ role: "MODERATOR", permissions: [] }, "write")).toBe(true);
  });

  it("keeps a read-only role and an ordinary customer out", () => {
    expect(asks({ role: "USER", permissions: ORDER_PRINT }, "write")).toBe(false);
    expect(asks({ role: "USER", permissions: [] }, "write")).toBe(false);
    expect(asks(null, "write")).toBe(false);
  });
});
