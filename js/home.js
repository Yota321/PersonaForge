/* =========================================================================
   FORGE - HOME (index.html)
   Landing page render + the "someone shared a link" interstitial, which
   also only ever renders on index.html (see tryLoadProfileFromURL() in
   engine.js). Loaded by index.html only, after engine.js + global.js.
   ========================================================================= */

function resumeQuiz(){
  const saved = getSavedQuizProgress();
  if (!saved){ goToNameScreen(); return; }
  click(500);
  sessionStorage.setItem("pf_resume_quiz", "1");
  location.href = "quiz.html";
}
function discardSavedQuizAndStart(){
  clearQuizProgress();
  click(360);
  goToNameScreen();
}

/* ---------------- POST-QUIZ DASHBOARD -----------------------------------
   Once a result exists, Home stops being a pure landing page and gains a
   short "Forge noticing you" section: current archetype/soul, a couple
   of human-sounding observations (computeLivingNotes(), engine.js), a
   confidence/journal snapshot, and a context-aware retake nudge instead
   of a flat button. Everything here is read-only and reuses computed
   data other pages already show in full — this is deliberately the
   short version, not a duplicate of Growth. */
function renderHomeDashboard(){
  const result = buildResultFromLatestTimeline();
  if (!result) return "";
  const growth = computeGrowthTimeline(result);
  const notes = computeLivingNotes(result, growth);
  const streak = computeJournalStreak();
  const nudge = computeRetakeNudge(growth, streak);
  const a = result.archetype;

  return `
  <section class="lp-dashboard section">
    <div class="lp-dashboard-head">
      <div class="eyebrow accent">YOUR SNAPSHOT</div>
      <h2>Still figuring you out, <span class="accent-text">a little more each time.</span></h2>
    </div>
    <div class="lp-dashboard-grid">
      <div class="card glass lp-dashboard-hero">
        <div class="eyebrow accent">CURRENTLY</div>
        <h3 style="margin-top:4px">${a.icon} ${a.name} &bull; ${result.soul.name} Soul</h3>
        ${notes.map(n => `<p style="margin-top:8px;color:var(--text-muted)">${n}</p>`).join("")}
        <div class="cta-row" style="margin-top:12px">
          <button class="btn btn-ghost btn-sm" onclick="click(380);viewMyLastResult()">See Full Result</button>
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('growth')">See Growth</button>
        </div>
      </div>
      <div class="card glass">
        <h4>Recent Activity</h4>
        <div class="mini-bar-row"><span>Retakes</span><span>${growth.retakeCount}</span></div>
        <div class="mini-bar-row"><span>Journal streak</span><span>${streak.current} day${streak.current===1?"":"s"}</span></div>
        <div class="mini-bar-row"><span>Confidence</span><span>${result.confidence.confidencePct}%</span></div>
        <div class="cta-row" style="margin-top:10px">
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('journal')">Journal</button>
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('improve')">Improve</button>
        </div>
      </div>
      <div class="card glass">
        <h4>Feel Like Checking In?</h4>
        <p style="color:var(--text-muted);font-size:13.5px">${nudge}</p>
        <div class="cta-row" style="margin-top:10px"><button class="btn btn-primary btn-sm" onclick="click(520);goToNameScreen()">Retake Assessment &rarr;</button></div>
      </div>
    </div>
  </section>`;
}

/* ---------------- LANDING ---------------------------------------------*/
function renderLanding(){
  setAccentColors();
  setPageTitle();
  const saved = localStorage.getItem("pf_last_code");
  const savedQuiz = getSavedQuizProgress();
  root.innerHTML = `
    <div class="lp-bg-flatten" aria-hidden="true"></div>
    <svg width="0" height="0" aria-hidden="true" style="position:absolute">
      <defs>
        <clipPath id="lpHeroNotch" clipPathUnits="objectBoundingBox">
          <path d="M1,0.0457 L1,0.5742 C1,0.5995 0.9472,0.6198 0.8815,0.6198 L0.6924,0.6198 C0.6266,0.6198 0.5734,0.6404 0.5734,0.6656 L0.5734,0.9543 C0.5734,0.9796 0.5202,1 0.4546,1 L0.119,1 C0.0533,1 0,0.9796 0,0.9543 L0,0.0457 C0,0.0204 0.0533,0 0.119,0 L0.8815,0 C0.9472,0 1,0.0204 1,0.0457 Z" />
        </clipPath>
      </defs>
    </svg>
    <div class="container lp-topbar-wrap">${topBar(false)}</div>
    <div class="landing-v2">

      <section class="lp-hero-grid">
        <div class="lp-hero-text">
          <div class="eyebrow accent">DISCOVER &middot; COMPARE &middot; EVOLVE</div>
          <h1>Small Pieces.<br>A Bigger <span class="accent-text">You.</span></h1>
          <p class="lp-sub">A personality read that actually adapts to you. Answer real scenarios, not a survey, and watch it change direction as it gets to know you. About seven minutes, entirely on your device.</p>

          ${savedQuiz ? `
          <div class="card glass lp-status-card">
            <div class="eyebrow accent">IN PROGRESS</div>
            <p>${savedQuiz.name ? obEsc(savedQuiz.name) + ", y" : "Y"}ou answered ${savedQuiz.cursor} of ${savedQuiz.targetLength}. Pick up on question ${savedQuiz.cursor + 1}.</p>
            <div class="cta-row">
              <button class="btn btn-primary" onclick="resumeQuiz()">Continue &rarr;</button>
              <button class="btn btn-ghost" onclick="discardSavedQuizAndStart()">Start over</button>
            </div>
          </div>
          ` : `
          <div class="cta-row">
            <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
            <button class="btn btn-ghost" onclick="click(380);navigate('compare')">Compare Two Results</button>
          </div>
          `}
          ${saved ? `<button class="btn btn-ghost lp-reopen" onclick="click(380);loadSaved()">Reopen my last result</button>` : ""}
          ${saved ? `
          <div class="lp-quick-links" role="navigation" aria-label="Your profile">
            <button class="lp-quick-link" onclick="click(360);navigate('profile')">${ICONS.people}<span>Profile</span></button>
            <button class="lp-quick-link" onclick="click(360);navigate('growth')">${ICONS.trendUp}<span>Growth</span></button>
            <button class="lp-quick-link" onclick="click(360);navigate('improve')">${ICONS.spark}<span>Improve</span></button>
          </div>` : ""}

          <div class="lp-avatars" aria-hidden="true">
            <div class="lp-avatar-stack">
              <img src="assets/Avatar_1.jpg" alt="" width="38" height="38" loading="lazy" />
              <img src="assets/Avatar_2.jpg" alt="" width="38" height="38" loading="lazy" />
              <img src="assets/Avatar_3.jpg" alt="" width="38" height="38" loading="lazy" />
              <img src="assets/Avatar_4.jpg" alt="" width="38" height="38" loading="lazy" />
              <img src="assets/Avatar_5.jpg" alt="" width="38" height="38" loading="lazy" />
            </div>
            <p class="lp-avatars-caption">For anyone curious what's actually going on in there.</p>
          </div>

          <div class="lp-trust-row">
            <span>Runs on your device</span><span class="dot-sep"></span><span>No account needed</span><span class="dot-sep"></span><span>Works offline</span>
          </div>
        </div>

        <div class="lp-bento-canvas">
          <div class="lp-hero-visual" aria-hidden="true">
            <img class="lp-hero-photo" src="assets/Hero_Home.jpg" alt="" width="1328" height="1956" loading="eager" fetchpriority="high" />
            <span class="lp-visual-caption lp-visual-caption-top">A more<br>thoughtful<br>you.</span>
            <span class="lp-visual-caption lp-visual-caption-bottom">Not just answers.<br>A clearer tomorrow.<br>//</span>
          </div>

          <button class="lp-card lp-card-01" onclick="click(520);goToNameScreen()">
            <div class="lp-card-top"><span class="lp-card-num">01</span><span class="lp-card-arrow">&nearr;</span></div>
            <h3>Discover</h3>
            <p>Answer real scenarios, not generic questions.</p>
            <span class="lp-card-foot">Real insights. Real you.</span>
          </button>
          <div class="lp-card lp-card-dark">
            <span class="lp-plus">+</span>
            <p>Your mind is a system of connected parts.</p>
            <div class="lp-dark-shapes" aria-hidden="true">
              <span class="lp-dshape ds1"></span>
              <span class="lp-dshape ds2"></span>
              <span class="lp-dshape ds3"></span>
            </div>
          </div>

          <div class="lp-bento-row">
            <button class="lp-card lp-card-02" onclick="click(380);navigate('compare')">
              <div class="lp-card-top"><span class="lp-card-num">02</span><span class="lp-card-arrow">&nearr;</span></div>
              <h3>Compare</h3>
              <p>See how you connect with friends, partners, and others.</p>
              <span class="lp-card-foot">Different people. Brighter connections.</span>
            </button>
            <button class="lp-card lp-card-03" onclick="click(380);navigate('growth')">
              <div class="lp-card-top"><span class="lp-card-num">03</span><span class="lp-card-arrow">&nearr;</span></div>
              <h3>Evolve</h3>
              <p>Track your growth over time.</p>
              <span class="lp-card-foot">Same questions. A different you.</span>
            </button>
          </div>
        </div>
      </section>

      ${saved ? renderHomeDashboard() : ""}

      <section class="lp-features section" aria-label="Why Forge">
        <div class="lp-feature"><span class="lp-feature-icon lp-fi-1">${ICONS.lock}</span><div><h4>Private</h4><p>Your data stays on your device.</p></div></div>
        <div class="lp-feature"><span class="lp-feature-icon lp-fi-2">${ICONS.wifi}</span><div><h4>Works Offline</h4><p>Use it anytime, anywhere.</p></div></div>
        <div class="lp-feature"><span class="lp-feature-icon lp-fi-3">${ICONS.layers}</span><div><h4>Built for You</h4><p>Adaptive and always evolving.</p></div></div>
        <div class="lp-feature"><span class="lp-feature-icon lp-fi-4">${ICONS.people}</span><div><h4>Made for People</h4><p>Understand yourself and others.</p></div></div>
      </section>

      <section class="lp-cta-split section">
        <div class="lp-cta-panel lp-cta-dark">
          <div class="eyebrow accent">NO ACCOUNT REQUIRED</div>
          <h3>Take the assessment. Keep it simple.</h3>
          <p>Forge works fully on your device. No sign up, no tracking, just insights.</p>
          <ul class="lp-checklist">
            <li>Unlimited quizzes</li>
            <li>Local storage only</li>
            <li>Personality timeline</li>
            <li>Works offline</li>
          </ul>
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
        </div>
        <div class="lp-cta-panel lp-cta-outline">
          <div class="eyebrow">WANT MORE? <span class="lp-soon-badge">Coming soon</span></div>
          <h3>An optional account, eventually.</h3>
          <p>Forge is built to stay useful without one. If accounts ever arrive, they'll stay optional and add to this, never gate it.</p>
          <ul class="lp-checklist lp-checklist-muted">
            <li>Sync across your own devices</li>
            <li>Saved comparisons</li>
            <li>Early access to new features</li>
          </ul>
          <button class="btn btn-ghost" onclick="showComingSoon('Cloud profiles')">Cloud Profile &rarr;</button>
          <p class="lp-fine-print">Always optional. Your privacy, your choice.</p>
        </div>
      </section>

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
  spawnAmbience();
  setupProgressiveReveal(document.querySelector(".landing-v2"));
  initHeroParallax();
  initMagneticButtons(document.querySelector(".landing-v2"));
}

/* Subtle magnetic pull on primary CTAs: the button nudges a few px
   toward the cursor within its own bounds, springing back on leave.
   Hover-capable pointers only, and a no-op under reduced motion.
   Clamped to +-8px regardless of button size: uncapped, the offset
   scaled with the button's own half-width (34px+ on a wide primary
   button), which visibly pushed it past its container's edge since a
   transform never reflows layout to make room for itself. */

/* Subtle pointer-parallax on the hero's abstract shapes, each drifting a
   different amount so the stack reads as layered rather than flat. Pure
   ambient motion (no content moves), and skipped entirely under
   prefers-reduced-motion. */
function initHeroParallax(){
  const visual = document.querySelector(".lp-hero-visual");
  const photo = visual && visual.querySelector(".lp-hero-photo");
  if (!visual || !photo || reducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
  let raf = null;
  visual.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const rect = visual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      photo.style.setProperty("--px", (px * 14).toFixed(2) + "px");
      photo.style.setProperty("--py", (py * 14).toFixed(2) + "px");
    });
  });
  visual.addEventListener("pointerleave", () => {
    photo.style.setProperty("--px", "0px");
    photo.style.setProperty("--py", "0px");
  });
}

function loadSaved(){
  const code = localStorage.getItem("pf_last_code");
  const decoded = code && decodeCode(code);
  if (!decoded){ showToast("No valid saved result found on this device."); return; }
  sessionStorage.setItem("pf_view_shared_code", code);
  location.href = "result.html";
}


/* =========================================================================
   FORGE - SHARE INTERSTITIAL
   The "someone shared their profile" screen, rendered in place on
   index.html by tryLoadProfileFromURL() (engine.js) when a ?code= link is
   opened. "View Profile" and "Compare With Mine" hand off to
   result.html/compare.html via a one-shot sessionStorage flag, since
   lastResult/session don't survive a real cross-page navigation.
   ========================================================================= */

function renderSharedLinkInterstitial(){
  const decoded = pendingSharedProfile;
  // decoded.archetype is whatever archIdx was baked into the code string
  // at encode time -- stale the moment matchArchetype's scoring changes,
  // same class of bug as buildResultFromDecoded's identically-named field
  // in engine.js. Recomputing fresh means this interstitial can never show
  // a different archetype than the result page "View Profile" hands off
  // to right after.
  const a = matchArchetype(decoded.normDims).primary;
  setAccentColors(a.colors[0], a.colors[1]);
  setPageTitle(decoded.name ? `${decoded.name}'s Profile` : "Shared Profile");
  const hasOwnProfile = !!localStorage.getItem("pf_last_code");
  // decoded.name comes straight out of a PF-code, which is just base64-ish
  // text anyone can hand-craft and put in a link — never trust it as HTML.
  const whoShared = decoded.name ? `${obEsc(decoded.name)} shared their Forge profile.` : "Someone shared their Forge profile.";
  root.innerHTML = `
    <div class="container">
      ${topBar(false)}
      <div class="shared-interstitial">
        <div class="shared-interstitial-icon">${a.icon}</div>
        <h2>${whoShared}</h2>
        <p class="shared-interstitial-sub">${a.icon} ${a.name}, ${a.title}</p>
        <div class="cta-row" style="justify-content:center;margin-top:22px">
          <button class="btn btn-primary" onclick="openSharedProfile()">View Profile</button>
          ${hasOwnProfile ? `<button class="btn btn-ghost" onclick="compareSharedWithMine()">Compare With Mine</button>` : ""}
          <button class="btn btn-ghost" onclick="takeAssessmentFromShared()">Take the Assessment</button>
        </div>
      </div>
    </div>
  `;
}
function openSharedProfile(){
  sessionStorage.setItem("pf_view_shared_code", pendingSharedCode);
  click(500);
  location.href = "result.html";
}
function compareSharedWithMine(){
  const myCode = localStorage.getItem("pf_last_code");
  if (!myCode){ openSharedProfile(); return; }
  sessionStorage.setItem("pf_prefill_b", pendingSharedCode);
  sessionStorage.setItem("pf_auto_compare", "1");
  click(500);
  location.href = "compare.html";
}
function takeAssessmentFromShared(){
  click(400);
  location.href = "quiz.html";
}

