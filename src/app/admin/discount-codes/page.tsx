import { prisma } from "@/lib/prisma";
import { createDiscountCode, toggleDiscountCodeActive, deleteDiscountCode } from "./actions";

function statusFor(code: { active: boolean; expiresAt: Date | null; maxUses: number | null; usedCount: number }) {
  if (!code.active) return { label: "Deaktiviert", color: "#8A7F6E" };
  if (code.expiresAt && code.expiresAt < new Date()) return { label: "Abgelaufen", color: "#B2543A" };
  if (code.maxUses !== null && code.usedCount >= code.maxUses) return { label: "Ausgeschöpft", color: "#B2543A" };
  return { label: "Aktiv", color: "#5B7A4E" };
}

export default async function AdminDiscountCodesPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
        Rabattcodes ({codes.length})
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 24 }}>
        Gilt für den Kauf des Einladungs-Pakets. 100 % Rabatt schaltet das Paket direkt frei, ohne Stripe.
      </p>

      <div style={{ border: "1px solid var(--line)", padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Neuer Rabattcode</div>
        <form action={createDiscountCode} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
          <input name="code" placeholder="z. B. MESSE2026" required style={{ ...field, textTransform: "uppercase" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="type" value="PERCENT" defaultChecked /> Prozent
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="type" value="FIXED" /> Fester Betrag (Cent)
            </label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
            <label style={{ flex: "1 1 140px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
              Wert (Prozent 0–100, oder Cent)
              <input name="value" type="number" min={0} required style={{ ...field, width: "100%", marginTop: 4 }} />
            </label>
            <label style={{ flex: "1 1 140px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
              Max. Nutzungen (leer = unbegrenzt)
              <input name="maxUses" type="number" min={1} style={{ ...field, width: "100%", marginTop: 4 }} />
            </label>
            <label style={{ flex: "1 1 140px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
              Ablaufdatum (optional)
              <input name="expiresAt" type="date" style={{ ...field, width: "100%", marginTop: 4 }} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: 12, fontSize: 12.5, alignSelf: "flex-start" }}>
            Anlegen
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {codes.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Noch keine Rabattcodes angelegt.</p>
        ) : (
          codes.map((code) => {
            const status = statusFor(code);
            return (
              <div
                key={code.id}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--ivory-2)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.03em" }}>{code.code}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                    {code.type === "PERCENT" ? `${code.value} %` : `${(code.value / 100).toFixed(2)} €`} Rabatt · genutzt {code.usedCount}
                    {code.maxUses !== null ? `/${code.maxUses}` : ""}
                    {code.expiresAt ? ` · gültig bis ${code.expiresAt.toLocaleDateString("de-DE")}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: status.color, fontWeight: 700 }}>{status.label}</span>
                  <form action={toggleDiscountCodeActive.bind(null, code.id, !code.active)}>
                    <button type="submit" style={{ fontSize: 11, color: "var(--terracotta-dark)", background: "none", border: "1px solid var(--line)", padding: "5px 10px", cursor: "pointer" }}>
                      {code.active ? "Deaktivieren" : "Aktivieren"}
                    </button>
                  </form>
                  <form action={deleteDiscountCode.bind(null, code.id)}>
                    <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "1px solid #B2543A55", padding: "5px 10px", cursor: "pointer" }}>
                      Löschen
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
