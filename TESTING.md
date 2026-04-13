# Live Moodboard — Testing & User Guide

## How It Works

### Getting Started
1. Open Figma Desktop → Plugins → Development → Import plugin from manifest
2. Point to `D:\Scripts & Automations\Projects\Live Moodboard\manifest.json`
3. Run: Plugins → Live Moodboard

### Adding a URL Card
1. Paste a URL in the input bar (e.g. `https://geniai.framer.website`)
2. Click **Add Card** (or press Enter)
3. A placeholder card appears on canvas immediately ("Fetching site info...")
4. After 3–15 seconds, placeholder is replaced by final card with:
   - OG image thumbnail (left)
   - Site title (right, truncated to 1 line)
   - Favicon + hostname
   - Hint: "Click this frame while Live Moodboard is running"
5. The panel loads the live site preview simultaneously

### Previewing a Saved Card
1. Click any `[Moodboard] *` card on canvas
2. The panel auto-loads that URL with interactive preview
3. Scroll, click, interact — see animations, transitions in real time

### Changing Preview Size
- Click **FHD / Desktop / Tablet L / Tablet / Phone / Phone S** presets
- Or enter custom W × H and click **Go**
- Panel resizes to match

### Blocked Sites
- Sites like Google, YouTube, GitHub block iframe embedding
- Plugin shows blocked state with explanation
- Click **Open in browser** to view in default browser
- Card still gets metadata (title, thumbnail, favicon) from Microlink

---

## Use Case Test Matrix

### UC1 — Add frameable site
**Input:** `https://geniai.framer.website`
| Check | Pass? |
|---|---|
| Placeholder appears on canvas instantly | ✅ |
| Button shows "Fetching..." | ✅ |
| Panel shows spinner with "Fetching site info..." | ✅ |
| Placeholder replaced by final card at same position | ✅ |
| Card has: OG thumbnail, site title, favicon, hostname, hint | ✅ |
| Panel loads live site preview (interactive) | ✅ |
| Card named `[Moodboard] geniai.framer.website` in layers panel | ✅ |
| All card children locked | ✅ |

### UC2 — Add blocked site (known)
**Input:** `https://google.com`
| Check | Pass? |
|---|---|
| Placeholder appears on canvas | ✅ |
| Panel shows blocked state immediately (known domain list) | ✅ |
| Status bar shows "google.com blocks embedding" | ✅ |
| "Open in browser" link visible | ✅ |
| Card still gets metadata from Microlink (title, thumbnail, favicon) | ✅ |
| Placeholder replaced by final card with metadata | ✅ |

### UC3 — Add blocked site (unknown, detected by timeout)
**Input:** Any site not in BLOCKED_DOMAINS that blocks iframes (e.g. a newly discovered domain)
| Check | Pass? |
|---|---|
| Placeholder appears on canvas | ✅ |
| Panel tries to load iframe (try-first approach) | ✅ |
| After ~8 seconds, fallback detection triggers | ✅ |
| Shows "detected" blocked state with distinct message | ✅ |
| "Report site" link visible in status bar | ✅ |
| "Open in browser" available | ✅ |
| Card still gets metadata | ✅ |

**Status:** ✅ FIXED
- Switched from pre-filtering blocklist to try-first approach
- Blocklist trimmed to 25 confirmed-blocked domains (verified in both plugins)
- Exact-match only (no subdomain wildcard) — subdomains get try-first treatment
- Two distinct blocked messages: "known" vs "detected"
- "Report site" placeholder link added to status bar
- See TEST LINKS.md / TEST LINKS.csv for full test data (39 URLs tested)

### UC4 — Select existing card
**Input:** Click a `[Moodboard]` card on canvas
| Check | Pass? |
|---|---|
| Panel auto-loads the card's URL | ✅ |
| Status bar shows hostname | ✅ |
| "Open in browser" link visible | ✅ |
| Live preview is interactive | ✅ |

### UC5 — Deselect / select non-card
**Input:** Click empty canvas or a non-moodboard frame
| Check | Pass? |
|---|---|
| Panel shows empty state ("No preview loaded") | ✅ |
| "Open in browser" link hidden | ✅ |
| Status text resets to "Paste a URL and add it to your moodboard" | ✅ |

### UC6 — Device preset switching
**Input:** Click through FHD → Phone → Tablet → custom 800x600
| Check | Pass? |
|---|---|
| Panel resizes for each preset | ✅ |
| Active preset button highlighted (blue) | ✅ |
| Custom W/H fields populate with current values | ✅ |
| Preview reloads/reflows at new size | ✅ |

### UC7 — Invalid URL
**Input:** `not a url`, `ftp://something`, empty string
| Check | Pass? |
|---|---|
| "Invalid URL" status message | ✅ |
| No card created on canvas | ✅ |
| No crash | ✅ |

**Status:** ✅ FIXED
- Added protocol validation (http/https only)
- Added hostname validation (must contain dot or be localhost)
- Invalid URLs rejected before Microlink API call

### UC8 — URL without protocol
**Input:** `geniai.framer.website` (no https://)
| Check | Pass? |
|---|---|
| Auto-prepended to `https://geniai.framer.website` | ✅  |
| Card created normally | ✅  |

### UC9 — Multiple cards
**Input:** Add 3+ different URLs sequentially
| Check | Pass? |
|---|---|
| Each card gets own position | ✅ |
| Selecting each card loads correct URL | ✅ |
| No state bleeding between cards | ✅ |

### UC10 — Same URL added twice
**Input:** Add `https://geniai.framer.website` twice
| Check | Pass? |
|---|---|
| Two separate cards created | ✅ |
| Each has its own node ID | ✅ |
| Marker detection doesn't confuse second with first | ✅ |

### UC11 — Rapid sequential adds
**Input:** Add URL, immediately add another before first finishes
| Check | Pass? |
|---|---|
| No crash | ✅ |
| Both cards eventually appear | ✅ |
| Images land on correct cards (no race condition) | ✅ |

**Status:** ✅ FIXED
- Replaced global `pendingOgImageBytes`/`pendingFaviconBytes` with `Map<operationId, images>`
- Each card operation gets unique ID (URL + timestamp)
- Images no longer clobbered by concurrent adds
- operationId passed back in `card-created` message for correct matching

### UC12 — Microlink API failure
**Input:** Disconnect network or use unreachable URL
| Check | Pass? |
|---|---|
| Card created with hostname as title (fallback) | ✅ |
| Gray thumbnail placeholder (no crash) | ✅ |
| Emoji favicon fallback | ✅ |

### UC13 — Card persistence across sessions
**Input:** Add card → close plugin → reopen → select card
| Check | Pass? |
|---|---|
| Card still on canvas with all visual elements | ✅ |
| pluginData persists (moodboard-url, moodboard-label) | ✅ |
| Selecting card loads URL in panel | ✅ |

### UC14 — Open in browser
**Input:** Load any site → click "Open in browser"
| Check | Pass? |
|---|---|
| Opens in system default browser | ✅ |
| Correct URL opened | ✅ |

---

## Test Sites Reference

Full test data in `TEST LINKS.md` and `TEST LINKS.csv` (39 URLs tested).

| Site | Frameable? | Has OG Image? | Has Favicon? | Notes |
|---|---|---|---|---|
| `geniai.framer.website` | Yes | Yes | Yes | Primary test site |
| `stripe.com` | Test | Yes | Yes | Corporate site |
| `linear.app` | Test | Yes | Yes | SaaS tool |
| `wikipedia.org` | Yes | Yes | Yes | Was in old blocklist — loads fine |
| `microsoft.com` | Yes | Yes | Yes | Was in old blocklist — loads fine |
| `google.com` | No (known) | Yes | Yes | Confirmed blocked in both plugins |
| `youtube.com` | No (known) | Yes | Yes | Confirmed blocked in both plugins |
| `github.com` | No (known) | Yes | Yes | Confirmed blocked in both plugins |
| `codepen.io` | No (known) | Yes | Yes | Confirmed blocked in both plugins |
| `example.com` | Yes | No | No | Tests fallbacks |

---

## Known Edge Cases

| Edge case | Behavior | Status |
|---|---|---|
| Site returns no OG image | Gray thumbnail placeholder | Acceptable |
| Site returns no favicon | Link emoji stays | Acceptable |
| Very long title (100+ chars) | Truncated with ellipsis (1 line) | Acceptable |
| Image CORS blocked (direct + proxy) | No thumbnail, no crash | Acceptable |
| Microlink rate limit (free tier) | Falls back to hostname-only card | Acceptable |
| Plugin closed while fetching | Placeholder stays on canvas (orphaned) | Acceptable for beta |

---

## Bugs Found

| # | Description | Severity | Status | Notes |  
|---|---|---|---|---|
| UC 3.3 | Unknown blocked sites — white screen with no fallback UI | 🟡 | ✅ | Try-first + 8s timeout detection with "detected" blocked message |
| UC 3.4 | Known blocked subdomain false negatives (e.g. one.google.com) | 🟡 | ✅ | Switched to exact-match blocklist, subdomains get try-first |
| UC 7.1 | Invalid URL validation | 🟡 | ✅ | Added protocol + hostname validation before API call |
| UC 11.2 | Rapid sequential adds — images not landing on correct cards | 🟢 | ✅ | Used Map<operationId> instead of global variables |