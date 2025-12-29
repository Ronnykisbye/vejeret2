
import React, { useState, useCallback, useEffect } from 'react';
import Home from './components/Home';
import WeatherDetail from './components/WeatherDetail';
import LoadingScreen from './components/LoadingScreen';
import { fetchWeatherData } from './services/weatherService';
import { WeatherData, View } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchingCity, setSearchingCity] = useState('');
  
  // Persistent cities state lifted from Home to remember selections
  const [cities, setCities] = useState<string[]>(['', '', '', '']);

  const handleCityChange = useCallback((index: number, value: string) => {
    setCities(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (city: string) => {
    if (!city.trim()) return;
    
    setSearchingCity(city);
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeatherData(city);
      // Verify data integrity before navigating
      if (data && data.current && data.forecast) {
        setWeatherData(data);
        setView('detail');
      } else {
        throw new Error("Modtog ufuldstændige vejrdata.");
      }
    } catch (err) {
      console.error("Search error:", err);
      // Return to home view and show error if search fails
      setError(`Kunne ikke hente vejr for "${city}". Tjek stavningen eller prøv igen.`);
      setView('home');
      // Clear error toast after a few seconds
      setTimeout(() => setError(null), 6000);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
    setWeatherData(null);
  }, []);

  // Safety fallback: If somehow in detail view without data, return home
  useEffect(() => {
    if (view === 'detail' && !weatherData && !loading) {
      setView('home');
    }
  }, [view, weatherData, loading]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      {/* Loading Overlay */}
      {loading && <LoadingScreen city={searchingCity} />}

      {/* Error Toast Overlay */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md px-6 py-4 bg-red-950/90 backdrop-blur-xl border border-red-500/40 text-red-100 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">⚠️</span>
            <p className="font-semibold leading-tight">{error}</p>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="relative min-h-screen">
        {(view === 'home' || !weatherData) ? (
          <Home 
            cities={cities} 
            onCityChange={handleCityChange} 
            onSearch={handleSearch} 
          />
        ) : (
          <WeatherDetail data={weatherData} onBack={handleBack} />
        )}
      </main>
    </div>
  );
};

export default App;
