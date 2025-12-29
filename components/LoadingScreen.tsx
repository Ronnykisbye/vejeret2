
import React, { useState, useEffect } from 'react';

const LoadingScreen: React.FC<{ city: string }> = ({ city }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "INTERCEPTING SATELLITE UPLINK...",
    "MAPPING ATMOSPHERIC VECTORS...",
    "DECRYPTING THERMAL GRADIENTS...",
    "CALIBRATING NEON-SKY SENSORS...",
    "SYNCHRONIZING TROPOSPHERIC DATA..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
      <div className="relative w-64 h-64 mb-12">
        <div className="absolute inset-0 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-t-2 border-fuchsia-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
        <div className="absolute inset-8 border-l-2 border-white/20 rounded-full animate-spin [animation-duration:3s]"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[10px] font-orbitron text-cyan-500/50 mb-1">SCANNING</div>
          <div className="w-12 h-[1px] bg-cyan-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-orbitron font-black text-white neon-text-cyan tracking-[0.2em] uppercase">
          {city || 'SYSTEM'}
        </h2>
        <div className="h-6 overflow-hidden">
          <p className="text-fuchsia-500 text-xs font-orbitron font-bold tracking-widest animate-in slide-in-from-bottom-2 duration-300" key={msgIdx}>
            {messages[msgIdx]}
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-12 w-full max-w-xs px-8">
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-[loading-bar_10s_linear_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
