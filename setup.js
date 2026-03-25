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

const TOKEN_KEY = "binge_watch_me_token";
const DAEMON_TOKEN_URL = "http://127.0.0.1:7777/token";

async function connectToDaemon() {
  const btn    = document.getElementById("connect-btn");
  const status = document.getElementById("status");

  btn.disabled    = true;
  status.textContent = "Connecting to daemon...";
  status.className   = "";

  try {
    const response = await fetch(DAEMON_TOKEN_URL);

    if (!response.ok) {
      throw new Error(`Daemon returned ${response.status}`);
    }

    const token = await response.text();

    if (!token || token.length < 8) {
      throw new Error("Invalid token received");
    }

    // Store token in extension storage
    await chrome.storage.local.set({ [TOKEN_KEY]: token });

    status.textContent = "Connected! You can close this page.";
    status.className   = "success";
    btn.textContent    = "Connected";

    // Notify background script to reconnect with new token
    chrome.runtime.sendMessage({ type: "token_updated", token });

  } catch (e) {
    status.textContent = `Failed: ${e.message}. Is the daemon running?`;
    status.className   = "error";
    btn.disabled       = false;
  }
}

// Check if already connected on page load
chrome.storage.local.get("binge_watch_me_token", (result) => {
  if (result.binge_watch_me_token) {
    document.getElementById("status").textContent = "Already connected";
    document.getElementById("status").className = "success";
    document.getElementById("connect-btn").textContent = "Reconnect";
  }
});

document.getElementById("connect-btn").addEventListener("click", connectToDaemon);
