import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteGuestButton } from "@/components/dashboard/DeleteGuestButton";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { publicHost } from "@/lib/site";
import type { Prisma } from "@/generated/prisma/client";

const statusLabel: Record<string, string> = { YES: "Zusage", NO: "Absage", PENDING: "Offen" };
const statusColor: Record<string, string> = { YES: "#5B7A4E", NO: "#B2543A", PENDING: "#8A7F6E" };

export default async function GuestListPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[id]/guests">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const q = typeof sp.q === "string" ? sp.q : "";
  const statusFilter = typeof sp.status === "string" ? sp.status : "";

  const where: Prisma.GuestWhereInput = {
    eventId: id,
    ...(q ? { firstName: { contains: q } } : {}),
    ...(statusFilter ? { rsvp: statusFilter === "PENDING" ? { is: null } : { status: statusFilter as "YES" | "NO" } } : {}),
  };

  const guests = await prisma.guest.findMany({
    where,
    include: { rsvp: true },
    orderBy: { firstName: "asc" },
  });

  const totalPersons = guests.reduce((sum, g) => sum + (g.rsvp?.status === "YES" ? (g.rsvp.attendingCount ?? g.invitedCount) : 0), 0);

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)" }}>
            Gästeliste — {event.title}
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
            {guests.length} Gäste angezeigt · {totalPersons} Personen zugesagt
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/dashboard/events/${id}/guests/export`} className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            CSV exportieren
          </a>
          <Link href={`/dashboard/events/${id}/guests/new`} className="btn btn-primary">
            + Gast hinzufügen
          </Link>
        </div>
      </div>

      <form method="get" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nach Namen suchen…"
          style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, flex: "1 1 200px" }}
        />
        <select
          name="status"
          defaultValue={statusFilter}
          style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}
        >
          <option value="">Alle Status</option>
          <option value="YES">Zusage</option>
          <option value="NO">Absage</option>
          <option value="PENDING">Offen</option>
        </select>
        <button type="submit" className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 12.5 }}>
          Filtern
        </button>
      </form>

      {guests.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", padding: "40px 24px", textAlign: "center", color: "var(--ink-soft)", fontSize: 13.5 }}>
          Keine Gäste gefunden.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                {["Name", "Status", "Personen", "Menü", "Kontakt", "Notizen", "Persönlicher Link", "Geöffnet", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", color: "var(--ink-faint)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const status = g.rsvp?.status ?? "PENDING";
                return (
                  <tr key={g.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {g.firstName} {g.lastName ?? ""}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ color: statusColor[status], fontWeight: 600, fontSize: 12 }}>{statusLabel[status]}</span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>{g.rsvp?.attendingCount ?? g.invitedCount}</td>
                    <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{g.rsvp?.menuChoice ?? "—"}</td>
                    <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{g.email ?? g.phone ?? "—"}</td>
                    <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{g.notes ?? "—"}</td>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <CopyLinkButton
                        url={`https://${publicHost()}/e/${event.slug}?g=${g.inviteToken}`}
                        className="btn btn-ghost"
                        style={{ padding: "6px 10px", fontSize: 11 }}
                      />
                    </td>
                    <td style={{ padding: "10px 8px", color: "var(--ink-soft)", fontSize: 12 }}>
                      {g.firstOpenedAt ? (
                        <span title={`${g.openCount}× aufgerufen`}>
                          ✓ {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(g.firstOpenedAt)}
                        </span>
                      ) : (
                        "noch nicht"
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <Link href={`/dashboard/events/${id}/guests/${g.id}/edit`} style={{ fontSize: 12, marginRight: 12 }}>
                        Bearbeiten
                      </Link>
                      <DeleteGuestButton eventId={id} guestId={g.id} guestName={g.firstName} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
