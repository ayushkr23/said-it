import { useEffect, useState } from "react";
import { DEFAULT_HOST, listModels, type OllamaModel } from "./ollama";

export type OllamaStatus = { state: "checking" | "online" | "offline"; models: OllamaModel[]; loaded: string[] };

/** Polls the local Ollama server. Nothing here talks to anything but localhost. */
export function useOllama(host = DEFAULT_HOST, everyMs = 6000) {
  const [status, setStatus] = useState<OllamaStatus>({ state: "checking", models: [], loaded: [] });
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ctl = new AbortController();
      const t = window.setTimeout(() => ctl.abort(), 2500);
      try {
        const models = await listModels(host, ctl.signal);
        const ps = await fetch(`${host}/api/ps`, { signal: ctl.signal })
          .then((r) => r.json() as Promise<{ models?: { name: string }[] }>)
          .catch(() => ({ models: [] }));
        if (alive) setStatus({ state: "online", models, loaded: (ps.models ?? []).map((m) => m.name) });
      } catch {
        if (alive) setStatus({ state: "offline", models: [], loaded: [] });
      } finally {
        window.clearTimeout(t);
      }
    };
    check();
    const id = window.setInterval(check, everyMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [host, everyMs]);
  return status;
}
