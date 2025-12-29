
import React, { useState, useEffect, useRef } from 'react';
import { fetchCitySuggestions } from '../services/weatherService';

interface CityInputProps {
  index: number;
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
}

const CityInput: React.FC<CityInputProps> = ({ index, value, onChange, onSearch }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [helpModeActive, setHelpModeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect to fetch suggestions "as you type" ONLY if help mode is active
  useEffect(() => {
    if (!helpModeActive || !value || value.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(async () => {
      const results = await fetchCitySuggestions(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 400);

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [value, helpModeActive]);

  const handleButtonClick = async () => {
    if (!value) return;

    // If suggestions are already showing, we treat this as a final "search now"
    if (showSuggestions) {
      setShowSuggestions(false);
      setHelpModeActive(false);
      onSearch(value);
      return;
    }

    // Activate help mode and fetch first set of suggestions
    setIsLoading(true);
    setHelpModeActive(true);
    try {
      const results = await fetchCitySuggestions(value);
      if (results && results.length > 0) {
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        // Fallback: search immediately if no suggestions found
        onSearch(value);
      }
    } catch (error) {
      console.error("Error activating suggestions:", error);
      onSearch(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setHelpModeActive(false);
    onSearch(city);
  };

  return (
    <div className="relative group" ref={dropdownRef}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-slate-900 rounded-lg p-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Indtast by ${index + 1}...`}
          className="w-full bg-transparent text-white px-4 py-3 outline-none focus:ring-0 placeholder-slate-500 font-medium"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleButtonClick();
            }
          }}
        />
        <button
          onClick={handleButtonClick}
          disabled={!value || isLoading}
          className="ml-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[140px] relative overflow-hidden"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              GÆTTER...
            </span>
          ) : (
            'SØG / HJÆLP'
          )}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-2 glass-card border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-in slide-in-from-top-2 duration-300">
          <div className="p-3 border-b border-white/10 bg-cyan-950/40 flex items-center justify-between">
            <span className="text-[10px] font-orbitron text-cyan-400 tracking-widest uppercase ml-1">Mente du en af disse?</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Hjælp aktiv</span>
          </div>
          <ul className="py-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-5 py-4 text-slate-200 hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between group/item"
                >
                  <span className="font-semibold text-lg tracking-tight group-hover/item:text-cyan-300">{suggestion}</span>
                  <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-1 rounded border border-cyan-500/20 opacity-0 group-hover/item:opacity-100 transition-all uppercase font-orbitron">
                    Vælg + Søg →
                  </span>
                </button>
              </li>
            ))}
            <li className="border-t border-white/5">
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  setHelpModeActive(false);
                  onSearch(value);
                }}
                className="w-full text-left px-5 py-3 text-slate-500 hover:text-slate-300 text-xs transition-colors flex items-center justify-between group"
              >
                <span>Søg på min præcise tekst: "{value}"</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100">BRUG INDTASTNING</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CityInput;
