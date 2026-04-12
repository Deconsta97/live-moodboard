# Live Moodboard — Roadmap

## MVP (Current)
- ✅ Plugin panel with live iframe preview
- ✅ Device size presets + custom dimensions
- ✅ Canvas card creation (FigJam-style layout)
- ✅ Microlink API for OG metadata
- ✅ Blocked site detection with helpful messaging
- ✅ Image bytes via separate messages (no postMessage bloat)
- ✅ Title truncation with ellipsis
- ⏳ Validate marker-based placeholder → card replacement flow

## V2 Features (Planned)

### Load from layer
- Right-click context on a text layer with a URL → create moodboard card
- Extract URL from layer text, fetch metadata, place card on canvas
- Keyboard shortcut option

### Place screenshot
- Capture a screenshot of the live preview in the panel
- Place as image on canvas (optional: as card thumbnail replacement)
- Manual "Screenshot" button in panel + keyboard shortcut

### FigJam support
- Port plugin to work in FigJam (use `createLinkPreviewAsync` for embeds where possible)
- FigJam embed nodes for OEmbed-compliant sites (YouTube, Spotify, Vimeo, etc.)
- Fallback to iframes for non-OEmbed sites (same as design file)

## Known Limitations
- ~70% of major sites block iframe embedding (X-Frame-Options, CSP)
- No bundler (plain tsc) — acceptable for current scope
- Microlink API dependency (free tier, reasonable SLA)

## Security Review

### Current Protections
- **iframe sandbox** — `allow-scripts allow-same-origin allow-forms allow-popups` but NOT `allow-top-navigation` or `allow-top-navigation-by-user-activation` → embedded site cannot break out or navigate Figma
- **postMessage origin check** — UI listens for `event.data.pluginMessage` only (not arbitrary messages)
- **No eval/innerHTML** — All DOM updates via text properties, template literals (no injection risk)
- **Plugin data isolation** — Card metadata stored via `setPluginData` (invisible to embedded site, cannot be read by iframe)
- **No credentials in messages** — URLs and bytes only, no auth tokens passed between UI and sandbox

### Potential Attack Vectors

1. **Malicious site exfiltrates user data via iframe**
   - Figma's sandbox prevents `top.location` access (iframe cannot read/navigate parent)
   - Site CAN access localStorage/IndexedDB of its own origin (but not Figma's)
   - **Risk:** Low — iframe is isolated, no Figma data exposed

2. **Malicious site crafts postMessage to sandbox**
   - UI origin: `chrome-extension://...`
   - Sandbox origin: `chrome-extension://...` (same)
   - postMessage with `pluginMessage` key will execute handlers
   - **Risk:** Medium — if UI messages are not validated, could trigger unwanted canvas operations
   - **Mitigation:** Add message type validation in sandbox; only handle known message types

3. **XSS via crafted URL in card title (OG metadata)**
   - Title set via `titleText.characters = title` (text node, not innerHTML)
   - **Risk:** Low — Figma's API doesn't eval or interpret markup

4. **Plugin data injection via URL**
   - Card stores URL via `setPluginData` — accessed only via `getPluginData` (string comparison)
   - **Risk:** Low — data is stored as-is, not eval'd

5. **CORS bypass via image proxy**
   - `wsrv.nl` proxy is trusted third-party; could theoretically be compromised
   - **Risk:** Low (proxied images only, no code execution)

6. **Microlink API response injection**
   - `fetchMetadata` parses JSON from Microlink API
   - Title, image URLs stored as strings (not eval'd)
   - **Risk:** Low — no code execution from metadata

### Recommendations (V2+)

- [ ] Add message validation: explicitly check `msg.type` against allowed types before handling
- [ ] Log unusual postMessage patterns (non-standard messages from UI)
- [ ] Consider removing `allow-popups` from sandbox if plugin doesn't need it
- [ ] Document iframe origin restrictions in code comments
- [ ] Audit any future features that accept user input (e.g. "Load from layer")
