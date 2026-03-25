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

const DAEMON_URL = "ws://127.0.0.1:7777/extension";
const RECONNECT_DELAY_MS = 3000;

let ws = null;
let reconnectTimer = null;

/**
 * Open a WebSocket connection to the binge-watch-me daemon.
 * Automatically reconnects if the connection drops.
 */
function connect() {
  console.log("[binge-watch-me] Connecting to daemon...");

  ws = new WebSocket(DAEMON_URL);

  ws.onopen = () => {
    console.log("[binge-watch-me] Connected to daemon");
    clearTimeout(reconnectTimer);
    // Update extension icon to show connected state
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setBadgeBackgroundColor({ color: "#1D9E75" });
  };

  ws.onmessage = (event) => {
    // Daemon sent a Command — forward it to the active streaming tab
    try {
      const command = JSON.parse(event.data);
      console.log("[binge-watch-me] Command from daemon:", command);
      forwardCommandToTab(command);
    } catch (e) {
      console.error("[binge-watch-me] Failed to parse command:", e);
    }
  };

  ws.onerror = (error) => {
    console.warn("[binge-watch-me] WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("[binge-watch-me] Disconnected from daemon — reconnecting...");
    // Show disconnected badge
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#E24B4A" });
    // Schedule reconnect
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
  };
}

/**
 * Send a MediaState update to the daemon.
 * Called by content.js via chrome.runtime.onMessage.
 * @param {import("./protocol.js").MediaState} state
 */
function sendStateToDaemon(state) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(state));
  }
}

/**
 * Forward a command to the content script running in the active
 * Netflix/YouTube tab.
 * @param {import("./protocol.js").Command} command
 */
function forwardCommandToTab(command) {
  chrome.tabs.query({ url: ["*://*.netflix.com/*"] }, (tabs) => {
    if (tabs.length === 0) {
      console.warn("[binge-watch-me] No matching tab found for command");
      return;
    }
    // Send to the first matching tab
    chrome.tabs.sendMessage(tabs[0].id, { type: "command", command });
  });
}

// Listen for state updates from content.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "state") {
    sendStateToDaemon(message.state);
  }
});

// Start connecting when the service worker loads
connect();
