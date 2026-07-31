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

export type DestId = "yahoo" | "morningstar" | "barrons" | "wsj" | "x";

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

export const DESTINATIONS: {
  id: DestId;
  mark: string;
  name: string;
  url: (symbol: string, info?: SymbolInfo) => string;
}[] = [
  { id: "yahoo", mark: "Y!", name: "Yahoo Finance", url: (s) => `https://finance.yahoo.com/quote/${encodeURIComponent(s)}` },
  { id: "morningstar", mark: "★", name: "Morningstar", url: morningstarUrl },
  { id: "barrons", mark: "B", name: "Barron's", url: barronsUrl },
  { id: "wsj", mark: "WSJ", name: "The Wall Street Journal", url: wsjUrl },
  // The cashtag search — what people are SAYING about the ticker, where the
  // other four are what it's worth.
  { id: "x", mark: "𝕏", name: "X (cashtag search)", url: (s) => `https://x.com/search?q=${encodeURIComponent("$" + s)}&src=cashtag_click` },
];
