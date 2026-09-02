// Package.key ist z.B. "PREMIUM_PLUS" — fuer eine lesbare URL (/preise/premium-plus)
// hin und her uebersetzt. Simple 1:1-Abbildung, kein eigenes Slug-Feld noetig.
export function packageSlug(key: string): string {
  return key.toLowerCase().replace(/_/g, "-");
}

export function packageKeyFromSlug(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}
