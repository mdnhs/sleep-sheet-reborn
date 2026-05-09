import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subDays, subWeeks, subMonths, startOfToday } from 'date-fns'

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
  const now = startOfToday()
  
  switch(period) {
    case 'day': 
      return { startDate: subDays(now, 1), endDate: now }
    case 'week':
      return { startDate: subWeeks(now, 1), endDate: now }
    case 'month':
      return { startDate: subMonths(now, 1), endDate: now }
    default:
      return { startDate: subMonths(now, 1), endDate: now }
  }
}


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
