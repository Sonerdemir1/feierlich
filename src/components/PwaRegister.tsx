"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installierbarkeit ist ein Bonus, kein kritischer Pfad — Fehler
        // hier duerfen die App nicht stoeren.
      });
    }
  }, []);

  return null;
}
