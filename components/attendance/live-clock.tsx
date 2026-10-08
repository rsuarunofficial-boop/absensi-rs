"use client";

import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime();

    const intervalId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div aria-live="off">
      <p className="mt-1 text-4xl font-bold tracking-tight">
        {now ? timeFormatter.format(now) : "--:--"}
      </p>
      <p className="mt-1 text-sm capitalize text-emerald-100">
        {now ? dateFormatter.format(now) : "Memuat waktu..."}
      </p>
    </div>
  );
}
