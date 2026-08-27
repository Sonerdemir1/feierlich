// Turkische Sonderzeichen erst manuell abbilden, weil ein reiner
// diakritik-strippender Ansatz (z.B. ueber NFD) "ı" (dotless i) und
// "ğ"/"ş" nicht sauber auf lateinische Buchstaben reduziert.
const SLUG_MAP: Record<string, string> = { ı: "i", ğ: "g", ş: "s", ü: "u", ö: "o", ç: "c", İ: "i" };

export function categorySlug(category: string): string {
  return `cat-${category
    .toLowerCase()
    .replace(/[ığşüöçİ]/g, (ch) => SLUG_MAP[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
