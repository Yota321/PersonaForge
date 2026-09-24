/* =========================================================================
   FORGE - GROWTH (growth.html)
   "Your personality moving over time": the full retake history, trend
   lines for a few key traits, and the same major-changes/soul-shift/
   confidence-trend reads result.js's Growth Timeline card already
   computes via computeGrowthTimeline() (engine.js) — this page is just
   that same data given a full page instead of one bento card, plus the
   full history list and per-trait sparklines it didn't have room for.
   Loaded by growth.html only, after engine.js + global.js.
   ========================================================================= */


// Small inline-SVG trend line across every retake for one dimension —
// deliberately not canvas (no resize/redraw machinery needed for a shape
// this simple) and deliberately not a charting library (one polyline is
// the whole ask).
const GROWTH_TREND_DIMS = ["confidence", "leadership", "creativity", "resilience", "socialEnergy"];
function sparklineSvg(values, color){
  if (values.length < 2){
    return `<span style="color:var(--text-dim);font-size:12px">Retake once more to start a trend line</span>`;
  }
  const w = 180, h = 38, pad = 5;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const dots = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${color}"/>`;
  }).join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Trend across ${values.length} retakes">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${dots}
  </svg>`;
}

function renderGrowth(){
  setAccentColors();
  setPageTitle("Growth");
  const result = buildResultFromLatestTimeline();

  if (!result){
    root.innerHTML = `
      <div class="container">
        ${topBar(true)}
        <div class="eyebrow accent">GROWTH</div>
        <h2 style="margin:10px 0 6px">Nothing to Track Yet</h2>
        <p class="tagline" style="text-align:left;color:var(--text-muted)">Take the assessment once, and this page starts following how you change every time you come back to it.</p>
        <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
        </div>
      </div>`;
    return;
  }

  const a = result.archetype;
  const growth = computeGrowthTimeline(result);
  const history = growth.entries;
  const color = a.colors ? a.colors[0] : "var(--accent)";
  const snapshot = computeWeeklySnapshot(result, growth);
  const streak = computeJournalStreak();
  const nudge = computeRetakeNudge(growth, streak);

  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">GROWTH</div>
      <h2 style="margin:10px 0 6px">Your Personality, Moving</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Same assessment, taken more than once, is the only honest way to see whether you're actually changing or just having a different week. Here's what's shifted so far.</p>

      <div class="card glass" style="margin-top:20px;text-align:center">
        <div class="eyebrow accent">CURRENTLY</div>
        <h4>${a.icon} ${a.name} &bull; ${result.soul.name} Soul</h4>
        <div class="ingot-name count-up" style="font-size:36px;margin-top:10px" data-target="${growth.retakeCount}" data-suffix="">0</div>
        <p style="color:var(--text-muted)">Total assessments taken on this device</p>
        ${growth.badges.length ? `<div class="tag-list" style="justify-content:center;margin-top:10px">${growth.badges.map(b => `<span class="tag">${b}</span>`).join("")}</div>` : ""}
      </div>

      ${snapshot ? `
      <div class="card glass" style="margin-top:14px">
        <div class="eyebrow accent">WEEKLY SNAPSHOT</div>
        <h4 style="margin-top:4px">Since your last check-in, ${snapshot.daysSince === 0 ? "earlier today" : snapshot.daysSince === 1 ? "1 day ago" : `${snapshot.daysSince} days ago`}</h4>
        ${snapshot.deltas.map(d => `<div class="mini-bar-row"><span>${d.label}</span><span class="${d.delta > 0 ? "ov-trend up" : d.delta < 0 ? "ov-trend down" : ""}">${d.delta > 0 ? "+" : ""}${d.delta}%</span></div>`).join("")}
        ${!snapshot.hasNotableChange ? `<p style="margin-top:8px;color:var(--text-dim);font-size:12.5px">Nothing moved much this time, which is its own kind of steady.</p>` : ""}
      </div>` : ""}

      ${!growth.hasPrevious ? `
      <div class="card glass" style="margin-top:14px">
        <h4>One Retake From Now, This Page Fills In</h4>
        <p>Right now there's only one data point, so there's nothing to compare yet. Come back and retake the assessment later (same device) and this page starts showing real before/after, not just a snapshot.</p>
      </div>` : `
      <div class="grid-2" style="margin-top:14px">
        <div class="card glass"><h4>Archetype</h4><p>${growth.archetypeChange.changed ? `${growth.archetypeChange.from} &rarr; ${growth.archetypeChange.to}` : `Still ${a.name}, unchanged since your last run.`}</p></div>
        <div class="card glass"><h4>Soul Type</h4><p>${growth.soulChange.changed ? `${growth.soulChange.from} &rarr; ${growth.soulChange.to}` : `Still ${result.soul.name}, unchanged since your last run.`}</p></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Match Confidence Trend</h4>
        <p>${growth.confidenceTrend.direction === "up" ? `Rising: ${growth.confidenceTrend.from}% &rarr; ${growth.confidenceTrend.to}%. Your answers are landing more decisively than they used to.`
          : growth.confidenceTrend.direction === "down" ? `Softer than last time: ${growth.confidenceTrend.from}% &rarr; ${growth.confidenceTrend.to}%. That's not necessarily a bad sign, it often just means you're between two real types right now.`
          : growth.confidenceTrend.direction === "flat" ? `Holding steady: ${growth.confidenceTrend.from}% &rarr; ${growth.confidenceTrend.to}%.`
          : "Not enough data to read a trend yet."}</p>
      </div>

      ${growth.majorChanges.length ? `
      <div class="card glass" style="margin-top:12px">
        <h4>What Actually Moved</h4>
        ${growth.majorChanges.map(c => `<div class="mini-bar-row"><span>${c.label}</span><span>${c.before}% &rarr; ${c.after}% (${c.delta > 0 ? "+" : ""}${c.delta})</span></div>`).join("")}
      </div>` : ""}

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Improved Tendencies</h4><div class="tag-list">${growth.improvedTendencies.length ? growth.improvedTendencies.map(t => `<span class="tag">${t.label} +${t.delta}</span>`).join("") : "<span class='tag'>Nothing jumped enough to call growth yet</span>"}</div></div>
        <div class="card glass"><h4>Steady, Barely Moved</h4><div class="tag-list">${growth.unchangedTraits.length ? growth.unchangedTraits.map(t => `<span class="tag">${t}</span>`).join("") : "<span class='tag'>Everything shifted at least a little</span>"}</div></div>
      </div>
      `}

      <div class="card glass" style="margin-top:12px">
        <h4>Trend Lines</h4>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:6px">Each dot is one retake, oldest to newest.</p>
        ${GROWTH_TREND_DIMS.map(dim => {
          const values = history.map(h => pct((h.normDims && h.normDims[dim]) || 0));
          return `<div class="mini-bar-row" style="align-items:center"><span>${DIM_LABELS[dim]}</span><span>${sparklineSvg(values, color)}</span></div>`;
        }).join("")}
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Full History</h4>
        ${history.slice().reverse().map((h, idx) => `
          <div class="mini-bar-row">
            <span>${h.dateLabel}${idx === 0 ? " (most recent)" : ""}</span>
            <span>${h.archetype || ""}${h.soul ? ` &bull; ${h.soul}` : ""}${typeof h.confidencePct === "number" ? ` &bull; ${h.confidencePct}%` : ""}</span>
          </div>`).join("")}
      </div>

      <div class="card glass" style="margin-top:12px;text-align:center">
        <h4>Curious Where You Land Next?</h4>
        <p>${nudge}</p>
        <div class="cta-row" style="justify-content:center;margin-top:10px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Retake Assessment &rarr;</button>
          <button class="btn btn-ghost" onclick="click(380);navigate('improve')">See Improve suggestions</button>
        </div>
      </div>
    </div>
  `;
  initCountUps(root);
}
