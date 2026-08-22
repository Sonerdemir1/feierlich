// Fuer Anzeige-Text (geteilte Links etc.) — immer die tatsaechliche
// Produktions-Domain statt eines hart codierten Platzhalters, sonst zeigt
// die UI eine falsche URL an, sobald die echte Domain feststeht.
export function publicHost(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(url).host;
}
