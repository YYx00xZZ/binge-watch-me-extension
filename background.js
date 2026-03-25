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

const TOKEN_KEY    = "binge_watch_me_token";
const DAEMON_HOST  = "127.0.0.1:7777";
const RECONNECT_DELAY_MS = 3000;

let ws = null;
let reconnectTimer = null;

async function getToken() {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] ?? null;
}

async function connect() {
  const token = await getToken();

  if (!token) {
    console.log("[binge-watch-me] No token set — open the extension popup to connect");
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#E24B4A" });
    return;
  }

  console.log("[binge-watch-me] Connecting to daemon...");

  ws = new WebSocket(`ws://${DAEMON_HOST}/extension?token=${token}`);

  ws.onopen = () => {
    console.log("[binge-watch-me] Connected to daemon");
    clearTimeout(reconnectTimer);
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setBadgeBackgroundColor({ color: "#1D9E75" });
  };

  ws.onmessage = (event) => {
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
    console.log("[binge-watch-me] Disconnected — reconnecting...");
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#E24B4A" });
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
  };
}

function forwardCommandToTab(command) {
  chrome.tabs.query({ url: ["*://*.netflix.com/*"] }, (tabs) => {
    if (tabs.length === 0) {
      console.warn("[binge-watch-me] No matching tab found");
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, { type: "command", command });
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "state") {
    sendStateToDaemon(message.state);
  }

  // Token was updated from setup page — reconnect immediately
  if (message.type === "token_updated") {
    console.log("[binge-watch-me] Token updated — reconnecting");
    if (ws) ws.close();
    clearTimeout(reconnectTimer);
    connect();
  }
});

function sendStateToDaemon(state) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(state));
  }
}

connect();
