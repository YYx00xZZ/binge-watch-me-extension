// binge-watch-me-extension — browser extension companion for binge-watch-me
// Copyright (C) 2026  Aleksandar Parvanov
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import adapters from "./adapters/index.js";

// Find the adapter that matches the current page URL
const adapter = adapters.find(a =>
  matchesPattern(a.matches, window.location.href)
);

if (!adapter) {
  console.log("[binge-watch-me] No adapter for this page");
} else {
  console.log(`[binge-watch-me] Using adapter for: ${window.location.href}`);
  startPolling(adapter);
}

/**
 * Poll the adapter for state every second and send it to background.js.
 * Also listen for commands coming back from background.js.
 */
function startPolling(adapter) {
  // Listen for commands forwarded from background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "command") {
      console.log("[binge-watch-me] Executing command:", message.command);
      adapter.execute(message.command);
    }
  });

  // Push state to background.js every second
  const intervalId = setInterval(() => {
    const state = adapter.getState();
    if (state) {
      try {
        chrome.runtime.sendMessage({ type: "state", state });
      } catch (e) {
        console.warn("[binge-watch-me] Extension context invalidated, stopping poll");
        clearInterval(intervalId);
      }
    }
  }, 1000);
}

/**
 * Check if a URL matches a manifest-style pattern like *://*.netflix.com/*
 * @param {string} pattern
 * @param {string} url
 * @returns {boolean}
 */
function matchesPattern(pattern, url) {
  const regex = pattern
    .replace(/\./g, "\\.")
    .replace(/\*/g, ".*");
  return new RegExp(regex).test(url);
}