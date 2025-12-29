
import React from 'react';
import CityInput from './CityInput';

interface HomeProps {
  cities: string[];
  onCityChange: (index: number, value: string) => void;
  onSearch: (city: string) => void;
}

const Home: React.FC<HomeProps> = ({ cities, onCityChange, onSearch }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950 animate-in fade-in duration-700">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-2xl z-10">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-6xl md:text-8xl font-black font-orbitron bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-700 tracking-tighter">
            NEON<span className="text-cyan-500 neon-text-cyan">SKY</span>
          </h1>
          <div className="flex items-center justify-center gap-4 opacity-70">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500"></div>
            <p className="text-cyan-400 uppercase tracking-[0.4em] text-[10px] font-orbitron font-bold">Vejr-Interface v2.4</p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500"></div>
          </div>
        </header>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            {cities.map((city, idx) => (
              <CityInput 
                key={idx}
                index={idx}
                value={city}
                onChange={(val) => onCityChange(idx, val)}
                onSearch={onSearch}
              />
            ))}
          </div>
          
          <footer className="mt-16 text-center space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <p className="text-slate-400 text-[10px] font-orbitron uppercase tracking-widest leading-relaxed">
              Systemstatus: <span className="text-cyan-400">Online</span> • Forbindelse: <span className="text-cyan-400">Krypteret</span>
            </p>
            <p className="text-slate-500 text-[9px] font-medium uppercase tracking-tighter">
              Drevet af Gemini Pro & Google Grounding Engine
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
