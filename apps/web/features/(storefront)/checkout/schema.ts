import { z } from "zod";

export const SHIPPING_ZONES = {
  inside_dhaka: { label: "Inside Dhaka", cost: 60 },
  outside_dhaka: { label: "Outside Dhaka", cost: 120 },
} as const;

export type ShippingZone = keyof typeof SHIPPING_ZONES;

export const shippingInformationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().min(1, "Address is required"),
  shippingZone: z.enum(["inside_dhaka", "outside_dhaka"], {
    error: "Please select a delivery zone",
  }),
});

export const paymentInformationSchema = z.object({
  paymentMethod: z.enum(['card', 'cod']),
  cardNumber: z.string().optional(),
  expirationDate: z.string().optional(),
  cvv: z.string().optional(),
  nameOnCard: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'card') {
    if (!data.cardNumber || data.cardNumber.length !== 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card number must be 16 digits",
        path: ['cardNumber']
      });
    }

    if (!data.expirationDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expirationDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid expiry format (MM/YY)",
        path: ['expirationDate']
      });
    } else {
      const [monthStr, yearStr] = data.expirationDate.split('/');
      const expMonth = parseInt(monthStr, 10);
      const expYear = parseInt(`20${yearStr}`, 10);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Card has expired",
          path: ['expirationDate']
        });
      }
    }

    if (!data.cvv || data.cvv.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CVV must be 3 digits",
        path: ['cvv']
      });
    }

    if (!data.nameOnCard || data.nameOnCard.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name on card is required",
        path: ['nameOnCard']
      });
    }
  }
});

export const confirmationInformationSchema = z.object({
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export const deliveryAndPaymentSchema = shippingInformationSchema.and(
  z.object({
    paymentMethod: z.enum(["card", "cod"]),
    cardNumber: z.string().optional(),
    expirationDate: z.string().optional(),
    cvv: z.string().optional(),
    nameOnCard: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.paymentMethod === "card") {
      if (!data.cardNumber || data.cardNumber.length !== 16) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card number must be 16 digits", path: ["cardNumber"] });
      }
      if (!data.expirationDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expirationDate)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid expiry format (MM/YY)", path: ["expirationDate"] });
      } else {
        const [monthStr, yearStr] = data.expirationDate.split("/");
        const expMonth = parseInt(monthStr, 10);
        const expYear = parseInt(`20${yearStr}`, 10);
        const now = new Date();
        if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card has expired", path: ["expirationDate"] });
        }
      }
      if (!data.cvv || data.cvv.length !== 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVV must be 3 digits", path: ["cvv"] });
      }
      if (!data.nameOnCard || data.nameOnCard.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Name on card is required", path: ["nameOnCard"] });
      }
    }
  })
);

export type ShippingInformationFormValues = z.infer<typeof shippingInformationSchema>;
export type PaymentInformationFormValues = z.infer<typeof paymentInformationSchema>;
export type DeliveryAndPaymentFormValues = z.infer<typeof deliveryAndPaymentSchema>;
export type ConfirmationInformationSchemaFormValues = z.infer<typeof confirmationInformationSchema>;
