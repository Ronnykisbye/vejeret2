/* =========================================================
   Afsnit 01 – Imports
   ========================================================= */
import React, { useState } from "react";
import CityInput from "./CityInput";
import LoadingScreen from "./LoadingScreen";
import WeatherDetail from "./WeatherDetail";
import InstallButton from "./InstallButton";

import { fetchWeatherData } from "../services/weatherService";
import { WeatherData } from "../types";

/* =========================================================
   Afsnit 02 – Component
   ========================================================= */
export default function Home() {
  const [city, setCity] = useState<string>("Helsingør");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<WeatherData | null>(null);

  /* =========================================================
     Afsnit 03 – Handlers
     ========================================================= */
  const loadWeather = async (selectedCity: string) => {
    const c = (selectedCity || "").trim();
    if (!c) return;

    setError("");
    setLoading(true);

    try {
      const result = await fetchWeatherData(c);
      setData(result);
    } catch (e: any) {
      setData(null);
      setError(e?.message || `Kunne ikke hente vejr for "${c}". Tjek stavningen eller prøv igen.`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     Afsnit 04 – UI
     ========================================================= */
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8">
      {/* Top / Branding */}
      <div className="w-full max-w-4xl text-center mb-6">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide">
            <span className="text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.12)]">NEON</span>
            <span className="text-cyan-400 drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">SKY</span>
          </h1>
        </div>

        <div className="mt-2 text-cyan-300/70 tracking-[0.35em] text-xs md:text-sm font-semibold">
          VEJR-INTERFACE v2.4
        </div>

        {/* Install-knap (kun synlig når browseren tillader PWA-install) */}
        <div className="mt-4 flex items-center justify-center">
          <InstallButton />
        </div>

        <div className="mt-3 text-white/60 text-sm font-semibold tracking-wide">
          BY Ronny Kisbye
        </div>
      </div>

      {/* Fejlbesked */}
      {error && (
        <div className="w-full max-w-3xl mb-5">
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-white flex gap-3 items-start">
            <div className="mt-0.5">⚠️</div>
            <div className="text-sm md:text-base font-semibold">{error}</div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="w-full max-w-4xl mb-6">
        <CityInput
          value={city}
          onChange={setCity}
          onSubmit={(c) => loadWeather(c)}
          placeholder="Skriv en by…"
        />
      </div>

      {/* Indhold */}
      <div className="w-full max-w-4xl">
        {loading && <LoadingScreen />}

        {!loading && data && (
          <WeatherDetail
            data={data}
            onBack={() => {
              // Tilbage til søgning: vi beholder data, men du kan vælge at nulstille hvis du vil
              // setData(null);
              setError("");
            }}
          />
        )}

        {!loading && !data && !error && (
          <div className="text-center text-white/60 mt-10">
            Skriv en by og tryk <span className="text-white font-semibold">VEJRET</span>.
          </div>
        )}
      </div>
    </div>
  );
}
