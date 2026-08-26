"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addPhotoTag, removePhotoTag, getEventGuestsForTagging } from "@/app/e/[slug]/actions";
import type { PhotoTagResult } from "@/app/e/[slug]/actions";

type Guest = { id: string; firstName: string; groupLabel: string | null };
type TaggedGuest = { id: string; firstName: string };

export function PhotoTagger({
  eventId,
  mediaId,
  imageUrl,
  imageAlt = "",
  initialTags = [],
}: {
  eventId: string;
  mediaId: string;
  imageUrl: string;
  imageAlt?: string;
  initialTags?: TaggedGuest[];
}) {
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<TaggedGuest[]>(initialTags);
  const [isPending, startTransition] = useTransition();
  const [popoverError, setPopoverError] = useState<string | null>(null);
  const [errorChipId, setErrorChipId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Gaestelisten sind ueberschaubar (typischerweise unter 300 Personen) —
  // einmal laden, sobald das Suchfeld zum ersten Mal geoeffnet wird, danach
  // rein clientseitig filtern statt pro Tastenanschlag zum Server zu gehen.
  const loadingGuests = open && guests === null;

  useEffect(() => {
    if (!open || guests !== null) return;
    let cancelled = false;
    getEventGuestsForTagging(eventId).then((data) => {
      if (!cancelled) setGuests(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, guests, eventId]);

  function closePopover() {
    setOpen(false);
    setPopoverError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) closePopover();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePopover();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const taggedIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = (guests ?? []).filter((g) => !taggedIds.has(g.id));
    if (!q) return candidates;
    return candidates.filter(
      (g) => g.firstName.toLowerCase().includes(q) || g.groupLabel?.toLowerCase().includes(q)
    );
  }, [guests, taggedIds, query]);

  function handleAdd(guest: Guest) {
    setTags((prev) => [...prev, { id: guest.id, firstName: guest.firstName }]);
    setQuery("");
    setPopoverError(null);
    startTransition(async () => {
      const result: PhotoTagResult = await addPhotoTag(mediaId, guest.id);
      if (!result.success) {
        setTags((prev) => prev.filter((t) => t.id !== guest.id));
        setPopoverError(result.error);
      }
    });
  }

  function handleRemove(guest: TaggedGuest) {
    setTags((prev) => prev.filter((t) => t.id !== guest.id));
    startTransition(async () => {
      const result: PhotoTagResult = await removePhotoTag(mediaId, guest.id);
      if (!result.success) {
        setTags((prev) => [...prev, guest]);
        setErrorChipId(guest.id);
        setTimeout(() => setErrorChipId((id) => (id === guest.id ? null : id)), 1400);
      }
    });
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- guest upload, unknown dimensions */}
        <img
          src={imageUrl}
          alt={imageAlt}
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
        />

        <button
          type="button"
          onClick={() => (open ? closePopover() : setOpen(true))}
          disabled={isPending}
          aria-label="Person auf diesem Foto markieren"
          aria-expanded={open}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: "var(--terracotta)",
            color: "var(--ivory)",
            fontSize: 15,
            lineHeight: 1,
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>

        {open && (
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: 38,
              right: 8,
              width: 210,
              maxWidth: "calc(100% - 16px)",
              background: "var(--ivory)",
              border: "1px solid var(--line)",
              zIndex: 5,
              padding: 10,
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Person suchen …"
              autoFocus
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 12.5,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--ink)",
                fontFamily: "var(--font-body)",
              }}
            />
            {popoverError && (
              <div style={{ fontSize: 11, color: "var(--terracotta-dark)", marginTop: 6 }}>{popoverError}</div>
            )}
            <div style={{ maxHeight: 168, overflowY: "auto", marginTop: 8 }}>
              {loadingGuests && (
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "6px 2px" }}>Lädt …</div>
              )}
              {!loadingGuests && filtered.length === 0 && (
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "6px 2px" }}>
                  Keine Treffer.
                </div>
              )}
              {filtered.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleAdd(g)}
                  disabled={isPending}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 8px",
                    fontSize: 12.5,
                    color: "var(--ink)",
                    background: "none",
                    border: "none",
                    cursor: isPending ? "default" : "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {g.firstName}
                  {g.groupLabel && (
                    <span style={{ color: "var(--ink-faint)", fontSize: 11 }}> · {g.groupLabel}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {tags.map((t) => (
            <span
              key={t.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                padding: "4px 8px 4px 10px",
                border: `1px solid ${t.id === errorChipId ? "var(--terracotta-dark)" : "var(--line)"}`,
                borderRadius: 999,
                color: t.id === errorChipId ? "var(--terracotta-dark)" : "var(--ink-soft)",
                fontFamily: "var(--font-body)",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              {t.firstName}
              <button
                type="button"
                onClick={() => handleRemove(t)}
                disabled={isPending}
                aria-label={`${t.firstName} entfernen`}
                style={{
                  border: "none",
                  background: "none",
                  cursor: isPending ? "default" : "pointer",
                  color: "var(--ink-faint)",
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
