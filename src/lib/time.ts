// Eigene Funktion statt Date.now() direkt in einer Server-Component-Renderfunktion
// aufzurufen — die react-hooks/purity-Regel markiert impure Aufrufe im
// Komponentenkoerper, ausgelagert in eine normale Funktion stoert sie nicht.
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}
