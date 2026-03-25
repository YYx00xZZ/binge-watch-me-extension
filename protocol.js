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

/**
 * Commands sent from the phone UI to the extension via the daemon.
 * Must stay in sync with src/protocol.rs in binge-watch-me.
 *
 * @typedef {Object} Command
 * @property {string} action - one of: play_pause, next, seek_forward,
 *                             seek_backward, volume_up, volume_down, set_volume
 * @property {number} [seconds] - required for seek_forward / seek_backward
 * @property {number} [level]   - required for set_volume (0-100)
 */

/**
 * State sent from the extension to the daemon.
 * Must stay in sync with src/protocol.rs in binge-watch-me.
 *
 * @typedef {Object} MediaState
 * @property {string}  site         - e.g. "netflix", "youtube"
 * @property {boolean} is_playing
 * @property {string}  title
 * @property {number}  current_time - seconds
 * @property {number}  duration     - seconds
 * @property {number}  volume       - 0-100
 */

/**
 * Build a MediaState object with safe defaults for missing values.
 * @param {Partial<MediaState>} fields
 * @returns {MediaState}
 */
export function makeMediaState(fields = {}) {
  return {
    site:         fields.site         ?? "unknown",
    is_playing:   fields.is_playing   ?? false,
    title:        fields.title        ?? "Nothing playing",
    current_time: fields.current_time ?? 0,
    duration:     fields.duration     ?? 0,
    volume:       fields.volume       ?? 50,
  };
}
