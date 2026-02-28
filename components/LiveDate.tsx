"use client";

import { useEffect, useState } from "react";

export default function LiveDate() {
  const [dateStr, setDateStr] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setDateStr(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          timeZone: "Europe/Warsaw",
        })
      );
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!dateStr) return null;
  return <>{dateStr}</>;
}
