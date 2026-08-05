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

## v2 update (the big one)

Nothing from the noir redesign or v1 features was removed. This is all additive.

**Adaptive engine**: question bank expanded from 60 to 150 (10 clusters x 15,
all hand-written, no filler), and every run now serves 50 of them instead of
35: 30 guaranteed baseline questions plus 20 pulled adaptively from whichever
2-3 clusters are showing the strongest signal.

**Hidden dimensions**: expanded from 20 to 25. Added emotionalStability,
competitiveness, responsibility, persistence, openMindedness. The original
20 keep their exact order and meaning, which is what makes old codes still
decode correctly (see below).

**New profiles on the result page**, all computed from the same 25
dimensions, no new questions needed beyond the expanded bank:
- Personality Mix: primary/secondary/third archetype as percentages, shown
  right under the main result
- Narrative Role: one of 15 original roles (Hero, Strategist, Trickster,
  Survivor, etc.), scored the same way archetypes are
- Social Profile: introvert/ambivert/extrovert spectrum, social battery,
  conversation style, group size preference
- Relationship Profile: love language mix, attachment style, conflict
  style, trust/jealousy/personal space/emotional intimacy, relationship
  dynamic (leads/follows/balanced/adaptive)
- Thinking, Learning, and Decision style breakdowns, each as a percentage
  split rather than a single label
- Stress response, ranked (fight/flight/freeze/humor/planning/isolation/
  seeking comfort/talking), plus ranked ideal environments
- Achievements: 16 deterministic badges (Professional Overthinker, Golden
  Retriever, Built Different, etc.) that unlock based on trait thresholds
- Aesthetic profile (colors, fonts, clothing, room, workspace) and
  entertainment predictions (music/movie/TV/book genres), both scored the
  same signature-matching way as archetypes
- Archetype extras: animal, element, symbol, and a hidden-potential line
  generated from that archetype's own strengths/weaknesses
- "Just for Fun" stats (Rizz, Aura, Chaos, etc.) kept, but moved into a
  clearly-labeled, collapsed-by-default section that's explicit about not
  being a real assessment, so it doesn't undercut the serious Measured
  Traits section from the last update

**Career matches**: now 4 tiers (Excellent, Good, Possible, Avoid) across
46 careers, still shows the top 8 with a "show all" toggle.

**Personality codes are versioned (PF1 to PF2) and never break old ones**.
A PF2 code carries all 25 dimensions. Decoding checks the version tag:
a PF1 code (20 dimensions) still decodes perfectly, its known traits come
back exactly as they were, and the 5 dimensions added in v2 default to
neutral until a retake. An "Upgraded from an older PF1 code" note shows on
screen when this happens. This was tested directly, including feeding a
hand-built legacy-format code through the real decoder.

**Profile Viewer**: pasting any code into the landing page's "View" button
reconstructs that person's entire result locally, personality, careers,
relationships, achievements, everything, without needing a second code to
compare against.

**QR code**: built from scratch (no library, per the zero-dependency
requirement) with a real Reed-Solomon implementation over GF(256), correct
finder/timing/alignment pattern placement, all 8 standard mask patterns
scored and the best one selected, and BCH-encoded format info. It's on the
result page under "Scan to Share" and encodes a link back to that exact
code. I verified it by writing an independent decoder and round-tripping
several payloads through it (short strings, exact version-boundary
lengths, a real share URL, punctuation), confirming byte-exact recovery
and valid Reed-Solomon syndromes every time. I can't physically scan it
with a camera in this sandboxed environment, so if it doesn't read on a
real phone, that's the one piece worth double-checking first.

**Timeline**: since there's no backend, "history" is a small local log
(last 10 runs) kept in localStorage on that device. Retaking the test shows
a "Since Last Time" delta against your previous run.

**Privacy messaging**: "Everything stays on your device" now appears
directly on the result page, alongside the existing landing-page privacy
note.

This was tested end-to-end in a real headless browser (not just read
through), including the full 50-question adaptive flow, back/forward
answer editing, the compare page, the profile viewer, an old-format code
decoding correctly, and the QR code actually rendering pixels, with zero
console or page errors in any of it.

## v3 update

Additive again, nothing removed. This one focused on making the engine
itself smarter rather than just adding more sections.

**Question System 2.0**: bank expanded from 150 to 200 (10 clusters x 20).
The quiz no longer has a fixed length. It answers a minimum of 35
questions, then checks its own confidence at 35, 40, and 45: if the top
archetype is clearly ahead of the runner-up, it stops right there instead
of padding out to 50. If two candidates are still close, it asks 5 more
and checks again, capping at 50 no matter what. This was calibrated
against real score distributions from dozens of simulated runs (not just
guessed at), and tested for both the early-stop and full-length paths.

**Smart disambiguation**: when the engine decides to keep going because two
archetypes are close, it doesn't just ask more random questions. It works
out which dimensions actually separate those two specific archetypes and
biases its next picks toward clusters that touch those dimensions, so the
extra questions are the ones most likely to resolve the tie.

**Better personality read**: added Match Confidence and Personality
Stability scores (how clearly you beat the runner-up, and how far ahead
you are from the field overall), plus Hidden Strengths and Hidden
Weaknesses, traits that scored notably high or low outside your matched
archetype's own signature.

**Compatibility engine rewrite**: the compare page now scores 31
categories (Friendship, Romantic, Marriage, Long Distance, every kind of
Partner, Daily Lifestyle, Leadership Balance, Chaos Together, and more),
shows the top 8 with a "show all" toggle, and generates real explanation
sentences from the actual dimension comparison, not fixed text, e.g. it
only says "you both avoid conflict" when both people's patience scores
actually support that. It also adds a full "Who Does What More" breakdown
across 17 traits, four "perfect together" activity suggestions, and three
generated fun facts.

**New profile sections**: Fantasy Role (20 options, Knight to Dragon
Rider), 4 more Narrative/Story roles (Villain, Hidden Villain, Chosen One,
Lone Wolf), Friendship Profile (friend type, reliability, comfort, chaos,
listening/advice/planning skill), Motivation style, and a small set of fun
extras (mythical creature, season, time of day, chess piece). Work Profile
got 5 more environment types (Freelancer, Research, Teaching, Creative
Studio, Management).

Tested the same way as the last two updates: a real headless browser run
through the full flow, including the new dynamic-length quiz, the expanded
result page, and a compare between two codes exercising every new section,
with zero console or page errors.
