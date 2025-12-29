/* =========================================================
   Afsnit 01 – Imports & typer
   ========================================================= */
import { WeatherData } from "../types";

/* =========================================================
   Afsnit 02 – Hjælpefunktioner
   ========================================================= */

// Sikrer at bynavne med æ/ø/å bliver korrekt sendt i URL
const enc = (s: string) => encodeURIComponent(s.trim());

// Dansk ugedag (kort)
const dkDayName = (isoDate: string) => {
  const d = new Date(isoDate + "T12:00:00"); // midt på dagen for at undgå timezone-rod
  const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  return days[d.getDay()];
};

// Open-Meteo vejrkode → dansk “condition”
const weatherCodeToDanish = (code: number) => {
  // Kilde: Open-Meteo WMO weather interpretation codes (standard mapping)
  // (Vi gengiver kun vores egne labels her)
  if (code === 0) return { condition: "Klar", description: "Klart vejr" };
  if (code === 1) return { condition: "Let skyet", description: "Overvejende klart med få skyer" };
  if (code === 2) return { condition: "Delvist skyet", description: "Skiftende skydække" };
  if (code === 3) return { condition: "Overskyet", description: "Helt overskyet" };

  if (code === 45 || code === 48) return { condition: "Tåge", description: "Tåge eller rimtåge" };

  if (code === 51 || code === 53 || code === 55) return { condition: "Støvregn", description: "Let til kraftig støvregn" };
  if (code === 56 || code === 57) return { condition: "Isslag", description: "Støvregn med isslag" };

  if (code === 61 || code === 63 || code === 65) return { condition: "Regn", description: "Let til kraftig regn" };
  if (code === 66 || code === 67) return { condition: "Isslag", description: "Regn med isslag" };

  if (code === 71 || code === 73 || code === 75) return { condition: "Sne", description: "Let til kraftigt snefald" };
  if (code === 77) return { condition: "Snekorn", description: "Snekorn" };

  if (code === 80 || code === 81 || code === 82) return { condition: "Byger", description: "Regnbyger (let til kraftige)" };
  if (code === 85 || code === 86) return { condition: "Snebyger", description: "Snebyger (let til kraftige)" };

  if (code === 95) return { condition: "Torden", description: "Tordenvejr" };
  if (code === 96 || code === 99) return { condition: "Torden med hagl", description: "Tordenvejr med hagl" };

  return { condition: "Ubestemt", description: "Vejrtypen kunne ikke bestemmes" };
};

// By-opslag via Nominatim (OpenStreetMap)
const geocodeCity = async (city: string) => {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${enc(city)}&format=json&limit=1&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      // Nominatim forventer normalt en User-Agent; i browser kan vi ikke sætte en rigtig UA,
      // men vi kan sætte en "Accept" og holde os til rimeligt få kald.
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding fejlede (status ${res.status})`);
  }

  const data: any[] = await res.json();
  if (!data?.length) {
    throw new Error("Ingen by fundet");
  }

  const hit = data[0];
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    displayName: String(hit.display_name || city),
  };
};

/* =========================================================
   Afsnit 03 – Hent vejr (gratis, uden API-key)
   ========================================================= */
export const fetchWeatherData = async (city: string): Promise<WeatherData> => {
  const cleanCity = (city || "").trim();
  if (!cleanCity) {
    throw new Error("By-navn mangler");
  }

  try {
    // 1) Find koordinater for byen
    const geo = await geocodeCity(cleanCity);

    // 2) Hent vejr fra Open-Meteo (gratis)
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${geo.lat}&longitude=${geo.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=5`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Vejr-API fejlede (status ${res.status})`);
    }

    const json: any = await res.json();

    // Current
    const cTemp = Number(json?.current?.temperature_2m);
    const cHum = Number(json?.current?.relative_humidity_2m);
    const cWind = Number(json?.current?.wind_speed_10m);
    const cCode = Number(json?.current?.weather_code);

    const cText = weatherCodeToDanish(cCode);

    // Daily forecast
    const dates: string[] = json?.daily?.time || [];
    const maxs: number[] = json?.daily?.temperature_2m_max || [];
    const mins: number[] = json?.daily?.temperature_2m_min || [];
    const codes: number[] = json?.daily?.weather_code || [];

    const forecast = dates.map((date, i) => {
      const t = weatherCodeToDanish(Number(codes[i]));
      return {
        date,
        dayName: dkDayName(date),
        tempHigh: Math.round(Number(maxs[i])),
        tempLow: Math.round(Number(mins[i])),
        condition: t.condition,
      };
    });

    const now = new Date();
    const lastUpdated = now.toLocaleString("da-DK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const result: WeatherData = {
      current: {
        city: cleanCity,
        temp: cTemp,
        condition: cText.condition,
        humidity: Number.isFinite(cHum) ? cHum : 0,
        windSpeed: Number.isFinite(cWind) ? `${Math.round(cWind)} km/t` : "–",
        description: cText.description,
        lastUpdated,
      },
      forecast,
      sources: [
        `Open-Meteo (forecast)`,
        `OpenStreetMap Nominatim (geocoding)`,
      ],
      // audioData: (valgfrit) – vi sætter den ikke her, fordi TTS kræver key/backend
    };

    return result;
  } catch (err: any) {
    // Vi kaster videre – UI viser “Kunne ikke hente vejr…”
    throw new Error(err?.message || "Kunne ikke hente vejrdata");
  }
};

/* =========================================================
   Afsnit 04 – Bysøgning / forslag (gratis)
   ========================================================= */
export const fetchCitySuggestions = async (query: string): Promise<string[]> => {
  const q = (query || "").trim();
  if (!q) return [];

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${enc(q)}&format=json&limit=5&addressdetails=1`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];

    const data: any[] = await res.json();
    if (!data?.length) return [];

    // Vi forsøger at give pæne, simple navne: "Helsingør, Denmark"
    const suggestions = data.map((x) => {
      const name = String(x.display_name || "").split(",").slice(0, 2).join(",").trim();
      return name || String(x.display_name || "");
    });

    // Fjern dubletter
    return Array.from(new Set(suggestions)).filter(Boolean);
  } catch {
    return [];
  }
};
