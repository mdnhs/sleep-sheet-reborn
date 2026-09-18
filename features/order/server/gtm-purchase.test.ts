import { describe, it, expect, vi } from "vitest";

// gtm-purchase imports the hashing helpers from lib/meta-capi, which imports
// the db client and reads DATABASE_URL at import time. Nothing here needs it.
vi.mock("@/db", () => ({ db: {} }));

const {
  buildGtmPurchaseRequest,
  evaluateGtmPurchaseSettings,
  extractMeasurementId,
  normalizeEndpoint,
  sendGtmPurchase,
} = await import("./gtm-purchase");

const config = {
  endpoint: "https://ss.sleepsheetbd.com",
  measurementId: "G-Y62ZKHQGLV",
};

const order = {
  id: "cmorder1",
  orderNumber: "ORD-180926-SMYD9S",
  totalAmount: 2450,
  shippingCost: 60,
  userId: "cmuser1",
  guestEmail: "Rabbi@Example.com ",
  guestPhone: "01711111111",
  fbc: "fb.1.1700000000000.AbCdEf",
  ipAddress: "103.10.10.10",
  userAgent: "Mozilla/5.0 (iPhone)",
  items: [
    { id: "i1", productId: "p1", quantity: 2, price: 1195, product: { name: "Comforter Set" } },
    { id: "i2", productId: null, quantity: 1, price: 60, product: null },
  ],
};

const parse = (r: { body: string }) => JSON.parse(r.body);
const params = (r: { body: string }) => parse(r).events[0].params;

describe("buildGtmPurchaseRequest", () => {
  it("posts a GA4 Measurement Protocol purchase to the container's /mp/collect", () => {
    const r = buildGtmPurchaseRequest(order, config);
    expect(r.url).toBe("https://ss.sleepsheetbd.com/mp/collect?measurement_id=G-Y62ZKHQGLV");
    expect(parse(r).events).toHaveLength(1);
    expect(parse(r).events[0].name).toBe("purchase");
  });

  // Stape's tag reads `event_id || transaction_id` for dedup, and Meta needs
  // the id to be the same wherever the event is sent from.
  it("carries the dedup id and the order number", () => {
    const p = params(buildGtmPurchaseRequest(order, config));
    expect(p.event_id).toBe("purchase_ORD-180926-SMYD9S");
    expect(p.transaction_id).toBe("ORD-180926-SMYD9S");
  });

  it("sends value, currency, shipping and named items", () => {
    const p = params(buildGtmPurchaseRequest(order, config));
    expect(p).toMatchObject({ value: 2450, currency: "BDT", shipping: 60 });
    expect(p.items[0]).toEqual({ item_id: "p1", item_name: "Comforter Set", price: 1195, quantity: 2 });
    // A line whose product was deleted still sends, keyed by the line id.
    expect(p.items[1]).toMatchObject({ item_id: "i2", quantity: 1 });
  });

  // Meta rejects a Purchase with no value at all.
  it("never sends a zero or missing value", () => {
    expect(params(buildGtmPurchaseRequest({ ...order, totalAmount: 0 }, config)).value).toBe(0.01);
    expect(params(buildGtmPurchaseRequest({ ...order, totalAmount: NaN }, config)).value).toBe(0.01);
  });

  describe("customer data", () => {
    it("hashes the email after trimming and lowercasing, and never sends it raw", () => {
      const r = buildGtmPurchaseRequest(order, config);
      const [hashed] = parse(r).user_data.sha256_email_address;
      expect(hashed).toMatch(/^[a-f0-9]{64}$/);
      expect(r.body).not.toContain("rabbi@example.com");
      expect(r.body.toLowerCase()).not.toContain("rabbi@example.com");
      // Trimmed and lowercased before hashing, so the value Meta receives
      // matches what it hashes on its side. Independently computed with
      // `printf 'rabbi@example.com' | shasum -a 256`.
      expect(hashed).toBe("cc79b97fd6a525a2f00ae67ac53b015f07c9bd8ad1cb37a70820d4bc3f11eb7c");
    });

    it("hashes the phone under both the GA4 key and the one Stape reads", () => {
      const u = parse(buildGtmPurchaseRequest(order, config)).user_data;
      expect(u.sha256_phone_number[0]).toMatch(/^[a-f0-9]{64}$/);
      // The Stape tag reads user_data.phone_number and leaves an already
      // hashed value alone.
      expect(u.phone_number).toBe(u.sha256_phone_number[0]);
      expect(JSON.stringify(u)).not.toContain("01711111111");
    });

    it("passes fbc, external_id and the customer's IP through", () => {
      const r = buildGtmPurchaseRequest(order, config);
      expect(params(r).fbc).toBe("fb.1.1700000000000.AbCdEf");
      expect(params(r).external_id).toBe("cmuser1");
      expect(parse(r).ip_override).toBe("103.10.10.10");
    });

    it("forwards the customer's user agent rather than this server's", () => {
      expect(buildGtmPurchaseRequest(order, config).headers["User-Agent"]).toBe("Mozilla/5.0 (iPhone)");
    });

    it("omits what it does not have instead of sending empty fields", () => {
      const r = buildGtmPurchaseRequest(
        { ...order, guestEmail: null, guestPhone: null, fbc: null, userId: null, ipAddress: null },
        config,
      );
      expect(parse(r).user_data).toBeUndefined();
      expect(parse(r).ip_override).toBeUndefined();
      expect(params(r).fbc).toBeUndefined();
      expect(params(r).external_id).toBeUndefined();
    });
  });

  it("uses one GA4 user per customer, not one per order", () => {
    const a = parse(buildGtmPurchaseRequest(order, config)).client_id;
    const b = parse(buildGtmPurchaseRequest({ ...order, id: "cmorder2", orderNumber: "ORD-2" }, config)).client_id;
    expect(a).toBe(b);
    expect(a).toBe("srv.cmuser1");
  });

  it("falls back to the order id when there is no customer account", () => {
    expect(parse(buildGtmPurchaseRequest({ ...order, userId: null }, config)).client_id).toBe("srv.cmorder1");
  });

  it("gives Meta a page_location for event_source_url, and a test code only when set", () => {
    const withBoth = buildGtmPurchaseRequest(order, { ...config, testEventCode: "TEST72052" }, "https://sleepsheetbd.com/");
    expect(params(withBoth).page_location).toBe("https://sleepsheetbd.com/");
    expect(params(withBoth).test_event_code).toBe("TEST72052");
    const bare = buildGtmPurchaseRequest(order, config);
    expect(params(bare).page_location).toBeUndefined();
    expect(params(bare).test_event_code).toBeUndefined();
  });

  it("appends the api secret to the query only when there is one", () => {
    expect(buildGtmPurchaseRequest(order, { ...config, apiSecret: "s3cret" }).url).toContain("&api_secret=s3cret");
    expect(buildGtmPurchaseRequest(order, config).url).not.toContain("api_secret");
  });
});

describe("evaluateGtmPurchaseSettings", () => {
  const ok = { gtm_purchase_endpoint: "https://ss.sleepsheetbd.com/", google_analytics_id: "G-Y62ZKHQGLV" };

  it("is ready and normalises the endpoint", () => {
    const r = evaluateGtmPurchaseSettings(ok);
    expect(r).toMatchObject({ ready: true, config: { endpoint: "https://ss.sleepsheetbd.com", measurementId: "G-Y62ZKHQGLV" } });
  });

  it("carries the optional secret and test code", () => {
    const r = evaluateGtmPurchaseSettings({ ...ok, gtm_purchase_api_secret: " s ", meta_capi_test_event_code: " TEST1 " });
    expect(r).toMatchObject({ ready: true, config: { apiSecret: "s", testEventCode: "TEST1" } });
  });

  // "Not set up" and "set up wrong" must stay distinct: the first falls back to
  // direct CAPI, the second must surface as an error.
  it("reports an empty endpoint as not configured", () => {
    expect(evaluateGtmPurchaseSettings({ google_analytics_id: "G-Y62ZKHQGLV" })).toMatchObject({ ready: false, reason: "not_configured" });
    expect(evaluateGtmPurchaseSettings({ ...ok, gtm_purchase_endpoint: "  " })).toMatchObject({ reason: "not_configured" });
  });

  it("reports a non-https or malformed endpoint as invalid, not as absent", () => {
    for (const bad of ["http://ss.sleepsheetbd.com", "ss.sleepsheetbd.com", "https://ss.sleepsheetbd.com/path", "https://a b.com"]) {
      expect(evaluateGtmPurchaseSettings({ ...ok, gtm_purchase_endpoint: bad })).toMatchObject({ ready: false, reason: "invalid_endpoint" });
    }
  });

  it("needs a GA4 measurement id", () => {
    expect(evaluateGtmPurchaseSettings({ gtm_purchase_endpoint: "https://ss.sleepsheetbd.com" }))
      .toMatchObject({ ready: false, reason: "missing_measurement_id" });
  });
});

describe("helpers", () => {
  it("normalizeEndpoint", () => {
    expect(normalizeEndpoint("https://ss.example.com///")).toBe("https://ss.example.com");
    expect(normalizeEndpoint("http://ss.example.com")).toBeUndefined();
    expect(normalizeEndpoint(undefined)).toBeUndefined();
  });

  it("extractMeasurementId pulls a G- id out of pasted text", () => {
    expect(extractMeasurementId("  g-y62zkhqglv ")).toBe("G-Y62ZKHQGLV");
    expect(extractMeasurementId("GTM-PQ667JWQ")).toBeUndefined();
    expect(extractMeasurementId("")).toBeUndefined();
  });
});

describe("sendGtmPurchase", () => {
  const req = buildGtmPurchaseRequest(order, { ...config, apiSecret: "s3cret" });

  it("succeeds on a 2xx", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    expect(await sendGtmPurchase(req, fetchImpl)).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(req.url, expect.objectContaining({ method: "POST", body: req.body }));
  });

  // A 404 is what the server container returns when no client claims /mp/collect.
  it("reports the status when the container refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = (async () => new Response("no client", { status: 404 })) as unknown as typeof fetch;
    expect(await sendGtmPurchase(req, fetchImpl)).toEqual({ ok: false, status: 404, detail: "HTTP 404" });
  });

  it("does not throw when the request itself fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = (async () => { throw new Error("getaddrinfo ENOTFOUND"); }) as unknown as typeof fetch;
    expect(await sendGtmPurchase(req, fetchImpl)).toEqual({ ok: false, detail: "getaddrinfo ENOTFOUND" });
  });

  it("keeps the api secret out of the logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    await sendGtmPurchase(req, fetchImpl);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain("s3cret");
    expect(logged).toContain("api_secret=***");
  });
});
