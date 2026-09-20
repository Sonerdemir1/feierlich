import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

// Kein Client-JS noetig — zwei kleine Formulare (POST). redirectTo fuehrt
// zurueck zur aktuellen Seite/Sektion. War bis zum Zera/Dixor-Umbau der
// Startseite Teil der obersten Nav-Leiste, dabei versehentlich zusammen
// mit den GSAP-Dateien geloescht (kein eigener GSAP-Bezug) — hier mit den
// aktuellen --zc-*-Tokens neu aufgebaut statt der alten --ink/--line-Werte.
export function LanguageSwitcher({ locale, redirectTo }: { locale: Locale; redirectTo: string }) {
  const options: { value: Locale; label: string }[] = [
    { value: "de", label: "DE" },
    { value: "tr", label: "TR" },
  ];

  return (
    <div className="zc-nav-lang">
      {options.map((opt) => (
        <form key={opt.value} action={setLocale}>
          <input type="hidden" name="locale" value={opt.value} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button type="submit" disabled={locale === opt.value} className={`zc-nav-lang-btn${locale === opt.value ? " is-active" : ""}`}>
            {opt.label}
          </button>
        </form>
      ))}
    </div>
  );
}
