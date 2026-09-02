"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Der iframe zeigt die echte Event-Seite mit ?dashboardPreview=1 — dort
// werden Titel/Untertitel/Beschreibung zu contentEditable-Feldern (siehe
// InlineEditableText.tsx), die sich per fetch() selbst speichern. Nach dem
// Speichern schickt das Feld eine postMessage hoch, damit die umgebende
// Dashboard-Seite (Titel-Überschrift, "Details bearbeiten"-Formular) sich
// synchronisiert — der iframe selbst braucht dafür keinen Reload, sein DOM
// zeigt den neuen Text schon direkt an.
export function LivePreviewFrame({ src, frameKey }: { src: string; frameKey: string }) {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "einladi-inline-saved") router.refresh();
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="card" style={{ height: 480, overflow: "hidden" }}>
      <iframe key={frameKey} title="Vorschau der Einladungsseite" src={src} style={{ width: "100%", height: "100%", border: "none" }} />
    </div>
  );
}
