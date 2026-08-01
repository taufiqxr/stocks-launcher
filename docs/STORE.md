# Chrome Web Store — submission kit

Everything pre-written; the two things only the owner can do are marked ⛔.

## One-time setup

1. ⛔ Go to https://chrome.google.com/webstore/devconsole, sign in with your
   Google account, pay the one-time **$5** developer registration fee, and
   verify the account email. (2-step verification must be on.)
2. In the console: **+ New item** → upload **`stocks-launcher-1.0.0.zip`**
   (repo root; regenerate any time with `npm run build:ext` then
   `cd dist-extension && zip -qr ../stocks-launcher-1.0.0.zip .`).

## Store listing tab

- **Name**: Stocks Launcher (comes from the manifest)
- **Summary** (from manifest, editable): Type a ticker or company name —
  open it on 14 research sites at once, each on its direct quote page, in
  one tab group.
- **Description**:

  > One box for stock research. Type a ticker or a company name, hit
  > Enter, and every research site you have enabled opens at once — each
  > on the DIRECT quote page for that symbol, bundled into a single named
  > tab group you can collapse or close as one.
  >
  > • Fourteen sites, grouped by purpose: Yahoo Finance, Google Finance,
  > Morningstar, Nasdaq · CNBC, MarketWatch, Barron's, WSJ, Bloomberg ·
  > TradingView, Finviz · X, Stocktwits and Reddit (cashtag searches)
  > • Address-bar shortcut: type "sl tsla" from any page
  > • Suggestions as you type, by ticker or company name — from a bundled
  > dataset of ~39,000 US-listed companies and funds, so they are instant
  > and work offline
  > • Pick your sites once; choices sync across your Chromes
  > • No server, no account, no API keys, no tracking — open source (MIT)
  >
  > Stocks, ETFs and mutual funds all resolve to the right page per site.
  > Unknown symbols (foreign listings, crypto) still open via each site's
  > own search.

- **Category**: Productivity → Tools
- **Language**: English (United States)
- **Store icon**: `extension/public/icons/128.png` (auto-taken from the zip)
- **Screenshots**: upload `docs/store-screenshot.png` (1280×800)
- **Homepage URL**: https://github.com/taufiqxr/stocks-launcher-chrome-extension

## Privacy tab

- **Single purpose**: Opens a typed stock ticker on the user's chosen
  research websites, each on its direct quote page.
- **Permission justifications**:
  - `storage` — saves which research sites the user has enabled, synced
    via Chrome so their picks follow them.
  - `tabGroups` — collects the tabs of one lookup into a single named tab
    group.
- **Remote code**: No, all code is packaged.
- **Data usage**: check NOTHING (the extension collects no user data of
  any kind). Certify the disclosures.
- **Privacy policy URL**: https://taufiqxr.github.io/stocks-launcher-chrome-extension/privacy.html

## Distribution tab

- **Visibility**: Public. **Regions**: all.

## Submit

3. ⛔ Press **Submit for review**. With these permissions expect hours to
   ~2–3 days. The listing goes live automatically on approval (that's the
   default; there's an option to hold for manual publish if preferred).

## Updating later

Bump `version` in `extension/public/manifest.json`, rebuild, re-zip,
upload as a new package on the existing item, resubmit. Users update
automatically.
