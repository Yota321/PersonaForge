/* =========================================================================
   FORGE - COMPARE (compare.html)
   The compare.html page itself (two-code pairwise compare) and party
   compare (3-5 people) — party is a mode within this same page, not a
   separate HTML file (see HANDOFF notes). Depends on compatibility.js
   for showCompatibilityLoading/renderCompareResult/bandColor — load that
   first. Loaded by compare.html only, after engine.js + global.js +
   compatibility.js.
   ========================================================================= */

function renderCompare(){
  setAccentColors();
  setPageTitle("Compare");
  // pf_prefill_a (set by compareThisResult() on the result page) wins
  // over pf_last_code so "Compare" on a *shared* result you're viewing
  // fills Person A with that result, not whatever you last took yourself.
  const myCode = sessionStorage.getItem("pf_prefill_a") || localStorage.getItem("pf_last_code") || "";
  sessionStorage.removeItem("pf_prefill_a");
  const prefillB = sessionStorage.getItem("pf_prefill_b") || "";
  sessionStorage.removeItem("pf_prefill_b");
  const autoCompare = sessionStorage.getItem("pf_auto_compare") === "1";
  sessionStorage.removeItem("pf_auto_compare");
  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">COMPARE</div>
      <h2 style="margin:10px 0 6px">Two Codes, One Read</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Paste two Forge codes to see how the two of you actually line up. Everything decodes locally, right here in the browser.</p>
      <div class="compare-inputs" style="margin-top:20px">
        <div><label>Person A code</label><textarea id="codeA" placeholder="Name-PF1-...">${myCode}</textarea></div>
        <div><label>Person B code</label><textarea id="codeB" placeholder="Name-PF1-...">${prefillB}</textarea></div>
      </div>
      <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
        <button class="btn btn-primary" onclick="runCompare()">Compare</button>
        <button class="btn btn-ghost" onclick="navigate('party')">Compare a group instead</button>
      </div>
      <div id="compareOut"></div>
    </div>
  `;
  if (autoCompare && myCode && prefillB) runCompare();
}

function runCompare(){
  const a = decodeCode(document.getElementById("codeA").value);
  const b = decodeCode(document.getElementById("codeB").value);
  const out = document.getElementById("compareOut");
  if (!a || !b){
    out.innerHTML = `<p class="center-note" style="text-align:left">One or both codes look off. Double check for typos and try again.</p>`;
    return;
  }
  compareCategoriesExpanded = false;
  // Escaped once here, at the source, matching runPartyCompare()'s
  // pattern — renderCompareResult() and everything it hands nameA/nameB
  // to (computeDeepCompatibility's explanations/funFacts/who-comparisons)
  // trust these as pre-sanitized rather than re-escaping downstream.
  compareState = { profileA: a, archA: a.archetype, nameA: obEsc(a.name), profileB: b, archB: b.archetype, nameB: obEsc(b.name), target: "compareOut" };
  click(420);
  showCompatibilityLoading(out, () => {
    out.innerHTML = renderCompareResult();
    initCountUps(out);
  });
}


/* =========================================================================
   FORGE - PARTY COMPARE (3-5 people)
   Depends on compare.js for showCompatibilityLoading (must load after it).
   ========================================================================= */

let partyState = null;

/* ---------------- PARTY COMPARE (3-5 people) ------------------------------*/
function renderParty(){
  setAccentColors();
  setPageTitle("Party Compare");
  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">PARTY COMPARE</div>
      <h2 style="margin:10px 0 6px">The Whole Group</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Paste 3 to 5 Forge codes to see how the whole group lines up together, not just pair by pair.</p>
      <div class="compare-inputs party-inputs" style="margin-top:20px">
        <div><label>Person 1</label><textarea id="partyCode0" placeholder="Name-PF2-...">${localStorage.getItem("pf_last_code") || ""}</textarea></div>
        <div><label>Person 2</label><textarea id="partyCode1" placeholder="Name-PF2-..."></textarea></div>
        <div><label>Person 3</label><textarea id="partyCode2" placeholder="Name-PF2-..."></textarea></div>
      </div>
      <button class="btn btn-ghost" style="margin-top:12px" onclick="toggleMorePartySlots()" id="partyToggleBtn">+ Add up to 2 more people</button>
      <div id="extraPartySlots" class="hidden compare-inputs party-extra-inputs" style="margin-top:12px">
        <div><label>Person 4</label><textarea id="partyCode3" placeholder="Name-PF2-..."></textarea></div>
        <div><label>Person 5</label><textarea id="partyCode4" placeholder="Name-PF2-..."></textarea></div>
      </div>
      <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
        <button class="btn btn-primary" onclick="runPartyCompare()">Compare Group</button>
        <button class="btn btn-ghost" onclick="navigate('compare')">Back to two-person compare</button>
      </div>
      <div id="partyOut"></div>
    </div>
  `;
}
function toggleMorePartySlots(){
  const el = document.getElementById("extraPartySlots");
  const btn = document.getElementById("partyToggleBtn");
  const showing = !el.classList.contains("hidden");
  el.classList.toggle("hidden");
  btn.textContent = showing ? "+ Add up to 2 more people" : "\u2212 Hide extra slots";
  click(360);
}
function runPartyCompare(){
  const ids = ["partyCode0","partyCode1","partyCode2","partyCode3","partyCode4"];
  const raw = ids.map(id => (document.getElementById(id)?.value || "").trim()).filter(Boolean);
  const out = document.getElementById("partyOut");
  if (raw.length < 3){
    out.innerHTML = `<p class="center-note" style="text-align:left">Add at least 3 codes to compare a group. For two people, use regular Compare instead.</p>`;
    return;
  }
  if (raw.length > 5){
    out.innerHTML = `<p class="center-note" style="text-align:left">Party Compare supports up to 5 people at once.</p>`;
    return;
  }
  const decoded = raw.map(c => decodeCode(c));
  if (decoded.some(d => !d)){
    out.innerHTML = `<p class="center-note" style="text-align:left">One or more codes look off. Double check each one for typos and try again.</p>`;
    return;
  }
  // Escaped once here, at the source: every name below (decoded from
  // pasted party codes) flows straight into rendered HTML in
  // renderPartyResult() via computeGroupCompatibility()'s bestPair/
  // toughestPair/roles/pairwise fields, none of which re-escape it.
  partyState = { decoded, names: decoded.map((d,i) => obEsc(d.name) || `Person ${i+1}`) };
  click(420);
  showCompatibilityLoading(out, () => {
    out.innerHTML = renderPartyResult();
    initCountUps(out);
  });
}
function renderPartyResult(){
  const { decoded, names } = partyState;
  const group = computeGroupCompatibility(decoded, names);
  const sortedPairs = [...group.pairwise].sort((a,b) => b.score - a.score);
  return `
    <div class="section revealed">
      <div class="card glass" style="text-align:center">
        <h4>${group.vibe}</h4>
        <div class="extras-row" style="justify-content:center;margin-top:10px">
          ${decoded.map((d,i) => `<span class="tag">${d.archetype.icon} ${names[i]}</span>`).join("")}
        </div>
        <div class="ingot-name count-up" style="font-size:44px;margin-top:14px" data-target="${group.overallScore}" data-suffix="%">0%</div>
        <p style="color:var(--text-muted)">Overall Group Compatibility</p>
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Strongest Pair</h4><p>${group.bestPair.nameA} and ${group.bestPair.nameB}<br><span style="color:var(--text-dim);font-family:var(--font-mono);font-size:12px">${group.bestPair.score}%</span></p></div>
        <div class="card glass"><h4>Most Friction</h4><p>${group.toughestPair.nameA} and ${group.toughestPair.nameB}<br><span style="color:var(--text-dim);font-family:var(--font-mono);font-size:12px">${group.toughestPair.score}%</span></p></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Who Brings What</h4>
        ${group.roles.map(r => `<div class="mini-bar-row"><span>${r.name}</span><span>${r.direction} ${r.standoutTrait} than the group average</span></div>`).join("")}
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>What the Whole Group Shares</h4><div class="tag-list">${group.groupSharedStrengths.length ? group.groupSharedStrengths.map(s=>`<span class="tag">${s}</span>`).join("") : "<span class='tag'>No single trait everyone's strong in, and that's fine</span>"}</div></div>
        <div class="card glass"><h4>Where the Group Differs Most</h4><div class="tag-list">${group.groupFriction.map(s=>`<span class="tag">${s}</span>`).join("")}</div></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Every Pair, Ranked</h4>
        ${sortedPairs.map(p => `<div class="mini-bar-row"><span>${p.nameA} + ${p.nameB}</span><span>${p.score}%</span></div>`).join("")}
      </div>

      <div class="card glass" style="margin-top:12px"><h4>Advice</h4><p>Lean on your strongest pair to help smooth over the toughest one, and use the shared strengths as the group's default mode when plans need to come together fast.</p></div>
    </div>
  `;
}


