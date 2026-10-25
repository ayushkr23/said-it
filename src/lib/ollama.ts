export type OllamaModel = { name: string; size: number };

export type ChatStats = {
  model: string;
  ms: number;
  promptTokens: number;
  outTokens: number;
  tokensPerSec: number;
};

export const DEFAULT_HOST = "http://localhost:11434";

export async function listModels(host = DEFAULT_HOST, signal?: AbortSignal): Promise<OllamaModel[]> {
  const res = await fetch(`${host}/api/tags`, { signal });
  if (!res.ok) throw new Error(`Ollama answered ${res.status}`);
  const data = (await res.json()) as { models: OllamaModel[] };
  return data.models ?? [];
}

export async function chatJSON<T>(opts: {
  host?: string;
  model: string;
  system: string;
  user: string;
  schema: object;
  signal?: AbortSignal;
}): Promise<{ data: T; stats: ChatStats }> {
  const started = performance.now();
  const res = await fetch(`${opts.host ?? DEFAULT_HOST}/api/chat`, {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      stream: false,
      format: opts.schema,
      keep_alive: "10m",
      options: { temperature: 0.1, num_ctx: 8192 },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama answered ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const evalNs = body.eval_duration || 1;
  return {
    data: JSON.parse(body.message.content) as T,
    stats: {
      model: opts.model,
      ms: Math.round(performance.now() - started),
      promptTokens: body.prompt_eval_count ?? 0,
      outTokens: body.eval_count ?? 0,
      tokensPerSec: Math.round(((body.eval_count ?? 0) / evalNs) * 1e9 * 10) / 10,
    },
  };
}
