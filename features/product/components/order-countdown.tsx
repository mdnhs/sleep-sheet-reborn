"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function OrderCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isSameDay, setIsSameDay] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(19, 0, 0, 0); // 7:00 PM

      let diff = target.getTime() - now.getTime();
      let sameDay = true;

      // If past 7:00 PM, set target to 7:00 PM tomorrow
      if (diff < 0) {
        target.setDate(target.getDate() + 1);
        diff = target.getTime() - now.getTime();
        sameDay = false;
      }

      setIsSameDay(sameDay);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
      if (!isReady) setIsReady(true);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isReady]);

  if (!isReady) return null;

  return (
    <div className="mb-2 lg:mb-4 inline-flex items-center gap-2 border border-border rounded-full px-3 py-1 sm:px-4 bg-background w-fit max-w-full">
      <Clock className="text-muted-foreground shrink-0 h-3.5 w-3.5" />
      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
        {t("orderIn")} <span className="font-semibold text-foreground">
          {timeLeft.hours} {t("hour")} {timeLeft.minutes} {t("min")}
        </span> {t("toGet")}{" "}
        <span className="font-semibold text-foreground">
          {isSameDay ? t("sameDayShipment") : t("shipmentTomorrow")}
        </span>
      </p>
    </div>
  );
}
