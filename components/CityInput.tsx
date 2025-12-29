/* =========================================================
   Afsnit 01 – Imports
   ========================================================= */
import React, { useEffect, useRef, useState } from "react";
import { fetchCitySuggestions } from "../services/weatherService";

/* =========================================================
   Afsnit 02 – Props
   ========================================================= */
type CityInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (city: string) => void;
  placeholder?: string;
};

/* =========================================================
   Afsnit 03 – Component
   ========================================================= */
export default function CityInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Skriv en by…",
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const blurTimer = useRef<number | null>(null);

  /* =========================================================
     Afsnit 04 – Fetch suggestions (debounce)
     ========================================================= */
  useEffect(() => {
    let alive = true;
    const q = (value || "").trim();

    // Kun dropdown når brugeren faktisk skriver noget
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const list = await fetchCitySuggestions(q);
        if (!alive) return;
        setSuggestions(list.slice(0, 6));
      } catch {
        if (!alive) return;
        setSuggestions([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [value]);

  /* =========================================================
     Afsnit 05 – Helpers
     ========================================================= */
  const submit = (city: string) => {
    const c = (city || "").trim();
    if (!c) return;
    setOpen(false);
    setSuggestions([]);
    onSubmit(c);
  };

  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setOpen(true);
  };

  const handleBlur = () => {
    // Delay så klik på forslag virker
    blurTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  /* =========================================================
     Afsnit 06 – UI
     ========================================================= */
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative">
        <div className="flex items-stretch gap-3">
          {/* Input */}
          <div className="flex-1 relative">
            <input
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setOpen(true);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(value);
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
              autoComplete="off"
              inputMode="search"
              className="w-full rounded-xl px-5 py-4 text-lg bg-slate-900/70 border border-white/10 text-white outline-none
                         focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />

            {/* Dropdown under input */}
            {open && (loading || suggestions.length > 0) && (
              <div
                className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden border border-white/10
                           bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50"
              >
                {loading && (
                  <div className="px-4 py-3 text-sm text-slate-300">Søger…</div>
                )}

                {!loading &&
                  suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // vigtigt så input ikke mister fokus før klik
                      onClick={() => {
                        onChange(s);
                        submit(s);
                      }}
                      className="w-full text-left px-4 py-3 text-base text-white hover:bg-cyan-500/10
                                 focus:outline-none"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Button */}
          <button
            type="button"
            onClick={() => submit(value)}
            className="rounded-xl px-7 py-4 font-semibold text-white bg-cyan-500/90 hover:bg-cyan-400
                       shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            VEJRET
          </button>
        </div>
      </div>
    </div>
  );
}
