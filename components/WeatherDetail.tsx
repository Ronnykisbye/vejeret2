import React, { useEffect, useRef, useState } from "react";
import { WeatherData } from "../types";

interface WeatherDetailProps {
  data: WeatherData;
  onBack: () => void;
}

const WeatherDetail: React.FC<WeatherDetailProps> = ({ data, onBack }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (data.audioData) {
      playAudio(data.audioData);
    }
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
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

  const playAudio = async (base64: string) => {
    try {
      stopAudio();

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current!;
      const bytes = decode(base64);
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0));
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      sourceNodeRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch {
      // Hvis audio fejler, ignorer og fortsæt
    }
  };

  const stopAudio = () => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
    } catch {
      // Ignorer
    } finally {
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (!data.audioData) return;
    if (isPlaying) stopAudio();
    else playAudio(data.audioData);
  };

  const cityName = (data.city || "").toUpperCase();

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
          {/* Left: City + temp */}
          <div className="lg:col-span-2">
            {/* ✅ FIX: Mindre og wrap så hele bynavnet kan ses */}
            <h2
              className="
                text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-white/90
                leading-[0.95]
                break-words whitespace-normal
                max-w-full
              "
              title={data.city}
            >
              {cityName}
            </h2>

            <div className="mt-2 text-white/70 italic text-lg md:text-xl">
              “{data.description || "Vejrstatus"}”
            </div>

            <div className="mt-8 flex items-end gap-6">
              <div className="text-7xl md:text-8xl font-extrabold text-white">
                {Math.round(data.temperature ?? 0)}
                <span className="text-cyan-400">°</span>
              </div>

              {data.icon && (
                <div className="flex items-center gap-3">
                  <img src={data.icon} alt="Vejr ikon" className="w-16 h-16 md:w-20 md:h-20" />
                  <div className="text-2xl md:text-3xl font-extrabold tracking-wide text-white">
                    {data.condition || ""}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/50 text-xs font-semibold tracking-widest">FUGTIGHED</div>
              <div className="mt-2 text-white text-xl font-bold">{data.humidity ?? 0}%</div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/50 text-xs font-semibold tracking-widest">VIND</div>
              <div className="mt-2 text-white text-xl font-bold">{Math.round(data.windSpeed ?? 0)} KM/T</div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/50 text-xs font-semibold tracking-widest">OPDATERET</div>
              <div className="mt-2 text-white text-lg font-bold">{data.updatedAt || ""}</div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/50 text-xs font-semibold tracking-widest">STATUS</div>
              <div className="mt-2 text-cyan-300 text-lg font-bold">SYNKRONISERET</div>
            </div>
          </div>
        </div>

        {/* Forecast */}
        {Array.isArray(data.forecast) && data.forecast.length > 0 && (
          <div className="mt-10">
            <div className="text-2xl font-extrabold tracking-wide text-white">5-DAGES PROGNOSE</div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.forecast.slice(0, 5).map((d: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-xs font-bold tracking-widest text-fuchsia-300">{(d.dayName || "").toUpperCase()}</div>
                  <div className="text-white/50 text-xs mt-1">{d.date || ""}</div>

                  <div className="mt-4 text-3xl font-extrabold text-white">
                    {Math.round(d.max ?? 0)}°
                    <span className="text-white/30 text-lg font-bold">/{Math.round(d.min ?? 0)}°</span>
                  </div>

                  <div className="mt-3 text-white/70 text-xs font-semibold">{(d.summary || "").toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDetail;
