// types/order.ts
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type PaymentMethod = string;
export type SaleType = "POS" | "WEBSITE";

export interface OrderUser {
  id: string;
  name: string;
  email: string;
}

// types/order.ts
export interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    costPrice?: number | null;
    size?: string | null;
    color?: string | null;
    images?: string[];
    product: OrderProduct;
    createdAt: string;
    orderId: string;
  }
  
  export interface OrderProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    variants: string[];
    tags: string[];
    sizes: string[];
    features: string[];
    careInstruction: string | null;
    images: string[];
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    categoryId: string;
  }
  
  export interface Order {
    id: string;
    orderNumber: string;
    userId?: string | null;
    guestName?: string | null;
    guestPhone?: string | null;
    guestEmail?: string | null;
    totalAmount: number;
    subtotal: number;
    shippingCost: number;
    tax: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    shippingAddress: string;
    shippingCity?: string | null;
    shippingState?: string | null;
    shippingPostalCode?: string | null;
    shippingCountry?: string | null;
    trackingNumber?: string | null;
    cancellationReason?: string | null;
    refundedAmount?: number | null;
    refundReason?: string | null;
    refundedAt?: string | null;
    saleType?: SaleType | null;
    reference?: string | null;
    note?: string | null;
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    } | null;
    items: OrderItem[];
    payment?: {
      transactionId?: string | null;
      last4Digits?: string | null;
    } | null;
  }
export interface PaginatedOrders {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}