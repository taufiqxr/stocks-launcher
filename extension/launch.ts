// The extension's tab opener — the reason this form factor beats the
// website: chrome.tabs.create has no popup blocker to dodge, and the tabs
// land in one NAMED, collapsible group per lookup.

export async function openInGroup(symbol: string, urls: string[]): Promise<void> {
  const ids: number[] = [];
  for (const url of urls) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (tab.id !== undefined) ids.push(tab.id);
  }
  if (ids.length > 1) {
    const groupId = await chrome.tabs.group({ tabIds: ids as [number, ...number[]] });
    await chrome.tabGroups.update(groupId, { title: symbol });
  }
  if (ids[0] !== undefined) {
    await chrome.tabs.update(ids[0], { active: true });
  }
  // Called from the popup (which should close after a launch) AND from the
  // omnibox service worker (which has no window at all).
  if (typeof window !== "undefined") window.close();
}
