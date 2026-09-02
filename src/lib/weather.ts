// Wettervorhersage fuer den Eventtag — Open-Meteo (kostenlos, kein API-Key
// noetig). Echte Vorhersagen gibt es nur fuer die naechsten ~16 Tage; bei
// Hochzeiten liegt das Event fast immer Monate in der Zukunft, daher gibt
// die Funktion bis dahin bewusst `null` zurueck (Seite zeigt dann einfach
// nichts an, statt eine falsche/erfundene Vorhersage).
const FORECAST_HORIZON_DAYS = 16;

export type DailyForecast = { code: number; tempMaxC: number; tempMinC: number };

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export async function getEventWeather(lat: number, lng: number, eventDate: Date): Promise<DailyForecast | null> {
  const now = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysUntil < 0 || daysUntil > FORECAST_HORIZON_DAYS) return null;

  const dateStr = eventDate.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "weathercode,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    start_date: dateStr,
    end_date: dateStr,
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      // Vorhersage aendert sich staendig — nicht cachen, sonst zeigt die
      // Seite tagelang denselben (veralteten) Stand.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as OpenMeteoResponse;
    const daily = json.daily;
    if (!daily?.time?.length) return null;
    return {
      code: daily.weathercode[0],
      tempMaxC: Math.round(daily.temperature_2m_max[0]),
      tempMinC: Math.round(daily.temperature_2m_min[0]),
    };
  } catch {
    return null;
  }
}

// WMO-Wettercodes (Open-Meteo-Standard) auf Emoji + deutsches Label
// reduziert — nur die Gruppen, die in einer Tages-Vorhersage realistisch
// vorkommen.
export function weatherCodeInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Sonnig" };
  if (code <= 2) return { emoji: "🌤️", label: "Leicht bewölkt" };
  if (code === 3) return { emoji: "☁️", label: "Bewölkt" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "Neblig" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Nieselregen" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Regen" };
  if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "Schnee" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "Regenschauer" };
  if (code === 85 || code === 86) return { emoji: "🌨️", label: "Schneeschauer" };
  if (code >= 95) return { emoji: "⛈️", label: "Gewitter" };
  return { emoji: "🌡️", label: "Wetter" };
}
