/* =========================================================
   Afsnit 01 – Imports
   ========================================================= */
import React, { useEffect, useState } from "react";
import CityInput from "./CityInput";
import LoadingScreen from "./LoadingScreen";
import WeatherDetail from "./WeatherDetail";
import InstallButton from "./InstallButton";

import { fetchWeatherData } from "../services/weatherService";
import { WeatherData } from "../types";

/* =========================================================
   Afsnit 02 – LocalStorage keys
   ========================================================= */
const LS_KEYS = ["neonsky_city_1", "neonsky_city_2", "neonsky_city_3", "neonsky_city_4"] as const;

/* =========================================================
   Afsnit 03 – Component
   ========================================================= */
export default function Home() {
  const [cities, setCities] = useState<string[]>(["Helsingør", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<WeatherData | null>(null);

  /* =========================================================
     Afsnit 04 – Load saved cities on first load
     ========================================================= */
  useEffect(() => {
    try {
      const saved = LS_KEYS.map((k) => localStorage.getItem(k) || "");
      if (saved.some((v) => v.trim().length > 0)) setCities(saved);
    } catch {
      // Ignorer
    }
  }, []);

  /* =========================================================
     Afsnit 05 – Save cities when changed
     ========================================================= */
  useEffect(() => {
    try {
      cities.forEach((v, idx) => localStorage.setItem(LS_KEYS[idx], v || ""));
    } catch {
      // Ignorer
    }
  }, [cities]);

  /* =========================================================
     Afsnit 06 – Helpers
     ========================================================= */
  const setCity = (idx: number, value: string) => {
    setCities((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

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
     Afsnit 07 – UI: Loading
     ========================================================= */
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  /* =========================================================
     Afsnit 08 – UI: Weather view
     (RETUR håndteres inde i WeatherDetail – så vi undgår 2× RETUR)
     ========================================================= */
  if (data) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-5xl">
          <WeatherDetail
            data={data}
            onBack={() => {
              setData(null);
              setError("");
            }}
          />
        </div>
      </div>
    );
  }

  /* =========================================================
     Afsnit 09 – UI: 4-city quick access view
     ========================================================= */
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8">
      {/* Branding / Top */}
      <div className="w-full max-w-5xl text-center mb-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide">
          <span className="text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.12)]">NEON</span>
          <span className="text-cyan-400 drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">SKY</span>
        </h1>

        <div className="mt-2 text-cyan-300/70 tracking-[0.35em] text-xs md:text-sm font-semibold">
          VEJR-INTERFACE v2.4
        </div>

        <div className="mt-4 flex items-center justify-center">
          <InstallButton />
        </div>

        <div className="mt-3 text-white/60 text-sm font-semibold tracking-wide">BY Ronny Kisbye</div>
      </div>

      {/* Fejlbesked */}
      {error && (
        <div className="w-full max-w-5xl mb-5">
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-white flex gap-3 items-start">
            <div className="mt-0.5">⚠️</div>
            <div className="text-sm md:text-base font-semibold">{error}</div>
          </div>
        </div>
      )}

      {/* 4 by-rækker */}
      <div className="w-full max-w-5xl space-y-4">
        <CityInput value={cities[0]} onChange={(v) => setCity(0, v)} onSubmit={(c) => loadWeather(c)} placeholder="Indtast by 1…" />
        <CityInput value={cities[1]} onChange={(v) => setCity(1, v)} onSubmit={(c) => loadWeather(c)} placeholder="Indtast by 2…" />
        <CityInput value={cities[2]} onChange={(v) => setCity(2, v)} onSubmit={(c) => loadWeather(c)} placeholder="Indtast by 3…" />
        <CityInput value={cities[3]} onChange={(v) => setCity(3, v)} onSubmit={(c) => loadWeather(c)} placeholder="Indtast by 4…" />
      </div>

      <div className="mt-8 text-center text-white/60">
        Tip: Gem dine 4 rejse-byer her – tryk <span className="text-white font-semibold">VEJRET</span> på den række du vil se.
      </div>
    </div>
  );
}
