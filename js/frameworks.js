/* =========================================================================
   FORGE - FRAMEWORKS (frameworks.html)
   The full-page unpacking of the MBTI/Big Five/DISC/Enneagram card the
   result page already shows compactly — same numbers, computed the same
   way, just with a real per-letter/per-trait breakdown and explanation
   instead of a single line each. Loaded by frameworks.html only, after
   engine.js + global.js.
   ========================================================================= */


function renderFrameworks(){
  setAccentColors();
  setPageTitle("Frameworks");
  const result = buildResultFromLatestTimeline();

  if (!result){
    root.innerHTML = `
      <div class="container">
        ${topBar(true)}
        <div class="eyebrow accent">FRAMEWORKS</div>
        <h2 style="margin:10px 0 6px">Nothing to Break Down Yet</h2>
        <p class="tagline" style="text-align:left;color:var(--text-muted)">Take the assessment once, and this page unpacks your MBTI, Big Five, DISC, and Enneagram reads letter by letter and trait by trait.</p>
        <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
        </div>
      </div>`;
    return;
  }

  const deep = computeFrameworksDeepDive(result.normDims);

  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">FRAMEWORKS</div>
      <h2 style="margin:10px 0 6px">Every Framework, Unpacked</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">A quick disclaimer first: none of this is a licensed or certified MBTI/DISC/Enneagram/Big Five instrument. It's Forge's own model projected onto those frameworks' language, because the language is familiar even when the underlying test isn't the official one.</p>

      <div class="section-divider"><span>MBTI</span></div>
      <div class="card glass" style="text-align:center">
        <div class="eyebrow accent">CLOSEST TYPE</div>
        <h3 style="margin-top:4px">${deep.mbti.type}</h3>
      </div>
      <div class="grid-2" style="margin-top:12px">
        ${deep.mbti.axes.map(a => `
          <div class="card glass">
            <h4>${a.letter} vs ${a.otherLetter}</h4>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${a.strengthPct}%"></div></div>
            <p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${a.strengthPct}% ${a.letter}</p>
            <p style="margin-top:6px">${a.meaning}</p>
          </div>`).join("")}
      </div>

      <div class="section-divider"><span>Big Five</span></div>
      ${deep.bigFive.map(t => `
        <div class="card glass" style="margin-top:10px">
          <h4>${t.name}</h4>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${t.pct}%"></div></div>
          <p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${t.pct}%</p>
          <p style="margin-top:6px">${t.explanation}</p>
        </div>`).join("")}

      <div class="section-divider"><span>DISC</span></div>
      ${deep.disc.map(d => `
        <div class="card glass${d.isPrimary ? " improve-checkin" : ""}" style="margin-top:10px">
          <h4>${d.name}${d.isPrimary ? " (Primary)" : ""}</h4>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${d.pct}%"></div></div>
          <p style="margin-top:6px;font-size:12px;color:var(--text-dim);text-align:right">${d.pct}%</p>
          <p style="margin-top:6px">${d.explanation}</p>
        </div>`).join("")}

      <div class="section-divider"><span>Enneagram</span></div>
      <div class="card glass">
        <div class="eyebrow accent">CORE TYPE</div>
        <h4 style="margin-top:4px">${deep.enneagram.core.name}</h4>
        <p style="margin-top:6px">${deep.enneagram.coreExplanation}</p>
      </div>
      <div class="card glass" style="margin-top:12px">
        <div class="eyebrow accent">CLOSEST WING</div>
        <h4 style="margin-top:4px">${deep.enneagram.wing.name}</h4>
        <p style="margin-top:6px">${deep.enneagram.wingExplanation}</p>
      </div>

      <div class="card glass" style="margin-top:14px;text-align:center">
        <h4>Want the Rest of Your Read?</h4>
        <p>These four frameworks are just one lens. Your full result has the archetype, soul type, and everything else built from the same answers.</p>
        <div class="cta-row" style="justify-content:center;margin-top:8px">
          <button class="btn btn-ghost btn-sm" onclick="click(380);viewMyLastResult()">See Full Result</button>
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('growth')">See Growth page</button>
        </div>
      </div>
    </div>
  `;
}
