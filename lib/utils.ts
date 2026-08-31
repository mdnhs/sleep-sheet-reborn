import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subDays, subWeeks, subMonths, subYears, startOfToday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractTags(title: string, content?: string): string[] {
  const genericTags = [
    "Best Comforters in Bangladesh",
    "Best Price Comforters in BD",
    "Sleep Sheet Bangladesh",
    "Premium Bedding Set BD",
    "Home Textile Bangladesh",
  ];

  if (!title) return genericTags;

  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "for", "nor", "on", "at", "to", "from",
    "by", "with", "in", "out", "over", "under", "this", "that", "these", "those",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "how", "what", "why", "where", "when", "who", "which", "tips",
    "guide", "best", "top", "এই", "এবং", "জন্য", "করা", "হলে", "কি", "না", "সেরা",
    "সম্পূর্ণ", "গাইড", "কেনার", "উপভোগ", "করুন", "আরামদায়ক", "কথা", "সম্পর্কে",
  ]);

  const words = title
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  const uniqueTitleTags = Array.from(new Set(words))
    .slice(0, 4)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));

  return Array.from(new Set([...uniqueTitleTags, ...genericTags]));
}

export const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortOptionValue = typeof sortOptions[number]['value'];

export  const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "home-appliances", label: "Home Appliances" },
  { value: "books", label: "Books" },
  { value: "footwear", label: "Footwear" },
];

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long", 
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit",
    // hour12: true, 
  });
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};



export const getDateRange = (period: string) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (period) {
    case "all":
    case "all-time":
      // From the epoch — effectively "no lower bound" without special-casing
      // the query builder, since no real order predates 1970.
      return { startDate: new Date(0), endDate: now };
    case "this-month":
    case "month": {
      const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      return { startDate, endDate };
    }
    case "last-month": {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return { startDate, endDate };
    }
    case "3-months": {
      const startDate = new Date(Date.UTC(year, month - 2, 1, 0, 0, 0, 0));
      return { startDate, endDate: now };
    }
    case "6-months": {
      const startDate = new Date(Date.UTC(year, month - 5, 1, 0, 0, 0, 0));
      return { startDate, endDate: now };
    }
    case "12-months":
    case "year": {
      const startDate = new Date(Date.UTC(year, month - 11, 1, 0, 0, 0, 0));
      return { startDate, endDate: now };
    }
    case "day":
      return { startDate: subDays(now, 1), endDate: now };
    case "week":
      return { startDate: subWeeks(now, 1), endDate: now };
    default: {
      const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      return { startDate, endDate };
    }
  }
};

// Same-length window immediately before the current one, for period-over-period deltas
export const getPreviousDateRange = (period: string) => {
  const { startDate, endDate } = getDateRange(period)
  return getPreviousRange(startDate, endDate)
}

// Same-length window immediately before an arbitrary [startDate, endDate) range
export const getPreviousRange = (startDate: Date, endDate: Date) => {
  const spanMs = endDate.getTime() - startDate.getTime()
  return {
    startDate: new Date(startDate.getTime() - spanMs),
    endDate: startDate,
  }
}

// A custom "from"/"to" pair (query params) takes priority over a preset period.
export const resolveDateRange = (period: string, from?: string, to?: string) => {
  if (from && to) {
    const startDate = new Date(from)
    const endDate = new Date(to)
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
      if (!from.includes("T")) startDate.setHours(0, 0, 0, 0);
      if (!to.includes("T") || endDate.getHours() === 0) endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate }
    }
  }
  return getDateRange(period)
}

// Daily buckets read badly over a long range; roll up to a coarser unit
export const getTrendBucketUnit = (startDate: Date, endDate: Date): "day" | "month" => {
  const spanDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (spanDays > 45) return "month";
  return "day";
};


export function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust to Monday
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1); // default to start of month
  }
}

export function getOptimizedImageUrl(url: string | null | undefined, width?: number): string {
  if (!url) return "";
  const targetWidth = width || 1000;
  if (url.startsWith("https://res.cloudinary.com/")) {
    const uploadIndex = url.indexOf("/image/upload/");
    if (uploadIndex !== -1) {
      const start = url.slice(0, uploadIndex + 14);
      let rest = url.slice(uploadIndex + 14);

      // Strip any old existing Cloudinary transformation segments before re-applying optimized params
      if (/^(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//.test(rest)) {
        rest = rest.replace(/^(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//, "");
      }

      const transform = `f_auto,q_auto:good,c_limit,w_${targetWidth}/`;
      return `${start}${transform}${rest}`;
    }
  }
  return url;
}

export function calculateItemUnitPrice(
  color: string | null | undefined,
  basePrice: number,
  variants?: { name: string; price: number | null }[] | null,
  addOns?: { name: string; price: number }[] | null
): number {
  if (!color) return basePrice;

  let baseColorName = color;
  if (color.includes(" (+ ")) {
    baseColorName = color.split(" (+ ")[0];
  } else if (color.startsWith("Add-ons: ")) {
    baseColorName = "";
  }

  const variant = variants?.find((v) => v.name === baseColorName);
  let price =
    variant && variant.price !== null && variant.price !== undefined
      ? variant.price
      : basePrice;

  if (addOns && addOns.length > 0) {
    for (const addOn of addOns) {
      if (!addOn.name) continue;
      const escapedName = addOn.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`${escapedName}\\s+x(\\d+)`);
      const match = color.match(regex);
      if (match && match[1]) {
        const qty = parseInt(match[1], 10);
        if (!isNaN(qty) && qty > 0) {
          price += addOn.price * qty;
        }
      }
    }
  }

  return price;
}

// Bought-cost counterpart to calculateItemUnitPrice: parses the same
// "BaseVariant (+ AddOnName xN)" encoding out of the stored `color` string
// and sums each matched add-on's costPrice (not its selling price) so admins
// entering an order item's bought price have a number to check against —
// the order item's own costPrice is a single manually-entered field with no
// separate slot for "this also included N curtains," so that cost is easy
// to forget unless it's surfaced explicitly.
export function calculateItemAddOnCost(
  color: string | null | undefined,
  addOns?: { name: string; price: number; costPrice?: number }[] | null
): number {
  if (!color || !addOns || addOns.length === 0) return 0;

  let total = 0;
  for (const addOn of addOns) {
    if (!addOn.name || !addOn.costPrice) continue;
    const escapedName = addOn.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedName}\\s+x(\\d+)`);
    const match = color.match(regex);
    if (match && match[1]) {
      const qty = parseInt(match[1], 10);
      if (!isNaN(qty) && qty > 0) {
        total += addOn.costPrice * qty;
      }
    }
  }
  return total;
}

export function enrichColorWithAddOnPrices(
  color: string | undefined | null,
  addOns?: { name: string; price: number }[] | null,
  formatAmount?: (price: number) => string
): string {
  if (!color) return "";
  if (!addOns || addOns.length === 0) return color;

  let result = color;
  for (const addOn of addOns) {
    if (!addOn.name) continue;
    const escapedName = addOn.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedName}\\s+x\\d+)(?!\\s*\\()`, "g");
    const formattedPrice = formatAmount ? formatAmount(addOn.price) : `${addOn.price} TK`;
    result = result.replace(regex, `$1 (${formattedPrice})`);
  }
  return result;
}

