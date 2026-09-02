import { prisma } from "./prisma";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Taeglichen Aufrufe-Zaehler erhoehen (separat vom laufenden Event.viewCount)
// — Grundlage fuer den Trend-Chart im Dashboard.
export async function recordEventView(eventId: string): Promise<void> {
  const date = startOfUtcDay(new Date());
  await prisma.eventViewDay.upsert({
    where: { eventId_date: { eventId, date } },
    update: { count: { increment: 1 } },
    create: { eventId, date, count: 1 },
  });
}

export type DailyViews = { date: Date; count: number };

// Liefert genau `days` Tage (aelteste zuerst), fehlende Tage als 0 aufgefuellt
// — der Chart bekommt so immer eine lueckenlose Zeitachse statt nur der Tage
// mit tatsaechlichen Aufrufen.
export async function getViewsTrend(eventId: string, days = 14): Promise<DailyViews[]> {
  const today = startOfUtcDay(new Date());
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await prisma.eventViewDay.findMany({ where: { eventId, date: { gte: since } } });
  const byDate = new Map(rows.map((r) => [r.date.toISOString(), r.count]));

  const result: DailyViews[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    result.push({ date: d, count: byDate.get(d.toISOString()) ?? 0 });
  }
  return result;
}
