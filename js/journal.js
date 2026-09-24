/* =========================================================================
   FORGE - JOURNAL (journal.html)
   A daily mood + short-text check-in. Not a separate product: today's
   prompt comes straight from the same computeRecommendationProfile()
   the Improve page already uses, so journaling and Improve read as one
   continuous thing instead of two unrelated features. Loaded by
   journal.html only, after engine.js + global.js.
   ========================================================================= */

const JOURNAL_MOODS = [
  { v: 1, emoji: "\u{1F614}", label: "Rough" },
  { v: 2, emoji: "\u{1F615}", label: "Off" },
  { v: 3, emoji: "\u{1F610}", label: "Neutral" },
  { v: 4, emoji: "\u{1F642}", label: "Good" },
  { v: 5, emoji: "\u{1F604}", label: "Great" },
];
let journalSelectedMood = 3;
// Read by saveJournalCheckIn() instead of threading the prompt text
// through an inline onclick string — several curated reflection prompts
// contain apostrophes, which would break out of a single-quoted JS
// string literal embedded in an HTML attribute.
let journalTodayPromptText = "";

// A stable "prompt of the day" rather than a fresh random one on every
// render: rotates through the person's own blended reflection prompts by
// day-of-year, so refreshing the page mid-entry doesn't swap the prompt
// out from under them.
function todaysPrompt(rec){
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const list = rec.reflectionPrompts.length ? rec.reflectionPrompts : ["What's on your mind today?"];
  return list[dayOfYear % list.length];
}

function renderJournal(){
  setAccentColors();
  setPageTitle("Journal");
  const result = buildResultFromLatestTimeline();

  if (!result){
    root.innerHTML = `
      <div class="container">
        ${topBar(true)}
        <div class="eyebrow accent">JOURNAL</div>
        <h2 style="margin:10px 0 6px">Nothing to Check In On Yet</h2>
        <p class="tagline" style="text-align:left;color:var(--text-muted)">Take the assessment once, and Forge can start tying your day-to-day check-ins to your actual read, not just a blank notebook.</p>
        <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
        </div>
      </div>`;
    return;
  }

  const rec = computeRecommendationProfile(result.normDims);
  const streak = computeJournalStreak();
  const today = getTodaysJournalEntry();
  // Defense in depth: importProfile() already drops any journal entry
  // whose id doesn't match isSafeId() before writing it to localStorage
  // (see sanitizeImportedJournal() in engine.js) — e.id ends up in an
  // inline onclick below, so this re-checks it here too.
  const entries = getJournalEntries().filter(e => isSafeId(e.id)).slice().reverse();
  journalSelectedMood = today ? today.mood : 3;
  journalTodayPromptText = todaysPrompt(rec);

  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">JOURNAL</div>
      <h2 style="margin:10px 0 6px">A Quick Check-In</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Thirty seconds, most days. Not a diary you have to keep up perfectly, just a real trail of how things actually went.</p>

      <div class="grid-2" style="margin-top:16px">
        <div class="card glass"><h4>Current Streak</h4><div class="ingot-name count-up" style="font-size:32px" data-target="${streak.current}" data-suffix=" ${streak.current === 1 ? "day" : "days"}">0</div></div>
        <div class="card glass"><h4>Longest Streak</h4><div class="ingot-name count-up" style="font-size:32px" data-target="${streak.longest}" data-suffix=" ${streak.longest === 1 ? "day" : "days"}">0</div></div>
      </div>

      <div class="card glass" style="margin-top:14px" id="journalTodayCard">
        <div class="eyebrow accent">TODAY</div>
        <h4>${today ? "Already checked in" : "How's today going?"}</h4>
        <div class="journal-mood-row" id="journalMoodRow">
          ${JOURNAL_MOODS.map(m => `<button type="button" class="journal-mood-btn${journalSelectedMood === m.v ? " selected" : ""}" data-mood="${m.v}" onclick="selectJournalMood(${m.v})" ${today ? "disabled" : ""}>${m.emoji}<span>${m.label}</span></button>`).join("")}
        </div>
        <p style="color:var(--text-muted);font-size:13px;margin-top:10px">Today's prompt: ${obEsc(journalTodayPromptText)}</p>
        <textarea id="journalTextField" class="ns-input" style="width:100%;min-height:90px;resize:vertical;margin-top:8px" placeholder="Optional, a sentence or two is plenty." ${today ? "disabled" : ""}>${today ? obEsc(today.text) : ""}</textarea>
        ${today ? `<p style="color:var(--text-dim);font-size:12px;margin-top:6px">Logged at ${new Date(today.timestamp).toLocaleTimeString()}. One check-in per day, come back tomorrow.</p>`
          : `<div class="cta-row" style="margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveJournalCheckIn()">Save Today's Entry</button></div>`}
      </div>

      <div class="card glass" style="margin-top:14px">
        <h4>Past Entries</h4>
        ${entries.length ? entries.slice(0, 30).map(e => {
          const mood = JOURNAL_MOODS.find(m => m.v === e.mood) || JOURNAL_MOODS[2];
          return `<div class="journal-entry-row">
            <span class="journal-entry-mood">${mood.emoji}</span>
            <span class="journal-entry-body"><span class="journal-entry-date">${new Date(e.timestamp).toLocaleDateString()}</span>${e.text ? `<span class="journal-entry-text">${obEsc(e.text)}</span>` : ""}</span>
            <button class="icon-btn journal-entry-delete" onclick="removeJournalEntry('${e.id}')" aria-label="Delete entry">${ICONS.close}</button>
          </div>`;
        }).join("") : `<p style="color:var(--text-muted)">No entries yet, today's is a good place to start.</p>`}
      </div>

      <div class="card glass" style="margin-top:14px;text-align:center">
        <h4>Want Suggestions Instead?</h4>
        <p>Improve has habits, reading, and reflection prompts built around your actual read.</p>
        <div class="cta-row" style="justify-content:center;margin-top:8px">
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('improve')">Open Improve</button>
          <button class="btn btn-ghost btn-sm" onclick="click(380);navigate('growth')">See Growth page</button>
        </div>
      </div>
    </div>
  `;
  initCountUps(root);
}

function selectJournalMood(v){
  journalSelectedMood = v;
  document.querySelectorAll(".journal-mood-btn").forEach(b => b.classList.toggle("selected", Number(b.dataset.mood) === v));
  click(320);
}
function saveJournalCheckIn(){
  const text = document.getElementById("journalTextField").value.trim();
  addJournalEntry({ mood: journalSelectedMood, text, prompt: journalTodayPromptText });
  click(520);
  showToast("Logged today's check-in.");
  renderJournal();
}
function removeJournalEntry(id){
  deleteJournalEntry(id);
  click(340);
  renderJournal();
}
