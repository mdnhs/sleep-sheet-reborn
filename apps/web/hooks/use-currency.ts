"use client";

import { useSettings } from "@/features/(saas)/organization/api/use-settings";

export const SUPPORTED_CURRENCIES = [
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka (৳)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
] as const;

const SYMBOL_MAP = Object.fromEntries(
  SUPPORTED_CURRENCIES.map(({ code, symbol }) => [code, symbol])
);

export function useCurrency() {
  const { data: settings } = useSettings();
  const code = settings?.currency ?? "BDT";
  const symbol = SYMBOL_MAP[code] ?? code;

  const formatAmount = (value: number) =>
    `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return { code, symbol, formatAmount };
}
