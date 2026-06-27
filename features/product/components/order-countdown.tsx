"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function OrderCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isSameDay, setIsSameDay] = useState(true);

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

      const pad = (num: number) => String(num).padStart(2, "0");
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="mb-2 lg:mb-4 inline-flex items-center gap-2 border border-border rounded-full px-3 py-1 sm:px-4 bg-background w-fit max-w-full">
      <Clock className="text-muted-foreground shrink-0 h-3.5 w-3.5" />
      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
        Order in <span className="font-semibold text-foreground">{timeLeft}</span> to get{" "}
        <span className="font-semibold text-foreground">
          {isSameDay ? "same day shipment" : "shipment tomorrow"}
        </span>
      </p>
    </div>
  );
}
