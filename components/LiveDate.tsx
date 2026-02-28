"use client";

import { useEffect, useState } from "react";

export default function LiveDate() {
  const [dateStr, setDateStr] = useState("");

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
    // Update every minute
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return <>{dateStr}</>;
}
