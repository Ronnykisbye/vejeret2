
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
    if (data.audioData) {
      // Auto-play on first load
      playAudio(data.audioData);
    }
    return () => {
      stopAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [data]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped or not started
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (base64: string) => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      // Resume context if it was suspended (browser policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
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

  if (!data || !data.current) return null;

  const { current, forecast, sources = [] } = data;

  const getWeatherVisuals = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('sol') || c.includes('klar')) return { icon: '☀️', color: 'rgba(253, 224, 71, 0.8)', effect: 'sun-glow' };
    if (c.includes('regn') || c.includes('byger')) return { icon: '🌧️', color: 'rgba(59, 130, 246, 0.8)', effect: 'rain-fall' };
    if (c.includes('sky') || c.includes('overskyet')) return { icon: '☁️', color: 'rgba(148, 163, 184, 0.8)', effect: 'cloud-drift' };
    if (c.includes('sne')) return { icon: '❄️', color: 'rgba(255, 255, 255, 0.8)', effect: 'snow-fall' };
    return { icon: '🌡️', color: 'rgba(34, 211, 238, 0.8)', effect: '' };
  };

  const visual = getWeatherVisuals(current.condition);

  return (
    <div className={`min-h-screen relative p-4 md:p-8 animate-in slide-in-from-bottom-4 duration-1000 overflow-hidden ${visual.effect}`}>
      {/* Dynamic Background Particles */}
      <div className="particles-container absolute inset-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="flex items-center text-cyan-400 hover:text-cyan-300 group font-orbitron uppercase tracking-widest text-sm transition-all">
            <span className="mr-3 text-2xl group-hover:-translate-x-2 transition-transform">←</span>
            Retur
          </button>
          
          <div className="flex items-center gap-6">
            {data.audioData && (
              <button 
                onClick={() => data.audioData && playAudio(data.audioData)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-500 font-orbitron text-[11px] tracking-widest uppercase ${
                  isPlaying 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  {isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_0.6s_ease-in-out_infinite]"></div>
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]"></div>
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]"></div>
                    </div>
                  ) : (
                    <span className="text-base leading-none">▶</span>
                  )}
                </div>
                {isPlaying ? 'Afspiller Briefing' : 'Afspil Briefing'}
              </button>
            )}

            {isPlaying && (
              <div className="hidden sm:flex items-center gap-2 text-cyan-500 font-orbitron text-[10px] animate-pulse">
                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                AI BRIEFING AKTIV
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 md:p-12 mb-8 relative border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full"></span>
                <span className="text-cyan-500 font-orbitron text-xs tracking-[0.3em] font-bold uppercase">Uplink Etableret</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black font-orbitron mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase leading-none">
                {current.city}
              </h1>
              <p className="text-xl text-slate-400 mb-8 font-medium italic">"{current.description}"</p>
              
              <div className="flex items-center gap-8">
                <span className="text-9xl font-black text-white tracking-tighter leading-none select-none">
                  {Math.round(current.temp)}<span className="text-cyan-500">°</span>
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-7xl mb-2 animate-bounce-slow" style={{ filter: `drop-shadow(0 0 15px ${visual.color})` }}>{visual.icon}</span>
                  <span className="text-2xl font-bold text-slate-100 uppercase tracking-widest neon-text-cyan">{current.condition}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'FUGTIGHED', value: `${current.humidity}%`, icon: '💧' },
                { label: 'VIND', value: current.windSpeed, icon: '🌬️' },
                { label: 'OPDATERET', value: current.lastUpdated, icon: '⏱️' },
                { label: 'STATUS', value: 'SYNKRONISERET', icon: '📡', color: 'text-cyan-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] backdrop-blur-md p-6 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all">
                  <div className="text-xs font-orbitron text-slate-500 mb-2 tracking-widest">{stat.label}</div>
                  <div className={`text-xl font-bold ${stat.color || 'text-white'} flex items-center gap-2 uppercase tracking-tight`}>
                    <span className="text-base grayscale opacity-50">{stat.icon}</span> {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-orbitron font-black text-white tracking-tighter uppercase">5-Dages Prognose</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {forecast.map((day, idx) => (
            <div key={idx} className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-fuchsia-500/40 hover:translate-y-[-4px] transition-all group">
              <p className="text-fuchsia-400 font-orbitron font-bold mb-1 uppercase text-[10px] tracking-[0.2em]">{day.dayName}</p>
              <p className="text-slate-500 text-xs mb-6 font-medium">{day.date}</p>
              <div className="text-4xl font-black mb-6 text-white group-hover:neon-text-pink transition-all">
                {day.tempHigh}°<span className="text-slate-600 text-xl font-medium ml-1">/ {day.tempLow}°</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-slate-300 font-bold text-xs uppercase tracking-tight line-clamp-1">{day.condition}</p>
                <span className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">
                   {getWeatherVisuals(day.condition).icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
};

export default WeatherDetail;
