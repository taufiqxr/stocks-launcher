// Build-time symbol dataset — fetches the SEC's public ticker files and
// emits public/symbols.json for the client-side suggestions. Runs via the
// `prebuild` hook, so `npm run build` is the whole story locally and in CI.
//
// Why this exists at all: Yahoo's suggest API is CORS-blocked in browsers
// and 429s anonymous servers, so a static site can never call it. The SEC
// files are public domain, keyless, and — the part that matters — carry the
// EXCHANGE, which is what direct Morningstar/WSJ quote URLs need.
//
// Output shape, tuned for size: an array of [ticker, name, mic, kindCode]
// with kindCode "s" | "e" | "f" and mic "" when unknown.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "symbols.json");

// The SEC's fair-access policy requires a "Name contact@email" User-Agent —
// a URL-shaped one 403s. This is the repo's public commit address.
const HEADERS = { "User-Agent": "StocksLauncher taufiqrsust@gmail.com" };

const EXCHANGE_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const FUNDS_URL = "https://www.sec.gov/files/company_tickers_mf.json";

// SEC exchange names → Market Identifier Code slugs (Morningstar's
// lowercase spelling; WSJ uppercases the same codes). Unknown names map to
// "" and the client falls back to search pages — never a guessed URL.
const MIC = {
  Nasdaq: "xnas",
  NYSE: "xnys",
  "NYSE Arca": "arcx",
  "NYSE American": "xase",
  "NYSE MKT": "xase",
  CBOE: "bats",
  Cboe: "bats",
  OTC: "pinx",
};

// ETF detection from the registrant name. \bETF\b/\bETN\b is the reliable
// signal; TRUST alone is NOT (Northern Trust is a bank) — it only counts
// beside a fund-shaped word (Invesco QQQ TRUST Series 1, SPDR Gold TRUST).
// A miss costs a wrong-section direct URL, so keep this conservative and
// verify the big ETFs against the output whenever it changes.
const ETF_RE = /\b(ETF|ETN)\b/i;
const TRUST_FUND_RE = /\bTRUST\b.*\b(SERIES|SHARES|FUND|INDEX)\b|\b(SPDR|ISHARES)\b/i;

function kindOf(name) {
  if (ETF_RE.test(name) || TRUST_FUND_RE.test(name)) return "e";
  return "s";
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

const [exchangeDoc, fundsDoc] = await Promise.all([fetchJson(EXCHANGE_URL), fetchJson(FUNDS_URL)]);

const rows = [];
const seen = new Set();

{
  const f = exchangeDoc.fields;
  const iTicker = f.indexOf("ticker");
  const iName = f.indexOf("name");
  const iExchange = f.indexOf("exchange");
  for (const row of exchangeDoc.data) {
    const ticker = String(row[iTicker] ?? "").trim().toUpperCase();
    const name = String(row[iName] ?? "").trim();
    if (!ticker || seen.has(ticker)) continue;
    seen.add(ticker);
    const kind = kindOf(name);
    let mic = MIC[String(row[iExchange] ?? "").trim()] ?? "";
    // The SEC files ETF trusts under "NYSE", but NYSE-group ETFs list on
    // Arca — and Morningstar hard-404s the wrong venue (SPY at
    // /etfs/xnys/… is Page Not Found, /etfs/arcx/… is the real page).
    if (kind === "e" && mic === "xnys") mic = "arcx";
    rows.push([ticker, name, mic, kind]);
  }
}

{
  // The mutual-fund file carries symbols but NO names — those rows are
  // ticker-searchable only. mic xnas is the US-mutual-fund default the fund
  // URL patterns were verified against (FXAIX).
  const f = fundsDoc.fields;
  const iSymbol = f.indexOf("symbol");
  for (const row of fundsDoc.data) {
    const ticker = String(row[iSymbol] ?? "").trim().toUpperCase();
    if (!ticker || seen.has(ticker)) continue;
    seen.add(ticker);
    rows.push([ticker, "", "xnas", "f"]);
  }
}

rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(rows));

const kinds = rows.reduce((m, r) => ((m[r[3]] = (m[r[3]] ?? 0) + 1), m), {});
console.log(`symbols.json: ${rows.length} tickers (${kinds.s ?? 0} stocks, ${kinds.e ?? 0} ETFs, ${kinds.f ?? 0} funds)`);
