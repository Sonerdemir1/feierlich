"use client";

import { WEDDING_PARTY_ROLES, WEDDING_PARTY_ROLE_LABEL, type WeddingPartyRole } from "@/lib/wedding-party";

const fieldStyle = { padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 };

// Umgebungsunabhaengiger Praesentations-Baustein wie WishlistItemQuickEdit.tsx
// — fuer GENAU den ausgewaehlten Trauzeugen/Brautjungfer-Eintrag. Das Foto
// selbst wird nicht hier, sondern direkt am runden Foto-Kreis in
// WeddingPartyList.tsx hochgeladen (siehe dortiger Kommentar).
export function WeddingPartyMemberQuickEdit({
  role,
  name,
  onChange,
}: {
  role: WeddingPartyRole;
  name: string;
  onChange: (patch: { role?: WeddingPartyRole; name?: string }) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Rolle
        <select value={role} onChange={(e) => onChange({ role: e.target.value as WeddingPartyRole })} style={fieldStyle}>
          {WEDDING_PARTY_ROLES.map((r) => (
            <option key={r} value={r}>
              {WEDDING_PARTY_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Name
        <input type="text" value={name} placeholder="z. B. Anna" onChange={(e) => onChange({ name: e.target.value })} style={fieldStyle} />
      </label>
    </div>
  );
}
