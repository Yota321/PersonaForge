/* =========================================================================
   FORGE - COMPATIBILITY (shared: result.html + compare.html)
   showCompatibilityLoading/bandColor/renderCompareResult and the state
   they share (compareState, compareCategoriesExpanded) are genuinely used
   by two different pages: compare.html's own two-code compare flow AND
   result.html's inline "Compare with someone else" card
   (runInlineCompare(), in result.js). Splitting per-page would mean
   duplicating this logic or result.html reaching into compare.js, so it
   lives here instead — load this on both pages, after engine.js +
   global.js, before result.js/compare.js.
   ========================================================================= */

/* =========================================================================
   FORGE - COMPARE
   Two-code pairwise comparison: the compare.html page itself, plus
   showCompatibilityLoading/bandColor/renderCompareResult, which are also
   reused by party.js (group compare) and result.js (inline compare widget).
   ========================================================================= */

let compareCategoriesExpanded = false;
let compareState = null;

/* ---------------- COMPATIBILITY LOADING TRANSITION ------------------------
   A brief "calculating" beat before a compare result appears, matching the
   forging screen's rhythm so checking compatibility feels like its own
   real moment rather than an instant lookup. */
function showCompatibilityLoading(out, done){
  const lines = pickLines(4, COMPATIBILITY_CALC_LINES);
  out.innerHTML = `
    <div class="section revealed">
      <div class="card glass compat-loading">
        <div class="calc-bars"><span></span><span></span><span></span><span></span></div>
        <p id="compat-loading-line">${lines[0]}...</p>
      </div>
    </div>`;
  let i = 0;
  const interval = setInterval(() => {
    i++;
    const el = document.getElementById("compat-loading-line");
    if (el && lines[i]) el.textContent = lines[i] + "...";
  }, 380);
  setTimeout(() => {
    clearInterval(interval);
    done();
  }, 1650);
}


function toggleCompareCategories(){
  compareCategoriesExpanded = !compareCategoriesExpanded;
  const out = document.getElementById(compareState.target);
  if (out) mountCompareResult(out);
}

function bandColor(band){
  const map = {
    "Extremely Incompatible": "#FB7185",
    "Difficult": "#FDBA74",
    "Mixed": "#FACC15",
    "Good": "#7DD3FC",
    "Excellent": "#6EE7B7",
    "Exceptional": "#A78BFA",
  };
  return map[band] || "#A7B0C2";
}

function hexToRgbaCompat(hex, alpha){
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0,2), 16), g = parseInt(h.substring(2,4), 16), b = parseInt(h.substring(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
// Two-profile overlay radar, used for both "Mind Map" (all 25 dims) and
// "Emotion Radar" (the narrower EMOTION_RADAR_DIMS subset) in Compare 2.0
// — same drawing code, just a different dim list and no growth animation
// (comparing two static shapes, not revealing one).
function drawCompareRadar(canvas, dims, normDimsA, colorA, normDimsB, colorB){
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const n = dims.length;
  const labels = dims.map(d => RADAR_LABELS[d] || d);
  const containerWidth = (canvas.parentElement && canvas.parentElement.clientWidth) || 360;
  const fontSize = Math.max(9, Math.min(12, containerWidth / 30));
  ctx.font = `${fontSize}px Manrope, sans-serif`;
  let maxLabelWidth = 0;
  labels.forEach(l => { maxLabelWidth = Math.max(maxLabelWidth, ctx.measureText(l).width); });
  const available = Math.min(420, containerWidth - 8);
  // At n=25 (the full Mind Map), axes sit only 14.4deg apart, so labels
  // held at a single fixed radius read as overlapping (worst case:
  // adjacent labels merging into one unreadable run, e.g. "Discipline"/
  // "Kindness" at the bottom vertex). Below ~13 axes (e.g. the Emotion
  // Radar's shorter dim list) there's enough angular room that a single
  // radius already reads cleanly, so this only kicks in when the axis
  // count actually needs it -- ported from drawRadar()'s identical fix
  // in result.js, generalized to any n instead of a fixed dim list.
  const needsStagger = n > 12;
  const margin = Math.min(available * 0.34, maxLabelWidth + 20 + (needsStagger ? 28 : 0));
  const size = available;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + "px"; canvas.style.height = size + "px";
  ctx.scale(dpr, dpr);
  const cx = size/2, cy = size/2, R = Math.max(60, size/2 - margin);
  ctx.clearRect(0,0,size,size);
  const isLight = document.documentElement.dataset.theme === "light";
  const gridColor = isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.08)";
  const spokeColor = isLight ? "rgba(15,23,42,0.07)" : "rgba(255,255,255,0.06)";
  const labelColor = isLight ? "rgba(15,23,42,0.68)" : "rgba(248,250,252,0.62)";

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
  // Same 3-tier radial stagger as drawRadar() in result.js: alternating
  // which of three radii a label sits at breaks up runs of angularly-close
  // labels, computed from n itself (not a hardcoded axis count) so it
  // applies correctly whichever dim list is passed in. When n isn't a
  // multiple of 3, the wrap seam (last axis <-> axis 0, genuine angular
  // neighbors) can land in the same tier despite that -- nudged to the
  // next tier so that seam never merges either.
  const labelRadius = (i) => {
    if (!needsStagger) return R + 16;
    let tier = i % 3;
    if (i === n - 1 && n % 3 !== 0 && tier === 0) tier = 1;
    return R + 14 + tier * 14;
  };
  dims.forEach((d, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI/2;
    const x = cx + Math.cos(angle) * R, y = cy + Math.sin(angle) * R;
    ctx.strokeStyle = spokeColor;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
    const cosA = Math.cos(angle);
    const off = labelRadius(i);
    const lx = cx + cosA * off, ly = cy + Math.sin(angle) * off;
    ctx.textAlign = cosA > 0.15 ? "left" : cosA < -0.15 ? "right" : "center";
    ctx.fillText(labels[i], lx, ly);
  });

  const drawPolygon = (normDims, color) => {
    ctx.beginPath();
    dims.forEach((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const val = Math.max(0, Math.min(1, ((normDims[d]||0) + 10) / 20));
      const r = R * val;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgbaCompat(color, 0.16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  };
  drawPolygon(normDimsA, colorA);
  drawPolygon(normDimsB, colorB);
}

// Mounts renderCompareResult() into `out` and draws the two dual-overlay
// radar canvases it references — split out from the plain "set innerHTML"
// callers used to do because canvases need to exist in the DOM before
// drawCompareRadar() can size itself off canvas.parentElement.
function mountCompareResult(out){
  out.innerHTML = renderCompareResult();
  initCountUps(out);
  const { profileA, archA, profileB, archB } = compareState;
  const duo = computeDuoTitle(archA, archB);
  const mind = document.getElementById("cmpRadarMind");
  const emo = document.getElementById("cmpRadarEmotion");
  if (mind) drawCompareRadar(mind, DIMENSIONS, profileA.normDims, duo.colorA, profileB.normDims, duo.colorB);
  if (emo) drawCompareRadar(emo, EMOTION_RADAR_DIMS, profileA.normDims, duo.colorA, profileB.normDims, duo.colorB);
}

function compareStyleRow(label, a, b){
  return `<div class="cmp-style-row"><h4>${label}</h4><div class="grid-2"><p>${a}</p><p>${b}</p></div></div>`;
}
function compareTagPair(label, aTags, bTags){
  return `<div class="cmp-style-row"><h4>${label}</h4><div class="grid-2">
    <div class="tag-list">${aTags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    <div class="tag-list">${bTags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </div></div>`;
}

function renderCompareResult(){
  const { profileA, archA, nameA, profileB, archB, nameB } = compareState;
  const deep = computeDeepCompatibility(profileA, profileB, nameA, nameB);
  const layers = computeCompareLayers(profileA, archA, profileB, archB, nameA, nameB);
  const overview = computeCompareOverview(deep.categories);
  const topCats = compareCategoriesExpanded ? deep.categories : deep.categories.slice(0, 8);
  // nameA/nameB come straight out of pasted PF-codes (yours and whoever's
  // code you're comparing against) — every caller that builds compareState
  // escapes them with obEsc() before storing, so they (and everything
  // computeDeepCompatibility/computeCompareLayers derive from them, e.g.
  // explanations/funFacts/agreement text) are already safe to interpolate
  // as HTML here. Don't re-escape — that would double-encode entities in
  // names that needed escaping.
  const A = nameA || "Person A", B = nameB || "Person B";
  const duo = computeDuoTitle(archA, archB);
  return `
    <div class="section revealed">
      <div class="duo-crest" style="background: linear-gradient(120deg, ${duo.colorA}, ${duo.colorB})">
        <div class="duo-icons"><span>${duo.iconA}</span><span class="duo-x">&times;</span><span>${duo.iconB}</span></div>
        <div class="duo-title">${duo.title}</div>
      </div>
      <div class="card glass" style="text-align:center">
        <h4>${A} and ${B}</h4>
        <p style="color:var(--text-muted);margin-top:4px">${archA.icon} ${archA.name} &nbsp;meets&nbsp; ${archB.icon} ${archB.name}</p>
        <div class="ingot-name count-up" style="font-size:44px;margin-top:14px" data-target="${deep.relationshipScore}" data-suffix="%">0%</div>
        <p style="color:var(--text-muted)">Overall Compatibility</p>
        <span class="tag band-tag" style="margin-top:10px;display:inline-block;color:${bandColor(deep.band)};border-color:${bandColor(deep.band)}66">${deep.band}</span>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Overview</h4>
        <div class="grid-2 cmp-overview-grid">
          ${overview.map(m => `
            <div class="mini-bar-row"><span>${m.label}</span><span class="count-up" data-target="${m.score}" data-suffix="%">0%</span></div>`).join("")}
        </div>
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Similarity</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${deep.similarityScore}%"></div></div><p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${deep.similarityScore}%</p></div>
        <div class="card glass"><h4>Comparison Confidence</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${deep.comparisonConfidence}%"></div></div><p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${deep.comparisonConfidence}%</p></div>
      </div>
      <div class="card glass" style="margin-top:12px"><p style="font-size:13.5px">${deep.similarityNote}</p></div>

      <div class="grid-2" style="margin-top:12px">
        ${topCats.map(c => `
          <div class="card glass"><h4>${c.name}</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${c.score}%"></div></div><p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${c.score}%</p></div>`).join("")}
      </div>
      <div class="careers-toggle"><button onclick="toggleCompareCategories()">${compareCategoriesExpanded ? "Show fewer categories" : `Show all ${deep.categories.length} categories`}</button></div>

      ${deep.explanations.length ? `
      <div class="card glass" style="margin-top:14px">
        <h4>Why This Score</h4>
        ${deep.explanations.map(e => `<p style="margin-top:8px">${e}</p>`).join("")}
      </div>` : ""}

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Shared Strengths</h4><div class="tag-list">${deep.sharedStrengths.map(s=>`<span class="tag">${s}</span>`).join("") || "<span class='tag'>Still emerging</span>"}</div></div>
        <div class="card glass"><h4>Possible Friction</h4><div class="tag-list">${deep.conflictAreas.map(s=>`<span class="tag">${s}</span>`).join("")}</div></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Who Does What More</h4>
        ${deep.whoComparisons.map(w => `<div class="mini-bar-row"><span>${w.label}</span><span>${w.winner}</span></div>`).join("")}
      </div>

      <div class="section-divider"><span>Layer Comparison</span></div>

      <div class="card glass" style="text-align:center">
        <div class="grid-2">
          <div><div class="eyebrow accent">${A.toUpperCase()}</div><h4>${layers.archetype.a.icon} ${layers.archetype.a.name}</h4></div>
          <div><div class="eyebrow accent">${B.toUpperCase()}</div><h4>${layers.archetype.b.icon} ${layers.archetype.b.name}</h4></div>
        </div>
      </div>
      <div class="card glass" style="margin-top:12px;text-align:center">
        <div class="grid-2">
          <div><div class="eyebrow" style="color:${layers.soul.a.hex}">SOUL TYPE</div><h4>${layers.soul.a.name} &bull; ${layers.soul.a.trait}</h4></div>
          <div><div class="eyebrow" style="color:${layers.soul.b.hex}">SOUL TYPE</div><h4>${layers.soul.b.name} &bull; ${layers.soul.b.trait}</h4></div>
        </div>
      </div>

      ${compareTagPair("Top Virtues", layers.topVirtues.a, layers.topVirtues.b)}
      ${compareTagPair("Top Tendencies", layers.topTendencies.a, layers.topTendencies.b)}

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Mind Map</h4><canvas id="cmpRadarMind" width="360" height="360" role="img" aria-label="Overlaid radar chart of both people's dimensions"></canvas></div>
        <div class="card glass"><h4>Emotion Radar</h4><canvas id="cmpRadarEmotion" width="360" height="360" role="img" aria-label="Overlaid radar chart of both people's emotional dimensions"></canvas></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Fun Stats</h4>
        ${layers.funStats.map(f => `<div class="mini-bar-row"><span>${f.label}</span><span>${A}: ${f.a}% &nbsp;&bull;&nbsp; ${B}: ${f.b}%</span></div>`).join("")}
      </div>

      ${compareTagPair("Strengths", layers.strengths.a, layers.strengths.b)}
      ${compareTagPair("Weaknesses", layers.weaknesses.a, layers.weaknesses.b)}
      ${compareTagPair("Stress Response", [layers.stressResponse.a], [layers.stressResponse.b])}
      ${compareStyleRow("Leadership Style", layers.leadershipStyle.a, layers.leadershipStyle.b)}
      ${compareStyleRow("Learning Style", layers.learningStyle.a, layers.learningStyle.b)}
      ${compareStyleRow("Work Style", layers.workStyle.a, layers.workStyle.b)}
      ${compareStyleRow("Relationship Style", layers.relationshipStyle.a, layers.relationshipStyle.b)}
      ${compareStyleRow("Communication Style", layers.communicationStyle.a, layers.communicationStyle.b)}
      ${compareStyleRow("Decision Style", layers.decisionStyle.a, layers.decisionStyle.b)}
      ${compareStyleRow("Thinking Style", layers.thinkingStyle.a, layers.thinkingStyle.b)}
      ${compareStyleRow("Growth Advice", layers.growthAdvice.a, layers.growthAdvice.b)}

      <div class="section-divider"><span>Where You Line Up</span></div>

      <div class="card glass">
        <h4>Where You Naturally Agree</h4>
        ${layers.agreement.agree.length ? layers.agreement.agree.map(r => `<p style="margin-top:8px">${r.text}</p>`).join("") : `<p style="margin-top:8px">No single trait both of you are strongly aligned on, and that's fine, it just means your common ground is more about balance than sameness.</p>`}
      </div>
      <div class="card glass" style="margin-top:12px">
        <h4>Where You Naturally Disagree</h4>
        ${layers.agreement.disagree.length ? layers.agreement.disagree.map(r => `<p style="margin-top:8px">${r.text}</p>`).join("") : `<p style="margin-top:8px">Nothing stands out as a hard opposite, your differences here are more matters of degree than direction.</p>`}
      </div>
      <div class="card glass" style="margin-top:12px">
        <h4>Where You Balance Each Other</h4>
        ${layers.agreement.balance.length ? layers.agreement.balance.map(r => `<p style="margin-top:8px">${r.text}</p>`).join("") : `<p style="margin-top:8px">You're fairly evenly matched across the board, less a case of balancing each other and more just running at similar levels.</p>`}
      </div>
      <div class="card glass" style="margin-top:12px">
        <h4>Where Conflict May Happen</h4>
        ${layers.agreement.conflictAreas.length ? layers.agreement.conflictAreas.map(r => `<p style="margin-top:8px">${r.text}</p>`).join("") : `<p style="margin-top:8px">Nothing in the friction-prone areas (trust, patience, risk, planning, independence) shows a sharp opposite, so conflict here is more likely to come from a bad day than a fundamental mismatch.</p>`}
      </div>
      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>What ${layers.brings.a.name} Brings</h4><div class="tag-list">${layers.brings.a.traits.length ? layers.brings.a.traits.map(t=>`<span class="tag">${t}</span>`).join("") : "<span class='tag'>A steady, matched contribution</span>"}</div></div>
        <div class="card glass"><h4>What ${layers.brings.b.name} Brings</h4><div class="tag-list">${layers.brings.b.traits.length ? layers.brings.b.traits.map(t=>`<span class="tag">${t}</span>`).join("") : "<span class='tag'>A steady, matched contribution</span>"}</div></div>
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Perfect Activity</h4><p>${deep.activities.activity}</p></div>
        <div class="card glass"><h4>Perfect Vacation</h4><p>${deep.activities.vacation}</p></div>
        <div class="card glass"><h4>Perfect Business</h4><p>${deep.activities.business}</p></div>
        <div class="card glass"><h4>Perfect Weekend</h4><p>${deep.activities.weekend}</p></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Fun Facts</h4>
        ${deep.funFacts.map(f => `<p style="margin-top:6px;font-size:13.5px">${f}</p>`).join("")}
      </div>

      <div class="card glass" style="margin-top:12px"><h4>Advice</h4><p>Lean on the shared strengths to build trust quickly, and name the friction points out loud early. Most conflict here comes from different defaults, not different goals.</p></div>
    </div>
  `;
}

