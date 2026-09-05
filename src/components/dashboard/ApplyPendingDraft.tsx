"use client";

import { useEffect, useRef } from "react";
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

    (async () => {
      try {
        const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
        const drafts = raw ? JSON.parse(raw) : {};
        const draft = drafts?.[templateId];
        if (!draft) return;

        const res = await fetch("/dashboard/apply-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, draft }),
        });
        // Marker in jedem Fall (Erfolg oder Fehlschlag) entfernen, damit bei
        // einem serverseitigen Fehler nicht bei jedem weiteren Dashboard-
        // Besuch erneut (erfolglos) versucht wird — der Entwurf selbst bleibt
        // bei einem Fehlschlag in localStorage stehen, falls spaeter ein
        // manueller Reparaturweg noetig wird.
        window.localStorage.removeItem(PENDING_DRAFT_KEY);
        if (!res.ok) return;

        const data = await res.json();
        delete drafts[templateId];
        window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
        if (data?.eventId) router.push(`/dashboard/events/${data.eventId}`);
      } catch {
        try {
          window.localStorage.removeItem(PENDING_DRAFT_KEY);
        } catch {
          // localStorage nicht verfuegbar — nichts weiter zu tun.
        }
      }
    })();
  }, [router]);

  return null;
}
