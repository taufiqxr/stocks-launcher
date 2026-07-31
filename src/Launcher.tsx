import { useEffect, useState } from "react";
import { DEFAULT_ON, DESTINATIONS, type DestId, type SymbolInfo } from "./destinations";
import { loadSymbols, searchSymbols, type Sym } from "./search";

const DESTS_KEY = "sl-dests";
const MIN_CHARS = 1;

const MIC_LABEL: Record<string, string> = {
  xnas: "Nasdaq",
  xnys: "NYSE",
  arcx: "NYSE Arca",
  xase: "NYSE American",
  bats: "Cboe",
  pinx: "OTC",
};

function loadDests(): DestId[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(DESTS_KEY) ?? "");
    if (Array.isArray(stored)) {
      const valid = DESTINATIONS.map((d) => d.id).filter((id) => stored.includes(id));
      if (valid.length > 0) return valid;
    }
  } catch {
    // Absent or malformed — fall through to the defaults.
  }
  // Sites usable without a subscription start on; a stored choice wins.
  return DEFAULT_ON;
}

// Each chip shows the site's own favicon, fetched at runtime through
// Google's favicon service — nothing bundled, so no licensed artwork lives
// in this repo. The drawn mark is the automatic fallback whenever the icon
// can't load (offline, blocked, service down), so a chip never renders
// empty.
function SiteIcon({ d }: { d: (typeof DESTINATIONS)[number] }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`dest dest-${d.id}`} aria-hidden="true">
        {d.mark}
      </span>
    );
  }
  return (
    <img
      className="dest-icon"
      src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=64`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// Chrome's autofill reads a lone text input as an address form and renders
// its own dropdown over ours; these attributes (plus the password-manager
// opt-outs) keep the field plain.
const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
} as const;

// Opens via a synthesized anchor click, not window.open: window.open
// CONSUMES the click's transient user activation, so the second of N calls
// gets popup-blocked — anchor navigation doesn't, which is what lets one
// press open five tabs.
function openTab(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// The extension popup reuses this component with its own storage
// (chrome.storage.sync via initialDests/onDestsChange) and its own opener
// (chrome tab groups via launch). The website passes nothing and gets the
// localStorage + anchor-click behavior it always had.
export default function Launcher({
  initialDests,
  onDestsChange,
  launch,
}: {
  initialDests?: DestId[];
  onDestsChange?: (dests: DestId[]) => void;
  launch?: (symbol: string, urls: string[]) => void;
}) {
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  // Keyboard highlight; -1 = nothing highlighted, Enter opens the raw text.
  const [active, setActive] = useState(-1);
  const [dests, setDests] = useState<DestId[]>(() => initialDests ?? loadDests());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSymbols().then(() => setReady(true));
  }, []);

  const hits: Sym[] = open && ready && typed.trim().length >= MIN_CHARS ? searchSymbols(typed) : [];

  function toggleDest(id: DestId) {
    setDests((prev) => {
      // The last enabled mark won't toggle off — a launcher pointed at
      // nothing is a control that does nothing.
      if (prev.includes(id) && prev.length === 1) return prev;
      const next = prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id];
      if (onDestsChange) onDestsChange(next);
      else localStorage.setItem(DESTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function go(symbol: string, info?: SymbolInfo) {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    const urls = DESTINATIONS.filter((d) => dests.includes(d.id)).map((d) => d.url(s, info));
    if (launch) launch(s, urls);
    else for (const url of urls) openTab(url);
    setTyped("");
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="launcher">
      <div className="box">
        <input
          {...NO_AUTOFILL}
          className="box-input"
          value={typed}
          placeholder="Ticker or company"
          aria-label="Ticker or company name"
          autoFocus
          onChange={(e) => {
            setTyped(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          // Closing on blur would fire before a click on a suggestion
          // lands, so the list closes on Escape and on a pick, and blur
          // only defers.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            } else if (e.key === "ArrowDown" && hits.length > 0) {
              e.preventDefault();
              setActive((a) => (a + 1) % hits.length);
            } else if (e.key === "ArrowUp" && hits.length > 0) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? hits.length - 1 : a - 1));
            } else if (e.key === "Enter") {
              // Enter on raw text still gets direct quote pages when the
              // top suggestion IS that ticker — "amd" ⏎ shouldn't land on
              // search pages that AMD ⏎ via arrow-down would have skipped.
              const chosen =
                active >= 0 && hits[active]
                  ? hits[active]
                  : hits.find((h) => h.ticker === typed.trim().toUpperCase());
              go(chosen ? chosen.ticker : typed, chosen?.info);
            }
          }}
        />
        {hits.length > 0 && (
          <div className="suggest" role="listbox">
            {hits.map((hit, i) => (
              <button
                key={hit.ticker}
                className={i === active ? "suggest-item active" : "suggest-item"}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                // pointerDown, not click: the input's blur would otherwise
                // tear the list down before the click resolved.
                onPointerDown={(e) => {
                  e.preventDefault();
                  go(hit.ticker, hit.info);
                }}
              >
                <span className="suggest-ticker">{hit.ticker}</span>
                {hit.name && <span className="suggest-name">{hit.name}</span>}
                {MIC_LABEL[hit.info.mic] && <span className="suggest-exch">{MIC_LABEL[hit.info.mic]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* The site picker: labeled chips grouped by what each site is FOR
          (owner's pick of the 2026-07-31 proposals — Option C). The brand
          marks stay the only color on the page; a checked chip opens on
          launch, an unchecked one is skipped. */}
      <div className="dest-groups" role="group" aria-label="Sites to open">
        {[...new Set(DESTINATIONS.map((d) => d.group))].map((group) => (
          <div className="dest-group" key={group}>
            <div className="dest-group-label">{group}</div>
            <div className="dest-chips">
              {DESTINATIONS.filter((d) => d.group === group).map((d) => (
                <button
                  key={d.id}
                  className={`dest-chip${dests.includes(d.id) ? " on" : ""}`}
                  aria-pressed={dests.includes(d.id)}
                  title={`${d.name} — ${dests.includes(d.id) ? "opens on launch, click to skip" : "skipped, click to enable"}`}
                  onClick={() => toggleDest(d.id)}
                >
                  <SiteIcon d={d} />
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
