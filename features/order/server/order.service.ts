import db from "@/lib/db";
import { deserializeProduct } from "@/lib/json-fields";
import { ServiceError } from "@/lib/service-error";

// Order items embed a Product whose array fields are JSON strings in D1.
// Deserialize them so clients receive real arrays (images, tags, ...).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withProductArrays<T extends { items?: any[] }>(order: T): T {
  if (!order?.items) return order;
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: item.product ? deserializeProduct(item.product) : item.product,
    })),
  };
}

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Order placed and pending confirmation.",
  PROCESSING: "Order is being processed.",
  SHIPPED: "Order has been shipped.",
  DELIVERED: "Order delivered to customer.",
  CANCELLED: "Order was cancelled by the user or admin.",
};

export async function listOrders(search?: string) {
  const orders = await db.order.findMany({
    where: search
      ? {
          OR: [
            { orderNumber: { contains: search } },
            { user: { OR: [{ name: { contains: search } }, { email: { contains: search } }] } },
          ],
        }
      : {},
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: true } },
      shippingMethod: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { orders: orders.map(withProductArrays) };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  paymentStatus: string,
) {
  const [updatedOrder] = await db.$transaction([
    db.order.update({
      where: { id },
      data: { status, paymentStatus },
      include: { user: true, items: true },
    }),
    db.orderTimelineEvent.create({
      data: {
        orderId: id,
        status,
        message: `${STATUS_MESSAGES[status] || `Status changed to ${status}`}, payment status is now ${paymentStatus.toLowerCase()}.`,
      },
    }),
  ]);

  return updatedOrder;
}

export async function deleteOrder(id: string) {
  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId: id } }),
    db.payment.deleteMany({ where: { orderId: id } }),
    db.order.delete({ where: { id } }),
  ]);
  return { success: true };
}

export async function getUserOrders(userId: string) {
  const order = await db.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  return { order: order.map(withProductArrays) };
}

export async function getOrdersByPhone(phone: string) {
  const orders = await db.order.findMany({
    where: { guestPhone: phone },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { orders: orders.map(withProductArrays) };
}

export async function getOrderById(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: true } },
      shippingMethod: true,
      payment: true,
      OrderTimelineEvent: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) throw new ServiceError("Order not found", 404);

  return { order: withProductArrays(order) };
}
