"use client";

import { useCallback, useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";

export interface SettingsPayload {
  settings: Settings;
  hoursConfigured: boolean;
  integrations: Record<"database" | "square" | "email" | "googleCalendar" | "metaCapi", boolean>;
}

export function useSettings() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "Failed to load settings");
    setData(json);
    setDraft(json.settings);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next?: Settings) => {
    const body = next ?? draft;
    if (!body) return false;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Save failed");
      return false;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
    await load();
    return true;
  };

  return { data, draft, setDraft, error, saving, saved, save };
}
