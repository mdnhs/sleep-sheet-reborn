/**
 * Billing provider abstraction. Real provider HTTP integration (bKash/Nagad/
 * SSLCommerz) requires merchant credentials and is wired per-environment. Here
 * we model the inbound, verified, idempotent webhook contract that every
 * provider must satisfy. Never trust client-side payment responses.
 */

export type ProviderName = 'bKash' | 'Nagad' | 'SSLCommerz' | 'MANUAL'

export type WebhookPayload = {
  invoiceId: string
  providerRef: string        // provider transaction id
  status: 'success' | 'failed'
  idempotencyKey: string     // unique per provider event
  signature?: string
}

export function isValidProvider(p: string): p is ProviderName {
  return p === 'bKash' || p === 'Nagad' || p === 'SSLCommerz' || p === 'MANUAL'
}

/**
 * Verifies a webhook is authentic. With a configured per-provider secret we
 * require an exact signature match; without one (local/dev) we require only a
 * well-formed payload. Real deployments must set the secret.
 */
export function verifyWebhook(payload: Partial<WebhookPayload>, secret?: string): payload is WebhookPayload {
  if (!payload || typeof payload.invoiceId !== 'string' || typeof payload.providerRef !== 'string') return false
  if (typeof payload.idempotencyKey !== 'string' || !payload.idempotencyKey) return false
  if (payload.status !== 'success' && payload.status !== 'failed') return false
  if (secret) {
    const expected = `${payload.invoiceId}:${payload.providerRef}:${payload.status}:${secret}`
    return payload.signature === expected
  }
  return true
}
