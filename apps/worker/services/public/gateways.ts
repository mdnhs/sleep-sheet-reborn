/**
 * Real payment-gateway adapters (server-to-server session creation).
 *
 * Each provider is activated by setting its credentials in the environment. When a
 * provider's credentials are absent, the adapter reports "not configured" and the
 * checkout falls back to the sandbox flow — so local/dev keeps working without secrets.
 * Amounts are whole BDT (matching order.grandTotal).
 */

export type GatewayEnv = {
  PAYMENT_GATEWAY_MODE?: string
  SSLCOMMERZ_STORE_ID?: string
  SSLCOMMERZ_STORE_PASSWORD?: string
  BKASH_APP_KEY?: string
  BKASH_APP_SECRET?: string
  BKASH_USERNAME?: string
  BKASH_PASSWORD?: string
}

export type GatewayProvider = 'bKash' | 'SSLCommerz' | 'Nagad'

export type InitiateParams = {
  amount: number
  tranId: string          // our order_payment id (echoed back by the gateway)
  orderNumber: string
  customerName?: string
  customerPhone?: string
  successUrl: string
  failUrl: string
  cancelUrl: string
  ipnUrl: string
}

export type InitiateResult = { redirectUrl: string; providerRef: string }

const isLive = (env: GatewayEnv) => env.PAYMENT_GATEWAY_MODE === 'live'

export function gatewayConfigured(provider: string, env: GatewayEnv): boolean {
  if (provider === 'SSLCommerz') return !!(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD)
  if (provider === 'bKash') return !!(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD)
  return false // Nagad: deferred until credentials/contract are provisioned
}

// ─── SSLCommerz ──────────────────────────────────────────────────────────────────

export function sslcommerzBaseUrl(env: GatewayEnv): string {
  return isLive(env) ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com'
}

/** Pure: the form body SSLCommerz expects for session creation (testable). */
export function buildSslcommerzForm(env: GatewayEnv, p: InitiateParams): Record<string, string> {
  return {
    store_id: env.SSLCOMMERZ_STORE_ID ?? '',
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD ?? '',
    total_amount: String(p.amount),
    currency: 'BDT',
    tran_id: p.tranId,
    success_url: p.successUrl,
    fail_url: p.failUrl,
    cancel_url: p.cancelUrl,
    ipn_url: p.ipnUrl,
    cus_name: p.customerName ?? 'Customer',
    cus_phone: p.customerPhone ?? 'N/A',
    product_name: `Order ${p.orderNumber}`,
    product_category: 'general',
    product_profile: 'general',
    shipping_method: 'NO',
  }
}

async function initiateSslcommerz(env: GatewayEnv, p: InitiateParams): Promise<InitiateResult> {
  const res = await fetch(`${sslcommerzBaseUrl(env)}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(buildSslcommerzForm(env, p)),
  })
  const data = await res.json() as { status?: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string }
  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
    throw new Error(`SSLCommerz init failed: ${data.failedreason ?? data.status ?? 'unknown'}`)
  }
  return { redirectUrl: data.GatewayPageURL, providerRef: data.sessionkey ?? p.tranId }
}

// ─── bKash (tokenized checkout) ──────────────────────────────────────────────────

function bkashBaseUrl(env: GatewayEnv): string {
  return isLive(env)
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
}

async function bkashGrantToken(env: GatewayEnv): Promise<string> {
  const res = await fetch(`${bkashBaseUrl(env)}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', accept: 'application/json',
      username: env.BKASH_USERNAME ?? '', password: env.BKASH_PASSWORD ?? '',
    },
    body: JSON.stringify({ app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET }),
  })
  const data = await res.json() as { id_token?: string; statusMessage?: string }
  if (!data.id_token) throw new Error(`bKash token grant failed: ${data.statusMessage ?? 'unknown'}`)
  return data.id_token
}

async function initiateBkash(env: GatewayEnv, p: InitiateParams): Promise<InitiateResult> {
  const token = await bkashGrantToken(env)
  const res = await fetch(`${bkashBaseUrl(env)}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', accept: 'application/json',
      authorization: token, 'x-app-key': env.BKASH_APP_KEY ?? '',
    },
    body: JSON.stringify({
      mode: '0011', payerReference: p.customerPhone ?? 'N/A', callbackURL: p.ipnUrl,
      amount: String(p.amount), currency: 'BDT', intent: 'sale', merchantInvoiceNumber: p.orderNumber,
    }),
  })
  const data = await res.json() as { bkashURL?: string; paymentID?: string; statusMessage?: string }
  if (!data.bkashURL || !data.paymentID) throw new Error(`bKash create failed: ${data.statusMessage ?? 'unknown'}`)
  return { redirectUrl: data.bkashURL, providerRef: data.paymentID }
}

/** Returns a hosted redirect when the provider is configured; null → use sandbox flow. */
export async function initiateGateway(provider: string, env: GatewayEnv, p: InitiateParams): Promise<InitiateResult | null> {
  if (!gatewayConfigured(provider, env)) return null
  if (provider === 'SSLCommerz') return initiateSslcommerz(env, p)
  if (provider === 'bKash') return initiateBkash(env, p)
  return null
}
