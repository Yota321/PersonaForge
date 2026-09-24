/* =========================================================================
   FORGE - IMPROVE (improve.html)
   Practical self-help, not therapy: books/films/music/habits/social
   actions/reflection prompts chosen by computeRecommendationProfile()
   (engine.js) from the person's actual normDims, plus two small live
   touches (a quote, a weather-shaped suggestion) pulled from keyless
   public APIs when the network's there and a curated fallback when it
   isn't. Loaded by improve.html only, after engine.js + global.js.
   ========================================================================= */


/* ---------------- Curated fallback quotes ---------------------------------
   Used whenever the live quote API is unreachable (offline, blocked,
   slow) — short, widely-attributed lines, not full copyrighted text. */
const IMPROVE_CURATED_QUOTES = [
  { text: "The quality of your life is the quality of your relationships.", author: "Esther Perel" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "What you pay attention to grows.", author: "unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln (attributed)" },
  { text: "Comparison is the thief of joy.", author: "Theodore Roosevelt" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "Small steps, repeated, are how everything actually gets built.", author: "unknown" },
  { text: "You are not required to set yourself on fire to keep other people warm.", author: "unknown" },
];
function pickCuratedQuote(){
  const q = IMPROVE_CURATED_QUOTES[Math.floor(Math.random() * IMPROVE_CURATED_QUOTES.length)];
  return { text: q.text, author: q.author, source: "curated" };
}
// zenquotes.io's /random endpoint: keyless, no auth, CORS-enabled. A short
// timeout and a broad try/catch mean any failure (offline, blocked,
// slow, unexpected shape) falls straight back to the curated list above
// with no visible error, since this is a nice-to-have, not core content.
async function fetchDailyQuote(){
  try{
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("https://zenquotes.io/api/random", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0].q){
      return { text: data[0].q, author: data[0].a || "unknown", source: "live" };
    }
    throw new Error("unexpected shape");
  } catch(e){
    return pickCuratedQuote();
  }
}

/* ---------------- Weather-shaped suggestion -------------------------------
   open-meteo.com: keyless, no auth, CORS-enabled. Needs the browser's own
   geolocation permission; if that's denied, times out, or the fetch
   fails for any reason, this falls back to a suggestion that doesn't
   depend on weather at all. */
function genericWalkSuggestion(){
  return { text: "No weather read available right now, take a few minutes outside if you can, or just sit with one of today's music picks.", source: "fallback" };
}
function weatherCodeToSuggestion(code, tempC){
  const t = Math.round(tempC);
  if (code === 0 || code === 1) return { text: `Clear where you are (${t}°C). Good conditions for the walk in today's habits.`, source: "live" };
  if (code === 2 || code === 3) return { text: `Cloudy but calm (${t}°C). Still a fine day for a short walk, light layer recommended.`, source: "live" };
  if (code >= 45 && code <= 48) return { text: `Foggy out there (${t}°C). A quieter, indoor version of today's habits might suit the mood better.`, source: "live" };
  if (code >= 51 && code <= 67) return { text: `Rain around you (${t}°C). A good excuse for one of today's reflective or reading picks instead of the walk.`, source: "live" };
  if (code >= 71 && code <= 77) return { text: `Snow where you are (${t}°C). A short bundled-up walk, or a warm drink and today's music picks.`, source: "live" };
  if (code >= 80) return { text: `Stormy conditions (${t}°C). Best to stay in, today's reflection prompts are a good use of that time.`, source: "live" };
  return { text: `${t}°C where you are right now. Any of today's habits should work fine.`, source: "live" };
}
function fetchWeatherSuggestion(){
  return new Promise((resolve) => {
    if (!navigator.geolocation){ resolve(genericWalkSuggestion()); return; }
    let settled = false;
    const done = (v) => { if (!settled){ settled = true; resolve(v); } };
    const timer = setTimeout(() => done(genericWalkSuggestion()), 4500);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timer);
        try{
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          if (!res.ok) throw new Error("bad status");
          const data = await res.json();
          if (!data.current_weather) throw new Error("no current_weather");
          done(weatherCodeToSuggestion(data.current_weather.weathercode, data.current_weather.temperature));
        } catch(e){ done(genericWalkSuggestion()); }
      },
      () => { clearTimeout(timer); done(genericWalkSuggestion()); },
      { timeout: 4000, maximumAge: 30 * 60 * 1000 }
    );
  });
}

function improveListCard(title, items, reason){
  return `<div class="card glass"><h4>${title}</h4>${reason ? `<p class="improve-reason">${reason}</p>` : ""}<ul class="improve-list">${items.map(i => `<li>${i}</li>`).join("")}</ul></div>`;
}

function renderImprove(){
  setAccentColors();
  setPageTitle("Improve");
  const result = buildResultFromLatestTimeline();

  if (!result){
    root.innerHTML = `
      <div class="container">
        ${topBar(true)}
        <div class="eyebrow accent">IMPROVE</div>
        <h2 style="margin:10px 0 6px">Nothing to Build On Yet</h2>
        <p class="tagline" style="text-align:left;color:var(--text-muted)">Take the assessment once and this page fills in with suggestions actually built around how you answered, not generic advice.</p>
        <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
        </div>
      </div>`;
    return;
  }

  const rec = computeRecommendationProfile(result.normDims);
  const checkIn = getImproveCheckInState();
  const a = result.archetype;
  const growth = computeGrowthTimeline(result);
  const streak = computeJournalStreak();
  const nudge = computeRetakeNudge(growth, streak);

  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">IMPROVE</div>
      <h2 style="margin:10px 0 6px">Practical, Not Prescriptive</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Built around your ${a.icon} ${a.name} read (${rec.primary.label}${rec.secondary ? ` with a bit of ${rec.secondary.label}` : ""}), not a generic list. Nothing here is a requirement, these are things that tend to land well for people who read the way you do &mdash; take what's useful, skip what isn't.</p>

      ${checkIn.dueForCheckIn ? `
      <div class="card glass improve-checkin" style="margin-top:16px">
        <div class="eyebrow accent">CHECK-IN</div>
        <h4>How's it going?</h4>
        <p>It's been a few days since you were last here. If you've tried even one or two of these, a retake is the most honest way to see whether anything's actually shifted.</p>
        <div class="cta-row" style="margin-top:10px">
          <button class="btn btn-primary btn-sm" onclick="click(480);goToNameScreen()">Retake Assessment &rarr;</button>
          <button class="btn btn-ghost btn-sm" onclick="dismissImproveCheckIn()">Not yet, remind me later</button>
        </div>
      </div>` : ""}

      <div class="card glass" style="margin-top:16px" id="improveTodayCard">
        <div class="eyebrow accent">TODAY</div>
        <h4>A line to sit with</h4>
        <p id="improveQuoteText" style="min-height:20px">Loading&hellip;</p>
        <p id="improveQuoteAuthor" style="color:var(--text-dim);font-size:12.5px;margin-top:4px"></p>
        <div class="nav-menu-sep" style="margin:14px 0"></div>
        <h4>If you're stepping outside</h4>
        <p id="improveWeatherText" style="min-height:20px">Checking conditions&hellip;</p>
      </div>

      <div class="grid-2" style="margin-top:14px">
        ${improveListCard("Reflection Prompts", rec.reflectionPrompts, `Picked because your answers lean ${rec.primary.label}.`)}
        ${improveListCard("Small Daily Habits", rec.habits, `Suits a ${rec.primary.label.toLowerCase()} pace.`)}
      </div>
      <div class="grid-2" style="margin-top:12px">
        ${improveListCard("Simple Social Actions", rec.socialActions)}
        ${improveListCard("Books", rec.books, `Reads well for the ${rec.primary.label.toLowerCase()} side of your result.`)}
      </div>
      <div class="grid-2" style="margin-top:12px">
        ${improveListCard("Shows &amp; Films", rec.films, `Tone-matched to ${rec.primary.label.toLowerCase()}.`)}
        ${improveListCard("Music", rec.music)}
      </div>
      <div class="grid-2" style="margin-top:12px">
        ${improveListCard("Podcasts", rec.podcasts, `A bit of ${rec.secondary.label.toLowerCase()} mixed in here too.`)}
        <div class="card glass" id="improveFeedbackCard">
          <h4>Did Any of This Land?</h4>
          <p style="color:var(--text-muted);font-size:13px">No wrong answer, this just quietly shapes what shows up next time.</p>
          <div class="cta-row" style="margin-top:8px">
            <button class="btn btn-ghost btn-sm" onclick="recordImproveFeedback('${rec.primary.id}','tried')">Tried something</button>
            <button class="btn btn-ghost btn-sm" onclick="recordImproveFeedback('${rec.primary.id}','skipped')">Not really for me</button>
          </div>
        </div>
      </div>

      <div class="card glass" style="margin-top:12px;text-align:center">
        <h4>These Only Mean Something If You Check Back</h4>
        <p>${nudge}</p>
        <div class="cta-row" style="justify-content:center;margin-top:10px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Retake Assessment &rarr;</button>
          <button class="btn btn-ghost" onclick="click(380);navigate('growth')">See your Growth page</button>
        </div>
      </div>
    </div>
  `;

  fetchDailyQuote().then(q => {
    const t = document.getElementById("improveQuoteText");
    const au = document.getElementById("improveQuoteAuthor");
    if (t) t.textContent = `“${q.text}”`;
    if (au) au.textContent = `— ${q.author}`;
  });
  fetchWeatherSuggestion().then(w => {
    const t = document.getElementById("improveWeatherText");
    if (t) t.textContent = w.text;
  });
}

function recordImproveFeedback(tagId, status){
  recordSuggestionFeedback(tagId, status);
  click(400);
  showToast(status === "tried" ? "Noted, glad something landed." : "Noted, we'll lean elsewhere next time.");
  const card = document.getElementById("improveFeedbackCard");
  if (card) card.querySelectorAll("button").forEach(b => b.disabled = true);
}
function dismissImproveCheckIn(){
  markImproveCheckInSeen();
  click(340);
  const el = document.querySelector(".improve-checkin");
  if (el) el.remove();
}
