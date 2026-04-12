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

## Tech Debt / Polish
- Add unit tests (Jest for UI, Figma plugin tests for sandbox)
- Error boundary / graceful degradation for API failures
- Keyboard shortcuts
- Plugin settings/preferences
- Batch operations (add multiple URLs at once)
