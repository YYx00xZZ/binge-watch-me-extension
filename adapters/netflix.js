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

import { makeMediaState } from "../protocol.js";

// Cache the last known title because Netflix removes the title
// element from the DOM during playback
let lastKnownTitle = "Unknown title";

const adapter = {
  matches: "*://*.netflix.com/*",

  getState() {
    const video = document.querySelector("video");
    if (!video) return null;

    const titleEl =
      document.querySelector('[data-uia="video-title"] h4') ||
      document.querySelector('[data-uia="video-title"]') ||
      document.querySelector(".watch-title");

    // Only update the cache when we actually find the title element
    if (titleEl?.textContent?.trim()) {
      lastKnownTitle = titleEl.textContent.trim();
    }

    const volume = Math.round((video.volume ?? 1) * 100);

    return makeMediaState({
      site:         "netflix",
      is_playing:   !video.paused && !video.ended,
      title:        lastKnownTitle,
      current_time: video.currentTime ?? 0,
      duration:     video.duration ?? 0,
      volume,
    });
  },

  /**
   * Execute a command on the Netflix player.
   * @param {import("../protocol.js").Command} cmd
   */
  execute(cmd) {
    const video = document.querySelector("video");
    if (!video) return;

    switch (cmd.action) {
      case "play_pause":
        video.paused ? video.play() : video.pause();
        break;

      case "seek_forward":
        video.currentTime += cmd.seconds ?? 10;
        break;

      case "seek_backward":
        video.currentTime -= cmd.seconds ?? 10;
        break;

      case "next": {
        const video = document.querySelector("video");
        if (!video) break;

        video.pause();

        setTimeout(() => {
          video.play();

          setTimeout(() => {
            const btn = document.querySelector('[data-uia="control-next"]');
            if (btn) {
              console.log("[binge-watch-me] next: using control-next button");
              btn.closest('button')?.click();
            } else {
              const seamless = document.querySelector(
                'button[data-uia="next-episode-seamless-button"]'
              );
              if (seamless) {
                console.log("[binge-watch-me] next: using seamless next-episode button");
                seamless.click();
              } else {
                console.warn("[binge-watch-me] next: no next button found in DOM");
              }
            }
          }, 300);
        }, 300);
        break;
      }

      case "set_volume":
        video.volume = (cmd.level ?? 100) / 100;
        break;

      // volume_up and volume_down are handled by the daemon
      // directly via CoreAudio — not forwarded to the extension
    }
  },
};

export default adapter;
