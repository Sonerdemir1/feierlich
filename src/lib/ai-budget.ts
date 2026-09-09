import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { AI_FREE_DAILY_BUDGET_USD, AI_FREE_MONTHLY_BUDGET_USD, AI_BUDGET_NOTIFY_RATIO, AiBudgetExceededError } from "@/lib/ai-budget-constants";

export * from "@/lib/ai-budget-constants";

// Selber Empfaenger wie die bestehende Kontaktformular-Benachrichtigung
// (kontakt/actions.ts) — dort ebenfalls als lokale Konstante gehalten statt
// zentral exportiert, hier bewusst genauso uebernommen statt eine neue
// gemeinsame Stelle einzufuehren.
const AI_BUDGET_ALERT_EMAIL = "info@sonerdemir.de";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function startOfNextUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
function isoDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function isoMonthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

async function currentMonthlyCost(monthStart: Date, nextMonthStart: Date): Promise<number> {
  const agg = await prisma.aiFreeUsageDay.aggregate({
    where: { date: { gte: monthStart, lt: nextMonthStart } },
    _sum: { costUsd: true },
  });
  return agg._sum.costUsd ?? 0;
}

// @@unique([period, periodKey]) auf AiBudgetNotification dient als Sperre:
// ein zweiter create()-Versuch fuer denselben Zeitraum wirft einen Fehler,
// den wir hier bewusst als "schon benachrichtigt" schlucken statt als
// echten Fehler zu behandeln — verhindert Mehrfachversand bei jedem
// weiteren Aufruf, solange der Deckel bei >=80% bleibt.
async function notifyOnce(period: "daily" | "monthly", periodKey: string, budgetUsd: number, totalUsd: number) {
  try {
    await prisma.aiBudgetNotification.create({ data: { period, periodKey } });
  } catch {
    return;
  }

  const ratioPercent = Math.round((totalUsd / budgetUsd) * 100);
  const periodLabel = period === "daily" ? "Tages" : "Monats";
  try {
    await sendEmail({
      to: AI_BUDGET_ALERT_EMAIL,
      subject: `einladi — ${periodLabel}-Budget kostenlose KI-Funktionen zu ${ratioPercent}% ausgeschöpft`,
      html:
        `<p>Das ${periodLabel}-Budget für die kostenlosen KI-Funktionen (Textvorschlag + KI-Hochzeitsporträt) ` +
        `liegt bei $${totalUsd.toFixed(2)} von $${budgetUsd.toFixed(2)} (${ratioPercent}%).</p>` +
        `<p>Zeitraum: ${periodKey}</p>`,
    });
  } catch (err) {
    // E-Mail-Versand ist hier nur ein Zusatz (Benachrichtigung), kein
    // kritischer Pfad — ein Fehlschlag darf den eigentlichen KI-Aufruf
    // nicht mit zu Fall bringen, siehe Aufrufer (checkAndRecordAiBudget
    // wird VOR dem eigentlichen OpenAI-Aufruf awaited, ein hier
    // geworfener Fehler wuerde also faelschlich den KI-Aufruf blockieren).
    console.error("[ai-budget] Budget-Benachrichtigung fehlgeschlagen:", err);
  }
}

// Zentrales Gate fuer ALLE kostenlosen KI-Aufrufe (Textvorschlag +
// Hochzeitsportraet) — wird direkt in generateInvitationCopy() (ai-text.ts)
// und generateWeddingPortraitImage() (ai-wedding-portrait.ts) aufgerufen,
// VOR dem eigentlichen OpenAI-Request, damit wirklich JEDER Aufrufer erfasst
// wird (anonyme Route, eingeloggte Route, Dashboard-Assistent, New-Event-
// Wizard) statt an mehreren Stellen einzeln verdrahtet werden zu muessen.
//
// Prueft + verbucht die grobe Kostenschaetzung SOFORT (nicht erst nach
// Erfolg des eigentlichen Aufrufs) — einfacher und robuster gegen
// gleichzeitige Anfragen kurz vor Erreichen des Deckels, auf Kosten einer
// kleinen Ungenauigkeit falls der nachfolgende Aufruf selbst fehlschlaegt
// (dann wurde etwas Budget "verbraucht", obwohl kein Text/Bild entstand) —
// im Rahmen der gewuenschten groben Schaetzung akzeptabel.
export async function checkAndRecordAiBudget(estimatedCostUsd: number): Promise<void> {
  const now = new Date();
  const day = startOfUtcDay(now);
  const monthStart = startOfUtcMonth(now);
  const nextMonthStart = startOfNextUtcMonth(now);

  const [dayRow, monthlySoFar] = await Promise.all([
    prisma.aiFreeUsageDay.findUnique({ where: { date: day } }),
    currentMonthlyCost(monthStart, nextMonthStart),
  ]);
  const dailySoFar = dayRow?.costUsd ?? 0;

  if (dailySoFar + estimatedCostUsd > AI_FREE_DAILY_BUDGET_USD || monthlySoFar + estimatedCostUsd > AI_FREE_MONTHLY_BUDGET_USD) {
    throw new AiBudgetExceededError();
  }

  await prisma.aiFreeUsageDay.upsert({
    where: { date: day },
    update: { costUsd: { increment: estimatedCostUsd }, callCount: { increment: 1 } },
    create: { date: day, costUsd: estimatedCostUsd, callCount: 1 },
  });

  const newDaily = dailySoFar + estimatedCostUsd;
  const newMonthly = monthlySoFar + estimatedCostUsd;
  if (newDaily >= AI_FREE_DAILY_BUDGET_USD * AI_BUDGET_NOTIFY_RATIO) {
    await notifyOnce("daily", isoDateKey(day), AI_FREE_DAILY_BUDGET_USD, newDaily);
  }
  if (newMonthly >= AI_FREE_MONTHLY_BUDGET_USD * AI_BUDGET_NOTIFY_RATIO) {
    await notifyOnce("monthly", isoMonthKey(monthStart), AI_FREE_MONTHLY_BUDGET_USD, newMonthly);
  }
}
