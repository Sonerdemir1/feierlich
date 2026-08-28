const typeLabel: Record<string, string> = {
  LOCATION: "Location",
  DJ: "DJ",
  PHOTOGRAPHER: "Fotograf",
  VIDEOGRAPHER: "Videograf",
  PLANNER: "Planer",
  CATERER: "Caterer",
};

type PartnerDefaults = {
  name?: string;
  type?: string;
  contactEmail?: string | null;
  brandColor?: string | null;
  commissionRate?: number | null;
};

export function PartnerForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaults?: PartnerDefaults;
  submitLabel: string;
}) {
  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <input name="name" placeholder="Name (z. B. Klangwerk DJ Team)" defaultValue={defaults?.name} required style={field} />
      <input
        name="contactEmail"
        type="email"
        placeholder="Kontakt-E-Mail (optional)"
        defaultValue={defaults?.contactEmail ?? ""}
        style={field}
      />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Art des Partners</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.entries(typeLabel).map(([value, label]) => (
            <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="type" value={value} defaultChecked={(defaults?.type ?? "DJ") === value} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
        <label style={{ flex: "1 1 110px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
          Markenfarbe
          <input name="brandColor" type="text" placeholder="#211C19" defaultValue={defaults?.brandColor ?? ""} style={{ ...field, width: "100%", marginTop: 4 }} />
        </label>
        <label style={{ flex: "1 1 110px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
          Provision (%)
          <input
            name="commissionRate"
            type="number"
            min={0}
            max={100}
            step="0.5"
            defaultValue={defaults?.commissionRate != null ? defaults.commissionRate * 100 : 10}
            style={{ ...field, width: "100%", marginTop: 4 }}
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary" style={{ padding: 14, justifyContent: "center", marginTop: 8 }}>
        {submitLabel}
      </button>
    </form>
  );
}
