# Forge

A privacy-first adaptive personality platform.

Forge analyzes how you think, communicate, make decisions, solve problems, and connect with other people using an adaptive assessment that runs entirely inside your browser.

No accounts.
No cloud processing.
No tracking.
No data collection.

Everything happens locally on your device.

---

## Overview

Forge combines multiple psychological frameworks into one adaptive personality system instead of simply recreating MBTI or DISC.

Every assessment generates a rich personality profile including:

- Primary Archetype (one of 30)
- Full Archetype Ranking
- Hidden Trait Radar
- Career Matches
- Relationship Analysis
- Compatibility Reports
- Communication & Leadership Style
- Growth Areas & Life Balance
- Fantasy & Narrative Roles
- Match Confidence & Personality Stability
- Personality Code
- Shareable Profile

---

## How the Assessment Works

The quiz is scenario-based (not a static survey) and adapts its length to how clear your profile becomes as you answer:

1. **Questions 1-15** — a fixed baseline set. Every visitor gets exactly these 15 questions, in the same order, so every profile starts from the same foundation.
2. **Questions 16-35** — 20 questions chosen adaptively, in two batches of 10, based on what your first-15 answers already show. Two people who answer the baseline identically get an identical adaptive set; different answers lead to a different one.
3. **Confidence check** — after question 35, Forge evaluates how clear your profile already is.
4. **Questions 36-45 (optional)** — asked one at a time, only if the profile isn't confident yet, stopping the moment it is.

So a full assessment is a **minimum of 35 and a maximum of 45 questions**, entirely client-side, with no server-dependent logic and no reliance on the clock or a random seed — the same answers always lead to the same adaptive path and the same result.

(The onboarding screen also offers two fixed-length shortcuts — a 15-question "Quick Read" and a 50-question "Deep Dive" — which skip the confidence check entirely and always ask exactly that many questions.)

---

## Results

The results page is a bento-style dashboard built entirely from your own answers: an overview grid of short summary cards (traits, mind map, social style, career fits, values, growth timeline, relationships, and more) that each open into a full detail view on tap. Nothing is hardcoded per archetype beyond the archetype's own reference data — every number and chart is computed live from your 25 measured dimensions.

Results can be:
- **Shared** as a compact `PF2-...` code or a direct link
- **Compared** against another person's result, one-on-one or as a 3-5 person party compare
- **Exported** as a Story or Post image, a PDF report, or a scannable QR code

---

## Project Structure

Forge is plain static HTML/CSS/JS — no build step, no bundler, no framework.

| Path | What it is |
|---|---|
| `index.html` | Landing page |
| `quiz.html` | Onboarding + the adaptive assessment |
| `result.html` | The results dashboard |
| `compare.html` | One-on-one and party compare |
| `legal.html` | Terms of Service & credits |
| `404.html` | Deep-link/clean-URL recovery page (see below) |
| `css/global.css` | Shared tokens, resets, nav, buttons, theming |
| `css/pages.css` | Page-specific layout and styling |
| `js/engine.js` | Question bank, archetype data, scoring, the adaptive engine, encode/decode |
| `js/global.js` | Theme, sound, nav, toasts, the custom scrollbar, clean-URL handling |
| `js/home.js`, `js/quiz.js`, `js/result.js`, `js/compare.js`, `js/legal.js` | Per-page rendering |
| `js/compatibility.js` | Compare-result rendering shared by `result.js` and `compare.js` |
| `js/vendor/jspdf.umd.min.js` | Vendored PDF library (lazy-loaded only when exporting a PDF) |
| `service-worker.js` | Offline caching |
| `manifest.json` | PWA install manifest |
| `assets/` | Images, audio, icons, and per-archetype artwork |

---

## Clean URLs

Quiz, Result, Compare, and Legal are reachable at extensionless paths (`/quiz`, `/result`, `/compare`, `/legal`) as well as their real `.html` files. Internal links and buttons still point at the real files for a fast, single-request navigation; each page then rewrites its own address bar to the clean form once loaded. A direct load, bookmark, or refresh of a clean path is handled by `404.html`, which recognizes the route and redirects to the matching file — the same mechanism GitHub Pages already needs for shared profile links. `service-worker.js` carries its own copy of the route map so this keeps working offline too.

---

## Offline / PWA

Forge installs as a Progressive Web App and works fully offline after the first visit: `service-worker.js` precaches every page, script, stylesheet, and core asset, then serves the freshest version when online and falls back to the cached copy when it can't reach the network. Your results, answers, and history are never part of that cache — they live only in this browser's `localStorage`/`sessionStorage`, on this device.

---

## Compatibility

Compare two Forge profiles to discover shared strengths, complementary traits, potential conflicts, and category-by-category compatibility (friendship, romantic, business, gaming, creative). A party mode extends this to a 3-5 person group.

---

## Privacy

Forge is designed around one principle: your personality belongs to you.

No accounts. No analytics. No ads. No servers. No tracking. Results are generated entirely inside your browser, and only ever leave your device if you choose to share a code, link, or QR image yourself.

---

## Running Locally

No install step needed — it's static files. Serve the project root with any static file server and open it in a browser, for example:

```
python -m http.server 8420
```

For clean URLs (`/quiz`, `/result`, ...) to also work locally on a direct load or refresh (not just via in-app navigation), the server needs to serve `404.html`'s content with a 404 status for unmatched paths, the same way GitHub Pages does. See `.claude/launch.json` for a small Python server that already does this.

---

## Deployment

Forge is designed to deploy as-is to GitHub Pages (or any static host) with no build step and no server-side configuration beyond a custom 404 page, which most static hosts, including GitHub Pages, already support natively.

---

## Philosophy

Forge is not designed to put people into boxes. It is designed to help people understand themselves better, discover patterns in how they think, and compare those patterns with others in meaningful ways.

Every result is a snapshot, not a label. People evolve. Forge evolves with them.

---

## License

All rights reserved.

Copyright © 2026 Golam Sayan Ahamed.
