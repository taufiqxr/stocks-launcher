// Client-side symbol search over the build-time SEC dataset. Loaded lazily
// after first paint; a linear scan over ~40k rows is a few milliseconds,
// so no index and no fuzzy library until proven necessary.

import type { Kind, SymbolInfo } from "./destinations";

export type Sym = {
  ticker: string;
  name: string;
  info: SymbolInfo;
};

type Row = [string, string, string, string];

const KINDS: Record<string, Kind> = { s: "stock", e: "etf", f: "fund" };

let rows: Sym[] | null = null;
let loading: Promise<void> | null = null;

export function loadSymbols(): Promise<void> {
  loading ??= fetch(`${import.meta.env.BASE_URL}symbols.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Row[]>) : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      rows = data.map(([ticker, name, mic, kind]) => ({ ticker, name, info: { mic, kind: KINDS[kind] ?? "" } }));
    })
    .catch(() => {
      // No dataset, no suggestions — the box still opens whatever is typed.
      rows = [];
    });
  return loading;
}

// Rank: exact ticker, ticker prefix, name word-prefix, name substring.
// Ties break toward shorter tickers (AMD before AMDL), then alphabetical.
export function searchSymbols(query: string, limit = 8): Sym[] {
  if (!rows) return [];
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const scored: { s: Sym; score: number }[] = [];
  for (const s of rows) {
    let score: number;
    if (s.ticker === q) score = 0;
    else if (s.ticker.startsWith(q)) score = 1;
    else {
      const name = s.name.toUpperCase();
      if (!name) continue;
      const at = name.indexOf(q);
      if (at === 0 || (at > 0 && name[at - 1] === " ")) score = 2;
      else if (at > 0) score = 3;
      else continue;
    }
    scored.push({ s, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score ||
      a.s.ticker.length - b.s.ticker.length ||
      (a.s.ticker < b.s.ticker ? -1 : a.s.ticker > b.s.ticker ? 1 : 0),
  );
  return scored.slice(0, limit).map((x) => x.s);
}
