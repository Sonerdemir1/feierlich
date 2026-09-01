// Ein einziger Key fuer beides: Places-Autocomplete (Dashboard, beim
// Event-Anlegen) und die Karten-Einbettung (oeffentliche Event-Seite) —
// beides laeuft im Browser, ein NEXT_PUBLIC_-Key ist also ohnehin sichtbar.
// Wird ueber HTTP-Referrer-Einschraenkung in der Google-Cloud-Konsole
// abgesichert, nicht durch Geheimhaltung.
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export const googleMapsConfigured = Boolean(GOOGLE_MAPS_API_KEY);
