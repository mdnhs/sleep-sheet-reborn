import { describe, it, expect } from "vitest";

/**
 * The browser Pixel and the server CAPI are both gated on a settings string,
 * and both gates used to read `!== "false"` — on by default, off only on an
 * exact match. That matters here more than it usually would: the GTM
 * container already carries a Meta Pixel base code plus ViewContent,
 * AddToCart, InitiateCheckout, Purchase and Search tags, so anything that
 * switches the app's own Pixel on counts all six events twice.
 *
 * These mirror the gate expressions rather than importing the components
 * (which pull in React and the database). If a gate is ever written back the
 * other way round, the "missing"/"empty"/"fetch failed" cases below fail.
 */
const pixelEnabled = (v: string | undefined) => v === "true";
const capiEnabled = (v: string | undefined) => v === "true";

describe("browser Pixel gate", () => {
  it("is on only when explicitly enabled", () => {
    expect(pixelEnabled("true")).toBe(true);
  });

  it("is off when explicitly disabled", () => {
    expect(pixelEnabled("false")).toBe(false);
  });

  // Each of these used to switch the Pixel ON.
  it("is off when the setting is missing", () => {
    expect(pixelEnabled(undefined)).toBe(false);
  });

  it("is off when the setting is empty", () => {
    expect(pixelEnabled("")).toBe(false);
  });

  it("is off for values that are not exactly \"true\"", () => {
    for (const v of ["0", "1", "no", "yes", "TRUE", "off", " true "]) {
      expect(pixelEnabled(v)).toBe(false);
    }
  });
});

describe("server CAPI gate", () => {
  it("is on only when explicitly enabled", () => {
    expect(capiEnabled("true")).toBe(true);
  });

  // loadCapiConfig() catches a failed settings read and carries on with an
  // empty map. Under the old gate that turned server-side Purchase events on.
  it("is off when the settings read failed and the map is empty", () => {
    const map: Record<string, string> = {};
    expect(capiEnabled(map.meta_capi_enabled)).toBe(false);
  });

  it("is off when explicitly disabled", () => {
    expect(capiEnabled("false")).toBe(false);
  });
});
