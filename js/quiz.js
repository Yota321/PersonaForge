/* =========================================================================
   FORGE - QUIZ (quiz.html)
   Onboarding wizard (3 steps) + the adaptive quiz itself + the Forging
   transition that hands off to result.html. Loaded by quiz.html only,
   after engine.js + global.js.
   ========================================================================= */

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
  autosaveOnboarding(obCurrentStep());
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
  autosaveOnboarding(obCurrentStep());
}
// Which onboarding screen is currently rendered, purely from DOM markers
// already on each screen — used so shared widgets (chip rows, card groups)
// can autosave under the right step number without threading it through
// every call site.
function obCurrentStep(){
  if (document.getElementById("experienceScreen")) return 3;
  if (document.getElementById("aboutScreen")) return 2;
  return 1;
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
    if (f){
      f.focus();
      f.onkeydown = (e) => { if (e.key === "Enter") confirmName(); };
      f.oninput = () => autosaveOnboarding(1);
    }
    ["occupationField","countryField"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => autosaveOnboarding(1);
    });
  }, 50);
  autosaveOnboarding(1);
}
// Persists the wizard's current step + whatever has been entered/picked so
// far (name, age group, occupation, country, gender, reason, length), so a
// refresh mid-onboarding restores to the exact same step with the exact
// same fields filled in rather than bouncing back to step 1. Reads straight
// off the live DOM where a field exists on the current screen, and falls
// back to the in-memory pendingName/pendingMeta for anything not currently
// on screen (so switching screens never drops an earlier answer).
function autosaveOnboarding(step){
  const nameField = document.getElementById("nameField");
  if (nameField) pendingName = nameField.value;
  const occ = document.getElementById("occupationField");
  const country = document.getElementById("countryField");
  if (occ) pendingMeta.occupation = occ.value;
  if (country) pendingMeta.country = country.value;
  if (document.querySelector('.ob-chip[data-group="ageGroup"]')) pendingMeta.ageGroup = obChipValue("ageGroup");
  if (document.querySelector('.ob-chip[data-group="gender"]')) pendingMeta.gender = obChipValue("gender");
  if (document.querySelector('.ob-chip[data-group="reason"]')) pendingMeta.reason = obChipValue("reason");
  if (document.querySelector('.ob-card[data-group="length"]')){
    pendingMeta.questionMode = obCardValue("length", pendingMeta.questionMode || "adaptive");
    pendingMeta.resultDepth = obDepthForLength(pendingMeta.questionMode);
  }
  saveOnboardingProgress(step, pendingName, pendingMeta);
}
function toggleExtraDetails(){
  const el = document.getElementById("extraDetails");
  const label = document.getElementById("extraToggleLabel");
  const showing = !el.classList.contains("hidden");
  el.classList.toggle("hidden");
  label.textContent = showing ? "+ Add more details" : "\u2212 Hide extra details";
  click(360);
}
// Root-cause fix for a real, reproducible bug: a spurious duplicate
// click (confirmed via instrumentation — a second, untrusted "click"
// event firing immediately after the real one on buttons whose
// pointerdown ripple effect mutates the button's own DOM) could invoke
// this a second time after the screen had already moved on. That second
// call would read chip/field values off whatever screen happened to be
// showing by then (not this one), overwriting good values with empty
// ones. Guarding on "is my own screen still the one on screen" makes
// every onboarding step handler a safe no-op if called out of turn,
// regardless of what triggers the extra call — a double click, a
// double-fired event, or anything else.
function confirmName(){
  if (!document.getElementById("nameScreen")) return;
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
  autosaveOnboarding(2);
}
function confirmAbout(goBack){
  if (!document.getElementById("aboutScreen")) return;
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
   presentation depth (see renderResult()'s isLightReport/resultDepth
   branch in result.js, and the "Want to dive deeper?" unlock CTA it
   renders for anything short of "deep"), both ride along invisibly on
   the same choice via `depth`/`value` below; question count is the one
   part of this that actually drives the quiz engine (QuizSession's
   questionMode), everything else is presentation only. */
const OB_LENGTH_OPTIONS = [
  { value: "15", depth: "short", title: "Quick Read", desc: "A fast, lighter pass that hits the highlights without digging deep." },
  { value: "adaptive", depth: "balanced", badge: "Recommended", title: "Balanced", desc: "The full Forge experience, thorough without dragging. Keeps asking a little longer if your answers are hard to pin down." },
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
            ${obCardGroup("length", OB_LENGTH_OPTIONS, pendingMeta.questionMode || "adaptive")}
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
  autosaveOnboarding(3);
}
// Question count and result-page presentation depth are two faces of
// the one visible choice — this is the only place that maps between
// them, so OB_LENGTH_OPTIONS stays the single source of truth.
function obDepthForLength(questionMode){
  return (OB_LENGTH_OPTIONS.find(o => o.value === questionMode) || {}).depth || "balanced";
}
function backFromExperience(){
  if (!document.getElementById("experienceScreen")) return;
  pendingMeta.questionMode = obCardValue("length", "adaptive");
  pendingMeta.resultDepth = obDepthForLength(pendingMeta.questionMode);
  renderAboutScreen();
}
function confirmExperience(){
  if (!document.getElementById("experienceScreen")) return;
  const questionMode = obCardValue("length", "adaptive");
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
// questionMode ("15" | "adaptive" | "50") comes from the "Your
// Experience" onboarding step (undefined when it was skipped entirely,
// e.g. the name screen's own "Skip for now") and is the one onboarding
// preference that actually changes what the quiz engine does — see
// QuizSession's constructor/_maybeAdjustLength(). Everything else in
// `meta` (age group, gender, reason, result depth, ...) is presentation
// only and just rides along to the result page via session.meta.
function startQuiz(name, meta, questionMode){
  pendingName = name || "";
  clearQuizProgress();
  clearOnboardingProgress();
  session = new QuizSession(Date.now() % 100000, pendingName, questionMode);
  session.meta = meta || {};
  renderQuiz();
}

/* ---------------- SESSION RECOVERY (refresh mid-onboarding/mid-quiz) ---
   boot() in quiz.html calls into these instead of assuming a fresh visit.
   Onboarding progress restores silently (nothing lost, no extra tap: it's
   just "the wizard remembers"). An in-progress quiz instead asks first,
   since silently resuming could feel like it skipped past a fresh-start
   click, and silently discarding could throw away real answers. */
function restoreOnboardingStep(saved){
  pendingName = saved.name || "";
  pendingMeta = saved.meta || {};
  const step = saved.step || 1;
  if (step >= 3) renderExperienceScreen();
  else if (step === 2) renderAboutScreen();
  else renderNameScreen();
}
function renderResumeQuizPrompt(saved){
  setAccentColors();
  setPageTitle("Assessment");
  root.innerHTML = `
    <div class="container lp-topbar-wrap">${topBar(true)}</div>
    <div class="ns-wrap">
      <div class="ns-panel glass" id="resumeScreen">
        <div class="ns-panel-top">
          <div class="eyebrow accent">WELCOME BACK</div>
        </div>
        <div class="ns-panel-body">
          <h2>Resume your <span class="accent-text">assessment?</span></h2>
          <p>${saved.name ? obEsc(saved.name) + ", y" : "Y"}ou answered ${saved.cursor} of ${saved.targetLength}. Pick up on question ${saved.cursor + 1}, or start over from scratch.</p>
          <button class="btn btn-primary" onclick="acceptResumeQuiz()">Resume &rarr;</button>
          <div class="ns-divider">OR</div>
          <button class="btn btn-ghost" onclick="declineResumeQuiz()">Start over</button>
        </div>
      </div>
    </div>
  `;
  spawnAmbience();
}
function acceptResumeQuiz(){
  click(500);
  const saved = getSavedQuizProgress();
  if (!saved){ renderNameScreen(); return; }
  session = restoreQuizSession(saved);
  pendingName = session.name || "";
  renderQuiz();
}
function declineResumeQuiz(){
  click(360);
  clearQuizProgress();
  clearOnboardingProgress();
  renderNameScreen();
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
  // the assessment grows by one question. Fixed modes ("15"/"50" — Quick
  // Read/Deep Dive) never extend, so measuring against their own total
  // instead reads more naturally as "how far through your chosen length."
  const modeLabel = session.questionMode === "15" ? "Quick Read" : session.questionMode === "50" ? "Deep Dive" : "Balanced";
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

