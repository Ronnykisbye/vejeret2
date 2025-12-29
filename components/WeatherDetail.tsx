import React, { useEffect, useRef, useState } from 'react';
import { WeatherData } from '../types';

interface WeatherDetailProps {
  data: WeatherData;
  onBack: () => void;
}

const WeatherDetail: React.FC<WeatherDetailProps> = ({ data, onBack }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (data?.audioData) {
      playAudio(data.audioData);
    }
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const stopAudio = () => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
    } catch {
      // ignore
    } finally {
      setIsPlaying(false);
    }
  };

  const playAudio = async (base64: string) => {
    try {
      stopAudio();

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current!;
      const bytes = decode(base64);
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);

      sourceNodeRef.current = source;
      setIsPlaying(true);
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (!data?.audioData) return;
    if (isPlaying) stopAudio();
    else playAudio(data.audioData);
  };

  if (!data || !data.current) return null;

  const { current, forecast, sources = [] } = data;

  /* =========================================================
     Afsnit 01 – Robust mapping (så 0° ikke opstår pga. forkert feltnavn)
     ========================================================= */
  const cityName =
    (data as any).city ||
    (current as any).city ||
    "";

  const tempValueRaw =
    (current as any).temperature ??
    (current as any).temp ??
    null;

  const tempValue =
    typeof tempValueRaw === "number" ? tempValueRaw : (tempValueRaw ? Number(tempValueRaw) : null);

  const humidity =
    (current as any).humidity ?? null;

  const windSpeed =
    (current as any).windSpeed ?? (current as any).wind ?? null;

  const lastUpdated =
    (current as any).lastUpdated ?? (current as any).updatedAt ?? (current as any).time ?? "";

  const condition =
    (current as any).condition ?? "";

  const description =
    (current as any).description ?? "Vejrstatus";

  /* =========================================================
     Afsnit 02 – Visuals
     ========================================================= */
  const getWeatherVisuals = (cond: string) => {
    const c = (cond || "").toLowerCase();
    if (c.includes('sol') || c.includes('klar')) return { icon: '☀️', color: 'rgba(253, 224, 71, 0.8)', effect: 'sun-glow' };
    if (c.includes('regn') || c.includes('byger')) return { icon: '🌧️', color: 'rgba(59, 130, 246, 0.8)', effect: 'rain-fall' };
    if (c.includes('sky') || c.includes('overskyet')) return { icon: '☁️', color: 'rgba(148, 163, 184, 0.8)', effect: 'cloud-drift' };
    if (c.includes('sne')) return { icon: '❄️', color: 'rgba(255, 255, 255, 0.85)', effect: 'snow-fall' };
    return { icon: '🌡️', color: 'rgba(34, 211, 238, 0.8)', effect: 'neon-pulse' };
  };

  const visual = getWeatherVisuals(condition);

  const statItems = [
    { label: 'FUGTIGHED', value: humidity !== null ? `${humidity}%` : '—', icon: '💧' },
    { label: 'VIND', value: windSpeed !== null ? `${windSpeed} KM/T` : '—', icon: '🌬️' },
    { label: 'OPDATERET', value: lastUpdated || '—', icon: '⏱️' },
    { label: 'STATUS', value: 'SYNKRONISERET', icon: '🛰️' },
  ];

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-2"
        >
          ← RETUR
        </button>

        {data.audioData && (
          <button
            type="button"
            onClick={toggleAudio}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white"
          >
            {isPlaying ? "Stop lyd" : "Afspil lyd"}
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="rounded-3xl bg-slate-950/40 border border-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10">
        <div className="text-cyan-300/70 tracking-[0.35em] text-xs md:text-sm font-semibold mb-6">
          UPLINK ETABLERET
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2">
            {/* ✅ FIX: By-navn kommer fra data.city, ikke current.city */}
            <h2
              className="
                text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-white/90
                leading-[0.95] break-words whitespace-normal max-w-full
              "
              title={cityName}
            >
              {(cityName || "—").toUpperCase()}
            </h2>

            <p className="text-xl text-slate-400 mb-8 font-medium italic">
              “{description}”
            </p>

            <div className="flex items-end gap-6">
              <div className="text-7xl md:text-8xl font-extrabold text-white">
                {tempValue !== null && !Number.isNaN(tempValue) ? Math.round(tempValue) : "—"}
                <span className="text-cyan-500">°</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-5xl" style={{ filter: `drop-shadow(0 0 18px ${visual.color})` }}>
                  {visual.icon}
                </span>
                <span className="text-2xl font-bold text-slate-100 uppercase tracking-widest neon-text-cyan">
                  {condition || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Right stats */}
          <div className="grid grid-cols-2 gap-4">
            {statItems.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-white/50 text-xs font-semibold tracking-widest">
                  {stat.label}
                </div>

                {/* ✅ FIX: “SYNKRONISERET” mindre og må gerne wrap */}
                <div
                  className={
                    stat.label === "STATUS"
                      ? "mt-2 text-cyan-300 text-base md:text-lg font-bold break-words leading-tight"
                      : "mt-2 text-white text-xl font-bold"
                  }
                >
                  <span className="text-base grayscale opacity-50">{stat.icon}</span> {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast */}
        {Array.isArray(forecast) && forecast.length > 0 && (
          <div className="mt-10">
            <div className="text-2xl font-extrabold tracking-wide text-white">5-DAGES PROGNOSE</div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.slice(0, 5).map((day: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-xs font-bold tracking-widest text-fuchsia-300">
                    {(day.dayName || "").toUpperCase()}
                  </div>
                  <div className="text-white/50 text-xs mt-1">{day.date || ""}</div>

                  <div className="mt-4 text-3xl font-extrabold text-white">
                    {day.tempHigh ?? "—"}°<span className="text-slate-600 text-xl font-medium ml-1">/ {day.tempLow ?? "—"}°</span>
                  </div>

                  <div className="mt-3 text-white/70 text-xs font-semibold">
                    {(day.condition || "").toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources (valgfrit – hvis du vil vise kilder) */}
        {Array.isArray(sources) && sources.length > 0 && (
          <div className="mt-10 text-white/50 text-xs">
            <div className="font-semibold tracking-widest mb-2">KILDER</div>
            <ul className="list-disc pl-5 space-y-1">
              {sources.slice(0, 5).map((s: any, idx: number) => (
                <li key={idx}>{s?.title || s?.url || "Kilde"}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDetail;
