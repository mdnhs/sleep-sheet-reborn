/**
 * Order-creation idempotency key (browser side).
 *
 * One UUID per checkout attempt, persisted in sessionStorage so every submit
 * for the same cart — a double-click, a re-click after a slow network, or a
 * back-then-resubmit — sends the SAME key. The checkout server treats a repeat
 * key as "return the existing order" instead of creating a second row, which
 * (together with the unique index on orders.idempotencyKey) prevents one real
 * transaction from producing duplicate orders (and therefore duplicate Meta
 * Purchase events).
 *
 * The key is cleared on a successful order so the next checkout starts fresh.
 */

const STORAGE_KEY = "checkout_idempotency_key";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers without crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Read the current key, creating and persisting one if none exists yet. */
export function getOrCreateCheckoutIdempotencyKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    let key = sessionStorage.getItem(STORAGE_KEY);
    if (!key) {
      key = uuid();
      sessionStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    // sessionStorage unavailable (private mode / disabled) — degrade gracefully.
    return undefined;
  }
}

/** Drop the current key so the next checkout attempt gets a fresh one. */
export function clearCheckoutIdempotencyKey(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
