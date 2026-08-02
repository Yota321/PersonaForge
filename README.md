# PersonaForge — Decode Yourself

A single self-contained `index.html` (HTML + CSS + JS inline, zero build step,
zero dependencies at runtime). Deploy by dragging it into a GitHub repo as
`index.html` and turning on GitHub Pages — that's the whole deploy process.

## What's in this build

- **20 hidden dimensions** (confidence, logic, creativity, humor, adaptability,
  curiosity, empathy, leadership, patience, drive, risk, trust, kindness,
  discipline, socialEnergy, selfAwareness, planning, resilience, optimism,
  independence) — never shown to the person taking the test.
- **60-question adaptive bank** across 10 scenario clusters (social,
  analytical, creative, impulsive, empathic, leadership, philosophical,
  playful, cautious, ambitious). Every question has exactly 3 answers, each
  nudging 3–5 hidden dimensions.
- **Adaptive selection engine**: the first 4 questions per cluster are
  guaranteed (40 baseline, sampling every trait area), then the remaining
  slots are filled from whichever 2–3 clusters are showing the strongest
  signal — literally "ask deeper questions where the person is trending."
  Currently serves **35 of 60** per run.
- **30 original archetypes**, each with all the fields from the brief:
  strengths, weaknesses, work style, stress response, friendship/dating/
  leadership/learning/communication style, decision making, ideal
  environments, hobbies, growth advice, best/worst teammate, life quote,
  color palette, icon.
- **Fun stats** (Aura, Rizz, Luck, Chaos, NPC Energy, Main Character Energy,
  Braincells, Delulu, Locked In, Gaming IQ, Street IQ, Wisdom, Social
  Battery, Charisma, Adventure Rating, Clutch Factor) computed from the
  hidden dimensions.
- **Career matches** (20 careers) scored Excellent / Good / Avoid with a
  one-line "why," computed from dimension fit rather than hand-authored per
  archetype — so it scales cleanly.
- **Relationship styles** across 9 relationship types (friendship, dating,
  marriage, business/creative/travel/gaming/study partner, roommate).
- **Personality Code**: a local, checksummed, fully decodable string like
  `PF1-8-FJHCFHKGFDJGIGDEGCCC-R` (archetype + all 20 dimensions + checksum).
  No server involved in encoding or decoding.
- **Compare page**: paste two codes, get relationship/communication/
  adventure/creative/trust scores, shared strengths, and friction areas.
- **Result page**: animated "Identity Ingot" hero card, a canvas-drawn radar
  chart of all 20 dimensions, animated stat bars, career list, relationship
  bars, life quote.
- **Export**: PNG story (1080×1920) and post (1080×1350) rendered on a
  `<canvas>` and downloaded client-side; PDF via the browser's native
  print dialog (`window.print()`, with print-specific CSS).
- **Accessibility**: keyboard answering (press 1/2/3), visible focus rings,
  `prefers-reduced-motion` respected (ambient embers and card animations
  turn off).
- **Optional local save**: last result's code is cached in `localStorage`
  only, nothing else — no analytics, no cookies, no network calls.

## Scaling to the full 150-question / 50-served spec

The engine was built so this is a content change, not a rewrite:

1. Open the file, find `QUESTION_BANK` near the top of the first `<script>`
   block, and add more question objects to any cluster (or add new
   clusters).
2. Raise `TOTAL_QUESTIONS` (currently `35`) and, if you add clusters,
   `BASELINE_PER_CLUSTER` in the engine section.
3. Nothing else changes — `QuizSession._pickAdaptive()` already re-ranks
   clusters by running affinity and pulls further into whichever ones are
   resonating.

Same pattern for archetypes (`ARCHETYPES` array) and careers (`CAREERS`
array) if you want to expand those lists later.

## Algorithms (also documented inline in the file)

- **Adaptive question selection** — baseline round for coverage, then
  affinity-ranked deepening. See `QuizSession`.
- **Archetype matching** — each archetype has a 3-dimension weighted
  "signature"; highest weighted score across all 30 archetypes wins. See
  `matchArchetype()`.
- **Scoring** — every answer nudges 3–5 of 20 hidden dimensions by -2..+2,
  summed then clamped to -10..10. See `QuizSession.answer()` /
  `normalizedDims()`.
- **Fun stats** — deterministic formulas over normalized dimensions, plus a
  small seeded-random flavor component for playful stats (Luck, Chaos,
  Delulu) so results feel alive without being unstable. See
  `computeFunStats()`.
- **Career / relationship fit** — averaged normalized score across each
  item's 2–3 relevant dimensions, tiered into Excellent/Good/Avoid. See
  `computeCareers()`, `computeRelationshipStyles()`.
- **Personality code encode/decode** — base36-packed dimensions with a
  mod-36 checksum, fully local. See `encodeCode()` / `decodeCode()`.
- **Compatibility (Compare page)** — per-dimension similarity plus a small
  complementary-trait bonus (e.g. one person's leadership vs. the other's
  patience), summarized into 5 scores plus shared-strength/friction lists.
  See `computeCompatibility()`.

## Notes / honest limitations of this v1

- Fonts (Space Grotesk / Manrope / JetBrains Mono) load from Google Fonts
  over the network on first visit; after that the browser cache keeps it
  working offline. For a guaranteed fully-offline first load, self-host the
  three font files and swap the `<link>` tag for local `@font-face` rules.
- PDF export uses the browser's print dialog rather than a bundled PDF
  library, to keep the zero-dependency, zero-build promise intact.
- This build ships 60 authored questions and serves 35 adaptively (not the
  full 150/50) and 30 fully authored archetypes — the architecture is built
  to scale to the full spec by adding content, as described above.

## v2 changes

- Full noir redesign: near black and white, one restrained red accent, film
  grain, vignette, slow venetian-blind light bars instead of the earlier
  orange ember theme.
- Asks for a name before the quiz starts. The name sits at the front of the
  personality code, e.g. `Yota-PF1-2-KEFCFFJFKKKEACBGHCEG-L`. Decoding
  still works with or without a name prefix.
- Added a "compare with someone" input right on the landing page and again
  right under your own result, in addition to the dedicated Compare page,
  so pasting a friend's code is always close at hand.
- Career Matches now pulls from 46 careers (up from 20), shows the top 8 on
  the page with a "show all" toggle instead of dumping the whole list.
- Replaced the joke fun-stat labels (Rizz, Delulu, NPC Energy, etc.) with
  16 serious Measured Traits computed the same deterministic way, including
  Friendship Reliability, Emotional Steadiness, and Stress Recovery. No
  randomness anywhere in the scoring anymore.
- Archetype name is presented larger and more deliberately on the result
  card, and a new "Full Archetype Ranking" section at the bottom shows how
  the person scored against all 30 archetypes, not just the winning one.
- Added a short "sub-profile" line under the archetype description that
  names the two traits, outside that archetype's core signature, the
  person leans into hardest, so two people who both get the same archetype
  read as distinct.
- Quiz now has working Back and Continue controls (also ArrowLeft/
  ArrowRight), so any answer can be revisited and changed without losing
  the rest of the run.
- Added a brief "calculating" overlay after every answer and expanded the
  forging-screen line pool to 18 rotating lines (including "Calculating
  cool factor" and "Calculating baseline friendship motor").
- Removed every em dash from the UI copy and data content.
