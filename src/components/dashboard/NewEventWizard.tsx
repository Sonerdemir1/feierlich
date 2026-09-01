"use client";

import { useState } from "react";
import { EventTypePicker } from "./EventTypePicker";
import { TemplatePicker } from "./TemplatePicker";
import { createEvent } from "@/app/dashboard/events/actions";
import { PlaceAutocompleteInput } from "./PlaceAutocompleteInput";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

type EventTypeOption = { id: string; name: string; category: string };
type TemplateOption = { id: string; name: string; category: string; layoutKey: string };

const STEPS = ["Eventtyp", "Template", "Eventdaten"] as const;

export function NewEventWizard({
  eventTypes,
  templates,
}: {
  eventTypes: EventTypeOption[];
  templates: TemplateOption[];
}) {
  const [step, setStep] = useState(0);
  const [eventTypeId, setEventTypeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

  const canAdvance = [Boolean(eventTypeId), Boolean(templateId), Boolean(title && eventDate)];

  return (
    <form action={createEvent}>
      <input type="hidden" name="eventTypeId" value={eventTypeId} />
      <input type="hidden" name="templateId" value={templateId} />

      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {STEPS.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "10px 0",
              textAlign: "center",
              fontSize: 12,
              fontWeight: i === step ? 600 : 400,
              color: i <= step ? "var(--ink)" : "var(--ink-faint)",
              borderBottom: i <= step ? "2px solid var(--terracotta)" : "2px solid var(--line)",
            }}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <EventTypePicker eventTypes={eventTypes} value={eventTypeId} onChange={setEventTypeId} />
      )}

      {step === 1 && <TemplatePicker templates={templates} value={templateId} onChange={setTemplateId} />}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 480 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Titel (z. B. &bdquo;Anna &amp; Lukas&ldquo; oder &bdquo;Firmenfeier 2027&ldquo;)
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Datum
              <input
                type="date"
                name="eventDate"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Uhrzeit (optional)
              <input
                type="time"
                name="eventTime"
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Location (optional)
            <input
              type="text"
              name="locationName"
              placeholder="z. B. Schloss Ehrenfels"
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Adresse (optional)
            {GOOGLE_MAPS_API_KEY ? (
              <PlaceAutocompleteInput
                apiKey={GOOGLE_MAPS_API_KEY}
                name="locationAddress"
                latName="locationLat"
                lngName="locationLng"
                placeholder="Adresse eingeben und Vorschlag auswählen"
              />
            ) : (
              <input
                type="text"
                name="locationAddress"
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            )}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Beschreibung (optional)
            <textarea
              name="description"
              rows={3}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5, fontFamily: "inherit" }}
            />
          </label>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, maxWidth: 480 }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          style={{ visibility: step === 0 ? "hidden" : "visible" }}
        >
          Zurück
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canAdvance[step]}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            style={{ opacity: canAdvance[step] ? 1 : 0.4 }}
          >
            Weiter
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={!canAdvance[2]} style={{ opacity: canAdvance[2] ? 1 : 0.4 }}>
            Event anlegen
          </button>
        )}
      </div>
    </form>
  );
}
