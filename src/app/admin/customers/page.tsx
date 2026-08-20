import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { _count: { select: { events: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 24 }}>
        Kunden ({customers.length})
      </h1>
      {customers.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>Noch keine Kunden registriert.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                {["E-Mail", "Registriert seit", "Events"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", color: "var(--ink-faint)", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>{c.email}</td>
                  <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>
                    {new Intl.DateTimeFormat("de-DE").format(c.createdAt)}
                  </td>
                  <td style={{ padding: "10px 8px" }}>{c._count.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
