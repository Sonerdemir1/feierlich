// Baut eine .ics-Kalenderdatei (RFC 5545) fuer ein Event — reiner Text,
// kein externer Dienst noetig. Zeit wird als TZID=Europe/Berlin statt UTC
// geschrieben: Kalender-Apps (Apple/Outlook/Google) loesen die Zeitzone
// beim Import selbst korrekt auf, ganz ohne eingebettetes VTIMEZONE-Block.
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcsEvent({
  uid,
  title,
  description,
  location,
  date,
  time,
  durationHours = 4,
}: {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  date: Date;
  time?: string | null; // "HH:MM", optional (dann ganztaegig)
  durationHours?: number;
}): string {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  let dtStartLine: string;
  let dtEndLine: string;

  const timeMatch = time?.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hh = Number(timeMatch[1]);
    const mm = Number(timeMatch[2]);
    dtStartLine = `DTSTART;TZID=Europe/Berlin:${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
    const end = new Date(Date.UTC(y, m - 1, d, hh, mm));
    end.setUTCHours(end.getUTCHours() + durationHours);
    dtEndLine = `DTEND;TZID=Europe/Berlin:${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}T${pad(end.getUTCHours())}${pad(end.getUTCMinutes())}00`;
  } else {
    dtStartLine = `DTSTART;VALUE=DATE:${y}${pad(m)}${pad(d)}`;
    const end = new Date(Date.UTC(y, m - 1, d + 1));
    dtEndLine = `DTEND;VALUE=DATE:${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//einladi//event//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@einladi.de`,
    `DTSTAMP:${dtstamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcsText(title)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

// Wandelt eine lokale Berlin-Uhrzeit in den passenden UTC-Zeitstempel um
// (Sommer-/Winterzeit automatisch via Intl aufgeloest) — nur fuer den
// Google-Kalender-Link noetig, der echte UTC-Zeiten statt TZID erwartet.
function berlinWallTimeToUtc(y: number, m: number, d: number, hh: number, mm: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" }).formatToParts(guess);
  const offsetLabel = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const offsetHours = Number(offsetLabel.match(/GMT([+-]\d+)/)?.[1] ?? 1);
  return new Date(Date.UTC(y, m - 1, d, hh - offsetHours, mm));
}

export function googleCalendarUrl({
  title,
  description,
  location,
  date,
  time,
  durationHours = 4,
}: {
  title: string;
  description?: string | null;
  location?: string | null;
  date: Date;
  time?: string | null;
  durationHours?: number;
}): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const fmt = (dt: Date) =>
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;

  let dates: string;
  const timeMatch = time?.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hh = Number(timeMatch[1]);
    const mm = Number(timeMatch[2]);
    const start = berlinWallTimeToUtc(y, m, d, hh, mm);
    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + durationHours);
    dates = `${fmt(start)}/${fmt(end)}`;
  } else {
    const startStr = `${y}${pad(m)}${pad(d)}`;
    const endDate = new Date(Date.UTC(y, m - 1, d + 1));
    const endStr = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}`;
    dates = `${startStr}/${endStr}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    ...(description ? { details: description } : {}),
    ...(location ? { location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
