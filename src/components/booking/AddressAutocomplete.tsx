"use client";

 
import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// Google Places (New) autocomplete with our own styled dropdown.
// Falls back to a plain input when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn't set.

export interface PlaceResult {
  line1: string;
  city: string;
  state: string;
  zip: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

let loader: Promise<any> | null = null;
function loadPlaces(key: string): Promise<any> {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.maps?.importLibrary) return resolve(w.google.maps.importLibrary("places"));
    const cb = `__clPlaces${Date.now()}`;
    w[cb] = () => resolve(w.google.maps.importLibrary("places"));
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export function AddressAutocomplete({
  apiKey,
  value,
  onChange,
  onSelect,
  error,
  id = "address-line1",
}: {
  apiKey: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: PlaceResult) => void;
  error?: string;
  id?: string;
}) {
  const listId = useId();
  const [places, setPlaces] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<{ text: string; secondary: string; prediction: any }[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const session = useRef<any>(null);
  const debounce = useRef<number | undefined>(undefined);
  const justSelected = useRef(false);

  useEffect(() => {
    if (!apiKey) return;
    loadPlaces(apiKey)
      .then((lib) => setPlaces(lib))
      .catch((e) => console.warn(e));
  }, [apiKey]);

  useEffect(() => {
    if (!places || justSelected.current) {
      justSelected.current = false;
      return;
    }
    window.clearTimeout(debounce.current);
    if (value.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    debounce.current = window.setTimeout(async () => {
      try {
        session.current ??= new places.AutocompleteSessionToken();
        const { suggestions: res } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: session.current,
          includedRegionCodes: ["us"],
          includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
          locationBias: { center: { lat: 40.73, lng: -73.5 }, radius: 50000 },
        });
        const list = (res ?? [])
          .filter((s: any) => s.placePrediction)
          .slice(0, 5)
          .map((s: any) => ({
            text: s.placePrediction.mainText?.text ?? s.placePrediction.text.text,
            secondary: s.placePrediction.secondaryText?.text ?? "",
            prediction: s.placePrediction,
          }));
        setSuggestions(list);
        setOpen(list.length > 0);
        setActive(-1);
      } catch (e) {
        console.warn("[places]", e);
      }
    }, 220);
    return () => window.clearTimeout(debounce.current);
  }, [value, places]);

  async function choose(i: number) {
    const s = suggestions[i];
    if (!s) return;
    setOpen(false);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "location", "id"] });
      session.current = null; // session ends on details fetch
      const get = (type: string, short = false) => {
        const c = place.addressComponents?.find((ac: any) => ac.types.includes(type));
        return c ? (short ? c.shortText : c.longText) : "";
      };
      const line1 = [get("street_number"), get("route")].filter(Boolean).join(" ") || s.text;
      const city = get("locality") || get("sublocality_level_1") || get("sublocality") || get("neighborhood") || get("postal_town") || get("administrative_area_level_3");
      justSelected.current = true;
      onSelect({
        line1,
        city,
        state: get("administrative_area_level_1", true),
        zip: get("postal_code"),
        placeId: place.id,
        lat: place.location?.lat(),
        lng: place.location?.lng(),
      });
    } catch (e) {
      console.warn("[places] details failed", e);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="field pl-10"
        value={value}
        autoComplete={places ? "off" : "address-line1"}
        placeholder="Start typing the street address…"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            choose(active);
          } else if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-accent" aria-hidden />
      {open && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-panel shadow-card">
          {suggestions.map((s, i) => (
            <li
              key={i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              className={`cursor-pointer px-4 py-3 text-sm ${i === active ? "bg-accent/15" : "hover:bg-white/5"}`}
            >
              <span className="font-semibold">{s.text}</span> <span className="text-mist">{s.secondary}</span>
            </li>
          ))}
          <li className="px-4 py-1.5 text-right text-[10px] text-white/40" aria-hidden>
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
