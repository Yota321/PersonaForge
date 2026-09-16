/* =========================================================================
   FORGE - PAGES
   Every page-specific render function and helper, for every page, in one
   file. Loaded by every page after engine.js + global.js. Each page's own
   tiny inline <script> sets PF_PAGE and calls the one entry point it
   needs; navigate()/goHome()/etc (global.js) use PF_PAGE to tell pages
   apart, since every render* function below exists on every page now.
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
            <button class="lp-card lp-card-03" onclick="click(380);navigate('party')">
              <div class="lp-card-top"><span class="lp-card-num">03</span><span class="lp-card-arrow">&nearr;</span></div>
              <h3>Evolve</h3>
              <p>Track your growth over time.</p>
              <span class="lp-card-foot">Same questions. A different you.</span>
            </button>
          </div>
        </div>
      </section>

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
          <button class="btn btn-ghost" onclick="showComingSoon('Accounts')">Sign Up &rarr;</button>
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
  if (!decoded){ alert("No valid saved result found on this device."); return; }
  sessionStorage.setItem("pf_view_shared_code", code);
  location.href = "result.html";
}

/* =========================================================================
   FORGE - ONBOARDING (name / about you / your experience)
   quiz.html's own page: a real 3-step setup, then straight into the quiz
   in place (see the QUIZ section below) — one continuous flow, one page.
   Step 2 ("about you") and step 3's result-depth choice collect only
   presentation preferences: nothing there touches personality scoring.
   Assessment length (also step 3) is the one choice that actually
   drives the quiz engine (QuizSession's questionMode, see startQuiz()).
   pendingName/pendingMeta accumulate across all three steps so going
   back and forth never loses an earlier answer.
   ========================================================================= */
let pendingMeta = {};

function obEsc(str){
  return String(str == null ? "" : str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
// Shared "01 —— 02 —— 03" wayfinding header for all three onboarding
// screens: steps before `step` read as done, `step` itself as active,
// anything after stays dim.
function obStepIndicator(step){
  const node = (n) => `<span class="ns-step-node ${n < step ? "ns-step-done" : n === step ? "ns-step-active" : "ns-step-dim"}">${String(n).padStart(2, "0")}</span>`;
  const line = (done) => `<span class="ns-step-line${done ? " ns-step-line-done" : ""}"></span>`;
  return `
    <span class="sr-only">Step ${step} of 3</span>
    <div class="ns-steps" aria-hidden="true">${node(1)}${line(step > 1)}${node(2)}${line(step > 2)}${node(3)}</div>
  `;
}
// Single-select chip row (age group, gender, "why are you here"): a
// plain toggle-button group, each button just marking itself selected
// and clearing its siblings in the same data-group.
function obChipRow(group, options, selected){
  return `<div class="ob-chip-row">${options.map(opt => {
    const sel = opt === selected;
    return `<button type="button" class="ob-chip${sel ? " selected" : ""}" data-group="${obEsc(group)}" data-value="${obEsc(opt)}" onclick="obSelectChip(this)">${obEsc(opt)}</button>`;
  }).join("")}</div>`;
}
function obSelectChip(el){
  const group = el.dataset.group;
  document.querySelectorAll(`.ob-chip[data-group="${group}"]`).forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  click(320);
}
function obChipValue(group){
  return document.querySelector(`.ob-chip.selected[data-group="${group}"]`)?.dataset.value || "";
}
// Richer single-select cards (result depth / assessment length): each
// option carries a title, a short description, and an optional badge
// ("Recommended"), with one pre-selected as the sensible fast-path
// default so "Start Assessment" already works with zero taps.
function obCardGroup(group, options, selected){
  return `<div class="ob-cards">${options.map(opt => {
    const sel = opt.value === selected;
    return `
      <button type="button" class="ob-card${sel ? " selected" : ""}" data-group="${obEsc(group)}" data-value="${obEsc(opt.value)}" onclick="obSelectCard(this)">
        <span class="ob-card-check" aria-hidden="true">&check;</span>
        <span class="ob-card-title">${obEsc(opt.title)}${opt.badge ? `<span class="ob-card-badge">${obEsc(opt.badge)}</span>` : ""}</span>
        <span class="ob-card-desc">${opt.desc}</span>
      </button>`;
  }).join("")}</div>`;
}
function obSelectCard(el){
  const group = el.dataset.group;
  document.querySelectorAll(`.ob-card[data-group="${group}"]`).forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  click(340);
}
function obCardValue(group, fallback){
  return document.querySelector(`.ob-card.selected[data-group="${group}"]`)?.dataset.value || fallback;
}

const OB_AGE_GROUPS = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];
const OB_GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const OB_REASONS = ["Learn about myself", "Compare with someone", "Personal growth", "Just curious"];

/* ---------------- STEP 1: NAME -----------------------------------------*/
function renderNameScreen(){
  setAccentColors();
  setPageTitle("Assessment");
  root.innerHTML = `
    <div class="container lp-topbar-wrap">${topBar(true)}</div>
    <div class="ns-wrap">
      <div class="ns-panel glass ns-pre" id="nameScreen">
        <div class="ns-panel-top">
          <div class="eyebrow accent">BEFORE WE START</div>
          ${obStepIndicator(1)}
        </div>
        <div class="ns-panel-body">
          <h2>Who am I <span class="accent-text">reading?</span></h2>
          <p>Your name goes at the front of your result and your personality code, so it's clearly yours if you ever share it.</p>

          <div class="ns-input-wrap">
            <svg class="ns-input-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6.8" r="3.3"/><path d="M3.8 16.2c.7-3.6 2.9-5.6 6.2-5.6s5.5 2 6.2 5.6"/></svg>
            <input type="text" id="nameField" class="ns-input" placeholder="e.g. Inori" maxlength="20" autocomplete="off" value="${obEsc(pendingName)}" />
          </div>

          <button class="ns-extra-toggle" onclick="toggleExtraDetails()" id="extraToggleBtn">
            <span id="extraToggleLabel">+ Add more details</span><span class="ns-extra-hint">Optional</span>
          </button>
          <div id="extraDetails" class="hidden ns-extra-fields">
            <div class="ob-section">
              <span class="ns-label">Age group</span>
              ${obChipRow("ageGroup", OB_AGE_GROUPS, pendingMeta.ageGroup)}
            </div>
            <input type="text" id="occupationField" class="ns-input ns-input-sm" placeholder="Occupation" maxlength="30" autocomplete="off" value="${obEsc(pendingMeta.occupation)}" />
            <input type="text" id="countryField" class="ns-input ns-input-sm" placeholder="Country" maxlength="30" autocomplete="off" value="${obEsc(pendingMeta.country)}" />
            <p class="ns-extra-note">Used only to personalize your report, never your exact age or date of birth. No information ever leaves your device.</p>
          </div>

          <button class="btn btn-primary" onclick="confirmName()">Continue &rarr;</button>
          <div class="ns-divider">OR</div>
          <button class="btn btn-ghost" onclick="click(360);startQuiz('')">Skip for now</button>
          <p class="ns-skip-note">You can also skip this and stay anonymous.</p>
        </div>
      </div>
    </div>
  `;
  spawnAmbience();
  // Double-rAF: guarantees the browser has painted the .ns-pre (offset)
  // state at least once before it's removed, so the transition to the
  // resting state actually plays instead of being collapsed into the
  // initial style calculation.
  const screen = document.getElementById("nameScreen");
  requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.remove("ns-pre")));
  // Reopens "Add more details" automatically when coming back from step
  // 2/3 with something already filled in, so a person who went back
  // doesn't have to remember to reopen it to see their own answer.
  if (pendingMeta.ageGroup || pendingMeta.occupation || pendingMeta.country){
    document.getElementById("extraDetails").classList.remove("hidden");
    document.getElementById("extraToggleLabel").textContent = "− Hide extra details";
  }
  setTimeout(() => {
    const f = document.getElementById("nameField");
    if (f){ f.focus(); f.onkeydown = (e) => { if (e.key === "Enter") confirmName(); }; }
  }, 50);
}
function toggleExtraDetails(){
  const el = document.getElementById("extraDetails");
  const label = document.getElementById("extraToggleLabel");
  const showing = !el.classList.contains("hidden");
  el.classList.toggle("hidden");
  label.textContent = showing ? "+ Add more details" : "\u2212 Hide extra details";
  click(360);
}
function confirmName(){
  pendingName = document.getElementById("nameField").value.trim();
  pendingMeta.ageGroup = obChipValue("ageGroup");
  pendingMeta.occupation = (document.getElementById("occupationField")?.value || "").trim();
  pendingMeta.country = (document.getElementById("countryField")?.value || "").trim();
  click(500);
  renderAboutScreen();
}

/* ---------------- STEP 2: ABOUT YOU ------------------------------------
   Short on purpose: two optional, non-scoring questions that only ever
   personalize wording/tone, never a trait, dimension, or archetype
   match. Nothing selected still works — Continue is the "skip" here. */
function renderAboutScreen(){
  setAccentColors();
  setPageTitle("Assessment");
  root.innerHTML = `
    <div class="container lp-topbar-wrap">${topBar(true)}</div>
    <div class="ns-wrap">
      <div class="ns-panel glass" id="aboutScreen">
        <div class="ns-panel-top">
          <div class="eyebrow accent">A LITTLE MORE ABOUT YOU</div>
          ${obStepIndicator(2)}
        </div>
        <div class="ns-panel-body ns-panel-body--wide">
          <h2>About <span class="accent-text">you.</span></h2>
          <p>Optional, and none of it touches your result, just a couple of details that help Forge speak to you more naturally.</p>

          <div class="ob-section">
            <span class="ns-label">Gender</span>
            ${obChipRow("gender", OB_GENDERS, pendingMeta.gender)}
          </div>
          <div class="ob-section">
            <span class="ns-label">Why are you taking Forge?</span>
            ${obChipRow("reason", OB_REASONS, pendingMeta.reason)}
          </div>

          <div class="qz-nav2">
            <button class="btn btn-ghost" onclick="click(300);confirmAbout(true)">&larr; Back</button>
            <button class="btn btn-primary" onclick="confirmAbout(false)">Continue &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  `;
  spawnAmbience();
}
function confirmAbout(goBack){
  pendingMeta.gender = obChipValue("gender");
  pendingMeta.reason = obChipValue("reason");
  if (goBack){ renderNameScreen(); return; }
  click(500);
  renderExperienceScreen();
}

/* ---------------- STEP 3: YOUR EXPERIENCE ------------------------------
   A single choice, framed as depth ("how deep do you want to go?") not
   a technical question-count picker — each option's copy deliberately
   never states 15/35/50 out loud. That number, and the result page's
   presentation depth (see .claude/TODO), both ride along invisibly on
   the same choice via `depth`/`value` below; question count is the one
   part of this that actually drives the quiz engine (QuizSession's
   questionMode), everything else is presentation only. */
const OB_LENGTH_OPTIONS = [
  { value: "15", depth: "short", title: "Quick Read", desc: "A fast, lighter pass that hits the highlights without digging deep." },
  { value: "35", depth: "balanced", badge: "Recommended", title: "Balanced", desc: "The full Forge experience, thorough without dragging." },
  { value: "50", depth: "deep", title: "Deep Dive", desc: "Every angle explored, for the most complete and confident read Forge can give." },
];
function renderExperienceScreen(){
  setAccentColors();
  setPageTitle("Assessment");
  root.innerHTML = `
    <div class="container lp-topbar-wrap">${topBar(true)}</div>
    <div class="ns-wrap">
      <div class="ns-panel glass" id="experienceScreen">
        <div class="ns-panel-top">
          <div class="eyebrow accent">ALMOST THERE</div>
          ${obStepIndicator(3)}
        </div>
        <div class="ns-panel-body ns-panel-body--wide">
          <h2>Choose your <span class="accent-text">depth.</span></h2>
          <p>One choice, then straight into the assessment.</p>

          <div class="ob-section">
            <span class="ns-label">How deep do you want to go?</span>
            ${obCardGroup("length", OB_LENGTH_OPTIONS, pendingMeta.questionMode || "35")}
          </div>

          <div class="qz-nav2">
            <button class="btn btn-ghost" onclick="click(300);backFromExperience()">&larr; Back</button>
            <button class="btn btn-primary" onclick="confirmExperience()">Start Assessment &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  `;
  spawnAmbience();
}
// Question count and result-page presentation depth are two faces of
// the one visible choice — this is the only place that maps between
// them, so OB_LENGTH_OPTIONS stays the single source of truth.
function obDepthForLength(questionMode){
  return (OB_LENGTH_OPTIONS.find(o => o.value === questionMode) || {}).depth || "balanced";
}
function backFromExperience(){
  pendingMeta.questionMode = obCardValue("length", "35");
  pendingMeta.resultDepth = obDepthForLength(pendingMeta.questionMode);
  renderAboutScreen();
}
function confirmExperience(){
  const questionMode = obCardValue("length", "35");
  pendingMeta.questionMode = questionMode;
  pendingMeta.resultDepth = obDepthForLength(questionMode);
  click(520);
  startQuiz(pendingName, pendingMeta, questionMode);
}

/* =========================================================================
   FORGE - QUIZ
   Part of quiz.html: the 35-50 question adaptive quiz (re-rendered in
   place per question), through the brief 'forging' transition that
   computes the result and hands off to result.html.
   ========================================================================= */

let session = null;
let pendingName = "";

/* ---------------- QUIZ --------------------------------------------------*/
// questionMode ("15" | "35" | "adaptive") comes from the "Your
// Experience" onboarding step (undefined when it was skipped entirely,
// e.g. the name screen's own "Skip for now") and is the one onboarding
// preference that actually changes what the quiz engine does — see
// QuizSession's constructor/_maybeAdjustLength(). Everything else in
// `meta` (age group, gender, reason, result depth, ...) is presentation
// only and just rides along to the result page via session.meta.
function startQuiz(name, meta, questionMode){
  pendingName = name || "";
  clearQuizProgress();
  session = new QuizSession(Date.now() % 100000, pendingName, questionMode);
  session.meta = meta || {};
  renderQuiz();
}

// Matches the .qz-cards breakpoint exactly — below it the grid is a
// single stacked column, so entrance motion switches with it: horizontal
// slides only make sense when the cards actually sit side by side.
function qzIsNarrow(){ return window.innerWidth <= 860; }
// Desktop: A enters from the left, C from the right, B rises from below.
// Mobile (stacked column): all three rise gently from below instead —
// "avoid too much horizontal movement since the screen is narrow." The
// resting state is identical for all three either way (no lean, no
// offset; hover/selected only ever touch border/background/box-shadow),
// so this is purely an entrance/exit start-or-end point, never fought
// over with a static CSS transform.
function qzEnterFrom(pos){
  if (qzIsNarrow()) return { x:0, y:36, scale:.97, opacity:0 };
  if (pos === "a") return { x:-90, y:0, scale:.95, opacity:0 };
  if (pos === "c") return { x:90, y:0, scale:.95, opacity:0 };
  return { x:0, y:60, scale:.95, opacity:0 };
}
const QZ_REST_XF = { x:0, y:0, scale:1, opacity:1 };

/* Real Lucide line icons (24x24, stroke-width 2, round caps), sourced
   directly from .claude/Icons rather than hand-typed, so the path data
   matches the actual icon set exactly — a broad-enough set that a
   per-question dimension-driven pick (below) rarely has to repeat
   within the same three-card row. */
const QZ_ICONS = {
  gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  brain: '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>',
  rocket: '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>',
  tree: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  camera: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  anchor: '<path d="M12 6v16"/><path d="m19 13 2-1a9 9 0 0 1-18 0l2 1"/><path d="M9 11h6"/><circle cx="12" cy="4" r="2"/>',
  smile: '<path d="M15 10V9"/><path d="M7.084 14.302a5.12 5.12 0 0 0 9.833 0 .24.24 0 0 0-.235-.302H7.32a.24.24 0 0 0-.235.302"/><path d="M9 10V9"/><circle cx="12" cy="12" r="10"/>',
  telescope: '<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
};
// Personality-dimension name (see the question bank's own d:{...} weights)
// -> the icon that best fits it. This is what "automatically choose the
// most semantically appropriate icon" actually means here: the semantic
// category already exists in the data (every option is authored with the
// trait(s) it expresses), so icon choice reads it from there instead of
// re-guessing from free-text keywords.
const QZ_DIM_ICON = {
  socialEnergy:"users", leadership:"rocket", trust:"shield", confidence:"star",
  optimism:"sun", risk:"mountain", drive:"rocket", patience:"anchor",
  emotionalStability:"anchor", independence:"compass", planning:"book",
  logic:"brain", adaptability:"compass", curiosity:"telescope", kindness:"heart",
  empathy:"heart", resilience:"tree", selfAwareness:"lightbulb", humor:"smile",
  openMindedness:"compass", creativity:"palette", discipline:"shield",
  persistence:"mountain", responsibility:"shield",
};
const QZ_ICON_FALLBACK = ["gamepad","coffee","headphones","camera","palette","tree"];
// Picks by the option's single strongest trait first; if that icon is
// already taken elsewhere in the same row, tries the next-strongest
// trait, so the three cards in one question naturally vary even though
// several dimensions share an icon overall.
function qzIconForOption(opt, idx, used){
  const dims = Object.entries(opt.d || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  for (const [dim] of dims){
    const icon = QZ_DIM_ICON[dim];
    if (icon && !used.has(icon)){ used.add(icon); return icon; }
  }
  for (const [dim] of dims){ if (QZ_DIM_ICON[dim]) return QZ_DIM_ICON[dim]; }
  return QZ_ICON_FALLBACK[idx % QZ_ICON_FALLBACK.length];
}
function qzIconSvg(key){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${QZ_ICONS[key] || QZ_ICONS.compass}</svg>`;
}
// Animates the current question's cards/heading out (mirroring their own
// entrance direction) before handing off to whatever actually advances
// the session — used for Back/Next Question, which (unlike selecting an
// answer) don't already have the calc overlay masking the swap.
function qzExitThenRender(advance){
  if (reducedMotion()){ advance(); return; }
  const row = document.getElementById("answerRow");
  const heading = document.getElementById("qzQuestion");
  if (!row){ advance(); return; }
  row.querySelectorAll(".qz-card").forEach((el) => {
    qzSpring(el, QZ_REST_XF, qzEnterFrom(el.dataset.pos), { stiffness:220, damping:24 });
  });
  if (heading){
    heading.style.transition = "opacity .22s var(--ease), transform .22s var(--ease)";
    heading.style.opacity = "0";
    heading.style.transform = "translateY(-10px)";
  }
  setTimeout(advance, 220);
}
function renderQuiz(){
  setPageTitle("Assessment");
  if (!session){ session = new QuizSession(Date.now() % 100000, pendingName); }
  const q = session.current();
  if (!q){ renderForging(); return; }
  const { current, total, max } = session.progress();
  // Adaptive mode measures progress against the absolute ceiling (max,
  // MAX_QUESTIONS) rather than the current target, since that target
  // itself can extend mid-quiz — basing the percentage on it would make
  // it visibly jump backward the instant confidence comes up short and
  // the assessment grows by one question. Fixed modes ("15"/"35") never
  // extend, so measuring against their own total instead reads more
  // naturally as "how far through your chosen length."
  const modeLabel = session.questionMode === "15" ? "Fast" : session.questionMode === "35" ? "Standard" : session.questionMode === "50" ? "Deep" : "Adaptive";
  const pctDenom = session.questionMode === "adaptive" ? max : total;
  const pctDone = Math.round((current / pctDenom) * 100);
  const existing = session.currentAnswer();
  // Answers always come in threes (see the question data). A/B/C map
  // straight to the three entrance directions: a=left, b=bottom, c=right.
  const posName = (i) => i === 0 ? "a" : i === 2 ? "c" : "b";
  const usedIcons = new Set();
  root.innerHTML = `
    <div class="container lp-topbar-wrap">${topBar(true)}</div>
    <div class="qz-wide">
      <div class="qz-progress2">
        <span class="qz-progress2-num"><span class="accent">${String(current + 1).padStart(2, "0")}</span> <span class="dim">/ ${total}</span></span>
      </div>
      <div class="qz-progress2-meta" style="text-align:center; margin-bottom:8px;">${modeLabel} &bull; <span class="count-up" data-target="${pctDone}" data-suffix="%">0%</span></div>
      <div class="qz-question2" id="qzQuestion">${q.text}</div>
      <div class="qz-cards" id="answerRow" role="listbox" aria-label="Answer options">
        ${q.options.map((opt, i) => `
          <button class="qz-card ${existing && existing.optionIndex === i ? "selected" : ""}" role="option" data-pos="${posName(i)}" onclick="selectOption(${i})">
            <span class="qz-card-letter">${String.fromCharCode(65 + i)}</span>
            <span class="qz-card-dot"></span>
            <span class="qz-card-icon">${qzIconSvg(qzIconForOption(opt, i, usedIcons))}</span>
            <span class="qz-card-text">${opt.text}</span>
          </button>`).join("")}
      </div>
      <div class="qz-nav2">
        <button class="btn btn-ghost" onclick="goBackQuestion()" ${session.canGoBack() ? "" : "disabled"}>&larr; Previous</button>
        <button class="btn btn-primary" onclick="continueForward()" ${existing ? "" : "disabled"}>Next Question &rarr;</button>
      </div>
    </div>
  `;
  spawnAmbience();
  attachKeyHandler();
  initCountUps(root);
  // Desktop: B rises from below and settles first (the anchor
  // grounding); A/C follow 80ms later sliding in from their own side —
  // "pieces assembling around the center." Mobile: the cards are just a
  // top-to-bottom stack, so they settle in that same order instead,
  // "one after another" rather than center-out.
  const narrow = qzIsNarrow();
  document.querySelectorAll(".qz-card").forEach((el, i) => {
    const pos = el.dataset.pos;
    if (reducedMotion()){ qzApplyTransform(el, QZ_REST_XF); return; }
    const delay = narrow ? i * 90 : (pos === "b" ? 0 : 80);
    qzApplyTransform(el, qzEnterFrom(pos));
    setTimeout(() => qzSpring(el, qzEnterFrom(pos), QZ_REST_XF, { stiffness: 210, damping: 22 }), delay);
  });
}

function attachKeyHandler(){
  document.onkeydown = (e) => {
    if (["1","2","3"].includes(e.key)){
      const idx = parseInt(e.key, 10) - 1;
      const opts = document.querySelectorAll(".qz-card");
      if (opts[idx]) selectOption(idx);
    } else if (e.key === "ArrowLeft" && session.canGoBack()){
      goBackQuestion();
    } else if (e.key === "ArrowRight" && session.canSkipForward()){
      continueForward();
    }
  };
}

function goBackQuestion(){
  click(300);
  qzExitThenRender(() => { session.goBack(); renderQuiz(); });
}
function continueForward(){
  click(460);
  qzExitThenRender(() => {
    session.goForward();
    if (session.isComplete()) renderForging();
    else renderQuiz();
  });
}

function selectOption(idx){
  const opts = document.querySelectorAll(".qz-card");
  opts.forEach(o => o.classList.remove("selected"));
  if (opts[idx]){
    opts[idx].classList.add("selected");
    // "Lock in" snap: a quick scale-up-then-settle spring on top of the
    // card's own resting position (x/y never move) — the same spring
    // used for entrance, just a shorter, snappier trip.
    qzSpring(opts[idx], { ...QZ_REST_XF, scale:1.06 }, QZ_REST_XF, { stiffness:260, damping:16 });
  }
  click(420 + idx * 60);
  session.answer(idx);
  saveQuizProgress();
  // Hold on the locked-in card for ~250ms before advancing — selecting
  // and immediately jumping away reads as twitchy; a short, deliberate
  // pause is what makes the choice feel registered rather than skipped
  // past.
  setTimeout(() => {
    showCalcOverlay(1, () => {
      if (session.isComplete()) renderForging();
      else renderQuiz();
    });
  }, 250);
}


/* ---------------- FORGING (brief transition + compute) -----------------*/
function renderForging(){
  document.onkeydown = null;
  const lines = ["Forging Personality...", "Analyzing Patterns...", ...pickLines(2), "Almost Finished..."];
  root.innerHTML = `
    <div class="forging">
      <div class="calc-bars"><span></span><span></span><span></span><span></span></div>
      <h2>Putting it together</h2>
      <p id="forge-line">${lines[0]}</p>
    </div>`;
  let i = 0;
  const int = setInterval(() => {
    i++;
    const el = document.getElementById("forge-line");
    if (el && lines[i]) el.textContent = lines[i];
  }, 420);
  setTimeout(() => {
    clearInterval(int);
    const result = computeResult(session);
    sessionStorage.setItem("pf_fresh_result", JSON.stringify(result));
    location.href = "result.html";
  }, 2200);
}

/* =========================================================================
   FORGE - RESULT
   result.html's own page: the result screen (radar/QR canvases, PNG
   export, history timeline), plus the legacy PF1 upgrade-quiz detour
   (still using the older .option/.options markup from question.css,
   which is why this page also loads that file).
   ========================================================================= */

let lastResult = null;
let careersExpanded = false;
let funStatsOpen = false;

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
function resultIcon(key, tint){
  const t = tint || RESULT_ICON_TINTS[resultIconTintIdx++ % RESULT_ICON_TINTS.length];
  const style = `--icon-bg:color-mix(in srgb, var(--${t}) 16%, transparent);--icon-fg:var(--${t})`;
  return `<span class="bento-icon" style="${style}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${RESULT_ICONS[key] || RESULT_ICONS.sparkles}</svg></span>`;
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
  const idAttr = opts.id ? ` id="${opts.id}"` : "";
  const i = resultCardIdx++;
  return `
      <div class="section bento-card util-card${span}"${idAttr} style="--i:${i}">
        <div class="bento-head">${resultIcon(iconKey, opts.tint)}<h3>${title}</h3></div>
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
  resultDetailRegistry[id] = { iconKey, title, tint: opts.tint, html: detailHtml, onOpen: opts.onOpen };
  const span = opts.span ? ` card-span-${opts.span}` : "";
  const i = resultCardIdx++;
  const num = String(i + 1).padStart(2, "0");
  const chips = resultChips(highlights);
  const bignum = opts.bigNumber
    ? `<div class="ov-bignum"><span class="val">${opts.bigNumber.val}</span><span class="lbl">${opts.bigNumber.label}</span></div>`
    : "";
  const arrow = `<span class="ov-arrow" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14 14 6M8 6h6v6"/></svg></span>`;
  return `
      <button type="button" class="section bento-card ov-card${span}" id="ov-${id}" style="--i:${i}" onclick="openResultDetail('${id}')" aria-haspopup="dialog">
        <span class="bento-num">${num}</span>
        <div class="bento-head">${resultIcon(iconKey, opts.tint)}<h3>${title}</h3>${arrow}</div>
        ${bignum}
        ${subtitle ? `<p class="ov-subtitle">${subtitle}</p>` : ""}
        ${chips ? `<div class="ov-chip-row">${chips}</div>` : ""}
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

function ensureResultDetailOverlay(){
  if (document.getElementById("resultDetailOverlay")) return;
  const el = document.createElement("div");
  el.id = "resultDetailOverlay";
  el.className = "detail-overlay";
  el.innerHTML = `
    <div class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detailHeadTitle">
      <div class="detail-head">
        <div class="detail-head-icon" id="detailHeadIcon"></div>
        <h2 id="detailHeadTitle"></h2>
        <button type="button" class="detail-close" onclick="closeResultDetail()" aria-label="Close">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
        </button>
      </div>
      <div class="detail-body" id="resultDetailBody"></div>
    </div>`;
  el.addEventListener("click", (e) => { if (e.target === el) closeResultDetail(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && resultDetailOpenId) closeResultDetail(); });
  document.body.appendChild(el);
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
  body.scrollTop = 0;
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

      <div class="hero-row">
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
            <p class="ingot-sub">${r.subProfile}</p>
            <div class="extras-row" style="justify-content:flex-start">
              <span class="tag">${r.extras.animal}</span>
              <span class="tag">${r.extras.element}</span>
              <span class="tag">${r.extras.symbol} Symbol</span>
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
        <div class="export-row" style="justify-content:flex-start;margin-top:20px">
          <button class="btn btn-ghost" onclick="exportPNG('story')">Export Story</button>
          <button class="btn btn-ghost" onclick="exportPNG('post')">Export Post</button>
          <button class="btn btn-ghost" onclick="window.print()">Save as PDF</button>
          <button class="btn btn-ghost" onclick="copyShareLink()">Copy Link</button>
          <button class="btn btn-ghost" onclick="copyCode()">Copy Code</button>
          <button class="btn btn-ghost" onclick="openResultDetail('qr')">Share QR</button>
        </div>
      </div>

      <div class="hero-side-grid">
      ${resultDetailCard("summary", "sparkles", "In Summary", a.description,
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
        { span: "3of12", tint: "accent" })}

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
        { span: "3of12" })}

      ${resultDetailCard("mindmap", "radar", "Mind Map", "A visual view of your key dimensions.", topDims,
        `
        <canvas id="radar" width="520" height="520" role="img" aria-label="Radar chart of 25 hidden personality dimensions"></canvas>
        <div class="radar-legend">25 dimensions, measured from your answers, never shown to you during the test</div>
        <p style="margin-top:14px">Your strongest reads are ${topDims.slice(0,3).join(", ")}. The full shape (not just the top few points) is what actually separates ${a.name} from a similar-looking type.</p>
        `,
        { span: "3of12", onOpen: () => drawRadar(document.getElementById("radar"), r.normDims, a.colors[0]) })}

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
        { span: "2of12" })}
      </div>
      </div>

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
        { span: "2of12" })}

      ${resultDetailCard("motivation", "gem", "Motivation", r.motivation.name,
        Object.entries(r.motivationFacets).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k} ${v}%`),
        `
        <p class="center-note" style="text-align:left;margin-top:0">What seems to move you when you actually decide something, drawn from your measured evidence, not a validated instrument.</p>
        <div class="card" style="margin-top:12px"><h4>${r.motivation.name}</h4></div>
        <div class="grid-2" style="margin-top:12px">
          ${Object.entries(r.motivationFacets).map(([k,v]) => `<div class="card"><h4>${k}</h4><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v}%"></div></div></div>`).join("")}
        </div>
        `,
        { span: "2of12" })}

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
        { span: "3of12" })}

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
        { span: "2of12" })}

      </div>

      <div class="result-grid" style="margin-top:16px">
      ${resultUtilityCard("users", "Compare with someone else", `
        <p class="hint">Paste a friend's Forge code to see how well you'd actually get along.</p>
        <div class="row">
          <input type="text" id="inlineCompareCode" placeholder="Name-PF1-...">
          <button class="btn btn-accent" onclick="runInlineCompare()">Compare</button>
        </div>
        <div id="inlineCompareOut"></div>
      `, { span: "2of12" })}

      </div>

      <div id="deepReportSections" class="deep-wrap${isLightReport ? " deep-collapsed" : ""}">
      <div class="result-grid" style="margin-top:0">

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
        previousTimeline ? ["confidence","leadership","creativity"].map(d => `${DIM_LABELS[d]} ${pct(previousTimeline.normDims?previousTimeline.normDims[d]:0)}→${pct(r.normDims[d])}`) : ["Retake later to start tracking"],
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
        { span: "3of12" })}

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
        { span: "2of12" })}

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
        <div class="careers-toggle" style="margin:16px 0 10px"><button onclick="toggleFunStats()">${funStatsOpen ? "Hide" : "Show"} the fun stats</button></div>
        ${funStatsOpen ? `
        <p class="center-note" style="text-align:left;margin-top:0">Playful, not a real assessment, unlike everything above.</p>
        <div class="grid-4">
          ${Object.entries(r.funStats).map(([k,v]) => `
            <div class="stat-tile">
              <div class="stat-val count-up" data-target="${v}">0</div>
              <div class="stat-label">${k}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${v}%"></div></div>
            </div>`).join("")}
        </div>` : ""}
        `,
        { span: "3of12" })}

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
        { span: "2of12" })}

      ${resultDetailCard("ranking", "listOrdered", "Full Ranking & Extras", "How you scored against all 30 archetypes.",
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
        <p class="center-note" style="text-align:left;margin-top:12px">A playful, dramatic reading of the same evidence above, not a real assessment. Flip it to see the other side.</p>
        <div class="sinvirtue-wrap">
          <canvas id="sinVirtueRadar"></canvas>
          <button class="sinvirtue-flip" id="sinVirtueFlipBtn" onclick="flipSinVirtue()" aria-label="Flip between Sins and Virtues">Flip</button>
        </div>
        <div class="sinvirtue-caption" id="sinVirtueCaption">Seven Deadly Sins</div>
        `,
        { span: "3of12", onOpen: () => { sinVirtueMode = "sin"; drawSinVirtueRadar(document.getElementById("sinVirtueRadar"), r.sinVirtue, sinVirtueMode, a.colors[0]); } })}

      </div>
      </div>

      ${isLightReport ? resultUtilityCard("sparkle", "Want to dive deeper?", `
        <p>You're looking at the ${depthLabel} read. Unlock the full Deep Analysis of this exact result, same answers, nothing to retake.</p>
        <button class="btn btn-primary" onclick="unlockFullReport()">Unlock full report &rarr;</button>
      `, { span: "2of12", id: "unlockSection", tint: "accent" }) : ""}

      <div class="section">
        <p class="center-note">Everything stays on your device. No servers, no accounts, no data collection. Your personality belongs to you.</p>
      </div>

      <div class="footer-nav">
        <button onclick="click(400);goToNameScreen()">Retake the test</button>
        <button onclick="click(400);navigate('compare')">Compare with someone</button>
      </div>
    </div>
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

// Both of these toggle state that only affects an already-registered
// detail card's content (Career's "show all", the fun-stats reveal
// folded into More About You) — a full renderResult() recomputes
// everything including resultDetailRegistry, and refreshOpenResultDetail()
// (called at the end of renderResult()) re-pours the freshly-registered
// HTML for whichever card is currently open back into the still-open
// panel, so the overlay never has to close and reopen for this.
function toggleFunStats(){
  funStatsOpen = !funStatsOpen;
  renderResult();
}

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
  url.pathname = url.pathname.replace(/[^/]*$/, "index.html");
  url.search = "";
  url.searchParams.set("code", code);
  return url.toString();
}
function copyShareLink(){
  const link = shareURLFor(lastResult.code);
  navigator.clipboard?.writeText(link).then(() => {
    click(700); alert("Share link copied. Opening it loads this exact result.");
  }).catch(() => alert(link));
}
function copyCode(){
  navigator.clipboard?.writeText(lastResult.code).then(() => {
    click(700); alert("Personality code copied.");
  }).catch(() => alert(lastResult.code));
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
  compareState = { profileA: mine, archA: lastResult.archetype, nameA: lastResult.name, profileB: other, archB: other.archetype, nameB: other.name, target: "inlineCompareOut" };
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
  const fontSize = Math.max(9, Math.min(11, containerWidth / 42));
  ctx.font = `${fontSize}px Manrope, sans-serif`;
  let maxLabelWidth = 0;
  labels.forEach(l => { maxLabelWidth = Math.max(maxLabelWidth, ctx.measureText(l).width); });

  const available = Math.min(420, containerWidth - 8);
  const margin = Math.min(available * 0.34, maxLabelWidth + 22);
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
    const lx = cx + cosA * (R + 14), ly = cy + Math.sin(angle) * (R + 14);
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
      const lx = cx + cosA * (R + 14), ly = cy + Math.sin(angle) * (R + 14);
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
   chart. Respects prefers-reduced-motion (snaps instantly instead). */
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
  const cx = size/2, cy = size/2, R = size/2 - 54;

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

/* ---------------- PNG export (canvas render of a share card) -----------*/
function exportPNG(kind){
  const r = lastResult; const a = r.archetype;
  const dims = kind === "story" ? { w: 1080, h: 1920 } : { w: 1080, h: 1350 };
  const canvas = document.createElement("canvas");
  canvas.width = dims.w; canvas.height = dims.h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0F1117";
  ctx.fillRect(0,0,dims.w,dims.h);
  const glow = ctx.createRadialGradient(dims.w/2, dims.h*0.22, 40, dims.w/2, dims.h*0.22, dims.w*0.7);
  glow.addColorStop(0, hexToRgba(a.colors[0], 0.22)); glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow; ctx.fillRect(0,0,dims.w,dims.h);
  const glow2 = ctx.createRadialGradient(dims.w*0.85, dims.h*0.75, 40, dims.w*0.85, dims.h*0.75, dims.w*0.6);
  glow2.addColorStop(0, hexToRgba(a.colors[1], 0.14)); glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2; ctx.fillRect(0,0,dims.w,dims.h);

  ctx.textAlign = "center";
  ctx.fillStyle = "#A7B0C2";
  ctx.font = "600 26px 'Space Grotesk', sans-serif";
  ctx.fillText("FORGE", dims.w/2, dims.h*0.12);

  if (r.name){
    ctx.font = "500 30px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#F8FAFC";
    ctx.fillText(r.name.toUpperCase(), dims.w/2, dims.h*0.18);
  }

  ctx.font = "700 90px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#F8FAFC";
  ctx.fillText(a.icon, dims.w/2, dims.h*0.30);

  ctx.font = "700 60px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#F8FAFC";
  wrapText(ctx, a.name, dims.w/2, dims.h*0.38, dims.w*0.85, 66);

  ctx.font = "italic 400 28px 'Manrope', sans-serif";
  ctx.fillStyle = a.colors[0];
  ctx.fillText(a.title, dims.w/2, dims.h*0.44);

  ctx.font = "400 26px 'Manrope', sans-serif";
  ctx.fillStyle = "#CBD5E1";
  wrapText(ctx, a.description, dims.w/2, dims.h*0.52, dims.w*0.78, 38);

  const topTraits = Object.entries(r.traits).sort((x,y)=>y[1]-x[1]).slice(0,3);
  const statY = dims.h*0.7;
  const spacing = dims.w/4;
  const statColors = [a.colors[0], a.colors[1], "#A7B0C2"];
  topTraits.forEach(([k,v], i) => {
    const x = dims.w/2 + (i-1)*spacing;
    ctx.font = "700 50px 'Space Grotesk', sans-serif"; ctx.fillStyle = statColors[i] || "#F8FAFC";
    ctx.fillText(v, x, statY);
    ctx.font = "400 18px 'Manrope', sans-serif"; ctx.fillStyle = "#A7B0C2";
    wrapText(ctx, k, x, statY + 30, spacing - 10, 20);
  });

  ctx.font = "400 22px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#6B7385";
  ctx.fillText(r.code, dims.w/2, dims.h*0.95);
  ctx.font = "400 18px 'Manrope', sans-serif";
  ctx.fillStyle = "#4B5163";
  ctx.fillText("Generated with Forge", dims.w/2, dims.h*0.975);

  const link = document.createElement("a");
  link.download = `forge-${kind}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  click(760);
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text).split(" ");
  let line = "", lines = [];
  words.forEach(w => {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = w + " "; }
    else line = test;
  });
  lines.push(line);
  const startY = y - ((lines.length-1)*lineHeight)/2;
  lines.forEach((l,i) => ctx.fillText(l.trim(), x, startY + i*lineHeight));
}

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

/* ---------------- COMPARE ------------------------------------------------*/
function renderCompare(){
  setAccentColors();
  setPageTitle("Compare");
  const myCode = localStorage.getItem("pf_last_code") || "";
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
  compareState = { profileA: a, archA: a.archetype, nameA: a.name, profileB: b, archB: b.archetype, nameB: b.name, target: "compareOut" };
  click(420);
  showCompatibilityLoading(out, () => {
    out.innerHTML = renderCompareResult();
    initCountUps(out);
  });
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
  // nameA/nameB come straight out of pasted PF-codes (yours and
  // whoever's code you're comparing against) — never trust either as HTML.
  const A = obEsc(nameA) || "Person A", B = obEsc(nameB) || "Person B";
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
  const a = decoded.archetype;
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

/* =========================================================================
   FORGE - LEGAL (Terms of Service & Credits)
   legal.html's own page. Config-driven: every array below drives a
   rendered section further down, so adding a font/dependency/credit/
   version-history entry later means editing one array here, no HTML to
   touch. Was a fully standalone page (own inline <style>/<script>,
   duplicating the whole design system) before being folded into the
   shared css/pages.css + js/pages.js structure like every other screen.
   ========================================================================= */

// Bump this (and add a row to LEGAL_VERSION_HISTORY) whenever this page's
// legal content, credits, or structure meaningfully changes.
const LEGAL_VERSION = "1.1.0";
const LEGAL_LAST_UPDATED = "September 3, 2026";

const LEGAL_VERSION_HISTORY = [
  { version: "1.0.0", date: "September 3, 2026", notes: "Initial Terms of Service, privacy notes, and third-party credits published." },
  { version: "1.1.0", date: "September 3, 2026", notes: "Generalized profile-code wording to cover future PF formats beyond PF1/PF2, added compliance, indemnification, DMCA, export control, dispute resolution, force majeure, severability, entire agreement, and assignment clauses, and revised wording throughout." }
];

// Every font actually used anywhere in Forge.
const LEGAL_FONTS = [
  {
    name: "Cabinet Grotesk",
    role: "Display &amp; body typeface, used for headings, buttons, and primary text",
    source: "Fontshare (Indian Type Foundry)",
    homepage: "https://www.fontshare.com/fonts/cabinet-grotesk",
    license: "Fontshare Free Font License",
    attribution: "Not required"
  },
  {
    name: "JetBrains Mono",
    role: "Monospace typeface, used for labels, codes, timestamps, and eyebrows",
    source: "Google Fonts",
    homepage: "https://fonts.google.com/specimen/JetBrains+Mono",
    license: "SIL Open Font License 1.1",
    attribution: "Not required (permitted under the OFL)"
  }
];

// Every third-party library, framework, or delivery service actually used
// by Forge. Rows marked "Original Forge code" are listed here for
// completeness, to make clear what was checked and confirmed to be
// in-house rather than silently omitted.
const LEGAL_THIRD_PARTY = [
  { name: "Google Fonts", purpose: "Webfont delivery for JetBrains Mono", homepage: "https://fonts.google.com/", license: "Hosting service; the font itself keeps its own license (see Fonts above)", attribution: "See Fonts above" },
  { name: "Fontshare", purpose: "Webfont delivery for Cabinet Grotesk", homepage: "https://www.fontshare.com/", license: "Hosting service; the font itself keeps its own license (see Fonts above)", attribution: "See Fonts above" },
  { name: "QR code generator", purpose: "Renders the scannable QR code for shared profile links", homepage: "N/A", license: "Original Forge code (implements the public ISO/IEC 18004 QR standard, no third-party library used)", attribution: "Not applicable" },
  { name: "Trait radar chart", purpose: "Canvas-drawn radar visualization on the results screen", homepage: "N/A", license: "Original Forge code", attribution: "Not applicable" },
  { name: "Interface icon set", purpose: "Every UI icon (home, theme, sound, navigation, etc.)", homepage: "N/A", license: "Original Forge artwork, no external icon library used", attribution: "Not applicable" }
];

// Music credit. This is the one block to edit if the background track ever
// changes. Set trackConfirmed to true once the fields below are verified
// against the source page, and the placeholder badge on the page
// disappears automatically.
const LEGAL_MUSIC_CREDIT = {
  trackConfirmed: false,
  trackName: "See source page for exact track title",
  composer: "See source page for composer credit",
  sourceSite: "DOVA-SYNDROME",
  sourceSiteUrl: "https://dova-s.jp/",
  trackPageUrl: "https://dova-s.jp/bgm/detail/15575",
  license: "DOVA-SYNDROME Audio Source Usage License",
  licenseSummary: "Free for personal and commercial use, no royalties or usage fees, and no copyright/credit notice is legally required. Rights to the track remain with its original composer. Individual composers may set additional terms on top of this baseline license, which take precedence where they apply.",
  attributionRequired: false,
  usageStatement: "Used by Forge as a soft, looping background ambience (assets/BG.mp3) that plays only if the person using the app leaves sound on. Forge does not modify, resell, redistribute, or claim ownership of this track. It is used strictly as background music within the app, consistent with the source license above."
};

// Open-source dependency groups. Empty today by design (see the Open
// Source Software section) — append { name, homepage, license, notice }
// objects into the relevant array below as dependencies are added.
const LEGAL_OPEN_SOURCE_GROUPS = [
  { license: "MIT", entries: [] },
  { license: "Apache License 2.0", entries: [] },
  { license: "BSD", entries: [] },
  { license: "Creative Commons", entries: [] },
  { license: "Other", entries: [] }
];

// Table of contents. Kept as data so adding a legal section later means
// adding one line here, not hand-editing a nav list.
const LEGAL_TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "about", label: "2. About Forge" },
  { id: "eligibility", label: "3. Eligibility" },
  { id: "privacy", label: "4. Privacy" },
  { id: "local-storage", label: "5. Local Storage" },
  { id: "offline", label: "6. Offline Functionality" },
  { id: "responsibilities", label: "7. User Responsibilities" },
  { id: "shared-codes", label: "8. Shared Profile Codes" },
  { id: "generated-results", label: "9. Generated Results" },
  { id: "intellectual-property", label: "10. Intellectual Property" },
  { id: "third-party-assets", label: "11. Third-Party Assets" },
  { id: "music-attribution", label: "12. Music Attribution" },
  { id: "open-source", label: "13. Open Source Software" },
  { id: "no-warranty", label: "14. No Warranty" },
  { id: "liability", label: "15. Limitation of Liability" },
  { id: "termination", label: "16. Termination of Use" },
  { id: "compliance", label: "17. Compliance with Laws" },
  { id: "indemnification", label: "18. Indemnification" },
  { id: "dmca", label: "19. DMCA & Copyright" },
  { id: "export-control", label: "20. Export Control" },
  { id: "dispute-resolution", label: "21. Dispute Resolution" },
  { id: "force-majeure", label: "22. Force Majeure" },
  { id: "severability", label: "23. Severability" },
  { id: "entire-agreement", label: "24. Entire Agreement" },
  { id: "assignment", label: "25. Assignment & Waiver" },
  { id: "future-updates", label: "26. Future Updates" },
  { id: "governing-law", label: "27. Governing Law" },
  { id: "contact", label: "28. Contact Information" },
  { id: "version-history", label: "29. Version History" },
  { id: "last-updated", label: "30. Last Updated" },
  { id: "third-party-credits", label: "Third-Party Credits" },
  { id: "fonts-credits", label: "Fonts" },
  { id: "icons-graphics", label: "Icons & Graphics" },
  { id: "music-credits", label: "Music Credits" },
  { id: "open-source-credits", label: "Open Source Notices" }
];

function legalEsc(str){
  return String(str == null ? "" : str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function legalLinkOrDash(url){
  if (!url || url === "N/A" || url === "-") return "N/A";
  return `<a href="${legalEsc(url)}" target="_blank" rel="noopener">${legalEsc(url.replace(/^https?:\/\//, ""))}</a>`;
}
const LEGAL_CHEVRON = `<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 8l5 5 5-5"/></svg>`;

function renderLegalTOC(){
  return LEGAL_TOC.map(item => `<a href="#${item.id}">${legalEsc(item.label)}</a>`).join("");
}
function renderLegalVersionHistory(){
  return LEGAL_VERSION_HISTORY.map(v => `<div class="version-row"><span class="v-tag">v${legalEsc(v.version)}</span><span class="v-date">${legalEsc(v.date)}</span><span class="v-note">${legalEsc(v.notes)}</span></div>`).join("");
}
function renderLegalFonts(){
  return LEGAL_FONTS.map(f => `<div class="credit-item"><h4>${legalEsc(f.name)}</h4><dl>` +
    `<dt>Role</dt><dd>${f.role}</dd>` +
    `<dt>Source</dt><dd>${legalEsc(f.source)}</dd>` +
    `<dt>Homepage</dt><dd>${legalLinkOrDash(f.homepage)}</dd>` +
    `<dt>License</dt><dd>${legalEsc(f.license)}</dd>` +
    `<dt>Attribution</dt><dd>${legalEsc(f.attribution)}</dd>` +
    `</dl></div>`).join("");
}
function renderLegalThirdParty(){
  return LEGAL_THIRD_PARTY.map(d => `<div class="credit-item"><h4>${legalEsc(d.name)}</h4><dl>` +
    `<dt>Purpose</dt><dd>${legalEsc(d.purpose)}</dd>` +
    `<dt>Homepage</dt><dd>${legalLinkOrDash(d.homepage)}</dd>` +
    `<dt>License</dt><dd>${legalEsc(d.license)}</dd>` +
    `<dt>Attribution</dt><dd>${legalEsc(d.attribution)}</dd>` +
    `</dl></div>`).join("");
}
function renderLegalOpenSource(){
  return LEGAL_OPEN_SOURCE_GROUPS.map(group => {
    const body = group.entries.length
      ? `<div class="credit-grid">${group.entries.map(e => `<div class="credit-item"><h4>${legalEsc(e.name)}</h4><dl>` +
          `<dt>Homepage</dt><dd>${legalLinkOrDash(e.homepage)}</dd>` +
          `<dt>License</dt><dd>${legalEsc(e.license)}</dd>` +
          (e.notice ? `<dt>Notice</dt><dd>${legalEsc(e.notice)}</dd>` : "") +
          `</dl></div>`).join("")}</div>`
      : `<p class="hint" style="margin:0 0 4px;">No ${legalEsc(group.license)}-licensed libraries are currently bundled with Forge.</p>`;
    return `<details class="legal-accordion" style="border:1px solid var(--border); border-radius: var(--radius-md); margin-bottom:8px;">` +
      `<summary style="padding:12px 14px; font-size:13.5px;">${legalEsc(group.license)} <span class="count">(${group.entries.length})</span>${LEGAL_CHEVRON}</summary>` +
      `<div class="legal-accordion-body" style="padding:0 14px 14px;">${body}</div></details>`;
  }).join("");
}
function legalOpenSourceTotal(){
  return LEGAL_OPEN_SOURCE_GROUPS.reduce((sum, g) => sum + g.entries.length, 0);
}
function renderLegalMusicCredit(){
  const m = LEGAL_MUSIC_CREDIT;
  const badge = m.trackConfirmed ? "" : `<span class="legal-placeholder" style="margin-bottom:8px;">Track title &amp; composer pending confirmation from source page</span><br>`;
  return `<div class="music-card">${badge}` +
    `<span class="track-name">${legalEsc(m.trackName)}</span>` +
    `<span class="track-meta">Composer: ${legalEsc(m.composer)}</span>` +
    `<p><strong>Source:</strong> ${legalEsc(m.sourceSite)}: <a href="${legalEsc(m.trackPageUrl)}" target="_blank" rel="noopener">${legalEsc(m.trackPageUrl)}</a></p>` +
    `<p><strong>License:</strong> ${legalEsc(m.license)}. ${legalEsc(m.licenseSummary)}</p>` +
    `<p><strong>Attribution required:</strong> ${m.attributionRequired ? "Yes" : "No, but credited here anyway"}</p>` +
    `<p><strong>Usage in Forge:</strong> ${legalEsc(m.usageStatement)}</p>` +
    `<p>Forge claims no ownership of this track. Full license terms are available at <a href="${legalEsc(m.sourceSiteUrl)}" target="_blank" rel="noopener">${legalEsc(m.sourceSiteUrl)}</a>.</p>` +
    `</div>`;
}

function renderLegal(){
  setPageTitle("Terms of Service");
  root.innerHTML = `
    <div class="lp-bg-flatten" aria-hidden="true"></div>
    <div class="container legal-screen">

      <div class="lp-topbar-wrap">${topBar(false)}</div>

      <header class="legal-hero">
        <div class="eyebrow accent">LEGAL &amp; CREDITS</div>
        <h1>Terms of Service</h1>
        <p class="legal-sub">The rules, privacy notes, and full third-party credits behind Forge, written so they're actually worth reading.</p>
        <div class="legal-meta">
          <span class="eyebrow">Version ${LEGAL_VERSION}</span>
          <span class="eyebrow">Last updated ${LEGAL_LAST_UPDATED}</span>
        </div>
      </header>

      <section class="legal-callout" aria-labelledby="disclaimer-heading">
        <div class="eyebrow accent">READ THIS FIRST</div>
        <h2 id="disclaimer-heading">Forge is not a medical or clinical tool</h2>
        <p>Forge is a personality <em>exploration</em> tool, built for curiosity, self-reflection, and comparing notes with friends. It is not a medical assessment, not psychological advice, not psychiatric advice, and not a diagnostic tool of any kind. It does not replace a licensed doctor, therapist, psychiatrist, or counselor, and nothing it generates should be used to make medical or mental-health decisions.</p>
        <ul>
          <li>Any resemblance to MBTI, DISC, the Enneagram, Big Five, or similar frameworks in Forge's output is an interpretive projection generated by <strong>Forge's own personality model</strong>. It is not an official, licensed, or certified assessment from any of those systems.</li>
          <li>Compatibility results describe a modeled interaction between two profiles. They are a fun comparison, not a guarantee, prediction, or professional judgment about any real relationship.</li>
        </ul>
        <p>If you're going through something that a quiz can't help with, please talk to a real, qualified professional.</p>
      </section>

      <div class="legal-layout">

        <nav class="legal-toc glass" aria-label="Table of contents">
          <div class="legal-toc-title">On this page</div>
          <div>${renderLegalTOC()}</div>
        </nav>

        <details class="legal-toc-mobile glass legal-accordion">
          <summary>On this page ${LEGAL_CHEVRON}</summary>
          <div class="legal-accordion-body">${renderLegalTOC()}</div>
        </details>

        <main class="legal-content">

          <section class="legal-section" id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>By opening or using Forge (officially <strong>PersonaForge</strong>, referred to throughout as "Forge" or "the app"), you agree to these Terms of Service. If you don't agree with them, please don't use Forge. These terms apply from the moment you first load the app, and continue to apply every time you come back.</p>
          </section>

          <section class="legal-section" id="about">
            <h2>2. About Forge</h2>
            <p>Forge is an adaptive, scenario-based personality exploration app. It asks a series of questions, adapts the next question based on your previous answers, and turns the result into a compact personality code we call a <strong>PF-code</strong>, shown as <code>PF*</code> since Forge's encoding format is expected to grow over time (starting with <code>PF1</code> and <code>PF2</code>, with more added as the model evolves), along with a visual trait breakdown, an archetype, and optional career and compatibility notes.</p>
            <p>Forge runs <strong>entirely inside your browser</strong>. There is no account system, no backend server, and no analytics of any kind. Everything described in these terms reflects that architecture.</p>
          </section>

          <section class="legal-section" id="eligibility">
            <h2>3. Eligibility</h2>
            <p>By using Forge, you confirm that you have the legal capacity to agree to these terms where you live. Forge doesn't collect personal information and has no age-verification mechanism of any kind, so it also has no way to enforce a minimum age on its own. If the laws where you live require a certain age, or a guardian's consent, to use interactive tools like this one, it's your responsibility to meet that requirement before using Forge, and a parent or guardian's responsibility to supervise use by anyone who hasn't reached it.</p>
          </section>

          <section class="legal-section" id="privacy">
            <h2>4. Privacy</h2>
            <p>Forge is built to keep your data on your own device rather than on a server, because there isn't one. Specifically:</p>
            <ul>
              <li>No account, sign-up, email address, or personal profile is ever requested.</li>
              <li>No analytics, tracking pixels, or third-party data collection scripts run anywhere in the app.</li>
              <li>Your quiz answers, results, and preferences are stored locally in your browser (see <a href="#local-storage">Local Storage</a> below) and are never transmitted anywhere by Forge itself.</li>
            </ul>
            <p>One thing worth knowing: if you type a name into Forge before or after your assessment, that name can end up embedded in your result's shareable PF-code, link, or QR code, since that's how Forge lets you share a labeled result with someone else. Don't enter a name, or anything else, that you wouldn't want visible to anyone you share that link or code with.</p>
          </section>

          <section class="legal-section" id="local-storage">
            <h2>5. Local Storage</h2>
            <p>Forge uses your browser's <code>localStorage</code> to remember a small amount of information between visits, entirely on your device:</p>
            <ul>
              <li>Your light/dark theme preference</li>
              <li>Whether ambient sound is on or off</li>
              <li>Your most recently generated result code, so it can greet you with it on return visits</li>
              <li>An in-progress quiz session, so you can pick up where you left off if you close the tab mid-assessment</li>
              <li>A short history of your recent results (up to the last 10), used to power comparisons</li>
            </ul>
            <p>This data is specific to the browser and device you're using. It doesn't sync across devices, and clearing your browser's site data for Forge will remove all of it permanently.</p>
          </section>

          <section class="legal-section" id="offline">
            <h2>6. Offline Functionality</h2>
            <p>Forge is designed to keep working without an internet connection once you've loaded it at least once. A service worker caches the app itself (the page, styles, scripts, icons, fonts, and background audio) so it can be reopened offline. It always tries to fetch the newest version of the app first when you're online, and only falls back to the offline copy when there's no connection.</p>
            <p>The service worker only ever caches the static files that make up the app. It never caches your results, your quiz answers, or anything stored in <code>localStorage</code>, since that data isn't the kind of thing a network cache touches in the first place.</p>
          </section>

          <section class="legal-section" id="responsibilities">
            <h2>7. User Responsibilities</h2>
            <ul>
              <li>Use Forge lawfully, and don't attempt to disrupt, overload, reverse-engineer for malicious purposes, or otherwise interfere with the app's normal operation.</li>
              <li>Don't present Forge's generated results as an official, certified, or clinical psychological assessment when sharing them with others.</li>
              <li>Respect other people's shared PF-codes and links the same way you'd want yours respected. See the next section for why that matters.</li>
            </ul>
          </section>

          <section class="legal-section" id="shared-codes">
            <h2>8. Shared Profile Codes</h2>
            <p>Every result Forge generates can be represented as a compact <code>PF*</code> code, a shareable link, or a scannable QR code. Because Forge has no accounts or access control of any kind, <strong>anyone who has your code, link, or QR image can view the result it represents</strong>, with no password or permission step in between. Treat anything you share this way as effectively public, and only share what you're comfortable with others seeing.</p>
          </section>

          <section class="legal-section" id="generated-results">
            <h2>9. Generated Results</h2>
            <p>Your archetype, trait breakdown, career notes, and compatibility results are all generated deterministically from your quiz answers using Forge's own personality model, not a licensed clinical instrument. As Forge's model is refined over time, results generated by a newer version may interpret the same underlying answers slightly differently than an older version once did. A PF-code you saved a while ago will still work, but its exact presentation may evolve as Forge does.</p>
          </section>

          <section class="legal-section" id="intellectual-property">
            <h2>10. Intellectual Property</h2>
            <p>The Forge name, logo, icon set, interface design, wording, and the underlying PF-code personality model and quiz content are the intellectual property of the Forge project. The specific answers you give and the resulting personal profile are yours to keep, export, and share as you like. Third-party assets used inside Forge remain the property of their respective owners. See the credits below for exactly what's used and under what terms.</p>
          </section>

          <section class="legal-section" id="third-party-assets">
            <h2>11. Third-Party Assets</h2>
            <p>Forge is built with as few external dependencies as possible. The full, itemized list of everything third-party actually used, including libraries, fonts, and delivery services, lives in the <a href="#third-party-credits">Third-Party Notices &amp; Credits</a> section below, kept up to date as Forge's dependencies change.</p>
          </section>

          <section class="legal-section" id="music-attribution">
            <h2>12. Music Attribution</h2>
            <p>Forge's background ambience is a licensed track sourced from a free-BGM library, used under that library's usage terms. Forge does not claim ownership or authorship of this music. Full details, including the source, license, and a direct link to the original listing, are in the <a href="#music-credits">Music Credits</a> section below.</p>
          </section>

          <section class="legal-section" id="open-source">
            <h2>13. Open Source Software</h2>
            <p>Forge doesn't currently bundle any third-party open-source libraries. The quiz engine, QR code generator, canvas-drawn charts, and icon set are all original code written for this project. If that changes in a future version, every open-source dependency will be listed, grouped by license, in the <a href="#open-source-credits">Open Source Notices</a> section below.</p>
          </section>

          <section class="legal-section" id="no-warranty">
            <h2>14. No Warranty</h2>
            <p>Forge is provided "as is" and "as available," without warranties of any kind, whether express or implied, including, without limitation, any implied warranty of merchantability, fitness for a particular purpose, or non-infringement. Forge doesn't guarantee that the app will be uninterrupted, error-free, or perfectly accurate at all times.</p>
          </section>

          <section class="legal-section" id="liability">
            <h2>15. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, the Forge project and its maintainer(s) are not liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of, or inability to use, Forge, including any decisions made on the basis of a generated result.</p>
          </section>

          <section class="legal-section" id="termination">
            <h2>16. Termination of Use</h2>
            <p>You can stop using Forge at any time, simply by closing the tab. Clearing your browser's local storage for the site removes everything Forge has saved. The Forge project may also modify, suspend, or discontinue any part of the app, or these terms, at any time. Continuing to use Forge after a change to these terms means you accept the updated version.</p>
          </section>

          <section class="legal-section" id="compliance">
            <h2>17. Compliance with Applicable Laws</h2>
            <p>You're responsible for using Forge in a way that complies with the laws that apply to you, including local, state or provincial, national, and international law. Forge is a browser-based personality exploration tool, not a licensed professional service, and using it doesn't exempt you from any legal obligation that would otherwise apply to your conduct, including how you choose to share a generated result with someone else.</p>
          </section>

          <section class="legal-section" id="indemnification">
            <h2>18. Indemnification</h2>
            <p>You agree to indemnify and hold harmless the Forge project and its maintainer(s) from any claim, loss, liability, or expense, including reasonable legal fees, arising out of your misuse of Forge, your violation of these terms, or your violation of any right of a third party, including anything you choose to share through a generated PF-code, link, or QR image.</p>
          </section>

          <section class="legal-section" id="dmca">
            <h2>19. DMCA and Copyright Complaints</h2>
            <p>Forge respects intellectual property rights. If you believe something published as part of Forge, such as an asset, image, or piece of code, infringes a copyright you hold, please get in touch using the details in <a href="#contact">Contact Information</a> below, along with a description of the work, its location, and how to reach you, and the claim will be reviewed in good faith. Because Forge has no user-uploaded content and no server-hosted storage, this mainly concerns Forge's own published assets and the third-party materials already credited above.</p>
          </section>

          <section class="legal-section" id="export-control">
            <h2>20. Export Control and Sanctions Compliance</h2>
            <p>Forge is a client-side web application published openly and at no cost. It isn't intended for use by anyone located in, or a national or resident of, a country that is subject to a comprehensive embargo, or by anyone on an applicable government restricted-party list. By using Forge, you confirm that your use complies with the export control and trade sanctions laws that apply to you.</p>
          </section>

          <section class="legal-section" id="dispute-resolution">
            <h2>21. Dispute Resolution</h2>
            <p>If a disagreement comes up about these terms or your use of Forge, please reach out first using <a href="#contact">Contact Information</a> below so there's a chance to resolve it informally before pursuing any other remedy. Nothing in this section limits either side's right to seek relief in the courts identified under <a href="#governing-law">Governing Law</a>.</p>
          </section>

          <section class="legal-section" id="force-majeure">
            <h2>22. Force Majeure</h2>
            <p>The Forge project isn't responsible for any failure or delay in Forge's availability caused by circumstances reasonably beyond its control, including outages of GitHub Pages or other hosting infrastructure, internet service disruptions, natural events, or similar causes.</p>
          </section>

          <section class="legal-section" id="severability">
            <h2>23. Severability</h2>
            <p>If a court of competent jurisdiction finds any provision of these terms unenforceable or invalid, that provision will be limited or removed to the minimum extent necessary, and the rest of these terms will remain in full effect.</p>
          </section>

          <section class="legal-section" id="entire-agreement">
            <h2>24. Entire Agreement</h2>
            <p>These terms, together with the credits and notices referenced throughout this page, make up the entire agreement between you and the Forge project regarding use of Forge, and replace any prior understanding on the subject.</p>
          </section>

          <section class="legal-section" id="assignment">
            <h2>25. Assignment and Waiver</h2>
            <p>You may not assign or transfer your rights under these terms. The Forge project may assign these terms in connection with a change of maintainership or a similar transfer of the project. If the Forge project doesn't enforce a provision of these terms on one occasion, that isn't a waiver of the right to enforce it later.</p>
          </section>

          <section class="legal-section" id="future-updates">
            <h2>26. Future Updates</h2>
            <p>Forge is an evolving project. Its personality model, features, and these terms are all expected to grow over time, including possible future opt-in features (for example, cloud sync) that don't exist yet and aren't implied to exist by anything on this page today. Any such change will be reflected here and logged in the <a href="#version-history">Version History</a> below.</p>
          </section>

          <section class="legal-section" id="governing-law">
            <h2>27. Governing Law</h2>
            <p class="legal-placeholder">Placeholder: to be completed</p>
            <p>This section will state the governing jurisdiction for these terms in a future update.</p>
          </section>

          <section class="legal-section" id="contact">
            <h2>28. Contact Information</h2>
            <p class="legal-placeholder">Placeholder: to be completed</p>
            <p>A contact method for legal or privacy inquiries will be added here.</p>
          </section>

          <section class="legal-section" id="version-history">
            <h2>29. Version History</h2>
            <div>${renderLegalVersionHistory()}</div>
          </section>

          <section class="legal-section" id="last-updated">
            <h2>30. Last Updated</h2>
            <p>These Terms of Service were last updated on <strong>${LEGAL_LAST_UPDATED}</strong>.</p>
          </section>

          <section class="legal-section" id="third-party-credits">
            <h2>Third-Party Notices &amp; Credits</h2>
            <p>Generated from Forge's own dependency list. Every library, framework, font, or third-party asset actually used by the app is itemized below. Nothing is assumed, and nothing is left out.</p>
            <details class="legal-accordion glass" open>
              <summary>Dependencies &amp; services <span class="count">${LEGAL_THIRD_PARTY.length} entries</span>${LEGAL_CHEVRON}</summary>
              <div class="legal-accordion-body">
                <p class="hint">To add a new dependency later, add one entry to the <code>LEGAL_THIRD_PARTY</code> array in js/pages.js.</p>
                <div class="credit-grid">${renderLegalThirdParty()}</div>
              </div>
            </details>
          </section>

          <section class="legal-section" id="fonts-credits">
            <h2>Fonts</h2>
            <p>Every typeface used across Forge, and where it comes from.</p>
            <details class="legal-accordion glass" open>
              <summary>Typefaces <span class="count">${LEGAL_FONTS.length} typefaces</span>${LEGAL_CHEVRON}</summary>
              <div class="legal-accordion-body">
                <div class="credit-grid">${renderLegalFonts()}</div>
              </div>
            </details>
          </section>

          <section class="legal-section" id="icons-graphics">
            <h2>Icons &amp; Graphics</h2>
            <p>The Forge logo, icon set, Open Graph image, favicons, PWA install icons, and every other piece of brand artwork in this app are original assets created for <strong>PersonaForge</strong>, unless a specific asset is noted otherwise above. The interface icon set (home, sun, moon, and so on) is drawn from the open-source Lucide icon set.</p>
          </section>

          <section class="legal-section" id="music-credits">
            <h2>Music Credits</h2>
            <div>${renderLegalMusicCredit()}</div>
          </section>

          <section class="legal-section" id="open-source-credits">
            <h2>Open Source Notices</h2>
            <p>An expandable, future-proofed home for any open-source software Forge comes to depend on, grouped by license family. Right now, this list is empty on purpose. See <a href="#open-source">Open Source Software</a> above.</p>
            <details class="legal-accordion glass">
              <summary>By license <span class="count">${legalOpenSourceTotal()} total</span>${LEGAL_CHEVRON}</summary>
              <div class="legal-accordion-body">
                <p class="hint">To list a new open-source dependency later, push an entry into the matching license group inside the <code>LEGAL_OPEN_SOURCE_GROUPS</code> array in js/pages.js.</p>
                <div>${renderLegalOpenSource()}</div>
              </div>
            </details>
          </section>

        </main>
      </div>

      <div class="footer-nav" style="margin-top:48px;">
        <a href="index.html" class="btn btn-primary" style="text-decoration:none;">Back to Forge</a>
      </div>

      <footer class="legal-footer glass">
        <p>PersonaForge ("Forge") &middot; Version ${LEGAL_VERSION} &middot; &copy; ${new Date().getFullYear()} The Forge project. All rights reserved except where third-party and open-source credits above say otherwise.</p>
        <p>Background music used under license. See <a href="#music-credits">Music Credits</a>. Third-party software and fonts used under their own licenses. See <a href="#third-party-credits">Third-Party Notices</a> and <a href="#open-source-credits">Open Source Notices</a>.</p>
        <nav class="footer-nav">
          <a href="index.html">Home</a>
          <a href="#" aria-disabled="true" title="Coming soon" onclick="return false;">Privacy Policy (coming soon)</a>
          <a href="legal.html">Terms of Service</a>
          <a href="#open-source-credits">Licenses</a>
          <a href="https://github.com/Yota321/PersonaForge" target="_blank" rel="noopener">GitHub</a>
          <a href="#contact" title="Placeholder">Contact</a>
        </nav>
      </footer>

    </div>
  `;
}
