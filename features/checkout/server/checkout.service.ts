import db from "@/lib/db";
import { ServiceError } from "@/lib/service-error";

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  address: string | null;
};

type ShippingInfo = {
  fullName: string;
  phone: string;
  email?: string | null;
  address: string;
  shippingZone: string;
};

type PaymentInfo = {
  paymentMethod: "card" | "cod";
  cardNumber?: string;
  expirationDate?: string;
};

type GuestItem = {
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

type LineItem = {
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  price: number;
};

type PlaceOrderInput = {
  user: SessionUser | null;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  guestItems?: GuestItem[];
};

const DEFAULT_SHIPPING = { inside: 60, outside: 120 } as const;

async function getShippingCost(zone: string): Promise<number> {
  const key = zone === "outside_dhaka" ? "shipping_outside_dhaka" : "shipping_inside_dhaka";
  const setting = await db.siteSetting.findUnique({ where: { key } });
  if (setting) return Number(setting.value);
  return zone === "outside_dhaka" ? DEFAULT_SHIPPING.outside : DEFAULT_SHIPPING.inside;
}

async function assertPaymentMethodEnabled(method: "card" | "cod"): Promise<void> {
  const key = method === "card" ? "payment_method_card" : "payment_method_cod";
  const setting = await db.siteSetting.findUnique({ where: { key } });
  const enabled = setting ? setting.value !== "false" : true;
  if (!enabled) {
    throw new ServiceError(`Payment method "${method}" is currently unavailable`);
  }
}

function summarize(items: LineItem[], shippingCost: number) {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  return { subtotal, shippingCost, totalAmount: subtotal + shippingCost };
}

function cardPayment(paymentInfo: PaymentInfo, amount: number) {
  if (paymentInfo.paymentMethod !== "card" || !paymentInfo.cardNumber) return null;
  return {
    amount,
    method: "CARD" as const,
    transactionId: paymentInfo.cardNumber,
    last4Digits: paymentInfo.cardNumber.slice(-4),
    expirationDate: paymentInfo.expirationDate,
    status: "COMPLETED" as const,
  };
}

async function decrementStock(items: LineItem[]): Promise<void> {
  for (const item of items) {
    await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}

async function buildItemsForUser(userId: string): Promise<LineItem[]> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new ServiceError("Cart is empty");
  }

  return cart.items.map((item: any) => {
    if (item.product.stock < item.quantity) {
      throw new ServiceError(`Insufficient stock for ${item.product.name}`);
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.product.price,
    };
  });
}

async function buildItemsForGuest(guestItems: GuestItem[]): Promise<LineItem[]> {
  if (!guestItems || guestItems.length === 0) {
    throw new ServiceError("Cart is empty");
  }

  const products = await db.product.findMany({
    where: { id: { in: guestItems.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  return guestItems.map((item) => {
    const product: any = productMap.get(item.productId);
    if (!product) throw new ServiceError("Product not found");
    if (product.stock < item.quantity) {
      throw new ServiceError(`Insufficient stock for ${product.name}`);
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: product.price,
    };
  });
}

async function placeUserOrder(
  user: SessionUser,
  shippingInfo: ShippingInfo,
  paymentInfo: PaymentInfo,
) {
  const items = await buildItemsForUser(user.id);
  const { subtotal, shippingCost, totalAmount } = summarize(
    items,
    await getShippingCost(shippingInfo.shippingZone),
  );
  const payment = cardPayment(paymentInfo, totalAmount);

  const order = await db.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      userId: user.id,
      subtotal,
      totalAmount,
      tax: 0,
      shippingCost,
      shippingAddress: shippingInfo.address,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
      paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        })),
      },
      ...(payment && { payment: { create: payment } }),
    },
  });

  await decrementStock(items);
  await db.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

  return { message: "Order placed successfully", order };
}

async function placeGuestOrder(shippingInfo: ShippingInfo, paymentInfo: PaymentInfo, guestItems: GuestItem[]) {
  const items = await buildItemsForGuest(guestItems);
  const { subtotal, shippingCost, totalAmount } = summarize(
    items,
    await getShippingCost(shippingInfo.shippingZone),
  );

  const order = await db.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      userId: undefined,
      guestName: shippingInfo.fullName,
      guestPhone: shippingInfo.phone,
      guestEmail: shippingInfo.email || null,
      subtotal,
      totalAmount,
      tax: 0,
      shippingCost,
      shippingAddress: shippingInfo.address,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
      paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
    },
  });

  if (!order) throw new ServiceError("Failed to create order", 500);

  await db.orderItem.createMany({
    data: items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size ?? null,
      color: item.color ?? null,
    })),
  });

  const payment = cardPayment(paymentInfo, totalAmount);
  if (payment) {
    await db.payment.create({ data: { orderId: order.id, ...payment } });
  }

  await decrementStock(items);

  return { message: "Order placed successfully", orderId: order.id };
}

/** Place an order for a logged-in user or a guest. */
export async function placeOrder({ user, shippingInfo, paymentInfo, guestItems }: PlaceOrderInput) {
  await assertPaymentMethodEnabled(paymentInfo.paymentMethod);
  return user
    ? placeUserOrder(user, shippingInfo, paymentInfo)
    : placeGuestOrder(shippingInfo, paymentInfo, guestItems ?? []);
}

export async function listShippingMethods() {
  const shippingMethods = await db.shippingMethod.findMany({
    where: { active: true },
    orderBy: { cost: "asc" },
  });
  return { shippingMethods };
}
