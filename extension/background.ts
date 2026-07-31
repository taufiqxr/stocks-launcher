// The omnibox service worker: type `sl tsla` in the address bar from any
// page. Suggestions come from the same bundled dataset and ranking the
// popup uses; a pick (or raw Enter) opens the enabled destinations as a
// named tab group.

import { DESTINATIONS } from "../src/destinations";
import { loadSymbols, searchSymbols } from "../src/search";
import { openInGroup } from "./launch";

const symbolsUrl = chrome.runtime.getURL("symbols.json");

// Omnibox descriptions are XML — an unescaped ampersand in a company name
// (AT&T) would otherwise kill the whole suggestion list.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

chrome.omnibox.setDefaultSuggestion({
  description: "Open <match>%s</match> on your research sites",
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  void loadSymbols(symbolsUrl).then(() => {
    suggest(
      searchSymbols(text, 6).map((hit) => ({
        content: hit.ticker,
        description: `<match>${esc(hit.ticker)}</match>${hit.name ? ` <dim>${esc(hit.name)}</dim>` : ""}`,
      })),
    );
  });
});

chrome.omnibox.onInputEntered.addListener((text) => {
  void (async () => {
    const symbol = text.trim().toUpperCase();
    if (!symbol) return;
    // `text` is either a picked suggestion's content (a ticker) or raw
    // typed text; an exact dataset match supplies the exchange/kind that
    // make direct quote URLs possible.
    await loadSymbols(symbolsUrl);
    const top = searchSymbols(symbol, 1)[0];
    const info = top && top.ticker === symbol ? top.info : undefined;
    const stored: unknown = (await chrome.storage.sync.get("dests")).dests;
    const all = DESTINATIONS.map((d) => d.id);
    const enabled = Array.isArray(stored) ? all.filter((id) => stored.includes(id)) : all;
    const use = enabled.length > 0 ? enabled : all;
    await openInGroup(
      symbol,
      DESTINATIONS.filter((d) => use.includes(d.id)).map((d) => d.url(symbol, info)),
    );
  })();
});
