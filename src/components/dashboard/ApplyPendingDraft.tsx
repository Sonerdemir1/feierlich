"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Muss exakt zu PENDING_DRAFT_KEY/STORAGE_KEY in DesignStudio.tsx passen —
// bewusst dupliziert statt importiert (gleiches Muster wie categorySlug in
// gallery-templates.ts), damit dieser winzige Client-Baustein nicht das
// ganze DesignStudio-Modul mitzieht.
const PENDING_DRAFT_KEY = "einladi:pending-draft-template-id";
const DRAFTS_STORAGE_KEY = "einladi:design-drafts:v1";

// Gemountet auf /dashboard (siehe page.tsx) — liest direkt nach dem ersten
// Login den im anonymen Customizer (/gestalten/[id]) hinterlegten Entwurf
// aus localStorage und wandelt ihn ueber /dashboard/apply-draft in ein
// echtes Event um. Schliesst die Luecke, die die Recherche fuer den
// Umsetzungsplan aufgedeckt hat: der CTA "Design speichern & Konto
// erstellen" hat den Entwurf bisher nie wieder ausgelesen.
export function ApplyPendingDraft() {
  const router = useRouter();
  const ran = useRef(false);
  // Sichtbares Feedback statt eines stillen Abbruchs (Bugfix): frueher
  // brach die Uebernahme bei fehlendem Draft oder Serverfehler kommentarlos
  // ab — der Kunde landete nach der Kontoerstellung auf einem leeren
  // Dashboard, ohne zu wissen, dass etwas schiefgelaufen ist. Seit dem Fix
  // in applyAndContinue() (DesignStudio.tsx) ist ein leerer Draft der
  // Regelfall nicht mehr zu erwarten — dieser Zustand bleibt trotzdem als
  // Absicherung, falls z. B. localStorage zwischen CTA-Klick und Login
  // manuell geleert wurde oder der Server-Request fehlschlaegt.
  const [error, setError] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let templateId: string | null;
    try {
      templateId = window.localStorage.getItem(PENDING_DRAFT_KEY);
    } catch {
      return;
    }
    if (!templateId) return;

    // Marker in JEDEM Fall entfernen (Erfolg, fehlender Draft oder
    // Serverfehler), damit nicht bei jedem weiteren Dashboard-Besuch
    // erneut (erfolglos) versucht wird.
    function clearMarker() {
      try {
        window.localStorage.removeItem(PENDING_DRAFT_KEY);
      } catch {
        // localStorage nicht verfuegbar — nichts weiter zu tun.
      }
    }

    (async () => {
      try {
        const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
        const drafts = raw ? JSON.parse(raw) : {};
        const draft = drafts?.[templateId];
        if (!draft) {
          clearMarker();
          setError(true);
          return;
        }

        const res = await fetch("/dashboard/apply-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, draft }),
        });
        clearMarker();
        if (!res.ok) {
          setError(true);
          return;
        }

        const data = await res.json();
        delete drafts[templateId];
        window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
        if (data?.eventId) {
          router.push(`/dashboard/events/${data.eventId}`);
        } else {
          setError(true);
        }
      } catch {
        clearMarker();
        setError(true);
      }
    })();
  }, [router]);

  if (!error) return null;

  return (
    <div
      style={{
        border: "1px solid var(--terracotta-dark, #B2543A)",
        background: "#FBEDE8",
        color: "var(--terracotta-dark, #B2543A)",
        padding: "14px 18px",
        fontSize: 13.5,
        marginBottom: 24,
      }}
    >
      Dein gestaltetes Design konnte nicht automatisch übernommen werden. Bitte lege dein Event
      unten manuell an — deine Design-Auswahl (Farben, Vorlage, Texte) kannst du danach jederzeit
      im Editor nachtragen.
    </div>
  );
}
