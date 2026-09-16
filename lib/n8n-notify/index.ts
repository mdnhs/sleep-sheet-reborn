/** Fire-and-forget notification to n8n for realtime Telegram order alerts.
 * No-op unless N8N_ORDER_WEBHOOK_URL is set. Never awaited by callers so a
 * slow/down n8n instance can't add latency to checkout or fail the order. */

interface OrderNotifyPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
}

export function notifyNewOrder(payload: OrderNotifyPayload): void {
  const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error("n8n order notify failed:", error);
  });
}
