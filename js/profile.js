/* =========================================================================
   FORGE - PROFILE (profile.html)
   The local identity hub: name, an optional on-device photo, archetype,
   soul type, retake count/history, export/import, compare shortcuts,
   settings, and app info. Everything here reads/writes getLocalProfile()
   (engine.js) — there's no account behind it, this page just gives that
   local record a real home instead of leaving it invisible in
   localStorage. Loaded by profile.html only, after engine.js + global.js.
   ========================================================================= */

// Downscales whatever image the person picks to a small square JPEG
// before it ever touches localStorage — an unresized phone photo would
// blow well past a reasonable localStorage budget and slow down every
// future JSON.parse of the profile record for no visual benefit at this
// display size.
const PROFILE_AVATAR_SIZE = 128;
function readAvatarFile(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = PROFILE_AVATAR_SIZE;
        canvas.height = PROFILE_AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, PROFILE_AVATAR_SIZE, PROFILE_AVATAR_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}
function pickAvatar(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try{
      const dataUrl = await readAvatarFile(file);
      updateLocalProfile({ avatarImage: dataUrl });
      click(460);
      renderProfile();
    } catch(e){
      showToast("Couldn't use that photo. Try a different image.");
    }
  });
  input.click();
}
function removeAvatar(){
  updateLocalProfile({ avatarImage: null });
  click(340);
  renderProfile();
}

function saveProfileName(){
  const field = document.getElementById("profileNameField");
  if (!field) return;
  const name = field.value.trim();
  updateLocalProfile({ name, nameIsCustom: name.length > 0 });
  click(460);
  showToast("Name updated.");
  renderProfile();
}

function profileAvatarMarkup(profile, freshSoulHex){
  // Defense in depth: importProfile() already validates avatarImage/
  // soulHex before ever writing them to localStorage (see
  // sanitizeImportedLocalProfile() in engine.js), but this only ever
  // renders a value it has re-checked itself, in case that field got
  // into localStorage some other way.
  if (profile.avatarImage && isSafeAvatarDataUrl(profile.avatarImage)){
    return `<img src="${profile.avatarImage}" alt="" class="profile-avatar-img" width="${PROFILE_AVATAR_SIZE}" height="${PROFILE_AVATAR_SIZE}" />`;
  }
  const initial = (profile.name || "?").trim().charAt(0).toUpperCase() || "?";
  // profile.soulHex is only written at quiz-completion time and never
  // refreshed on its own -- callers that have already recomputed the
  // current soul pass its hex in here instead, so this stays in sync
  // with what the rest of the page shows for the same person.
  const hex = freshSoulHex || profile.soulHex;
  const bg = isSafeHexColor(hex) ? hex : "var(--accent)";
  return `<div class="profile-avatar-fallback" style="background:${bg}">${obEsc(initial)}</div>`;
}

function renderProfile(){
  setAccentColors();
  setPageTitle("Profile");
  const profile = getLocalProfile();

  if (!profile){
    root.innerHTML = `
      <div class="container">
        ${topBar(true)}
        <div class="eyebrow accent">PROFILE</div>
        <h2 style="margin:10px 0 6px">No Local Profile Yet</h2>
        <p class="tagline" style="text-align:left;color:var(--text-muted)">Tap "Get Started" up top to create one, or just take the assessment, either one sets a profile up automatically, right here on this device. No account, no signup form.</p>
        <div class="cta-row" style="justify-content:flex-start;margin-top:18px">
          <button class="btn btn-primary" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button>
          <button class="btn btn-ghost" onclick="showGetStartedModal()">Create Profile</button>
        </div>
      </div>`;
    return;
  }

  const history = getFullTimeline();
  const retakeCount = history.length;
  const decoded = profile.code ? decodeCode(profile.code) : null;
  const hasResult = !!decoded;
  // decoded.archetype and profile.soul are both stale the moment the
  // engine's scoring changes: decoded.archetype is whatever archIdx was
  // baked into the code at encode time, and profile.soul is only ever
  // written by ensureLocalProfile() on an actual quiz completion, never
  // refreshed just from viewing this page. Recomputing both fresh from
  // decoded.normDims means Profile can't drift from Growth/Home, which
  // already do the same (buildResultFromLatestTimeline).
  const archetype = decoded ? matchArchetype(decoded.normDims).primary : null;
  const soul = decoded ? computeSoulType(decoded.normDims) : null;
  const progress = computeProgress(decoded ? decoded.normDims : null);
  const journalStreak = computeJournalStreak();

  root.innerHTML = `
    <div class="container">
      ${topBar(true)}
      <div class="eyebrow accent">YOUR PROFILE</div>
      <h2 style="margin:10px 0 6px">Your Local Space in Forge</h2>
      <p class="tagline" style="text-align:left;color:var(--text-muted)">Everything here lives only on this device. There's no account behind it, and nothing here is sent anywhere.</p>

      <div class="card glass profile-hero" style="margin-top:18px">
        <div class="profile-hero-row">
          <div class="profile-avatar-wrap">
            ${profileAvatarMarkup(profile, soul ? soul.hex : null)}
          </div>
          <div class="profile-hero-info">
            <h3>${obEsc(profile.name) || "Unnamed"}</h3>
            <p style="color:var(--text-muted)">${hasResult ? `${archetype.icon} ${archetype.name} &bull; ${obEsc(soul ? soul.name : "")} Soul` : "Not assessed yet"}</p>
            <div class="cta-row" style="margin-top:8px">
              <button class="btn btn-ghost btn-sm" onclick="pickAvatar()">${profile.avatarImage ? "Change photo" : "Add photo"}</button>
              ${profile.avatarImage ? `<button class="btn btn-ghost btn-sm" onclick="removeAvatar()">Remove photo</button>` : ""}
            </div>
          </div>
        </div>
        <div class="nav-menu-sep" style="margin:16px 0"></div>
        <div class="profile-name-edit">
          <label for="profileNameField" class="ns-label">Display name</label>
          <div class="profile-name-row">
            <input type="text" id="profileNameField" class="ns-input ns-input-sm" maxlength="20" value="${obEsc(profile.name)}" placeholder="Add a name" />
            <button class="btn btn-primary btn-sm" onclick="saveProfileName()">Save</button>
          </div>
        </div>
      </div>

      ${!hasResult ? `
      <div class="card glass improve-checkin" style="margin-top:14px">
        <h4>No Result on This Profile Yet</h4>
        <p>The rest of this page fills in the moment you take the assessment, archetype, soul type, growth history, all of it.</p>
        <div class="cta-row" style="margin-top:8px"><button class="btn btn-primary btn-sm" onclick="click(520);goToNameScreen()">Start Assessment &rarr;</button></div>
      </div>` : ""}

      <div class="card glass" style="margin-top:14px">
        <div class="progress-head">
          <div>
            <div class="eyebrow accent">LEVEL ${progress.level}</div>
            <h4 style="margin-top:2px">${progress.title}</h4>
          </div>
          <div class="progress-xp">${progress.xp} XP</div>
        </div>
        <div class="stat-bar-track" style="margin-top:10px"><div class="stat-bar-fill" style="width:${progress.progressToNext}%"></div></div>
        <p style="margin-top:6px;font-size:12px;color:var(--text-dim)">${progress.nextLevelXp ? `${progress.nextLevelXp - progress.xp} XP to Level ${progress.level + 1}` : "Highest level reached"}</p>
        <p style="margin-top:8px;font-size:12.5px;color:var(--text-muted)">From ${progress.retakeCount} retake${progress.retakeCount===1?"":"s"}, ${progress.journalCount} journal entr${progress.journalCount===1?"y":"ies"}, and ${progress.achievementCount} unlocked trait${progress.achievementCount===1?"":"s"}.</p>
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Retakes</h4><div class="ingot-name count-up" style="font-size:32px" data-target="${retakeCount}" data-suffix="">0</div><p style="color:var(--text-muted)">Total assessments on this device</p></div>
        <div class="card glass"><h4>Match Confidence</h4><div class="ingot-name count-up" style="font-size:32px" data-target="${profile.confidencePct || 0}" data-suffix="%">0%</div><p style="color:var(--text-muted)">Most recent read</p></div>
      </div>
      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Journal Streak</h4><div class="ingot-name count-up" style="font-size:32px" data-target="${journalStreak.current}" data-suffix="">0</div><p style="color:var(--text-muted)">Longest: ${journalStreak.longest} day${journalStreak.longest===1?"":"s"}</p></div>
        <div class="card glass"><h4>Journal</h4><p style="margin-top:4px">${journalStreak.totalEntries} entr${journalStreak.totalEntries===1?"y":"ies"} logged.</p><div class="cta-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('journal')">Open Journal</button></div></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Recent History</h4>
        ${history.length ? history.slice().reverse().slice(0, 5).map(h => `
          <div class="mini-bar-row"><span>${new Date(h.timestamp).toLocaleDateString()}</span><span>${h.archetype || ""}${h.soul ? ` &bull; ${h.soul}` : ""}</span></div>`).join("")
          : `<p>No history yet.</p>`}
        <div class="careers-toggle"><button onclick="click(380);navigate('growth')">See full Growth page</button></div>
      </div>

      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Compare</h4><p>See how you and someone else line up.</p><div class="cta-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('compare')">Compare Two</button><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('party')">Party Compare</button></div></div>
        <div class="card glass"><h4>Improve</h4><p>Suggestions built around your actual result.</p><div class="cta-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('improve')">Open Improve</button></div></div>
      </div>
      <div class="grid-2" style="margin-top:12px">
        <div class="card glass"><h4>Frameworks</h4><p>MBTI, Big Five, DISC, and Enneagram, unpacked in full.</p><div class="cta-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('frameworks')">Open Frameworks</button></div></div>
        <div class="card glass"><h4>Groups</h4><p>Saved party rosters for people you compare often.</p><div class="cta-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="click(380);navigate('party')">Manage Groups</button></div></div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Export &amp; Import</h4>
        <p>Move your profile to another browser or device, or back it up as a file.</p>
        <div class="cta-row" style="margin-top:8px">
          <button class="btn btn-ghost btn-sm" onclick="exportProfile()">Export Profile (.pf)</button>
          <button class="btn btn-ghost btn-sm" onclick="importProfile()">Import Profile (.pf)</button>
        </div>
      </div>

      <div class="card glass" style="margin-top:12px">
        <h4>Settings</h4>
        <div class="mini-bar-row"><span>Theme</span><button class="btn btn-ghost btn-sm" onclick="toggleTheme();renderProfile()">${currentTheme === "light" ? "Switch to dark" : "Switch to light"}</button></div>
        <div class="mini-bar-row"><span>Sound</span><button class="btn btn-ghost btn-sm" onclick="toggleSound();renderProfile()">${soundOn ? "Turn off" : "Turn on"}</button></div>
      </div>

      <div class="card glass" style="margin-top:12px;text-align:center">
        <h4>About Forge</h4>
        <p style="color:var(--text-muted)">Local-first, no account, no server. Your data never leaves this device unless you export it yourself.</p>
        <div class="cta-row" style="justify-content:center;margin-top:8px">
          <a class="btn btn-ghost btn-sm" href="legal.html">Terms &amp; Credits</a>
          <button class="btn btn-ghost btn-sm" onclick="showPrivacyModal()">Privacy</button>
        </div>
      </div>
    </div>
  `;
  initCountUps(root);
}
