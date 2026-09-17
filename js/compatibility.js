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
  if (out){ out.innerHTML = renderCompareResult(); initCountUps(out); }
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

function renderCompareResult(){
  const { profileA, archA, nameA, profileB, archB, nameB } = compareState;
  const deep = computeDeepCompatibility(profileA, profileB, nameA, nameB);
  const topCats = compareCategoriesExpanded ? deep.categories : deep.categories.slice(0, 8);
  // nameA/nameB come straight out of pasted PF-codes (yours and whoever's
  // code you're comparing against) — every caller that builds compareState
  // escapes them with obEsc() before storing, so they (and everything
  // computeDeepCompatibility derives from them, e.g. explanations/funFacts)
  // are already safe to interpolate as HTML here. Don't re-escape — that
  // would double-encode entities in names that needed escaping.
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

