# Stocks Launcher — Plan

One box. Type a ticker or a company name, hit Enter, and every research site
you care about opens at once — Yahoo Finance, Morningstar, Barron's, WSJ, and
X's cashtag search — each on the **direct quote page** for that symbol, not a
search page.

Born 2026-07-31 as a sidebar widget in a private dashboard; this project makes
it a standalone, public, zero-backend web app anyone can use or fork.

## Product

- **A single static page** hosted on GitHub Pages. No server, no accounts, no
  keys, no tracking. Everything runs in the browser.
- **Keyboard-first**: land on the page → the box is focused → type → arrows to
  pick a suggestion → Enter → tabs open → box clears. A whole lookup in under
  two seconds.
- **Destination toggles**: each site is a small brand mark under the box; lit
  opens, dim skips. Choices persist in `localStorage`. The last lit mark
  refuses to turn off (a launcher pointed at nothing is a control that does
  nothing).
- **Suggestions by company name**: typing "advanced micro" offers AMD. Works
  offline-from-the-site's-own-data (see Symbol data below) — no third-party
  API call per keystroke.

## Architecture

| Piece | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript | Ported from the working widget; small, familiar |
| Hosting | GitHub Pages via Actions | Free, public, versioned with the code |
| Suggestions | Bundled symbol dataset, client-side fuzzy match | Yahoo's suggest API is CORS-blocked in browsers AND 429s anonymous servers — a static site cannot call it, so the site ships its own data |
| Symbol data | SEC EDGAR `company_tickers_exchange.json` (+ `company_tickers_mf.json` for funds), fetched at BUILD time by a script, emitted as a compact JSON the page loads | Public domain, no key, includes the **exchange** — which is exactly what direct Morningstar/WSJ URLs need |
| Tab opening | Synthesized anchor clicks | `window.open` consumes the click's transient user activation, so the 2nd+ of N calls gets popup-blocked; anchor navigation doesn't (verified: 5 tabs from one click, no permission prompts) |

### Symbol data pipeline

`scripts/build-symbols.ts`, run in CI before the Vite build:

1. Fetch SEC `company_tickers_exchange.json` → `{ticker, name, exchange}` for
   every US-listed company (Nasdaq / NYSE / others). Fetch
   `company_tickers_mf.json` for mutual funds.
2. Normalize into a compact array sorted for prefix search:
   `[["AAPL", "Apple Inc.", "XNAS", "stock"], …]`.
3. Emit `public/symbols.json` (~1–2 MB raw, ~300 KB gzipped — fine for a page
   that is itself the destination; lazy-load it after first paint).

Client search: case-insensitive prefix + substring over ticker and name,
ticker-prefix matches ranked first, capped at 8 rows. No fuzzy library until
the naive version proves insufficient.

Known limitation to state honestly in the README: the SEC files cover
SEC-registered US listings — foreign tickers (0700.HK) and crypto aren't in
them. The box still opens whatever you type; you just don't get suggestions
for those.

## Destinations — verified URL patterns

These were each confirmed landing on a real page (2026-07-31), including the
fund variants. This table is the core IP of the project; keep it tested.

| Site | Stocks | ETFs | Mutual funds | Fallback |
|---|---|---|---|---|
| Yahoo Finance | `finance.yahoo.com/quote/SYM` | same | same | — (quote path takes anything) |
| Morningstar | `morningstar.com/stocks/<mic>/sym/quote` | `…/etfs/<mic>/sym/quote` | `…/funds/<mic>/sym/quote` | `morningstar.com/search?query=SYM` |
| Barron's | `barrons.com/market-data/stocks/sym` | `…/funds/sym` (no /etfs/ section — that's a soft 404) | `…/funds/sym` | `barrons.com/search?keyword=SYM` |
| WSJ | `wsj.com/market-data/quotes/SYM` | `…/quotes/etf/SYM` (the bare path never renders for an ETF) | `…/quotes/mutualfund/US/<MIC>/SYM` | `wsj.com/search?query=SYM` |
| X | `x.com/search?q=%24SYM&src=cashtag_click` | same | same | — |

Exchange MIC slugs (Morningstar lowercase, WSJ uppercase): Nasdaq `xnas`,
NYSE `xnys`, NYSE Arca `arcx`, NYSE American `xase`, Cboe BZX `bats`, OTC
`pinx`. Two corrections found in build-day testing: the SEC files ETF trusts
under "NYSE" but NYSE-group ETFs actually list on **Arca** — and Morningstar
hard-404s the wrong venue (SPY at `/etfs/xnys/…` is Page Not Found) — so the
pipeline rewrites `etf + xnys → arcx`; and class shares are dash on Yahoo
(`BRK-B`) but dot everywhere else (`brk.b`). **Rule: never guess a direct
URL** — an unmapped exchange or unknown security type falls back to that
site's search page, because a wrong direct URL looks like the site not
knowing the stock.

Destinations live in one config module (`src/destinations.ts`, ported from
the widget's `researchLinks.ts`) so adding a site is one entry: id, mark,
brand color, URL builder, fallback.

## UI

- Centered launcher card: the input, the suggestion dropdown, the toggle row.
  Dark and light themes via `prefers-color-scheme`, no chrome beyond that.
- Brand marks are CSS-drawn (Y! on Yahoo purple `#5f01d1`, ★ on Morningstar
  red `#d02b20`, B on Barron's navy `#0b3c85`, WSJ and 𝕏 white-on-black) —
  no external logo assets, nothing to license.
- Suggestions show `SYMBOL  Company Name  ·  exchange`. Enter with no
  selection opens the raw text — and still gets direct pages when the top
  suggestion is exactly that ticker.
- URL parameter support: `?q=TSLA` pre-fills and (with `&go=1`) launches —
  makes the page scriptable and bookmarkable (browser keyword search:
  `sl TSLA`).

## Pitfalls already learned (don't relearn)

1. **Yahoo's suggest API is unusable from a static site** — CORS-blocked in
   the browser, 429 for anonymous servers (it wants its cookie/crumb dance).
   That is WHY the symbol dataset exists. A live-suggestion proxy (Cloudflare
   Worker + `yfinance`-style handshake) is a possible later add, never a
   dependency.
2. **Multi-tab opening must use anchor clicks**, not `window.open` — see
   Architecture. Also `rel="noopener"` on every one.
3. **Chrome autofill fights bare text inputs** — carry the
   `autocomplete/autocorrect/data-1p-ignore/data-lpignore` attribute set.
4. **Suggestion pick must be `pointerdown`, not `click`** — the input's blur
   tears the dropdown down before a click resolves.
5. **Dow Jones sites (Barron's/WSJ) bot-block probes** — you cannot smoke-test
   their URLs with curl (401 for bots, and Morningstar rate-limits to 202
   after a few hits); verify patterns in a real browser.

## Milestones

- ✅ **M1 — Launcher works** (shipped 2026-07-31): scaffold, destinations
  module ported, input + toggles + anchor-click opening, deployed to Pages
  at https://taufiqxr.github.io/stocks-launcher/.
- ✅ **M2 — Suggestions** (shipped 2026-07-31, same day): SEC symbol
  pipeline (38,835 tickers), client-side search, keyboard navigation,
  direct-page URLs from the dataset's exchange field — verified live for a
  stock (NVDA), an ETF (SPY) and a mutual fund (FXAIX) on all five sites.
- **M3 — Polish**: `?q=` parameter, PWA manifest (installable, works
  offline), README with a demo GIF, themes pass.
- **M4 — Maybe, later**: optional live-suggestion Worker proxy; per-site
  ordering; more sites (Finviz `finviz.com/quote.ashx?t=SYM`, Seeking Alpha
  `seekingalpha.com/symbol/SYM`, StockAnalysis
  `stockanalysis.com/stocks/sym`); an "open on my broker" slot.

## Relationship to the private dashboard

The family-office sidebar keeps its own copy of this widget (with its
server-side Yahoo suggest proxy — a luxury a static site doesn't have). This
project is a spin-off, not a migration; the two share the URL-pattern table
above by convention, not by code.
