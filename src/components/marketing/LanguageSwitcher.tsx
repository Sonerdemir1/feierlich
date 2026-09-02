import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

// Kein Client-JS noetig — zwei kleine Formulare (POST), passend zum Rest
// der App. redirectTo fuehrt zurueck zur aktuellen Seite/Sektion.
export function LanguageSwitcher({ locale, redirectTo }: { locale: Locale; redirectTo: string }) {
  const options: { value: Locale; label: string }[] = [
    { value: "de", label: "DE" },
    { value: "tr", label: "TR" },
  ];

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((opt) => (
        <form key={opt.value} action={setLocale}>
          <input type="hidden" name="locale" value={opt.value} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            disabled={locale === opt.value}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 9px",
              border: "1px solid var(--line)",
              background: locale === opt.value ? "var(--ink)" : "transparent",
              color: locale === opt.value ? "var(--ivory)" : "var(--ink-soft)",
              cursor: locale === opt.value ? "default" : "pointer",
            }}
          >
            {opt.label}
          </button>
        </form>
      ))}
    </div>
  );
}
