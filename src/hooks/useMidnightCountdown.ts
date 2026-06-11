"use client";

import { useEffect, useState } from "react";
import { getMsUntilMidnightUTC } from "@/lib/mining-math";

export function useMidnightCountdown() {
  const [countdown, setCountdown] = useState(getMsUntilMidnightUTC());

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getMsUntilMidnightUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}
