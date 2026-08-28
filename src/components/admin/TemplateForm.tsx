type TemplateDefaults = {
  name?: string;
  category?: string;
  description?: string | null;
  layoutKey?: string;
  priceCents?: number;
  status?: string;
  colors?: string;
  fonts?: string;
};

export function TemplateForm({ action, defaults, submitLabel }: { action: (formData: FormData) => void; defaults?: TemplateDefaults; submitLabel: string }) {
  const colors = defaults?.colors ? JSON.parse(defaults.colors) : { primary: "#211C19", accent: "#B2543A", background: "#FAF6EF" };
  const fonts = defaults?.fonts ? JSON.parse(defaults.fonts) : { display: "Cormorant Garamond", body: "Work Sans" };

  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
        <input name="name" placeholder="Name" defaultValue={defaults?.name} required style={{ ...field, flex: "1 1 140px", minWidth: 0 }} />
        <input name="category" placeholder="Kategorie" defaultValue={defaults?.category} required style={{ ...field, flex: "1 1 140px", minWidth: 0 }} />
      </div>
      <input name="layoutKey" placeholder="Layout-Schlüssel (z. B. minimal-ivory)" defaultValue={defaults?.layoutKey} required style={field} />
      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "-8px 0 0" }}>
        Ohne passende Vorschau-Komponente im Code zeigt die Karte nur einen Platzhalter — die Metadaten (Name, Preis,
        Verfügbarkeit) funktionieren trotzdem sofort.
      </p>
      <textarea name="description" placeholder="Beschreibung (optional)" defaultValue={defaults?.description ?? ""} rows={2} style={{ ...field, fontFamily: "inherit" }} />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Farben</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
          <label style={{ flex: "1 1 110px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Primär
            <input name="colorPrimary" type="text" defaultValue={colors.primary} style={{ ...field, width: "100%", marginTop: 4 }} />
          </label>
          <label style={{ flex: "1 1 110px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Akzent
            <input name="colorAccent" type="text" defaultValue={colors.accent} style={{ ...field, width: "100%", marginTop: 4 }} />
          </label>
          <label style={{ flex: "1 1 110px", minWidth: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Hintergrund
            <input name="colorBackground" type="text" defaultValue={colors.background} style={{ ...field, width: "100%", marginTop: 4 }} />
          </label>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Schriften</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
          <input name="fontDisplay" placeholder="Überschrift" defaultValue={fonts.display} style={{ ...field, flex: "1 1 140px", minWidth: 0 }} />
          <input name="fontBody" placeholder="Fließtext" defaultValue={fonts.body} style={{ ...field, flex: "1 1 140px", minWidth: 0 }} />
        </div>
      </div>

      <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
        Preis (€, 0 = im Paket enthalten)
        <input name="price" type="number" min={0} step="0.01" defaultValue={(defaults?.priceCents ?? 0) / 100} style={{ ...field, marginTop: 4, width: 140 }} />
      </label>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Status</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, rowGap: 8 }}>
          {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((value) => (
            <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="status" value={value} defaultChecked={(defaults?.status ?? "DRAFT") === value} />
              {{ ACTIVE: "Aktiv", DRAFT: "Entwurf", ARCHIVED: "Archiviert" }[value]}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ padding: 14, justifyContent: "center", marginTop: 8 }}>
        {submitLabel}
      </button>
    </form>
  );
}
