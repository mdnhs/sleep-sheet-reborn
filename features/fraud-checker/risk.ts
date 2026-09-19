import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";

export type Risk = "none" | "low" | "medium" | "high";

// Thresholds are a judgement call, not BD Courier's: with no parcels there is
// nothing to judge, and a few parcels either way isn't a strong signal.
export function getRisk(total: number, ratio: number): Risk {
  if (total === 0) return "none";
  if (ratio >= 80) return "low";
  if (ratio >= 60) return "medium";
  return "high";
}

// `label`/`verdict` are English, for the badge on the (English) Orders page.
// `bn` is the Bengali copy the Fraud Checker page renders.
export const RISK_STYLES: Record<
  Risk,
  {
    label: string;
    verdict: string;
    bn: { label: string; verdict: string };
    icon: typeof ShieldCheck;
    badge: string;
    pill: string;
    bar: string;
    stroke: string;
    text: string;
    panel: string;
  }
> = {
  none: {
    label: "No history",
    verdict: "No delivery history found for this number.",
    bn: {
      label: "কোনো রেকর্ড নেই (No History)",
      verdict: "এই নম্বরে কোনো কুরিয়ার ডেলিভারির রেকর্ড পাওয়া যায়নি।",
    },
    icon: ShieldQuestion,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
    pill: "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
    bar: "bg-slate-400",
    stroke: "stroke-slate-300 dark:stroke-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    panel: "bg-slate-50 dark:bg-slate-900/40",
  },
  low: {
    label: "Low risk",
    verdict: "Strong delivery record — safe to ship.",
    bn: {
      label: "নিরাপদ ক্রেতা (Safe Delivery)",
      verdict: "নিরাপদ কাস্টমার! সফল ডেলিভারির হার অনেক ভালো।",
    },
    icon: ShieldCheck,
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    pill: "border-emerald-500 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400",
    bar: "bg-emerald-500",
    stroke: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    panel: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  medium: {
    label: "Medium risk",
    verdict: "Mixed record — consider confirming the order by phone first.",
    bn: {
      label: "মাঝারি ঝুঁকি (Medium Risk)",
      verdict: "ডেলিভারির রেকর্ড মিশ্র। পাঠানোর আগে ফোন করে অর্ডারটি কনফার্ম করে নিন।",
    },
    icon: ShieldAlert,
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    pill: "border-amber-500 text-amber-600 dark:border-amber-500 dark:text-amber-400",
    bar: "bg-amber-500",
    stroke: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    panel: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  high: {
    label: "High risk",
    verdict: "Poor delivery record — take advance payment before shipping.",
    bn: {
      label: "উচ্চ ঝুঁকি (High Risk)",
      verdict: "ঝুঁকিপূর্ণ কাস্টমার! অগ্রিম পেমেন্ট ছাড়া পার্সেল পাঠাবেন না।",
    },
    icon: ShieldX,
    badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    pill: "border-red-500 text-red-600 dark:border-red-500 dark:text-red-400",
    bar: "bg-red-500",
    stroke: "stroke-red-500",
    text: "text-red-600 dark:text-red-400",
    panel: "bg-red-50/60 dark:bg-red-950/20",
  },
};
