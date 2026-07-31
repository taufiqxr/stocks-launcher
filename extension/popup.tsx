import { createRoot } from "react-dom/client";
import Launcher from "../src/Launcher";
import { DESTINATIONS, type DestId } from "../src/destinations";
import { openInGroup } from "./launch";
import "../src/styles.css";
import "./popup.css";

// Toggle prefs live in chrome.storage.sync — shared with the omnibox
// service worker (which can't read localStorage) and synced across the
// user's Chromes. Loaded before first render so the marks never flash the
// wrong state.
async function main() {
  const stored: unknown = (await chrome.storage.sync.get("dests")).dests;
  let initial: DestId[] | undefined;
  if (Array.isArray(stored)) {
    const valid = DESTINATIONS.map((d) => d.id).filter((id) => stored.includes(id));
    if (valid.length > 0) initial = valid;
  }
  createRoot(document.getElementById("root")!).render(
    <div className="popup">
      <Launcher
        initialDests={initial}
        onDestsChange={(dests) => void chrome.storage.sync.set({ dests })}
        launch={(symbol, urls) => void openInGroup(symbol, urls)}
      />
    </div>,
  );
}

void main();
