import { describe, it, expect, vi } from "vitest";

// meta-capi imports the db client, which reads DATABASE_URL at import time.
// evaluateCapiConfig is pure, so a stand-in is all it needs.
vi.mock("@/db", () => ({ db: {} }));

const { evaluateCapiConfig } = await import("./index");

const ready = { enabled: true, pixelId: "1041069494713009", accessToken: "tok" };

describe("evaluateCapiConfig", () => {
  it("is ready when enabled with a pixel id and a token", () => {
    expect(evaluateCapiConfig(ready)).toEqual({ ready: true });
  });

  // The case that produced a bare 500: CAPI off in settings, and the orders
  // route could not tell that apart from Meta rejecting the event.
  it("names the switch when CAPI is turned off", () => {
    const r = evaluateCapiConfig({ ...ready, enabled: false });
    expect(r).toMatchObject({ ready: false, reason: "disabled" });
    if (!r.ready) expect(r.message).toMatch(/turned off/i);
  });

  it("names the pixel id when it is missing", () => {
    expect(evaluateCapiConfig({ ...ready, pixelId: "" }))
      .toMatchObject({ ready: false, reason: "missing_pixel_id" });
  });

  it("names the token when it is missing", () => {
    expect(evaluateCapiConfig({ ...ready, accessToken: "" }))
      .toMatchObject({ ready: false, reason: "missing_access_token" });
  });

  // Same precedence as the old inline condition, so the message points at the
  // first thing to fix rather than the last.
  it("reports the switch before the credentials", () => {
    expect(evaluateCapiConfig({ enabled: false, pixelId: "", accessToken: "" }))
      .toMatchObject({ reason: "disabled" });
    expect(evaluateCapiConfig({ enabled: true, pixelId: "", accessToken: "" }))
      .toMatchObject({ reason: "missing_pixel_id" });
  });

  it("points staff at the settings page in every message", () => {
    for (const cfg of [
      { ...ready, enabled: false },
      { ...ready, pixelId: "" },
      { ...ready, accessToken: "" },
    ]) {
      const r = evaluateCapiConfig(cfg);
      if (!r.ready) expect(r.message).toContain("Settings > Purchase events");
    }
  });
});
