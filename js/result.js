/* =========================================================================
   FORGE - RESULT (result.html)
   The bento card chrome (overview tiles + detail overlay), renderResult()
   itself, the PF1 upgrade-quiz detour, radar/sin-virtue canvas drawing,
   and PNG export. Loaded by result.html only, after engine.js + global.js
   + compatibility.js.
   ========================================================================= */

/* =========================================================================
   FORGE - RESULT
   result.html's own page: the result screen (radar/QR canvases, PNG
   export, history timeline), plus the legacy PF1 upgrade-quiz detour
   (still using the older .option/.options markup from question.css,
   which is why this page also loads that file).
   ========================================================================= */

let lastResult = null;
let careersExpanded = false;

/* ---------------- PF1 UPGRADE QUIZ ---------------------------------------
   A short, fixed 9-question flow that only asks about the 5 dimensions
   added since PF1, drawn from real existing content rather than anything
   new. On completion, re-encodes as a full PF2 code. */
let upgradeSession = null;
function startUpgradeQuiz(){
  if (!lastResult || !lastResult.decodedProfile) return;
  upgradeSession = new UpgradeQuizSession(lastResult.decodedProfile);
  click(500);
  renderUpgradeQuiz();
}
function renderUpgradeQuiz(){
  const q = upgradeSession.current();
  if (!q){ finishUpgradeQuiz(); return; }
  const { cursor } = upgradeSession;
  const total = upgradeSession.totalLength();
  root.innerHTML = `
    <div class="container">
      <div class="quiz-top">
        ${topBar(true)}
        <div class="progress-track"><div class="progress-fill" style="width:${Math.round((cursor/total)*100)}%"></div></div>
        <div class="progress-meta">
          <span>Upgrade question ${cursor + 1} of ${total}</span>
          <span class="encourage">Unlocking the newer profile sections</span>
        </div>
      </div>
      <div class="question-card glass">
        <div class="q-num">UPGRADE ${String(cursor + 1).padStart(2,"0")}</div>
        <div class="q-text">${q.text}</div>
        <div class="options">
          ${q.options.map((opt,i) => `<button class="option" onclick="selectUpgradeOption(${i})"><span class="opt-key">${String.fromCharCode(65+i)}</span><span>${opt.text}</span></button>`).join("")}
        </div>
      </div>
    </div>
  `;
}
function selectUpgradeOption(idx){
  click(420 + idx * 60);
  upgradeSession.answer(idx);
  showCalcOverlay(1, () => {
    if (upgradeSession.isComplete()) finishUpgradeQuiz();
    else renderUpgradeQuiz();
  });
}
function finishUpgradeQuiz(){
  const finalDims = upgradeSession.finalNormDims();
  const match = matchArchetype(finalDims);
  const code = encodeCode(match.primary.id, finalDims, upgradeSession.name);
  lastResult = buildResultFromDecoded({ archetype: match.primary, normDims: finalDims, name: upgradeSession.name, version: CODE_VERSION, upgraded: false }, code);
  localStorage.setItem("pf_last_code", code);
  upgradeSession = null;
  renderResult();
}

/* ---------------- RESULT: bento card chrome ------------------------------
   Real Lucide icons (sourced from .claude/Icons, same approach as the
   quiz's own QZ_ICONS) used purely as small category badges on each
   bento card — decoration, not data. Each card also gets a soft tinted
   background/foreground pair (RESULT_ICON_TINTS) so the grid reads as
   varied-but-coordinated the way the flat-bento reference does, instead
   of every icon badge being the same single accent color. */
const RESULT_ICONS = {
  radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
  trendingUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  settings: '<path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  mapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  chartBar: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  drama: '<path d="M10 11h.01"/><path d="M14 6h.01"/><path d="M18 6h.01"/><path d="M6.5 13.1h.01"/><path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3"/><path d="M17.4 9.9c-.8.8-2 .8-2.8 0"/><path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"/><path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4"/>',
  sword: '<path d="m11 19-6-6"/><path d="m5 21-2-2"/><path d="m8 16-4 4"/><path d="M9.5 17.5 20.414 6.586A2 2 0 0021 5.172V3h-2.172a2 2 0 00-1.414.586L6.5 14.5"/>',
  checkCircle: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
  gem: '<path d="M10.5 3 8 9l4 13 4-13-2.5-6"/><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/><path d="M2 9h20"/>',
  usersRound: '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
  messageCircle: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
  heartHandshake: '<path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/>',
  brain: '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  trophy: '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/>',
  palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  partyPopper: '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
  flame: '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
  chartLine: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>',
  listOrdered: '<path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/>',
  qrCode: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  sparkle: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
};
// Six soft tint pairs cycled across cards (accent/sky/mint/gold/coral/
// peach), purely decorative variety for the icon badges.
const RESULT_ICON_TINTS = ["accent", "sky", "mint", "gold", "coral", "peach"];
let resultIconTintIdx = 0;
// Picks the next tint in rotation — called once per card by whichever
// function builds that card's wrapper, so the same resolved name can be
// reused for both the icon badge and the card's own background wash
// (instead of resultIcon() silently auto-cycling a second, unrelated
// value if it were ever called again for the same card).
function nextResultTint(){
  return RESULT_ICON_TINTS[resultIconTintIdx++ % RESULT_ICON_TINTS.length];
}
function resultIcon(key, tint){
  const t = tint || nextResultTint();
  const style = `--icon-bg:color-mix(in srgb, var(--${t}) 16%, transparent);--icon-fg:var(--${t})`;
  return `<span class="bento-icon" style="${style}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${RESULT_ICONS[key] || RESULT_ICONS.sparkles}</svg></span>`;
}
// The Soul Type system's one visual identifier everywhere it appears
// (hero hint pill, Secondary Archetype expansion) — a small solid heart
// tinted to that soul's own color, standing in for the old tinted-circle
// badge. Deliberately plain currentColor fill/stroke (no bento-icon
// background chip) so it reads as an inline marker next to text, not a
// second icon badge competing with the card's own header icon.
function soulHeart(hex, size){
  const s = size || 15;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${hex}" stroke="${hex}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">${RESULT_ICONS.heart}</svg>`;
}

// ---- Secondary Archetype expansion card: the closing-insight sentence --
// Composes a short, natural-reading observation from three independently
// computed lenses (Soul Type, dominant Sin(s), dominant Virtue(s)) rather
// than authoring one sentence per soul/sin/virtue combination (7x7x7 —
// unmaintainable). Each map below is a short clause fragment; SOUL_INSIGHT_PULL is what the soul
// leans toward, SIN_INSIGHT_BEHAVIOR/VIRTUE_INSIGHT_BEHAVIOR describe how
// that sin/virtue tends to show up. Composed together they read as one
// observation, not three definitions stapled end to end.
const SOUL_INSIGHT_PULL = {
  Red: "raw determination", Orange: "courage", Yellow: "fairness",
  Green: "compassion", Blue: "quiet integrity", Purple: "endurance",
  "Light Blue": "calm patience",
};
const SIN_INSIGHT_BEHAVIOR = {
  Pride: "pushes you to go it alone rather than ask for help",
  Greed: "pushes you to always want a little more than you have",
  Wrath: "flares up fast when you feel crossed",
  Envy: "quietly compares your own effort to everyone else's ease",
  Lust: "chases the next new thing before the last one has settled",
  Gluttony: "never quite knows when enough is enough",
  Sloth: "tempts you to coast once the hard part feels done",
};
const VIRTUE_INSIGHT_BEHAVIOR = {
  Humility: "keeps your confidence grounded instead of loud",
  Charity: "turns ambition into something you're willing to share",
  Patience: "gives you room to cool off before you act",
  Kindness: "keeps you rooting for others as much as yourself",
  Chastity: "helps you commit fully instead of chasing the next thing",
  Temperance: "helps you know exactly where the line is",
  Diligence: "carries you through once the initial spark fades",
};
function buildSoulInsight(soul, dominantSins, dominantVirtues){
  const sinNames = dominantSins.map(ax => ax.sinLabel);
  const virtueNames = dominantVirtues.map(ax => ax.virtueLabel);
  const sinSentence = sinNames.map(n => `${n} ${SIN_INSIGHT_BEHAVIOR[n]}`).join(", and ");
  const virtueSentence = virtueNames.map(n => `${n} ${VIRTUE_INSIGHT_BEHAVIOR[n]}`).join(", and ");
  return `Your ${soul.name} Soul naturally leans toward ${SOUL_INSIGHT_PULL[soul.name]}. ${sinSentence}. ${virtueSentence}.`;
}
// ---------------- RESULT: two-layer card system -----------------------
// Layer 1 (overview) is always short: icon, title, one-line subtitle,
// up to 5 highlight chips — never a paragraph, never a full chart. The
// whole card is the tap target. Layer 2 (detail) is the same data's full
// breakdown, opened in a centered panel on desktop or a full-screen
// sheet on mobile (see .detail-overlay in pages.css) — a real "open into
// a bigger version of itself", not a stretch-in-place. Every detail
// card's full HTML is registered up front, in the same call that builds
// its overview tile, so the two can never drift out of sync and opening
// one is just an innerHTML swap with no recomputation.
let resultCardIdx = 0;
let resultDetailRegistry = {};
let resultDetailOpenId = null;

function resultChips(items){
  return (items || []).filter(Boolean).slice(0, 5).map(h => `<span class="ov-chip">${h}</span>`).join("");
}

// A card with no Layer 2 — either it's already a single short action
// (Compare box, Unlock CTA, Scan to Share) or nothing further exists to
// drill into. Keeps the same bento chrome, just isn't a <button> and
// never opens the overlay.
function resultUtilityCard(iconKey, title, innerHtml, opts){
  opts = opts || {};
  const span = opts.span ? ` card-span-${opts.span}` : "";
  const extraClass = opts.className ? ` ${opts.className}` : "";
  const idAttr = opts.id ? ` id="${opts.id}"` : "";
  const tint = opts.tint || nextResultTint();
  const i = resultCardIdx++;
  return `
      <div class="section bento-card util-card${span}${extraClass}"${idAttr} style="--i:${i};--tint:var(--${tint})">
        <div class="bento-head">${resultIcon(iconKey, tint)}<h3>${title}</h3></div>
        <div class="bento-body">${innerHtml}</div>
      </div>`;
}

// The primary building block: registers this card's full Layer-2 content
// (detailHtml) and returns its short Layer-1 tile. `highlights` is a
// short array of strings rendered as chips (3-5); `subtitle` is one line,
// never a paragraph. `opts.onOpen(bodyEl)` runs after the detail HTML is
// in the DOM, for anything that needs a live element to draw into (a
// full-size radar canvas, for instance).
function resultDetailCard(id, iconKey, title, subtitle, highlights, detailHtml, opts){
  opts = opts || {};
  // Resolved once here (rather than left to resultIcon()'s own fallback)
  // so the exact same tint name can be reused for the card's background
  // wash below AND stored back into the registry — otherwise reopening
  // this card's detail panel would call resultIcon() a second time with
  // no explicit tint and silently auto-cycle to a different color than
  // the overview tile showed.
  const tint = opts.tint || nextResultTint();
  resultDetailRegistry[id] = { iconKey, title, tint, html: detailHtml, onOpen: opts.onOpen };
  const span = opts.span ? ` card-span-${opts.span}` : "";
  const extraClass = opts.className ? ` ${opts.className}` : "";
  const i = resultCardIdx++;
  const chips = resultChips(highlights);
  const bignum = opts.bigNumber
    ? `<div class="ov-bignum"><span class="val">${opts.bigNumber.val}</span><span class="lbl">${opts.bigNumber.label}</span></div>`
    : "";
  const arrow = `<span class="ov-arrow" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14 14 6M8 6h6v6"/></svg></span>`;
  // opts.preview: a small inline visual (mini bars, a compact comparison —
  // never a full chart redraw) for the rare card whose overview tile
  // should carry more than text, so a "wide" card actually has wide
  // content instead of just wide whitespace around short text.
  const preview = opts.preview ? `<div class="ov-preview">${opts.preview}</div>` : "";
  const tapHint = `<span class="tap-hint">Tap for detail<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>`;
  return `
      <button type="button" class="section bento-card ov-card${span}${extraClass}" id="ov-${id}" style="--i:${i};--tint:var(--${tint})" onclick="openResultDetail('${id}')" aria-haspopup="dialog">
        <div class="bento-head">${resultIcon(iconKey, tint)}<h3>${title}</h3>${arrow}</div>
        ${bignum}
        ${subtitle ? `<p class="ov-subtitle">${subtitle}</p>` : ""}
        ${preview}
        ${chips ? `<div class="ov-chip-row">${chips}</div>` : ""}
        ${tapHint}
      </button>`;
}

// For a detail panel with no matching overview tile in the main grid —
// right now just QR: it's reachable only from the "Share QR" button in
// the hero's own action row, per the redesign brief ("do not reserve a
// permanent full section for QR in the main grid"), so it registers its
// content without resultDetailCard()'s usual button/tile markup.
function registerDetailOnly(id, iconKey, title, detailHtml, opts){
  opts = opts || {};
  resultDetailRegistry[id] = { iconKey, title, tint: opts.tint, html: detailHtml, onOpen: opts.onOpen };
}

// The modal's own scrollbar controller — created once, alongside the
// overlay itself, and reused for every card that opens in it (only one
// card is ever open at a time, per resultDetailOpenId).
let detailScrollbar = null;

function ensureResultDetailOverlay(){
  if (document.getElementById("resultDetailOverlay")) return;
  const el = document.createElement("div");
  el.id = "resultDetailOverlay";
  el.className = "detail-overlay";
  el.innerHTML = `
    <div class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detailHeadTitle">
      <div class="detail-panel-scroll" id="detailPanelScroll">
        <div class="detail-head">
          <div class="detail-head-icon" id="detailHeadIcon"></div>
          <h2 id="detailHeadTitle"></h2>
          <button type="button" class="detail-close" onclick="closeResultDetail()" aria-label="Close">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>
        </div>
        <div class="detail-body" id="resultDetailBody"></div>
      </div>
      <div class="scrollbar-rail detail-scrollbar-rail" id="detailSbRail" aria-hidden="true">
        <div class="scrollbar-track" id="detailSbTrack"></div>
        <div class="scrollbar-thumb" id="detailSbThumb"></div>
      </div>
    </div>`;
  el.addEventListener("click", (e) => { if (e.target === el) closeResultDetail(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && resultDetailOpenId) closeResultDetail(); });
  document.body.appendChild(el);

  // Reuses the exact same scrollbar controller the main page uses (see
  // createScrollbarController() in global.js) rather than a second,
  // bespoke implementation — just bound to this panel's own scroll
  // container (#detailPanelScroll) instead of the window, so it tracks
  // the modal's own scroll position independently of the page behind it.
  const scrollEl = document.getElementById("detailPanelScroll");
  detailScrollbar = createScrollbarController({
    rail: document.getElementById("detailSbRail"),
    track: document.getElementById("detailSbTrack"),
    thumb: document.getElementById("detailSbThumb"),
    getScrollTop: () => scrollEl.scrollTop,
    getScrollHeight: () => scrollEl.scrollHeight,
    getViewportHeight: () => scrollEl.clientHeight,
    scrollTo: (top, smooth) => scrollEl.scrollTo({ top, behavior: smooth ? "smooth" : "auto" }),
    scrollEventTarget: scrollEl,
  });
  // Content height changes on every open (a different card), every
  // in-place toggle (career/fun-stats "show more"), and any async
  // image/canvas paint — observing the actual content instead of the
  // (height-capped) scroll container catches all of that without every
  // call site needing to remember to refresh the scrollbar by hand.
  new ResizeObserver(() => detailScrollbar.refresh()).observe(document.getElementById("resultDetailBody"));
}

function openResultDetail(id){
  const entry = resultDetailRegistry[id];
  if (!entry) return;
  ensureResultDetailOverlay();
  const overlay = document.getElementById("resultDetailOverlay");
  document.getElementById("detailHeadIcon").innerHTML = resultIcon(entry.iconKey, entry.tint);
  document.getElementById("detailHeadTitle").textContent = entry.title;
  const body = document.getElementById("resultDetailBody");
  body.innerHTML = entry.html;
  overlay.classList.add("open");
  document.documentElement.classList.add("detail-lock-scroll");
  document.querySelectorAll(".ov-card.active").forEach(c => c.classList.remove("active"));
  const tile = document.getElementById("ov-" + id);
  if (tile) tile.classList.add("active");
  resultDetailOpenId = id;
  click(360);
  body.querySelectorAll(".stat-bar-fill[data-w]").forEach(el => { el.style.width = el.dataset.w + "%"; });
  initCountUps(body);
  const scrollEl = document.getElementById("detailPanelScroll");
  if (scrollEl) scrollEl.scrollTop = 0;
  if (detailScrollbar) detailScrollbar.refresh();
  if (entry.onOpen) entry.onOpen(body);
}

function closeResultDetail(){
  const overlay = document.getElementById("resultDetailOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.documentElement.classList.remove("detail-lock-scroll");
  document.querySelectorAll(".ov-card.active").forEach(c => c.classList.remove("active"));
  resultDetailOpenId = null;
  click(300);
}

// A handful of actions inside a detail panel (career list length, fun
// stats reveal) still go through the full renderResult() to recompute
// state — that rebuilds resultDetailRegistry too, so once it's done we
// just re-pour the freshly-registered content for whichever card was
// open back into the still-open panel instead of closing it.
function refreshOpenResultDetail(){
  if (!resultDetailOpenId) return;
  const entry = resultDetailRegistry[resultDetailOpenId];
  const body = document.getElementById("resultDetailBody");
  if (!entry || !body) return;
  body.innerHTML = entry.html;
  document.querySelectorAll("#resultDetailBody .stat-bar-fill[data-w]").forEach(el => {
    el.style.width = el.dataset.w + "%";
  });
  initCountUps(body);
  if (detailScrollbar) detailScrollbar.refresh();
  if (entry.onOpen) entry.onOpen(body);
}

/* ---------------- RESULT -------------------------------------------------
   Two layers, per the redesign brief: Layer 1 is nothing but short
   overview tiles built with resultDetailCard() (icon, one-line subtitle,
   3-5 highlight chips). Every tile's full breakdown is written once,
   inline, as that same call's detailHtml argument, and only ever reaches
   the DOM when its card is tapped open (openResultDetail()) — see the
   comment above resultDetailCard() for how the registry works. */
function renderResult(){
  const r = lastResult;
  const a = r.archetype;
  resultIconTintIdx = 0; // keeps each card's icon tint stable across re-renders (career toggle, fun stats, etc.)
  resultCardIdx = 0; // keeps each card's entrance stagger stable across re-renders too
  resultDetailRegistry = {};
  registerDetailOnly("qr", "qrCode", "Scan to Share", `
    <div class="card" style="text-align:center">
      <canvas id="qrCanvas"></canvas>
      <p style="margin-top:10px;font-size:13px;color:var(--text-muted)">Scans to a link that loads this exact result, no app required.</p>
      <button class="btn btn-ghost" style="margin-top:10px" onclick="downloadQR()">Download QR</button>
    </div>
  `, { onOpen: () => {
    const qrCanvas = document.getElementById("qrCanvas");
    if (!qrCanvas) return;
    const shareUrl = shareURLFor(r.code);
    const ok = QR.drawToCanvas(qrCanvas, shareUrl, { scale: 6, margin: 3 });
    if (!ok) QR.drawToCanvas(qrCanvas, r.code, { scale: 6, margin: 3 });
  } });
  setAccentColors(a.colors[0], a.colors[1]);
  setShareableURL(r.code);
  setPageTitle(r.name || "Your Result");
  const topCareers = careersExpanded ? r.careers : r.careers.slice(0, 8);
  const previousTimeline = getPreviousTimelineEntry();
  const topDims = Object.entries(r.normDims).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k]) => RADAR_LABELS[k] || k);
  const topTrait = Object.entries(r.traits).sort((x, y) => y[1] - x[1])[0];
  const topValues = r.humanValues.slice(0, 3);
  const topLifeBalance = Object.entries(r.lifeBalance).sort((x, y) => y[1] - x[1]);
  // The Secondary Archetype card's Sins & Virtues section shows only the
  // single strongest axis on each side (ties included) rather than the
  // full 7-axis breakdown — this card is a short identity read, not a
  // chart. maxBy() picks every axis tied for the highest value, since a
  // flat filter(v === max) after Math.max is exactly that.
  const maxSinPct = Math.max(...r.sinVirtue.map(ax => ax.sinPct));
  const dominantSins = r.sinVirtue.filter(ax => ax.sinPct === maxSinPct);
  const maxVirtuePct = Math.max(...r.sinVirtue.map(ax => ax.virtuePct));
  const dominantVirtues = r.sinVirtue.filter(ax => ax.virtuePct === maxVirtuePct);
  // Onboarding's "how deep do you want to go?" choice (step 03/03)
  // rides in on r.meta.resultDepth. "short"/"balanced" get the
  // highlight row (through Career) plus an unlock CTA for everything
  // past it; "deep", or no meta at all (a shared/viewed profile, or one
  // saved before this feature existed), always gets the full report.
  const isLightReport = !!(r.meta && r.meta.resultDepth && r.meta.resultDepth !== "deep");
  const depthLabel = r.meta && r.meta.resultDepth === "short" ? "Quick Read" : "Balanced";
  root.innerHTML = `
    <div class="container result-hero">
      ${topBar(true)}
      ${r.name ? `<div class="name-tag">${obEsc(r.name)}'s Result</div>` : `<div class="name-tag">Your Result</div>`}
      ${r.meta && (r.meta.occupation || r.meta.country || r.meta.ageGroup) ? `<p class="meta-line">${[r.meta.occupation, r.meta.country, r.meta.ageGroup].filter(Boolean).map(obEsc).join(" \u00b7 ")}</p>` : ""}

      <div class="result-grid">

      <div class="hero-bento">
      <div class="ingot">
        <div class="ingot-split">
          <div class="ingot-content">
            <div class="ingot-top">
              <div class="ingot-icon">${a.icon}</div>
              <div class="ingot-confidence"><span class="val count-up" data-target="${r.confidence.confidencePct}" data-suffix="%">0%</span><span class="lbl">Confidence</span></div>
            </div>
            <div class="archetype-eyebrow">Primary Archetype</div>
            <h2 class="ingot-name">${a.name}</h2>
            <div class="ingot-title">${a.title}</div>
            <p class="ingot-desc">${a.description}</p>
            <div class="extras-row" style="justify-content:flex-start">
              <span class="tag">${r.extras.animal}</span>
              <span class="tag">${r.extras.element}</span>
              <span class="tag">${r.extras.symbol} Symbol</span>
              <button type="button" class="tag soul-hint-tag" style="--soul-color:${r.soul.hex}" onclick="openResultDetail('secondary-archetype')">${soulHeart(r.soul.hex, 13)} Soul: ${r.soul.name}</button>
            </div>
            <div class="mix-row">
              ${r.mix.map((m,i) => `<div class="mix-item"><span class="mix-pct count-up" data-target="${m.pct}" data-suffix="%">0%</span><span class="mix-name">${m.archetype.icon} ${i===0?"":m.archetype.name}</span></div>`).join("")}
            </div>
            <div class="ingot-code">${r.code}</div>
            ${r.upgradedFromV1 ? `
            <div class="upgrade-banner">
              <p>Your profile was created using Forge Version 1.</p>
              <p>Forge has improved. Your original 20 traits carried over exactly, the 5 newer ones default to neutral for now.</p>
              <button class="btn btn-accent" style="margin-top:10px" onclick="startUpgradeQuiz()">Answer ${UPGRADE_QUESTION_COUNT} questions to unlock the newer profile sections</button>
            </div>` : ""}
          </div>
          ${a.image ? `<div class="ingot-visual" role="img" aria-label="${a.name}" style="background-image:url('${a.image}')"></div>` : ""}
        </div>
        <div class="export-row ingot-actions">
          <button class="btn btn-ghost btn-sm" onclick="exportPNG('story')">Export Story</button>
          <button class="btn btn-ghost btn-sm" onclick="exportPNG('post')">Export Post</button>
          <button class="btn btn-ghost btn-sm" onclick="savePDF()">Save as PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="copyShareLink()">Copy Link</button>
          <button class="btn btn-ghost btn-sm" onclick="compareThisResult()">Compare</button>
          <button class="btn btn-ghost btn-sm" onclick="openResultDetail('qr')">Share QR</button>
        </div>
      </div>

      ${resultDetailCard("summary", "sparkles", "In Summary", "The clearest read on what makes this archetype yours.",
        (a.strengths || []).slice(0, 4),
        `
        <p>${a.description}</p>
        <p style="margin-top:10px">${r.subProfile}</p>
        <div class="tag-list" style="margin-top:14px">${a.strengths.map(s=>`<span class="tag">${s}</span>`).join("")}</div>
        <div class="grid-2" style="margin-top:16px">
          <div class="card"><h4>Match Confidence</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.confidence.confidencePct}%"></div></div><p style="margin-top:8px;font-size:12.5px;color:var(--text-dim)">How clearly ${a.name} beat the runner-up.</p></div>
          <div class="card"><h4>Personality Stability</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.confidence.stabilityPct}%"></div></div><p style="margin-top:8px;font-size:12.5px;color:var(--text-dim)">How far ahead your top type is from the field overall.</p></div>
        </div>
        ${r.hidden.hiddenStrengths.length ? `<div class="card" style="margin-top:12px"><h4>Hidden Strengths</h4><div class="tag-list">${r.hidden.hiddenStrengths.map(s=>`<span class="tag">${s}</span>`).join("")}</div><p style="margin-top:8px;font-size:12.5px;color:var(--text-dim)">Traits outside ${a.name}'s usual signature that showed up strongly anyway.</p></div>` : ""}
        `,
        { span: "3of12", tint: "accent", className: "hero-summary", bigNumber: { val: `${r.confidence.confidencePct}%`, label: "Match confidence" } })}

      ${resultDetailCard("traits", "chartBar", "Core Traits", `${topTrait[0]} leads at ${topTrait[1]}%.`,
        Object.entries(r.traits).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([k])=>k),
        `
        <div class="grid-4">
          ${Object.entries(r.traits).map(([k,v]) => `
            <div class="stat-tile">
              <div class="stat-val count-up" data-target="${v}">0</div>
              <div class="stat-label">${k}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill" data-w="${v}"></div></div>
            </div>`).join("")}
        </div>
        `,
        { span: "3of12", className: "hero-traits" })}

      ${resultDetailCard("mindmap", "radar", "Mind Map", "A visual view of your key dimensions.", topDims,
        `
        <canvas id="radar" width="520" height="520" role="img" aria-label="Radar chart of 25 hidden personality dimensions"></canvas>
        <div class="radar-legend">25 dimensions, measured from your answers, never shown to you during the test</div>
        <p style="margin-top:14px">Your strongest reads are ${topDims.slice(0,3).join(", ")}. The full shape (not just the top few points) is what actually separates ${a.name} from a similar-looking type.</p>
        `,
        { span: "3of12", className: "hero-map", onOpen: () => drawRadar(document.getElementById("radar"), r.normDims, a.colors[0]) })}

      ${resultDetailCard("emotions", "heart", "Emotions", "Understand your emotional patterns and responses.",
        [`Steadiness ${r.traits["Emotional Steadiness"]}%`, `Trust ${r.relationship.trustLevel}%`, `Under stress: ${r.stress[0].name}`],
        `
        <div class="card"><h4>Emotional Steadiness</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.traits["Emotional Steadiness"]}%"></div></div></div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Emotional Intimacy</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.relationship.emotionalIntimacy}%"></div></div></div>
          <div class="card"><h4>Trust Level</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.relationship.trustLevel}%"></div></div></div>
          <div class="card"><h4>Jealousy Level</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.relationship.jealousyLevel}%"></div></div></div>
          <div class="card"><h4>Personal Space Needed</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.relationship.personalSpace}%"></div></div></div>
        </div>
        <div class="card" style="margin-top:12px"><h4>Under Stress, First Move</h4><p><strong>${r.stress[0].name}.</strong> ${r.stress[0].description}</p></div>
        `,
        { span: "2of12", className: "hero-emotions" })}
      </div>

      ${resultDetailCard("secondary-archetype", "usersRound", "Secondary Archetype", "A deeper layer beneath your primary archetype.",
        [
          `${soulHeart(r.soul.hex, 12)} ${r.soul.name} Soul`,
          ...dominantSins.map(ax => `&#128520; ${ax.sinLabel}`),
          ...dominantVirtues.map(ax => `&#128519; ${ax.virtueLabel}`),
        ],
        `
        <p>Your primary archetype is the clearest single match, but personality rarely fits in one label. This reading looks past that match to what's underneath: a core color, and the pull between instinct and restraint that shapes how it actually comes out in you.</p>

        <div class="expansion-divider"></div>

        <div class="bento-head soul-type-head" style="margin-bottom:6px">${soulHeart(r.soul.hex, 20)}<h3 style="font-size:16px">${r.soul.name} Soul</h3></div>
        <p>${r.soul.meaning}</p>

        <div class="expansion-divider"></div>

        <div class="bento-head" style="margin-bottom:2px">${resultIcon("drama", "coral")}<h3 style="font-size:16px">Sins &amp; Virtues</h3></div>
        <p class="center-note" style="text-align:left;margin-top:0">A playful, dramatic reading of the same evidence, not a real assessment. Flip the card to see the other side.</p>
        <div class="sinvirtue-wrap">
          <canvas id="sinVirtueRadar"></canvas>
          <button class="sinvirtue-flip" id="sinVirtueFlipBtn" onclick="flipSinVirtue()" aria-label="Flip between Sins and Virtues">Flip</button>
        </div>
        <div class="sinvirtue-caption" id="sinVirtueCaption">Seven Deadly Sins</div>

        <div class="expansion-divider"></div>

        <p style="color:var(--text-muted)">${buildSoulInsight(r.soul, dominantSins, dominantVirtues)}</p>
        `,
        { tint: "sky", className: "secondary-expansion", onOpen: () => { sinVirtueMode = "sin"; drawSinVirtueRadar(document.getElementById("sinVirtueRadar"), r.sinVirtue, sinVirtueMode, a.colors[0]); } })}

      <div class="section-heading">
        <div>
          <p class="eyebrow">More to explore</p>
          <h2>More ways to read your result.</h2>
        </div>
        <p>Every card below is a different lens on the same signal. Short reads first, tap any card for the deeper pattern.</p>
      </div>

      <div class="insight-bento">

      ${resultDetailCard("social", "messageCircle", "Social", r.social.category,
        [`${r.social.socialBattery}% battery`, r.social.groupSizePreference, r.friendship.type.name],
        `
        <div class="card">
          <h4>${r.social.category}</h4>
          <div class="spectrum-track"><div class="spectrum-fill" style="width:${r.social.spectrumPct}%"></div><div class="spectrum-dot" style="left:${r.social.spectrumPct}%"></div></div>
          <div class="spectrum-labels"><span>Introvert</span><span>Ambivert</span><span>Extrovert</span></div>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Social Battery</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.social.socialBattery}%"></div></div></div>
          <div class="card"><h4>Group Size Preference</h4><p>${r.social.groupSizePreference}</p></div>
          <div class="card"><h4>Conversation Style</h4><p>${r.social.conversationStyle}</p></div>
          <div class="card"><h4>Communication Style</h4><p>${r.social.communicationStyle}</p></div>
        </div>
        <div class="card" style="margin-top:12px"><h4>Friendship: ${r.friendship.type.name}</h4></div>
        <div class="grid-3" style="margin-top:12px">
          <div class="card"><h4>Reliable</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.reliableScore}%"></div></div></div>
          <div class="card"><h4>Comfort</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.comfortScore}%"></div></div></div>
          <div class="card"><h4>Chaos</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.chaosScore}%"></div></div></div>
          <div class="card"><h4>Listening</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.listeningSkill}%"></div></div></div>
          <div class="card"><h4>Advice</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.adviceSkill}%"></div></div></div>
          <div class="card"><h4>Planning</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${r.friendship.planningSkill}%"></div></div></div>
        </div>
        `,
        { span: "3of12", className: "insight-social" })}

      ${resultDetailCard("motivation", "gem", "Motivation", r.motivation.name,
        Object.entries(r.motivationFacets).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k} ${v}%`),
        `
        <p class="center-note" style="text-align:left;margin-top:0">What seems to move you when you actually decide something, drawn from your measured evidence, not a validated instrument.</p>
        <div class="card" style="margin-top:12px"><h4>${r.motivation.name}</h4></div>
        <div class="grid-2" style="margin-top:12px">
          ${Object.entries(r.motivationFacets).map(([k,v]) => `<div class="card"><h4>${k}</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v}%"></div></div></div>`).join("")}
        </div>
        `,
        { span: "3of12", className: "insight-motivation" })}

      ${resultDetailCard("relationships", "heartHandshake", "Relationships", "Love styles, attachment patterns, and compatibility insights.",
        [r.relationship.loveLanguages[0].name, r.relationship.attachmentStyle.name, r.relationship.conflictStyle.name],
        `
        <div class="card">
          <h4>Love Language Mix</h4>
          ${r.relationship.loveLanguages.map(l => `
            <div class="relationship-row">
              <span class="r-label">${l.name}</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${l.pct}%"></div></div>
              <span class="r-score">${l.pct}%</span>
            </div>`).join("")}
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Attachment Style</h4><p><strong>${r.relationship.attachmentStyle.name}.</strong> ${r.relationship.attachmentStyle.description}</p></div>
          <div class="card"><h4>Conflict Style</h4><p><strong>${r.relationship.conflictStyle.name}.</strong> ${r.relationship.conflictStyle.description}</p></div>
          <div class="card"><h4>Romantic Style</h4><p>${a.datingStyle}</p></div>
          <div class="card"><h4>Relationship Dynamic</h4><p>${r.relationship.relationshipDynamic}</p></div>
        </div>
        <div class="card" style="margin-top:12px">
          ${r.relationships.map(rel => `
            <div class="relationship-row">
              <span class="r-label">${rel.label}</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" data-w="${rel.score}"></div></div>
              <span class="r-score">${rel.score}</span>
            </div>`).join("")}
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Perfect Teammate</h4><p>${a.bestTeammate}</p></div>
          <div class="card"><h4>Worst Teammate</h4><p>${a.worstTeammate}</p></div>
        </div>
        `,
        { span: "4of12", className: "insight-relationships" })}

      ${resultDetailCard("career", "briefcase", "Career", `Best fit: ${r.careers[0].name}.`,
        r.careers.slice(0,4).map(c => `${c.name} ${c.fit}%`),
        `
        ${topCareers.map(c => `
          <div class="career-row">
            <span>${c.name}</span>
            <span class="fit-badge fit-${c.tier === "Excellent Match" ? "excellent" : c.tier === "Good Match" ? "good" : c.tier === "Possible Match" ? "possible" : "avoid"}">${c.tier}, ${c.fit}%</span>
          </div>`).join("")}
        <div class="careers-toggle"><button onclick="toggleCareers()">${careersExpanded ? "Show fewer" : `Show all ${r.careers.length}`}</button></div>
        <p class="center-note" style="text-align:left">${r.careers[0].why}</p>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Work Style</h4><p>${a.workStyle}</p></div>
          <div class="card"><h4>Leadership</h4><p>${a.leadershipStyle}</p></div>
          <div class="card"><h4>Decision Making</h4><p>${a.decisionMaking}</p></div>
          <div class="card"><h4>Communication</h4><p>${a.communicationStyle}</p></div>
        </div>
        `,
        { span: "2of12", className: "insight-career" })}

      </div>

      <div id="deepReportSections" class="deep-wrap${isLightReport ? " deep-collapsed" : ""}">

      ${resultDetailCard("values", "layers", "Values", `${topValues.map(v=>v.name).join(", ")} lead.`,
        topValues.map(v => `${v.icon} ${v.name} ${v.pct}%`),
        `
        <p class="center-note" style="text-align:left;margin-top:0">What matters most to you and guides your decisions, drawn from your measured evidence, not a validated instrument.</p>
        <div class="values-grid" style="margin-top:12px">
          ${r.humanValues.map(v => `
          <div class="card value-card">
            <div class="value-card-head">
              <span class="value-icon">${v.icon}</span>
              <span class="value-name">${v.name}</span>
              <span class="value-pct count-up" data-target="${v.pct}" data-suffix="%">0%</span>
            </div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v.pct}%"></div></div>
            <p class="value-explain">${v.explanation}</p>
            <div class="value-source">Drawn from: ${v.inferredFrom.join(", ")}</div>
          </div>`).join("")}
        </div>
        `,
        { span: "2of12" })}

      ${resultDetailCard("growth-timeline", "chartLine", "Growth Timeline",
        previousTimeline ? `Compared with your run on ${new Date(previousTimeline.timestamp).toLocaleDateString()}.` : "Your development over time.",
        previousTimeline ? [] : ["Retake later to start tracking"],
        previousTimeline ? `
        <p class="center-note" style="text-align:left;margin-top:0">Compared with your previous run on this device, ${new Date(previousTimeline.timestamp).toLocaleDateString()}.</p>
        <div class="card" style="margin-top:12px">
          ${["confidence","leadership","creativity","socialEnergy","resilience"].map(dim => {
            const before = pct(previousTimeline.normDims ? previousTimeline.normDims[dim] : 0);
            const after = pct(r.normDims[dim]);
            return `
            <div class="relationship-row">
              <span class="r-label">${DIM_LABELS[dim]}</span>
              <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted)">${before} &rarr; ${after}</span>
            </div>`;
          }).join("")}
        </div>
        ` : `
        <p>Everything above reflects this one run. Retake the assessment later (same device) and this card fills in with exactly how your traits shifted between attempts, no guessing, just the real before/after.</p>
        `,
        {
          // Fixed at 3of12 (not conditional on previousTimeline) because
          // this card's width is part of a row that's hand-tuned to sum
          // to exactly 12 columns — see the Values/Growth Timeline/Life
          // Balance/Learning Style/Environment Fit row below. The preview
          // bars are still conditional; without them the card just shows
          // its one-line placeholder in the same 3-column width.
          span: "3of12",
          preview: previousTimeline ? ["confidence","creativity","resilience"].map(dim => {
            const before = pct(previousTimeline.normDims ? previousTimeline.normDims[dim] : 0);
            const after = pct(r.normDims[dim]);
            const delta = after - before;
            return `
            <div class="core-trait-row">
              <span class="core-trait-label">${DIM_LABELS[dim]}</span>
              <div class="core-trait-track"><div class="core-trait-fill" style="width:${after}%;background:${a.colors[0]}"></div></div>
              <span class="core-trait-pct">${after}%</span>
              <span class="ov-trend ${delta >= 0 ? "up" : "down"}">${delta > 0 ? "+" : ""}${delta}</span>
            </div>`;
          }).join("") : ""
        })}

      ${resultDetailCard("life-balance", "chartBar", "Life Balance", "How you allocate your energy across different areas.",
        topLifeBalance.slice(0,3).map(([k,v]) => `${k} ${v}%`),
        `
        <p class="center-note" style="text-align:left;margin-top:0">A presentational grouping of your measured traits into 5 familiar buckets, not a separate assessment or new data.</p>
        <div class="card" style="margin-top:12px">
          ${topLifeBalance.map(([k,v]) => `
            <div class="relationship-row">
              <span class="r-label">${k}</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v}%"></div></div>
              <span class="r-score">${v}</span>
            </div>`).join("")}
        </div>
        `,
        { span: "3of12" })}

      ${resultDetailCard("learning-style", "brain", "Learning Style", a.learningStyle,
        r.learning.slice(0,3).map(t => `${t.name} ${t.pct}%`),
        `
        <div class="card"><h4>${a.name}'s Approach</h4><p>${a.learningStyle}</p></div>
        <div class="grid-3" style="margin-top:12px">
          <div class="card">
            <h4>Learning Style</h4>
            ${r.learning.map(t => `<div class="mini-bar-row"><span>${t.name}</span><span>${t.pct}%</span></div>`).join("")}
          </div>
          <div class="card">
            <h4>Thinking Style</h4>
            ${r.thinking.map(t => `<div class="mini-bar-row"><span>${t.name}</span><span>${t.pct}%</span></div>`).join("")}
          </div>
          <div class="card">
            <h4>Decision Style</h4>
            ${r.decision.map(t => `<div class="mini-bar-row"><span>${t.name}</span><span>${t.pct}%</span></div>`).join("")}
          </div>
        </div>
        `,
        { span: "2of12" })}

      ${resultDetailCard("environment-fit", "mapPin", "Environment Fit", "The settings where you perform and feel your best.",
        a.idealEnvironments.slice(0,4),
        `
        <div class="grid-2">
          <div class="card"><h4>Ideal Environments</h4><div class="tag-list">${a.idealEnvironments.map(s=>`<span class="tag">${s}</span>`).join("")}</div></div>
          <div class="card"><h4>Also True For You</h4><div class="tag-list">${r.environments.map(e => `<span class="tag">${e}</span>`).join("")}</div></div>
        </div>
        <div class="card" style="margin-top:12px"><h4>Favorite Hobbies</h4><div class="tag-list">${a.hobbies.map(s=>`<span class="tag">${s}</span>`).join("")}</div></div>
        `,
        { span: "2of12" })}

      ${resultDetailCard("stress-recovery", "wind", "Stress & Recovery", "How you respond to pressure and what helps you recharge.",
        r.stress.slice(0,3).map(s => s.name),
        `
        <div class="card"><h4>${a.name}, Under Stress</h4><p>${a.stressResponse}</p></div>
        <div class="card" style="margin-top:12px">
          <h4>In Order</h4>
          ${r.stress.map((s,i) => `<p style="margin-top:${i?8:0}px"><strong>${i+1}. ${s.name}.</strong> ${s.description}</p>`).join("")}
        </div>
        `,
        { span: "3of12" })}

      ${resultDetailCard("personal-growth", "trendingUp", "Personal Growth", a.growthAdvice,
        a.weaknesses.slice(0,3),
        `
        <div class="card"><h4>Growth Advice</h4><p>${a.growthAdvice}</p></div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Watch-outs</h4><div class="tag-list">${a.weaknesses.map(s=>`<span class="tag">${s}</span>`).join("")}</div></div>
          <div class="card"><h4>Hidden Weaknesses</h4><div class="tag-list">${r.hidden.hiddenWeaknesses.length ? r.hidden.hiddenWeaknesses.map(s=>`<span class="tag">${s}</span>`).join("") : "<span class='tag'>Nothing standing out beyond the type itself</span>"}</div></div>
        </div>
        ${r.achievements.length ? `
        <div class="card" style="margin-top:12px">
          <h4>Achievements Unlocked</h4>
          <div class="grid-2" style="margin-top:8px">
            ${r.achievements.map(ach => `
              <div class="card achievement-card">
                <div class="achievement-icon">${ach.icon}</div>
                <div><h4 style="margin-bottom:2px">${ach.name}</h4><p style="font-size:13px">${ach.description}</p></div>
              </div>`).join("")}
          </div>
        </div>` : ""}
        `,
        { span: "2of12" })}

      ${resultDetailCard("more-about-you", "sparkles", "More About You", "Narrative role, fantasy casting, and a few more reads.",
        [r.narrativeRole.primary.name, r.fantasyRole.name, r.mythicalCreature.name],
        `
        <div class="grid-2">
          <div class="card"><h4>${r.narrativeRole.primary.icon} ${r.narrativeRole.primary.name}</h4><p>${r.narrativeRole.primary.description}</p><p style="margin-top:8px;color:var(--text-dim);font-size:13px">Runner-up: ${r.narrativeRole.runnerUp.icon} ${r.narrativeRole.runnerUp.name}</p></div>
          <div class="card"><h4>${r.fantasyRole.icon} ${r.fantasyRole.name}</h4><p>${r.fantasyRole.description}</p></div>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Weapon</h4><p>${r.fantasyWeapon.name}</p></div>
          <div class="card"><h4>Companion</h4><p>${r.fantasyCompanion.name}</p></div>
          <div class="card" style="grid-column:1/-1"><h4>Kingdom</h4><p>${r.fantasyKingdom.name}</p></div>
        </div>
        <div class="extras-row" style="justify-content:flex-start;margin-top:12px">
          <span class="tag">${r.mythicalCreature.name}</span>
          <span class="tag">${r.season.name}</span>
          <span class="tag">${r.timeOfDay.name}</span>
          <span class="tag">${r.chessPiece.name}</span>
          <span class="tag">${r.flower.name}</span>
          <span class="tag">${r.planet.name}</span>
          <span class="tag">${r.constellation.name}</span>
          <span class="tag">${r.gemstone.name}</span>
          <span class="tag">${r.weather.name}</span>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>Coffee Order</h4><p>${r.coffeeOrder.name}</p></div>
          <div class="card" style="font-family:var(--font-display);font-style:italic;text-align:center;display:flex;align-items:center;justify-content:center">"${a.quote}"</div>
        </div>
        <div class="card" style="margin-top:12px">
          <h4>${r.aesthetic.name}</h4>
          <div class="grid-2" style="margin-top:8px">
            <p><strong>Colors:</strong> ${r.aesthetic.colors}</p>
            <p><strong>Fonts:</strong> ${r.aesthetic.fontPairing}</p>
            <p><strong>Clothing:</strong> ${r.aesthetic.clothing}</p>
            <p><strong>Room:</strong> ${r.aesthetic.room}</p>
          </div>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="card"><h4>${r.entertainment.primary.name}</h4>
            <p><strong>Music:</strong> ${r.entertainment.primary.music}</p>
            <p><strong>Movies:</strong> ${r.entertainment.primary.movie}</p>
            <p><strong>TV:</strong> ${r.entertainment.primary.tv}</p>
            <p><strong>Books:</strong> ${r.entertainment.primary.book}</p>
          </div>
          <div class="card"><h4>Also worth trying: ${r.entertainment.secondary.name}</h4>
            <p><strong>Music:</strong> ${r.entertainment.secondary.music}</p>
            <p><strong>Movies:</strong> ${r.entertainment.secondary.movie}</p>
          </div>
        </div>
        `,
        { span: "4of12" })}

      ${resultDetailCard("frameworks", "layers", "Other Frameworks", "Your closest read on a few familiar systems.",
        [r.frameworks.mbti, r.frameworks.enneagram.name],
        `
        <p class="center-note" style="text-align:left;margin-top:0">Approximate, for reference only, if you're familiar with these systems. Your Forge archetype is still the primary read.</p>
        <div class="grid-2" style="margin-top:12px">
          <div class="card framework-card framework-mbti"><h4>Closest MBTI</h4><p style="font-size:22px;font-family:var(--font-display)">${r.frameworks.mbti}</p></div>
          <div class="card framework-card framework-enneagram"><h4>Closest Enneagram</h4><p>${r.frameworks.enneagram.name}</p></div>
        </div>
        <div class="card framework-card framework-disc" style="margin-top:12px">
          <h4>Closest DISC</h4>
          ${r.frameworks.disc.map(d => `<div class="mini-bar-row"><span>${d.name}</span><span>${d.pct}%</span></div>`).join("")}
        </div>
        <div class="card framework-card framework-bigfive" style="margin-top:12px">
          <h4>Closest Big Five</h4>
          ${r.frameworks.bigFive.map(d => `<div class="relationship-row"><span class="r-label">${d.name}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${d.pct}%"></div></div><span class="r-score">${d.pct}</span></div>`).join("")}
        </div>
        `,
        { span: "3of12" })}

      <div class="fun-ranking-row">

      ${resultDetailCard("fun-stats", "partyPopper", "Fun Stats", "NPC energy, rizz, chaos, and other bonus flavor.",
        Object.keys(r.funStats).slice(0, 4),
        `
        <p class="center-note" style="text-align:left;margin-top:0">Playful, not a real assessment, unlike the readings above.</p>
        <div class="grid-4">
          ${Object.entries(r.funStats).map(([k,v]) => `
            <div class="stat-tile">
              <div class="stat-val count-up" data-target="${v}">0</div>
              <div class="stat-label">${k}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v}%"></div></div>
            </div>`).join("")}
        </div>
        `,
        {})}

      ${resultDetailCard("ranking", "listOrdered", "Full Ranking", "How you scored against all 30 archetypes.",
        [r.consistency ? `${r.consistency.pct}% consistent` : null, `${r.achievements.length} achievements`].filter(Boolean),
        `
        <p class="center-note" style="text-align:left;margin-top:0">This is how you scored against all 30 archetypes, not just the one you matched.</p>
        <div class="card" style="margin-top:12px">
          ${r.ranked.map((row, i) => {
            const maxScore = r.ranked[0].score || 1;
            const width = Math.max(4, Math.round((row.score / maxScore) * 100));
            return `
            <div class="rank-row ${i===0 ? "primary" : ""}">
              <span class="rank-num">${String(i+1).padStart(2,"0")}</span>
              <span class="rank-icon">${row.archetype.icon}</span>
              <span class="rank-name">${row.archetype.name}</span>
              <div class="rank-bar-track"><div class="rank-bar-fill" style="width:${width}%"></div></div>
            </div>`;
          }).join("")}
        </div>
        ${r.consistency ? `
        <div class="card" style="margin-top:12px">
          <div class="stat-val count-up" style="font-size:32px;text-align:center" data-target="${r.consistency.pct}" data-suffix="%">0%</div>
          <p style="text-align:center;margin-top:6px">Answer Consistency &mdash; you answered consistently across multiple situations.</p>
          <p style="text-align:center;margin-top:6px;font-size:12px;color:var(--text-dim)">${r.consistency.note}</p>
        </div>` : ""}
        `,
        {
          // Fun Stats and Full Ranking now share a row as two ordinary
          // half-width cards, so this card dropped the old full-width
          // "subtitle beside a wide preview row" treatment
          // (.insight-ranking) — that layout only made sense when this
          // card had the whole row to itself. Trimmed the preview from 6
          // chips to 3 so it still reads cleanly at half width instead of
          // wrapping into several short rows.
          preview: `<div class="rank-preview-row">${r.ranked.slice(0,3).map((row,i) => `<span class="rank-preview-chip"><span class="num">${String(i+1).padStart(2,"0")}</span>${row.archetype.icon} ${row.archetype.name}</span>`).join("")}</div>`,
        })}

      </div>

      </div>

      ${isLightReport ? resultUtilityCard("sparkle", "Want to dive deeper?", `
        <p>You're looking at the ${depthLabel} read. Unlock the full Deep Analysis of this exact result, same answers, nothing to retake.</p>
        <button class="btn btn-primary" onclick="unlockFullReport()">Unlock full report &rarr;</button>
      `, { span: "2of12", id: "unlockSection", tint: "accent" }) : ""}

      </div>
    </div>

    <footer class="lp-footer">
      <div class="lp-footer-inner">
      <div class="lp-footer-top">
        <img id="lpFooterLogo" class="lp-footer-logo" alt="Forge" src="${currentTheme === "light" ? "assets/Logo_black.svg" : "assets/Logo_white.svg"}"
          onerror="this.style.display='none';" />
        <p class="lp-footer-tagline">A clearer you. A brighter tomorrow.</p>
      </div>
      <nav class="footer-nav">
        <button onclick="click(380);navigate('compare')">Compare</button>
        <button onclick="click(380);navigate('party')">Party Compare</button>
        <a href="legal.html">Terms of Service</a>
        <button onclick="showPrivacyModal()">Privacy</button>
      </nav>
      </div>
    </footer>
  `;
  // Unlike the old markCollapsibleCards() this replaced, refreshing an
  // already-open detail panel is a plain innerHTML swap with nothing to
  // measure post-layout, so it runs synchronously right away rather than
  // waiting on a frame — deferring it into the requestAnimationFrame
  // block below (with everything else that genuinely does need to wait
  // for layout/paint) left it unreliable, since rAF callbacks aren't
  // guaranteed to run promptly in every context.
  refreshOpenResultDetail();
  requestAnimationFrame(() => {
    document.querySelectorAll(".stat-bar-fill").forEach(el => {
      el.style.width = (el.dataset.w || el.style.width) + (el.dataset.w ? "%" : "");
    });
    initCountUps(root);
    setupProgressiveReveal(root);
  });
}

// Career's "show all" toggles state that only affects an already-
// registered detail card's content — a full renderResult() recomputes
// everything including resultDetailRegistry, and refreshOpenResultDetail()
// (called at the end of renderResult()) re-pours the freshly-registered
// HTML for whichever card is currently open back into the still-open
// panel, so the overlay never has to close and reopen for this.
function toggleCareers(){
  careersExpanded = !careersExpanded;
  renderResult();
}

// Reveals the deep-analysis overview cards for a Quick Read/Balanced
// report — they're already fully rendered (just under the
// .deep-collapsed wrapper class, see .deep-wrap in pages.css) since
// renderResult() builds the whole report in one pass regardless of
// depth, so this needs no recomputation, no re-decode, and no trip back
// through the assessment.
function unlockFullReport(){
  const deep = document.getElementById("deepReportSections");
  if (!deep) return;
  click(480);
  deep.classList.remove("deep-collapsed");
  const cta = document.getElementById("unlockSection");
  if (cta) cta.remove();
  deep.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

function downloadQR(){
  const canvas = document.getElementById("qrCanvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "personaforge-qr.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  click(700);
}

function shareURLFor(code){
  const url = new URL(location.href);
  // Points at the site root (already the clean form — "/", never
  // "index.html") rather than this page's own path, since a shared link
  // always opens through index.html's tryLoadProfileFromURL() interstitial.
  url.pathname = url.pathname.replace(/[^/]*$/, "");
  url.search = "";
  url.searchParams.set("code", code);
  return url.toString();
}
function copyShareLink(){
  const link = shareURLFor(lastResult.code);
  navigator.clipboard?.writeText(link).then(() => {
    click(700); showToast("Share link copied — opening it loads this exact result.");
  }).catch(() => showToast("Couldn't copy automatically — long-press to copy: " + link));
}

// Sends the viewer to compare.html with THIS result pre-filled as Person
// A, regardless of whether it's the visitor's own result or one they're
// viewing from a shared link — pf_prefill_a takes priority over
// localStorage's pf_last_code in renderCompare() for exactly that reason.
function compareThisResult(){
  sessionStorage.setItem("pf_prefill_a", lastResult.code);
  click(400);
  navigate("compare");
}



function runInlineCompare(){
  const codeStr = document.getElementById("inlineCompareCode").value;
  const other = decodeCode(codeStr);
  const out = document.getElementById("inlineCompareOut");
  if (!other){
    out.innerHTML = `<p class="center-note" style="text-align:left">That code doesn't look right. Check for typos and try again.</p>`;
    return;
  }
  const mine = { normDims: lastResult.normDims };
  compareCategoriesExpanded = false;
  // See compare.js's runCompare() — nameA/nameB are escaped at the source
  // so renderCompareResult() and computeDeepCompatibility()'s generated
  // text (explanations/funFacts/who-comparisons) never see raw HTML.
  compareState = { profileA: mine, archA: lastResult.archetype, nameA: obEsc(lastResult.name), profileB: other, archB: other.archetype, nameB: obEsc(other.name), target: "inlineCompareOut" };
  click(420);
  showCompatibilityLoading(out, () => {
    out.innerHTML = renderCompareResult();
    initCountUps(out);
  });
}

/* ---------------- Radar chart (canvas, no library) ---------------------*/
function hexToRgba(hex, alpha){
  const h = (hex || "#A78BFA").replace("#","");
  const full = h.length === 3 ? h.split("").map(c=>c+c).join("") : h;
  const r = parseInt(full.substring(0,2),16) || 0;
  const g = parseInt(full.substring(2,4),16) || 0;
  const b = parseInt(full.substring(4,6),16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRadar(canvas, normDims, accentColor){
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const dims = DIMENSIONS;
  const n = dims.length;
  const labels = dims.map(d => RADAR_LABELS[d] || d);
  const color = accentColor || "#A78BFA";

  // Sized off the canvas's own bento card, not the whole page (root) —
  // this chart now lives in one grid cell among many, so its own
  // container's width is what actually constrains it.
  const containerWidth = (canvas.parentElement && canvas.parentElement.clientWidth) || root.clientWidth;
  // Measure the widest label at the font size we intend to use, so the
  // margin is always exactly as big as it needs to be, on any screen.
  // Floor dropped 9->8: one more px of breathing room specifically for
  // the smallest phone widths, where 25 tightly-packed labels need every
  // bit of margin they can get (see LABEL_STAGGER below).
  const fontSize = Math.max(8, Math.min(11, containerWidth / 42));
  ctx.font = `${fontSize}px Manrope, sans-serif`;
  let maxLabelWidth = 0;
  labels.forEach(l => { maxLabelWidth = Math.max(maxLabelWidth, ctx.measureText(l).width); });

  const available = Math.min(420, containerWidth - 8);
  // +28 on top of the usual text-width buffer: labels now stagger across
  // three radial offsets (see the 3-way stagger below), so the margin
  // has to cover the farthest tier or those labels clip at the edge.
  const margin = Math.min(available * 0.34, maxLabelWidth + 22 + 28);
  const size = available;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + "px"; canvas.style.height = size + "px";
  ctx.scale(dpr, dpr);
  const cx = size/2, cy = size/2, R = Math.max(60, size/2 - margin);
  ctx.clearRect(0,0,size,size);
  // With 25 axes only 14.4° apart, several consecutive labels near the
  // top/bottom vertices land close enough (both angularly and radially)
  // to visually merge — e.g. "Kindness"/"Discipline" at indices 12/13
  // used to read as one run-together word at a single fixed radius.
  // Staggering across three radial tiers (i % 3) mostly fixes that, but
  // 24 % 3 === 0 === 0 % 3, so the wrap seam (index 24 <-> index 0,
  // genuine angular neighbors) still shares a tier and "Open-Minded"
  // touches "Confidence" — confirmed by rendering both labels to an
  // offscreen canvas and diffing actual glyph pixels, not just bounding
  // boxes. Bumping index 24 to tier 2 (verified pixel-clean against both
  // of its neighbors, at container widths from 300px to 720px+) closes
  // that seam. A single sub-pixel touch between "Self-Aware"/"Planning"
  // remains on the narrowest phones (~300-390px) — real but far below
  // anything perceptible, and short of the original merge bug.
  const labelOffset = (i) => {
    const tier = (i === 24 && i % 3 === 0) ? 2 : i % 3;
    return 14 + tier * 14;
  };

  const isLight = document.documentElement.dataset.theme === "light";
  const gridColor = isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.08)";
  const spokeColor = isLight ? "rgba(15,23,42,0.07)" : "rgba(255,255,255,0.06)";
  const labelColor = isLight ? "rgba(15,23,42,0.68)" : "rgba(248,250,252,0.62)";
  const dotColor = isLight ? "#0F172A" : "#F8FAFC";

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++){
    ctx.beginPath();
    for (let i = 0; i <= n; i++){
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const r = (R * ring)/4;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = labelColor;
  ctx.font = `${fontSize}px Manrope, sans-serif`;
  ctx.textBaseline = "middle";
  dims.forEach((d, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI/2;
    const x = cx + Math.cos(angle) * R, y = cy + Math.sin(angle) * R;
    ctx.strokeStyle = spokeColor;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
    const cosA = Math.cos(angle);
    const off = labelOffset(i);
    const lx = cx + cosA * (R + off), ly = cy + Math.sin(angle) * (R + off);
    ctx.textAlign = cosA > 0.15 ? "left" : cosA < -0.15 ? "right" : "center";
    ctx.fillText(labels[i], lx, ly);
  });

  // The data polygon draws itself: growing outward from the center over
  // ~750ms instead of appearing instantly, so the personality visibly
  // emerges rather than just showing up.
  const drawPolygon = (progress) => {
    ctx.save();
    ctx.beginPath();
    dims.forEach((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const val = Math.max(0, Math.min(1, (normDims[d] + 10) / 20)) * progress;
      const r = R * val;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.18 * progress);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = dotColor;
    dims.forEach((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const val = Math.max(0, Math.min(1, (normDims[d] + 10) / 20)) * progress;
      const r = R * val;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
  };

  if (reducedMotion()){
    drawPolygon(1);
    return;
  }
  const start = performance.now();
  const duration = 750;
  function tick(now){
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    ctx.clearRect(0,0,size,size);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++){
      ctx.beginPath();
      for (let i = 0; i <= n; i++){
        const angle = (i / n) * Math.PI * 2 - Math.PI/2;
        const r = (R * ring)/4;
        const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = labelColor;
    ctx.font = `${fontSize}px Manrope, sans-serif`;
    ctx.textBaseline = "middle";
    dims.forEach((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * R, y = cy + Math.sin(angle) * R;
      ctx.strokeStyle = spokeColor;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      const cosA = Math.cos(angle);
      const off = labelOffset(i);
      const lx = cx + cosA * (R + off), ly = cy + Math.sin(angle) * (R + off);
      ctx.textAlign = cosA > 0.15 ? "left" : cosA < -0.15 ? "right" : "center";
      ctx.fillText(labels[i], lx, ly);
    });
    drawPolygon(eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------------- Seven Sins / Heavenly Virtues (fun, flippable) ---------
   Same 7 axes, same underlying percentages, just read from the sin side
   or the virtue side (100 - the other). Flipping morphs the polygon from
   its current shape to the new one instead of snapping, since the whole
   point is that it's the same evidence seen differently, not a new
   chart. Respects prefers-reduced-motion (snaps instantly instead). Lives
   inside the Secondary Archetype expansion card now, not its own card. */
let sinVirtueMode = "sin";
function drawSinVirtueRadar(canvas, axes, mode, accentColor, fromValues){
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const n = axes.length;
  const values = axes.map(a => mode === "sin" ? a.sinPct : a.virtuePct);
  const labels = axes.map(a => mode === "sin" ? a.sinLabel : a.virtueLabel);
  const color = accentColor || "#A78BFA";
  const isLight = document.documentElement.dataset.theme === "light";
  const gridColor = isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.08)";
  const labelColor = isLight ? "rgba(15,23,42,0.72)" : "rgba(248,250,252,0.68)";

  // Sized off its own bento card (see drawRadar's identical comment).
  const containerWidth = (canvas.parentElement && canvas.parentElement.clientWidth) || root.clientWidth;
  const available = Math.min(320, containerWidth - 8);
  const size = available;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + "px"; canvas.style.height = size + "px";
  ctx.scale(dpr, dpr);
  // Text-width-aware margin, ported from drawRadar()'s own technique —
  // the flat 54px this used to be never accounted for label width at
  // all, so the two widest labels ("Temperance", "Diligence") clipped
  // at the canvas edge. Measured against BOTH sin and virtue labels
  // (not just whichever mode is showing) so flipping never changes the
  // chart's size/margin — that would read as a jump, not a flip.
  ctx.font = "12px Manrope, sans-serif";
  let maxLabelWidth = 0;
  axes.forEach(a => {
    maxLabelWidth = Math.max(maxLabelWidth, ctx.measureText(a.sinLabel).width, ctx.measureText(a.virtueLabel).width);
  });
  const margin = Math.min(size * 0.34, maxLabelWidth + 22);
  const cx = size/2, cy = size/2, R = Math.max(60, size/2 - margin);

  function frame(currentValues){
    ctx.clearRect(0,0,size,size);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++){
      ctx.beginPath();
      for (let i = 0; i <= n; i++){
        const angle = (i/n) * Math.PI*2 - Math.PI/2;
        const r = (R*ring)/4;
        const x = cx + Math.cos(angle)*r, y = cy + Math.sin(angle)*r;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = labelColor;
    ctx.font = "12px Manrope, sans-serif";
    ctx.textBaseline = "middle";
    axes.forEach((a,i) => {
      const angle = (i/n) * Math.PI*2 - Math.PI/2;
      const x = cx + Math.cos(angle)*R, y = cy + Math.sin(angle)*R;
      ctx.strokeStyle = gridColor;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      const cosA = Math.cos(angle);
      const lx = cx + cosA*(R+16), ly = cy + Math.sin(angle)*(R+16);
      ctx.textAlign = cosA > 0.15 ? "left" : cosA < -0.15 ? "right" : "center";
      ctx.fillText(labels[i], lx, ly);
    });
    ctx.beginPath();
    axes.forEach((a,i) => {
      const angle = (i/n) * Math.PI*2 - Math.PI/2;
      const r = R * Math.max(0, Math.min(1, currentValues[i]/100));
      const x = cx + Math.cos(angle)*r, y = cy + Math.sin(angle)*r;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.2);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8;
    ctx.fill(); ctx.stroke();
  }

  if (reducedMotion() || !fromValues){ frame(values); return; }
  const start = performance.now(), duration = 550;
  function tick(now){
    const t = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-t, 3);
    const current = values.map((v,i) => fromValues[i] + (v - fromValues[i]) * eased);
    frame(current);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function flipSinVirtue(){
  const r = lastResult;
  if (!r || !r.sinVirtue) return;
  const fromValues = r.sinVirtue.map(a => sinVirtueMode === "sin" ? a.sinPct : a.virtuePct);
  sinVirtueMode = sinVirtueMode === "sin" ? "virtue" : "sin";
  click(sinVirtueMode === "virtue" ? 660 : 330);
  drawSinVirtueRadar(document.getElementById("sinVirtueRadar"), r.sinVirtue, sinVirtueMode, r.archetype.colors[0], fromValues);
  const caption = document.getElementById("sinVirtueCaption");
  if (caption) caption.textContent = sinVirtueMode === "sin" ? "Seven Deadly Sins" : "Seven Heavenly Virtues";
}

/* ---------------- EXPORT: Story / Post (dedicated canvas compositions,
   not a screenshot of the page) -------------------------------------- */
function loadExportImage(src){
  return new Promise((resolve) => {
    if (!src){ resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function exportRoundRect(ctx, x, y, w, h, r){
  const rad = Math.max(0, Math.min(r, w/2, h/2));
  ctx.beginPath();
  ctx.moveTo(x+rad, y);
  ctx.arcTo(x+w, y, x+w, y+h, rad);
  ctx.arcTo(x+w, y+h, x, y+h, rad);
  ctx.arcTo(x, y+h, x, y, rad);
  ctx.arcTo(x, y, x+w, y, rad);
  ctx.closePath();
}

// Cover-fit drawImage clipped to a rounded rect — same "photo fills its
// card" treatment as .ingot-visual on the live hero card.
function exportDrawImageCover(ctx, img, x, y, w, h, radius){
  ctx.save();
  exportRoundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  if (img){
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, x + (w-dw)/2, y + (h-dh)/2, dw, dh);
  } else {
    ctx.fillStyle = "#1B1E2E";
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

// Wraps to an array of lines (left-aligned metric), used by both the
// centered old-style callers and the new left-aligned panel text.
function exportWrapLines(ctx, text, maxWidth, maxLines){
  const words = String(text || "").split(" ");
  const lines = [];
  let line = "";
  for (const w of words){
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line){
      lines.push(line);
      line = w;
      if (maxLines && lines.length >= maxLines) { line = ""; break; }
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (maxLines && lines.length > maxLines){
    lines.length = maxLines;
    lines[maxLines-1] = lines[maxLines-1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

// A pill chip like .ov-chip, drawn left-to-right starting at x — returns
// the x position right after it, so callers can lay out a chip row.
function exportDrawChip(ctx, text, x, y, color, fontSize){
  fontSize = fontSize || 22;
  ctx.font = `500 ${fontSize}px 'Manrope', sans-serif`;
  const padX = fontSize, h = fontSize * 1.9;
  const textW = ctx.measureText(text).width;
  const w = textW + padX * 2;
  ctx.fillStyle = hexToRgba(color, 0.16);
  exportRoundRect(ctx, x, y, w, h, h/2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.4);
  ctx.lineWidth = 1.5;
  exportRoundRect(ctx, x, y, w, h, h/2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h/2 + 1);
  return x + w + 14;
}

function exportPageBackground(ctx, w, h, a){
  ctx.fillStyle = "#0B0C12";
  ctx.fillRect(0, 0, w, h);
  const g1 = ctx.createRadialGradient(w*0.5, h*0.08, 20, w*0.5, h*0.08, w*0.85);
  g1.addColorStop(0, hexToRgba(a.colors[0], 0.24)); g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
  const g2 = ctx.createRadialGradient(w*0.9, h*0.92, 20, w*0.9, h*0.92, w*0.7);
  g2.addColorStop(0, hexToRgba(a.colors[1], 0.16)); g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
}

function exportBrandHeader(ctx, w, y, r, size){
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${size}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = "#F8FAFC";
  ctx.fillText("FORGE", w/2, y);
  if (r.name){
    ctx.font = `500 ${Math.round(size*0.42)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "#8B93A7";
    ctx.fillText(`${r.name.toUpperCase()}'S RESULT`, w/2, y + size*0.62);
  }
}

function exportBrandFooter(ctx, w, y, r){
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = "400 20px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#6B7385";
  ctx.fillText(r.code, w/2, y);
  ctx.font = "400 16px 'Manrope', sans-serif";
  ctx.fillStyle = "#4B5163";
  ctx.fillText("Generated with Forge — forge your own at yota321.github.io/PersonaForge", w/2, y + 26);
}

// Shared "identity panel" — eyebrow + confidence pill, archetype name,
// subtitle, optional description, then a trait-chip row. Used by both
// Story and Post with different available heights/line budgets, so the
// two stay siblings (same building blocks) without being literal crops
// of each other.
function exportIdentityPanel(ctx, r, a, x, y, w, h, opts){
  opts = opts || {};
  const pad = opts.pad || 44;
  exportRoundRect(ctx, x, y, w, h, opts.radius || 28);
  ctx.fillStyle = "#12141F";
  ctx.fill();
  ctx.strokeStyle = hexToRgba(a.colors[0], 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const innerX = x + pad, innerW = w - pad*2;
  let cursorY = y + pad;

  // Eyebrow (left) + confidence pill (right), same row.
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = "600 18px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#8B93A7";
  ctx.fillText("PRIMARY ARCHETYPE", innerX, cursorY + 16);

  const pct = `${r.confidence.confidencePct}%`;
  ctx.font = "700 28px 'Space Grotesk', sans-serif";
  const pctW = ctx.measureText(pct).width;
  ctx.textAlign = "right";
  ctx.fillStyle = a.colors[0];
  ctx.fillText(pct, x + w - pad, cursorY + 22);
  ctx.font = "500 13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#6B7385";
  ctx.fillText("CONFIDENCE", x + w - pad, cursorY + 40);
  ctx.textAlign = "left";

  cursorY += 60;

  // Archetype name, up to 2 lines.
  ctx.font = `700 ${opts.nameSize || 58}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = "#F8FAFC";
  const nameLines = exportWrapLines(ctx, a.name, innerW, 2);
  const nameLH = (opts.nameSize || 58) * 1.06;
  nameLines.forEach((line, i) => ctx.fillText(line, innerX, cursorY + (opts.nameSize||58)*0.78 + i*nameLH));
  cursorY += nameLH * nameLines.length + 6;

  // Subtitle.
  ctx.font = `italic 500 ${opts.subSize || 26}px 'Manrope', sans-serif`;
  ctx.fillStyle = a.colors[0];
  ctx.fillText(a.title, innerX, cursorY + (opts.subSize||26)*0.8);
  cursorY += (opts.subSize||26) * 1.5;

  // Optional short description.
  if (opts.showDescription){
    ctx.font = "400 22px 'Manrope', sans-serif";
    ctx.fillStyle = "#B6BDCC";
    const descLines = exportWrapLines(ctx, a.description, innerW, opts.descLines || 3);
    descLines.forEach((line, i) => ctx.fillText(line, innerX, cursorY + 22*0.8 + i*32));
    cursorY += 32 * descLines.length + 18;
  } else {
    cursorY += 14;
  }

  // Trait chips follow the content directly (clamped so they can never
  // run past the panel's own bottom edge) rather than being pinned to a
  // fixed offset from the bottom — pinning left a dead gap under short
  // descriptions and risked overlap under long ones.
  const chipY = Math.min(cursorY + 6, y + h - pad - (opts.chipSize||22)*1.9);
  const topTraits = Object.entries(r.traits).sort((x2,y2)=>y2[1]-x2[1]).slice(0, opts.chipCount || 3);
  const chipColors = [a.colors[0], a.colors[1], "#8B93A7", a.colors[0]];
  let chipX = innerX;
  const maxChipX = x + w - pad;
  topTraits.forEach(([k,v], i) => {
    const label = `${k} ${v}%`;
    const next = chipX + (() => {
      ctx.font = `500 ${opts.chipSize||22}px 'Manrope', sans-serif`;
      return ctx.measureText(label).width + (opts.chipSize||22)*2 + 14;
    })();
    if (next > maxChipX + 14) return;
    chipX = exportDrawChip(ctx, label, chipX, chipY, chipColors[i] || "#8B93A7", opts.chipSize||22);
  });
}

async function exportPNG(kind){
  const r = lastResult; const a = r.archetype;
  const isStory = kind === "story";
  const w = 1080, h = isStory ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");

  const img = await loadExportImage(a.image);
  exportPageBackground(ctx, w, h, a);

  if (isStory){
    exportBrandHeader(ctx, w, 66, r, 32);
    exportDrawImageCover(ctx, img, 80, 140, w-160, 1120, 32);
    exportIdentityPanel(ctx, r, a, 80, 1280, w-160, 490, {
      nameSize: 54, subSize: 25, showDescription: true, descLines: 3, chipCount: 3
    });
    exportBrandFooter(ctx, w, 1860, r);
  } else {
    exportBrandHeader(ctx, w, 54, r, 26);
    exportDrawImageCover(ctx, img, 60, 106, w-120, 480, 26);
    exportIdentityPanel(ctx, r, a, 60, 606, w-120, 340, {
      nameSize: 44, subSize: 22, showDescription: false, chipCount: 3, pad: 36
    });
    exportBrandFooter(ctx, w, 990, r);
  }

  const link = document.createElement("a");
  link.download = `forge-${kind}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  click(760);
}

/* ---------------- EXPORT: PDF ---------------------------------------------
   A real generated PDF document (jsPDF, vendored locally in
   js/vendor/jspdf.umd.min.js so it works fully offline — never a CDN
   dependency), not the browser's print dialog. The library itself is
   loaded lazily on first use so it never costs anything on normal page
   load; every value drawn comes straight from `lastResult`. */
let jsPDFLoadPromise = null;
function loadJsPDF(){
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPDFLoadPromise) return jsPDFLoadPromise;
  jsPDFLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "js/vendor/jspdf.umd.min.js";
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
      else reject(new Error("jsPDF loaded but window.jspdf.jsPDF is missing"));
    };
    script.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(script);
  });
  return jsPDFLoadPromise;
}

// jsPDF can't embed WebP directly, so the archetype photo (the project's
// only WebP asset) is redrawn onto an offscreen canvas and re-exported
// as a JPEG data URL purely for this one PDF — the source .webp file
// itself is never touched.
async function loadImageAsJpegDataURL(src){
  const img = await loadExportImage(src);
  if (!img) return null;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), w: canvas.width, h: canvas.height };
}

function pdfWrap(doc, text, maxWidth){
  return doc.splitTextToSize(String(text || ""), maxWidth);
}

// A labeled horizontal bar (the PDF's stand-in for .stat-bar-track),
// returns the y position just below it.
function pdfStatBar(doc, label, pct, x, y, w, color){
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.setTextColor(90, 96, 112);
  doc.text(label, x, y);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text(`${pct}%`, x + w, y, { align: "right" });
  const barY = y + 2.4, barH = 2.6;
  doc.setFillColor(232, 234, 240);
  doc.roundedRect(x, barY, w, barH, barH/2, barH/2, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, barY, Math.max(barH, w * (pct/100)), barH, barH/2, barH/2, "F");
  return barY + barH + 7;
}

function pdfSectionTitle(doc, text, x, y, color){
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.setTextColor(...color);
  doc.text(text, x, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  doc.line(x, y + 2.5, x + 26, y + 2.5);
  return y + 12;
}

function pdfFooter(doc, pageNum, r, pageW, pageH){
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.setTextColor(150, 155, 168);
  doc.text("Generated with Forge — everything computed locally, on your device.", 20, pageH - 12);
  doc.text(String(pageNum), pageW - 20, pageH - 12, { align: "right" });
}

function hexToRgbTriple(hex){
  const h = (hex || "#A78BFA").replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c+c).join("") : h;
  return [parseInt(full.substring(0,2),16)||0, parseInt(full.substring(2,4),16)||0, parseInt(full.substring(4,6),16)||0];
}

async function savePDF(){
  const btn = document.querySelector('[onclick="savePDF()"]');
  const prevLabel = btn ? btn.textContent : null;
  if (btn){ btn.textContent = "Preparing…"; btn.disabled = true; }
  try {
    const JsPDFCtor = await loadJsPDF();
    const r = lastResult, a = r.archetype;
    const accent = hexToRgbTriple(a.colors[0]);
    const accent2 = hexToRgbTriple(a.colors[1]);
    const dark = [20, 22, 31];

    const doc = new JsPDFCtor({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const contentW = pageW - marginX*2;
    let page = 1;

    // ---- Page 1: cover ----------------------------------------------
    doc.setFillColor(...dark);
    doc.rect(0, 0, pageW, 58, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.setTextColor(255,255,255);
    doc.text("FORGE", pageW/2, 22, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.setTextColor(190, 195, 205);
    doc.text(r.name ? `${r.name}'s Result` : "Your Result", pageW/2, 30, { align: "center" });

    const photo = await loadImageAsJpegDataURL(a.image);
    let y = 70;
    if (photo){
      const maxW = 90, maxH = 90;
      const scale = Math.min(maxW/photo.w, maxH/photo.h);
      const iw = photo.w*scale, ih = photo.h*scale;
      doc.addImage(photo.dataUrl, "JPEG", (pageW-iw)/2, y, iw, ih, undefined, "FAST");
      y += ih + 12;
    }

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text("PRIMARY ARCHETYPE", pageW/2, y, { align: "center" });
    y += 10;
    doc.setFont("helvetica", "bold"); doc.setFontSize(26);
    doc.setTextColor(20,22,31);
    doc.text(a.name, pageW/2, y, { align: "center" });
    y += 9;
    doc.setFont("helvetica", "italic"); doc.setFontSize(13);
    doc.setTextColor(...accent);
    doc.text(a.title, pageW/2, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.setTextColor(60, 64, 76);
    doc.text(`${r.confidence.confidencePct}% match confidence`, pageW/2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    const descLines = pdfWrap(doc, a.description, contentW - 30);
    doc.text(descLines, pageW/2, y, { align: "center" });
    y += descLines.length * 5.5 + 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.setTextColor(120, 125, 138);
    doc.text(r.code, pageW/2, pageH - 22, { align: "center" });
    pdfFooter(doc, page, r, pageW, pageH);

    // Content below the cover flows across as many pages as it needs —
    // trait/value/career counts vary per result, so a fixed 3-page layout
    // can overrun the last page (the bug this replaced). Every row checks
    // its own space first and starts a fresh page, footer included, rather
    // than letting a row collide with the footer or spill off the bottom.
    const bottomSafe = pageH - 26;
    function ensureSpace(needed){
      if (y + needed > bottomSafe){
        pdfFooter(doc, page, r, pageW, pageH);
        doc.addPage(); page++;
        y = 24;
      }
    }

    // ---- Core traits + values ------------------------------------------
    doc.addPage(); page++;
    y = 24;
    ensureSpace(20);
    y = pdfSectionTitle(doc, "Core Traits", marginX, y, accent);
    y += 2;
    Object.entries(r.traits).forEach(([k,v]) => {
      ensureSpace(12);
      y = pdfStatBar(doc, k, v, marginX, y, contentW, accent);
    });

    y += 8;
    ensureSpace(20);
    y = pdfSectionTitle(doc, "Values", marginX, y, accent2);
    y += 2;
    r.humanValues.slice(0, 6).forEach(v => {
      ensureSpace(12);
      y = pdfStatBar(doc, v.name, v.pct, marginX, y, contentW, accent2);
    });

    // ---- Career fits + relationships ------------------------------------
    y += 8;
    ensureSpace(20);
    y = pdfSectionTitle(doc, "Career Fits", marginX, y, accent);
    y += 2;
    r.careers.slice(0, 6).forEach(c => {
      ensureSpace(12);
      y = pdfStatBar(doc, c.name, c.fit, marginX, y, contentW, accent);
    });

    y += 8;
    ensureSpace(20);
    y = pdfSectionTitle(doc, "Relationships", marginX, y, accent2);
    y += 2;

    const attLines = pdfWrap(doc, `${r.relationship.attachmentStyle.name} — ${r.relationship.attachmentStyle.description}`, contentW);
    ensureSpace(attLines.length * 5 + 12);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(20,22,31);
    doc.text("Attachment Style", marginX, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(90,96,112);
    doc.text(attLines, marginX, y + 5.5);
    y += attLines.length * 5 + 12;

    const confLines = pdfWrap(doc, `${r.relationship.conflictStyle.name} — ${r.relationship.conflictStyle.description}`, contentW);
    ensureSpace(confLines.length * 5 + 12);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(20,22,31);
    doc.text("Conflict Style", marginX, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(90,96,112);
    doc.text(confLines, marginX, y + 5.5);
    pdfFooter(doc, page, r, pageW, pageH);

    doc.save(`forge-${(r.name || "result").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.pdf`);
    click(760);
  } catch(e){
    console.error("PDF export failed:", e);
    showToast("Couldn't generate the PDF — try again.");
  } finally {
    if (btn){ btn.textContent = prevLabel; btn.disabled = false; }
  }
}
