// The launcher's destinations — the brand list and each site's quote-URL
// rules. Ported from the private dashboard widget this project was spun off
// from; every direct pattern here was verified landing on a real page in a
// real browser (2026-07-31), including the mutual-fund variants.
//
// The one rule: NEVER guess a direct URL. A missing exchange or security
// kind falls back to that site's search page, because a wrong direct URL
// looks like the site not knowing the stock.

export type Kind = "stock" | "etf" | "fund";

export type SymbolInfo = {
  // Market Identifier Code slug, Morningstar's lowercase spelling:
  // xnas / xnys / arcx / xase / bats / pinx. Empty when unknown.
  mic: string;
  kind: Kind | "";
};

export type DestId =
  | "yahoo"
  | "google"
  | "morningstar"
  | "nasdaq"
  | "cnbc"
  | "marketwatch"
  | "barrons"
  | "wsj"
  | "tradingview"
  | "finviz"
  | "x"
  | "stocktwits";

const SECTIONS: Record<string, string> = {
  stock: "stocks",
  etf: "etfs",
  fund: "funds",
};

// Class-share punctuation differs per site: Yahoo (and the SEC dataset)
// spell Berkshire "BRK-B"; Morningstar, Barron's and WSJ spell it "BRK.B".
const dotted = (symbol: string) => symbol.replace(/-/g, ".");

function morningstarUrl(symbol: string, info?: SymbolInfo): string {
  const section = info && SECTIONS[info.kind];
  if (section && info.mic) {
    return `https://www.morningstar.com/${section}/${info.mic}/${encodeURIComponent(dotted(symbol).toLowerCase())}/quote`;
  }
  return `https://www.morningstar.com/search?query=${encodeURIComponent(symbol)}`;
}

// Barron's has no /etfs/ section — /market-data/etfs/spy is a soft 404
// while /market-data/funds/spy is SPY's real page (and their own /stocks/
// URL redirects there). ETFs file under funds.
const BARRONS_SECTIONS: Record<string, string> = {
  stock: "stocks",
  etf: "funds",
  fund: "funds",
};

function barronsUrl(symbol: string, info?: SymbolInfo): string {
  const section = info && BARRONS_SECTIONS[info.kind];
  if (section) {
    return `https://www.barrons.com/market-data/${section}/${encodeURIComponent(dotted(symbol).toLowerCase())}`;
  }
  return `https://www.barrons.com/search?keyword=${encodeURIComponent(symbol)}`;
}

function wsjUrl(symbol: string, info?: SymbolInfo): string {
  // WSJ's paths by security type, each browser-verified: stocks at
  // /market-data/quotes/<SYM>, ETFs at /market-data/quotes/etf/<SYM> (the
  // bare quotes path never renders for an ETF), funds under a
  // country/exchange path. A raw ticker with no data takes the stock path —
  // it covers the common case.
  if (info?.kind === "etf") {
    return `https://www.wsj.com/market-data/quotes/etf/${encodeURIComponent(dotted(symbol))}`;
  }
  if (info?.kind === "fund") {
    if (info.mic) {
      return `https://www.wsj.com/market-data/quotes/mutualfund/US/${info.mic.toUpperCase()}/${encodeURIComponent(dotted(symbol))}`;
    }
    return `https://www.wsj.com/search?query=${encodeURIComponent(symbol)}`;
  }
  return `https://www.wsj.com/market-data/quotes/${encodeURIComponent(dotted(symbol))}`;
}

// Google Finance quote paths need their own exchange spelling; a fund is
// always :MUTF. Verified: AAPL:NASDAQ, SPY:NYSEARCA, FXAIX:MUTF. The BARE
// path (no suffix) is NOT a quote page — it lands on the Google Finance
// home — so the no-data fallback is a plain Google search, whose finance
// panel resolves anything.
const GOOGLE_EXCH: Record<string, string> = {
  xnas: "NASDAQ",
  xnys: "NYSE",
  arcx: "NYSEARCA",
  xase: "NYSEAMERICAN",
  bats: "BATS",
  pinx: "OTCMKTS",
};

function googleUrl(symbol: string, info?: SymbolInfo): string {
  if (info?.kind === "fund") {
    return `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}:MUTF`;
  }
  const exch = info && GOOGLE_EXCH[info.mic];
  if (exch) {
    return `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}:${exch}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(symbol + " stock")}`;
}

function nasdaqUrl(symbol: string, info?: SymbolInfo): string {
  const section = info?.kind === "etf" ? "etf" : info?.kind === "fund" ? "mutual-fund" : "stocks";
  return `https://www.nasdaq.com/market-activity/${section}/${encodeURIComponent(symbol.toLowerCase())}`;
}

function marketwatchUrl(symbol: string, info?: SymbolInfo): string {
  // MarketWatch files ETFs and mutual funds together under /fund/.
  const section = info?.kind === "etf" || info?.kind === "fund" ? "fund" : "stock";
  return `https://www.marketwatch.com/investing/${section}/${encodeURIComponent(symbol.toLowerCase())}`;
}

// `free`: usable without a subscription — these default ON (owner decision
// 2026-07-31); the subscription brands ship default-off. A stored choice
// always wins over defaults.
export const DESTINATIONS: {
  id: DestId;
  mark: string;
  name: string;
  group: string;
  free: boolean;
  url: (symbol: string, info?: SymbolInfo) => string;
}[] = [
  // One endpoint per symbol regardless of kind: Yahoo, CNBC, TradingView,
  // Finviz (self-redirects unknowns to its own search), Stocktwits, X.
  { id: "yahoo", mark: "Y!", name: "Yahoo Finance", group: "Quotes", free: true, url: (s) => `https://finance.yahoo.com/quote/${encodeURIComponent(s)}` },
  { id: "google", mark: "G", name: "Google Finance", group: "Quotes", free: true, url: googleUrl },
  { id: "morningstar", mark: "★", name: "Morningstar", group: "Quotes", free: true, url: morningstarUrl },
  { id: "nasdaq", mark: "NDQ", name: "Nasdaq", group: "Quotes", free: true, url: nasdaqUrl },
  { id: "cnbc", mark: "CNBC", name: "CNBC", group: "News", free: true, url: (s) => `https://www.cnbc.com/quotes/${encodeURIComponent(s)}` },
  { id: "marketwatch", mark: "MW", name: "MarketWatch", group: "News", free: true, url: marketwatchUrl },
  { id: "barrons", mark: "B", name: "Barron's", group: "News", free: false, url: barronsUrl },
  { id: "wsj", mark: "WSJ", name: "WSJ", group: "News", free: false, url: wsjUrl },
  { id: "tradingview", mark: "TV", name: "TradingView", group: "Charts & data", free: true, url: (s) => `https://www.tradingview.com/symbols/${encodeURIComponent(dotted(s))}/` },
  { id: "finviz", mark: "FV", name: "Finviz", group: "Charts & data", free: true, url: (s) => `https://finviz.com/quote.ashx?t=${encodeURIComponent(s)}` },
  // The cashtag feeds — what people are SAYING about the ticker, where the
  // rest are what it's worth.
  { id: "x", mark: "𝕏", name: "X", group: "Sentiment", free: true, url: (s) => `https://x.com/search?q=${encodeURIComponent("$" + s)}&src=cashtag_click` },
  { id: "stocktwits", mark: "ST", name: "Stocktwits", group: "Sentiment", free: true, url: (s) => `https://stocktwits.com/symbol/${encodeURIComponent(s)}` },
];

export const DEFAULT_ON: DestId[] = DESTINATIONS.filter((d) => d.free).map((d) => d.id);
