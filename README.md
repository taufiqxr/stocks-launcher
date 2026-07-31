# Stocks Launcher

**Live at [taufiqxr.github.io/stocks-launcher](https://taufiqxr.github.io/stocks-launcher/).**

Type a ticker or a company name. Hit Enter. Every research site you care
about opens at once — each on the **direct quote page** for that symbol.

- Twelve sites, grouped by purpose: **Yahoo Finance**, **Google Finance**,
  **Morningstar**, **Nasdaq** · **CNBC**, **MarketWatch**, **Barron's**,
  **WSJ** · **TradingView**, **Finviz** · **X** and **Stocktwits** (cashtag
  feeds)
- Suggestions as you type, by ticker or company name
- Check or uncheck any site — free ones start on, and your picks are
  remembered (per browser on the web, synced across Chromes in the
  extension)
- One static page: no server, no account, no API keys, no tracking

## Why

Looking up one stock across five sites is five address bars and five
searches. This is one box.

## How it works

Suggestions come from a dataset built at deploy time from the SEC's public
ticker files (`scripts/build-symbols.mjs`) — ~39,000 US-listed companies and
funds with their exchange, which is what lets Morningstar, Barron's and WSJ
open on direct quote pages instead of search results. Anything the dataset
doesn't know (foreign listings, crypto) still opens: unknown symbols take
each site's search page instead. See [PLAN.md](PLAN.md) for the architecture
and the verified URL-pattern table.

## Chrome extension

The same launcher as a toolbar popup, plus an address-bar shortcut — type
`sl tsla` from any page — and each lookup's tabs open bundled in a named
tab group. No store listing yet; load it straight from the repo:

```
npm install
npm run build:ext
```

Then in Chrome: `chrome://extensions` → turn on **Developer mode**
(top right) → **Load unpacked** → pick the `dist-extension/` folder.

## Develop

```
npm install
npm run symbols   # build public/symbols.json from SEC data (once)
npm run dev
```

`npm run build` runs the symbol pipeline automatically; pushes to `main`
deploy via GitHub Actions.

## License

[MIT](LICENSE)
