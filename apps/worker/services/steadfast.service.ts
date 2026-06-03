import {
  createSteadfastOrder,
  getSteadfastStatusByInvoice,
  getSteadfastBalance,
} from "../integrations/steadfast";
import db from "@repo/database";
import type { OrderStatus } from "@repo/types";
import { ServiceError } from "../utils/service-error";

function mapSteadfastStatus(s: string): OrderStatus | null {
  switch (s) {
    case "delivered":
    case "partial_delivered":
    case "delivered_approval_pending":
    case "partial_delivered_approval_pending":
      return "DELIVERED";
    case "cancelled":
    case "cancelled_approval_pending":
      return "CANCELLED";
    case "hold":
    case "in_review":
    case "pending":
      return "PROCESSING";
    default:
      return null;
  }
}

export async function getBalance() {
  return getSteadfastBalance();
}

export async function bookOrder(input: { orderId: string; recipient_phone: string; note?: string }) {
  const { orderId, recipient_phone, note } = input;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true } } },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  const address = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const payload = {
    invoice: order.orderNumber,
    recipient_name: order.user?.name ?? order.guestName ?? "Guest",
    recipient_phone,
    recipient_address: address,
    cod_amount: order.paymentMethod === "COD" ? order.totalAmount : 0,
    note,
  };
  console.log("[Steadfast] booking payload:", JSON.stringify(payload));

  const result = await createSteadfastOrder(payload);

  await db.order.update({
    where: { id: orderId },
    data: { trackingNumber: result.consignment?.tracking_code ?? null, status: "PROCESSING" },
  });

  await db.orderTimelineEvent.create({
    data: {
      orderId,
      status: "PROCESSING",
      message: `Booked with Steadfast Courier. Tracking: ${result.consignment?.tracking_code}. Consignment ID: ${result.consignment?.consignment_id}.`,
    },
  });

  return { success: true, consignment: result.consignment };
}

export async function syncOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ServiceError("Order not found", 404);
  if (!order.trackingNumber) throw new ServiceError("No tracking number", 400);

  const data = await getSteadfastStatusByInvoice(order.orderNumber);
  const mapped = mapSteadfastStatus(data.delivery_status);

  if (mapped && mapped !== order.status) {
    await db.order.update({ where: { id: orderId }, data: { status: mapped } });
    await db.orderTimelineEvent.create({
      data: {
        orderId,
        status: mapped,
        message: `Status synced from Steadfast: ${data.delivery_status}`,
      },
    });
  }

  return { delivery_status: data.delivery_status, mapped, updated: mapped !== order.status };
}
