/* =========================================================================
   FORGE - GLOBAL UI CHROME
   Theme + sound, shared motion utilities, nav/top-bar, toasts, privacy
   modal, the QR generator, and the premium scrollbar. Loaded on every
   page after engine.js and before that page's own script.
   ========================================================================= */

// Generic HTML-escaping for any user-entered string (names, occupations,
// pasted codes, ...) dropped into a template literal. Lives here rather
// than in one page's own file because it's used well beyond onboarding —
// result.js, compatibility.js, compare.js, and home.js all escape a name
// with it too, and every page loads global.js.
function obEsc(str){
  return String(str == null ? "" : str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* =========================================================================
   PERSONAFORGE, MINI QR ENCODER
   A from-scratch QR code generator (no external library, per the
   zero-dependency requirement). Supports byte-mode encoding, error
   correction level L, versions 1 through 5 (up to 108 bytes of data,
   comfortably more than a PersonaForge share URL needs). Implements the
   ISO/IEC 18004 structure: Reed-Solomon error correction over GF(256),
   finder/timing/alignment/dark-module placement, zigzag data placement,
   all 8 mask patterns scored by the standard 4 penalty rules, and BCH
   format-info encoding.
   Renders straight to a <canvas>, nothing here touches the DOM until
   drawQR() is called.
   ========================================================================= */

const QR = (function(){

  /* ---- GF(256) tables, primitive polynomial 0x11D ---------------------- */
  const GF_EXP = new Array(512);
  const GF_LOG = new Array(256);
  (function buildTables(){
    let x = 1;
    for (let i = 0; i < 255; i++){
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();
  function gfMul(a, b){
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  /* ---- Reed-Solomon generator polynomial and encoding ------------------- */
  function buildGenerator(ecCount){
    let poly = [1];
    for (let i = 0; i < ecCount; i++){
      const term = [1, GF_EXP[i]];
      const next = new Array(poly.length + 1).fill(0);
      for (let a = 0; a < poly.length; a++){
        for (let b = 0; b < term.length; b++){
          next[a + b] ^= gfMul(poly[a], term[b]);
        }
      }
      poly = next;
    }
    return poly;
  }
  function rsEncode(dataBytes, ecCount){
    const generator = buildGenerator(ecCount);
    const remainder = dataBytes.slice();
    for (let i = 0; i < dataBytes.length; i++) remainder.push(0);
    for (let i = 0; i < dataBytes.length; i++){
      const coef = remainder[i];
      if (coef === 0) continue;
      for (let j = 0; j < generator.length; j++){
        remainder[i + j] ^= gfMul(generator[j], coef);
      }
    }
    return remainder.slice(dataBytes.length, dataBytes.length + ecCount);
  }

  /* ---- Version capacity table, ECC level L, single block ---------------- */
  const VERSIONS = [
    { v:1, size:21, dataCodewords:19, ecCodewords:7 },
    { v:2, size:25, dataCodewords:34, ecCodewords:10, align:18 },
    { v:3, size:29, dataCodewords:55, ecCodewords:15, align:22 },
    { v:4, size:33, dataCodewords:80, ecCodewords:20, align:26 },
    { v:5, size:37, dataCodewords:108, ecCodewords:26, align:30 },
  ];

  function pickVersion(byteLength){
    // 4 bits mode + 8 bits count indicator + 8*len data, needs to fit with
    // room for the terminator inside the version's data codeword capacity.
    for (const ver of VERSIONS){
      const capacityBits = ver.dataCodewords * 8;
      const neededBits = 4 + 8 + byteLength * 8;
      if (neededBits <= capacityBits) return ver;
    }
    return null; // caller should shorten the payload
  }

  /* ---- Bit buffer build (byte mode) -------------------------------------- */
  function buildDataCodewords(text, ver){
    const bytes = Array.from(new TextEncoder().encode(text));
    const bits = [];
    const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    pushBits(0b0100, 4);           // byte mode indicator
    pushBits(bytes.length, 8);     // character count (versions 1-9)
    bytes.forEach(b => pushBits(b, 8));

    const capacityBits = ver.dataCodewords * 8;
    const termLen = Math.min(4, capacityBits - bits.length);
    for (let i = 0; i < termLen; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8){
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      codewords.push(byte);
    }
    const padBytes = [0xEC, 0x11];
    let p = 0;
    while (codewords.length < ver.dataCodewords){
      codewords.push(padBytes[p % 2]);
      p++;
    }
    return codewords;
  }

  function bytesToBits(bytes){
    const bits = [];
    bytes.forEach(b => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
    return bits;
  }

  /* ---- Matrix construction ------------------------------------------------ */
  function makeEmptyGrid(size){
    return Array.from({ length: size }, () => new Array(size).fill(0));
  }
  function makeReservedGrid(size){
    return Array.from({ length: size }, () => new Array(size).fill(false));
  }

  function placeFinder(matrix, reserved, r0, c0){
    for (let r = -1; r <= 7; r++){
      for (let c = -1; c <= 7; c++){
        const R = r0 + r, C = c0 + c;
        if (R < 0 || C < 0 || R >= matrix.length || C >= matrix.length) continue;
        reserved[R][C] = true;
        const inCore = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        if (!inCore){ matrix[R][C] = 0; continue; }
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[R][C] = (isBorder || isCenter) ? 1 : 0;
      }
    }
  }
  function placeAlignment(matrix, reserved, r0, c0){
    for (let r = -2; r <= 2; r++){
      for (let c = -2; c <= 2; c++){
        const R = r0 + r, C = c0 + c;
        reserved[R][C] = true;
        const isBorder = r === -2 || r === 2 || c === -2 || c === 2;
        const isCenter = r === 0 && c === 0;
        matrix[R][C] = (isBorder || isCenter) ? 1 : 0;
      }
    }
  }
  function placeTiming(matrix, reserved, size){
    for (let i = 8; i < size - 8; i++){
      if (!reserved[6][i]){ matrix[6][i] = i % 2 === 0 ? 1 : 0; reserved[6][i] = true; }
      if (!reserved[i][6]){ matrix[i][6] = i % 2 === 0 ? 1 : 0; reserved[i][6] = true; }
    }
  }
  function reserveFormatAreas(reserved, size){
    for (let i = 0; i <= 8; i++){ reserved[8][i] = true; reserved[i][8] = true; }
    for (let i = 0; i < 8; i++){ reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  }

  const MASKS = [
    (r,c) => (r + c) % 2 === 0,
    (r,c) => r % 2 === 0,
    (r,c) => c % 3 === 0,
    (r,c) => (r + c) % 3 === 0,
    (r,c) => (Math.floor(r/2) + Math.floor(c/3)) % 2 === 0,
    (r,c) => ((r*c) % 2) + ((r*c) % 3) === 0,
    (r,c) => (((r*c) % 2) + ((r*c) % 3)) % 2 === 0,
    (r,c) => (((r+c) % 2) + ((r*c) % 3)) % 2 === 0,
  ];

  function placeData(matrix, reserved, size, dataBits){
    let bitIndex = 0;
    let row = size - 1;
    let col = size - 1;
    let dirUp = true;
    while (col > 0){
      if (col === 6) col = 5;
      // eslint-disable-next-line no-constant-condition
      while (true){
        for (let cc = 0; cc < 2; cc++){
          const c = col - cc;
          if (!reserved[row][c]){
            const bit = bitIndex < dataBits.length ? dataBits[bitIndex] : 0;
            matrix[row][c] = bit;
            bitIndex++;
          }
        }
        if (dirUp){
          if (row === 0){ dirUp = false; break; }
          row--;
        } else {
          if (row === size - 1){ dirUp = true; break; }
          row++;
        }
      }
      col -= 2;
    }
  }

  function applyMask(matrix, reserved, size, maskFn){
    const out = makeEmptyGrid(size);
    for (let r = 0; r < size; r++){
      for (let c = 0; c < size; c++){
        out[r][c] = reserved[r][c] ? matrix[r][c] : (matrix[r][c] ^ (maskFn(r,c) ? 1 : 0));
      }
    }
    return out;
  }

  function penalty(matrix, size){
    let score = 0;
    // Rule 1: runs of 5+ same color, rows then columns
    for (let r = 0; r < size; r++){
      let run = 1;
      for (let c = 1; c < size; c++){
        if (matrix[r][c] === matrix[r][c-1]) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    for (let c = 0; c < size; c++){
      let run = 1;
      for (let r = 1; r < size; r++){
        if (matrix[r][c] === matrix[r-1][c]) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++){
      for (let c = 0; c < size - 1; c++){
        const v = matrix[r][c];
        if (v === matrix[r][c+1] && v === matrix[r+1][c] && v === matrix[r+1][c+1]) score += 3;
      }
    }
    // Rule 3: finder-like 1:1:3:1:1 patterns with 4-module light run
    const patternA = [1,0,1,1,1,0,1,0,0,0,0];
    const patternB = [0,0,0,0,1,0,1,1,1,0,1];
    const matchAt = (arr, start, pattern) => {
      for (let i = 0; i < pattern.length; i++) if (arr[start+i] !== pattern[i]) return false;
      return true;
    };
    for (let r = 0; r < size; r++){
      const row = matrix[r];
      for (let c = 0; c <= size - 11; c++){
        if (matchAt(row, c, patternA) || matchAt(row, c, patternB)) score += 40;
      }
    }
    for (let c = 0; c < size; c++){
      const col = matrix.map(row => row[c]);
      for (let r = 0; r <= size - 11; r++){
        if (matchAt(col, r, patternA) || matchAt(col, r, patternB)) score += 40;
      }
    }
    // Rule 4: dark/light balance
    let dark = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (matrix[r][c]) dark++;
    const percent = (dark / (size*size)) * 100;
    const deviation = Math.floor(Math.abs(percent - 50) / 5);
    score += deviation * 10;
    return score;
  }

  /* ---- BCH format info ---------------------------------------------------- */
  function bchFormat(data5){
    let d = data5 << 10;
    const g = 0b10100110111; // generator, degree 10
    for (let i = 14; i >= 10; i--){
      if ((d >> i) & 1) d ^= (g << (i - 10));
    }
    const format = (data5 << 10) | d;
    return format ^ 0b101010000010010;
  }
  function placeFormatInfo(matrix, size, maskId){
    const eccBits = 0b01; // level L
    const data5 = (eccBits << 3) | maskId;
    const format = bchFormat(data5);
    const bit = i => (format >> i) & 1;
    for (let i = 0; i <= 5; i++) matrix[i][8] = bit(i);
    matrix[7][8] = bit(6);
    matrix[8][8] = bit(7);
    matrix[8][7] = bit(8);
    for (let i = 9; i <= 14; i++) matrix[8][14 - i] = bit(i);
    for (let i = 0; i <= 7; i++) matrix[8][size - 1 - i] = bit(i);
    for (let i = 8; i <= 14; i++) matrix[size - 15 + i][8] = bit(i);
    matrix[size - 8][8] = 1; // dark module
  }

  /* ---- Top-level encode: text -> boolean matrix --------------------------- */
  function encode(text){
    const byteLen = new TextEncoder().encode(text).length;
    const ver = pickVersion(byteLen);
    if (!ver) return null;
    const dataCodewords = buildDataCodewords(text, ver);
    const ecCodewords = rsEncode(dataCodewords, ver.ecCodewords);
    const allCodewords = dataCodewords.concat(ecCodewords);
    const dataBits = bytesToBits(allCodewords);

    const size = ver.size;
    const matrix = makeEmptyGrid(size);
    const reserved = makeReservedGrid(size);

    placeFinder(matrix, reserved, 0, 0);
    placeFinder(matrix, reserved, 0, size - 7);
    placeFinder(matrix, reserved, size - 7, 0);
    if (ver.align){
      // The QR spec's alignment coordinate table lists candidate
      // positions (e.g. {6, 18} for version 2); for versions 2-5 (one
      // extra alignment pattern each) the only combination that doesn't
      // land on a finder pattern is (align, align), so that single
      // stored coordinate is used for both row and column here.
      placeAlignment(matrix, reserved, ver.align, ver.align);
    }
    placeTiming(matrix, reserved, size);
    reserveFormatAreas(reserved, size);
    reserved[size - 8][8] = true; // dark module cell

    placeData(matrix, reserved, size, dataBits);

    let best = null, bestScore = Infinity, bestMaskId = 0;
    for (let m = 0; m < MASKS.length; m++){
      const masked = applyMask(matrix, reserved, size, MASKS[m]);
      placeFormatInfo(masked, size, m);
      const score = penalty(masked, size);
      if (score < bestScore){ bestScore = score; best = masked; bestMaskId = m; }
    }
    return { matrix: best, size, version: ver.v, maskId: bestMaskId };
  }

  /* ---- Render to canvas ---------------------------------------------------- */
  function drawToCanvas(canvas, text, options){
    const result = encode(text);
    if (!result) return false;
    const opts = options || {};
    const scale = opts.scale || 8;
    const margin = opts.margin != null ? opts.margin : 4;
    const dark = opts.dark || "#0F1117";
    const light = opts.light || "#F8FAFC";
    const size = result.size;
    const total = size + margin * 2;
    canvas.width = total * scale;
    canvas.height = total * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark;
    for (let r = 0; r < size; r++){
      for (let c = 0; c < size; c++){
        if (result.matrix[r][c]){
          ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
        }
      }
    }
    return true;
  }

  return {
    encode, drawToCanvas, pickVersion,
    _internal: { makeEmptyGrid, makeReservedGrid, placeFinder, placeAlignment, placeTiming,
      reserveFormatAreas, VERSIONS, GF_EXP, GF_LOG, gfMul, rsEncode, buildGenerator,
      bchFormat, MASKS },
  };
})();






/* =========================================================================
   PERSONAFORGE, APP MODULE
   Renders every screen into #app. No framework, no build step.
   ========================================================================= */

const root = document.getElementById("app");
let soundOn = localStorage.getItem("pf_sound") !== "off";
let currentTheme = localStorage.getItem("pf_theme") === "light" ? "light" : "dark";

/* ---------------- theme (light / dark) ------------------------------------
   Dark is the default since that's the theme that's been built and
   refined so far, but light mode is fully implemented too. Switching is
   instant via a CSS attribute (everything else uses CSS custom
   properties so it repaints on its own), except canvas-drawn pixels
   (radar chart, QR code) which need an explicit redraw since their
   colors are baked in at draw time, not read live from CSS. */
function applyTheme(theme){
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pf_theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#FFFFFF" : "#0F1117");
}
let themeScanTransition = null;
function toggleTheme(){
  // A click while the previous scan is still playing would call
  // startViewTransition() again before the first transition has settled.
  // Chromium responds by rejecting the in-flight transition's `ready`
  // promise with InvalidStateError ("Transition was aborted because of
  // invalid state") -- and since nothing held a reference to it, that
  // rejection went unhandled. Ignoring re-entrant clicks until the current
  // scan finishes avoids the overlap instead of just swallowing the error.
  if (themeScanTransition) return;
  const next = currentTheme === "light" ? "dark" : "light";
  const applyAndRefresh = () => {
    applyTheme(next);
    // Only the result page has canvas-drawn pixels (radar chart, QR code)
    // whose colors are baked in at draw time rather than read live from
    // CSS, so it's the one screen that needs a forced re-render. Every
    // other screen (quiz, landing, compare, party) uses CSS custom
    // properties directly and repaints on its own, so toggling theme
    // there never interrupts what the person is doing (e.g. mid-quiz).
    if (typeof lastResult !== "undefined" && lastResult && document.getElementById("radar")){ renderResult(); }
    else { updateThemeIcon(); updateBrandLogo(); }
  };
  click(300);
  // The bottom-to-top scan is built on the View Transitions API: it
  // snapshots the page before/after the DOM change below and lets us
  // reveal the "after" snapshot with a custom clip-path animation (see
  // the ::view-transition-new(root) keyframes) instead of the browser's
  // default cross-fade. No polyfill or manual DOM cloning needed, but
  // it's Chromium-only today — Safari/Firefox and reduced-motion simply
  // keep the previous instant-ish CSS-transition swap, which is a fine
  // degradation since the scan is a delight-on-top, not a requirement.
  if (reducedMotion() || typeof document.startViewTransition !== "function"){
    document.body.classList.add("theme-transitions");
    applyAndRefresh();
    return;
  }
  themeScanTransition = document.startViewTransition(applyAndRefresh);
  // `ready` can still reject for reasons outside our control (e.g. the tab
  // being hidden mid-scan) even with the re-entrancy guard above, so it
  // needs its own handler rather than being left to reject unheard.
  themeScanTransition.ready.catch(() => {});
  themeScanTransition.finished.finally(() => { themeScanTransition = null; });
}
function updateThemeIcon(){
  const item = document.getElementById("navThemeItem");
  if (item) item.innerHTML = `${currentTheme === "light" ? ICONS.moon : ICONS.sun}<span>${currentTheme === "light" ? "Dark mode" : "Light mode"}</span>`;
}
function setPageTitle(suffix){
  document.title = suffix ? `Forge \u2022 ${suffix}` : "Forge";
}

function updateBrandLogo(){
  const path = currentTheme === "light" ? "assets/Logo_black.svg" : "assets/Logo_white.svg";
  const navLogo = document.getElementById("navLogo");
  if (navLogo) navLogo.src = path;
  const footerLogo = document.getElementById("lpFooterLogo");
  if (footerLogo) footerLogo.src = path;
}

/* ---------------- tiny sound (optional, WebAudio, no assets) ---------- */
let audioCtx = null;
function click(freq = 440, dur = 0.045){
  if (!soundOn) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.frequency.value = freq; o.type = "sine";
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e){ /* audio unsupported, fail silently */ }
}

/* ---------------- background music -------------------------------------
   BG.mp3 lives in the assets folder, loaded via
   the <audio id="bgMusic"> element outside #app so it keeps playing
   across every screen re-render instead of restarting. The same speaker
   icon that mutes the tiny click sounds controls this too. Browsers
   block audio autoplay until a real user gesture, so playback is
   attempted on the first interaction anywhere on the page, once. */
const bgMusic = document.getElementById("bgMusic");
if (bgMusic){
  bgMusic.volume = 0.35;
  bgMusic.addEventListener("error", () => {
    // assets/BG.mp3 missing or failed to load: fail silently, never break the app
  });
  const startMusicOnce = () => {
    if (!soundOn){ document.removeEventListener("pointerdown", startMusicOnce); return; }
    bgMusic.play().then(() => {
      document.removeEventListener("pointerdown", startMusicOnce);
    }).catch(() => {
      // Autoplay genuinely blocked even after a real gesture (happens on
      // some mobile browsers with stricter policies). Show a visible,
      // dismissible prompt instead of failing silently with no way for
      // the person to know why there's no sound.
      showAudioPrompt();
    });
  };
  document.addEventListener("pointerdown", startMusicOnce);
}
function showAudioPrompt(){
  if (document.getElementById("audioPrompt")) return;
  const el = document.createElement("button");
  el.id = "audioPrompt";
  el.className = "audio-prompt";
  el.textContent = "Tap anywhere to enable audio";
  el.onclick = retryAudioPrompt;
  document.body.appendChild(el);
  document.addEventListener("pointerdown", retryAudioPrompt);
}
function retryAudioPrompt(){
  if (!bgMusic || !soundOn) return;
  bgMusic.play().then(() => {
    const el = document.getElementById("audioPrompt");
    if (el) el.remove();
    document.removeEventListener("pointerdown", retryAudioPrompt);
  }).catch(() => {});
}

/* ---------------- decorative venetian blind bars ----------------------*/
/* ---------------- micro-interactions -------------------------------------*/
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateCountUp(el, target, duration){
  if (reducedMotion() || !el){ if (el) el.textContent = target + (el.dataset.suffix || ""); return; }
  const start = performance.now();
  const suffix = el.dataset.suffix || "";
  function tick(now){
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function initCountUps(container){
  (container || document).querySelectorAll(".count-up[data-target]").forEach(el => {
    const target = parseFloat(el.dataset.target);
    if (Number.isNaN(target)) return;
    animateCountUp(el, target, 900 + Math.random() * 300);
  });
}

function setupProgressiveReveal(container){
  if (reducedMotion()){
    (container || document).querySelectorAll(".section").forEach(s => s.classList.add("revealed"));
    return;
  }
  const sections = (container || document).querySelectorAll(".section");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  sections.forEach(s => observer.observe(s));
}

function fireConfetti(){
  if (reducedMotion()) return;
  const colors = ["#A78BFA", "#7DD3FC", "#6EE7B7", "#FDBA74", "#FACC15"];
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);
  const count = 46;
  for (let i = 0; i < count; i++){
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = (45 + Math.random() * 10) + "%";
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--dx", (Math.random() * 2 - 1) * 220 + "px");
    piece.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    piece.style.animationDelay = (Math.random() * 0.15) + "s";
    piece.style.animationDuration = (1.1 + Math.random() * 0.6) + "s";
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 2200);
}

/* ---------------- per-archetype accent theming ---------------------------
   Buttons, graphs, gradients and glows subtly shift to match the current
   person's own archetype colors on the result page, and reset to the
   default lavender/sky brand colors everywhere else. */
function setAccentColors(c1, c2){
  document.documentElement.style.setProperty("--user-accent-1", c1 || "#A78BFA");
  document.documentElement.style.setProperty("--user-accent-2", c2 || "#7DD3FC");
}

function spawnAmbience(){
  const layer = document.getElementById("embers");
  if (!layer || layer.dataset.done) return;
  layer.dataset.done = "1";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const orbColors = [
    "radial-gradient(circle, #A78BFA, transparent 70%)",
    "radial-gradient(circle, #7DD3FC, transparent 70%)",
    "radial-gradient(circle, #6EE7B7, transparent 70%)",
    "radial-gradient(circle, #FDBA74, transparent 70%)",
  ];
  const positions = [
    { left:"-10%", top:"-8%" },
    { left:"65%", top:"5%" },
    { left:"10%", top:"55%" },
    { left:"70%", top:"60%" },
  ];
  positions.forEach((pos, i) => {
    const orb = document.createElement("div");
    orb.className = "blind-bar";
    orb.style.left = pos.left;
    orb.style.top = pos.top;
    orb.style.background = orbColors[i % orbColors.length];
    orb.style.animationDuration = (16 + i * 3) + "s";
    orb.style.animationDelay = (i * 1.4) + "s";
    layer.appendChild(orb);
  });
}

function pickLines(n, sourcePool){
  const pool = [...(sourcePool || CALC_LINES)];
  const out = [];
  for (let i = 0; i < n && pool.length; i++){
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/* ---------------- shared chrome ---------------------------------------*/
/* ---------------- icon set -------------------------------------------
   One consistent hand-authored line-icon family (1.6px stroke, rounded
   caps/joins, 20x20 grid), replacing the emoji glyphs. No external icon
   library, since this environment has no live network access to fetch
   one, but the visual language stays cohesive across every use. */
const ICONS = {
  home: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 10 3l7 6.5"/><path d="M5 8.5V17h10V8.5"/><path d="M8 17v-5h4v5"/></svg>`,
  sun: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="3.4"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7"/></svg>`,
  moon: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 12.2A6.8 6.8 0 1 1 7.8 3.5a6 6 0 0 0 8.7 8.7Z"/></svg>`,
  soundOn: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5h3l4-3.2v11.4l-4-3.2H3z"/><path d="M13 7.3a4 4 0 0 1 0 5.4M15.3 5a7.2 7.2 0 0 1 0 10"/></svg>`,
  soundOff: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5h3l4-3.2v11.4l-4-3.2H3z"/><path d="M13 7.5l4 5M17 7.5l-4 5"/></svg>`,
  menu: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>`,
  close: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l10 10M15 5 5 15"/></svg>`,
  lock: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="9" width="11" height="8" rx="2.4"/><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/></svg>`,
  wifi: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5a10 10 0 0 1 14 0M5.6 10.6a6.2 6.2 0 0 1 8.8 0M8.4 13.6a2.4 2.4 0 0 1 3.2 0"/><circle cx="10" cy="16.2" r="1" fill="currentColor" stroke="none"/></svg>`,
  layers: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 17 8l-7 4.5L3 8z"/><path d="m4.6 10.8-1.6 1 7 4.5 7-4.5-1.6-1"/></svg>`,
  people: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.2" cy="7" r="2.6"/><path d="M2.5 16c.5-3 2.3-4.6 4.7-4.6s4.2 1.6 4.7 4.6"/><circle cx="14.4" cy="7.4" r="2.1"/><path d="M13 11.6c2 .1 3.5 1.6 3.9 4"/></svg>`,
};

function topBar(showBack){
  return `
  <div class="top-bar">
    <div class="nav-zone nav-left">
      <button class="nav-pill" onclick="goHome()" aria-label="Go to home">
        <span class="nav-pill-icon">${ICONS.home}</span><span class="nav-pill-label">Home</span>
      </button>
    </div>
    <div class="nav-zone nav-center">
      <img id="navLogo" class="nav-logo" alt="Forge" src="${currentTheme === "light" ? "assets/Logo_black.svg" : "assets/Logo_white.svg"}"
        onerror="this.style.display='none'; document.getElementById('navLogoFallback').style.display='inline';" />
      <span id="navLogoFallback" class="nav-logo-fallback" style="display:none">Forge<span class="brand-dot">.</span></span>
    </div>
    <div class="nav-zone nav-right">
      <button class="btn btn-primary btn-sm nav-signup" onclick="showComingSoon('Accounts')">Sign Up<span class="pill-arrow">&rarr;</span></button>
      <button class="icon-btn" id="navMenuBtn" onclick="toggleNavMenu()" aria-haspopup="true" aria-expanded="false" aria-label="Open menu">${ICONS.menu}</button>
    </div>
    <div class="nav-menu-backdrop" id="navMenuBackdrop" hidden></div>
    <div class="nav-menu" id="navMenu" hidden>
     <div class="nav-menu-inner">
      <button class="nav-menu-item nav-menu-signup" onclick="closeNavMenu();showComingSoon('Accounts')"><span>Sign Up &rarr;</span></button>
      <button class="nav-menu-item" id="navThemeItem" onclick="toggleTheme()">${currentTheme === "light" ? ICONS.moon : ICONS.sun}<span>${currentTheme === "light" ? "Dark mode" : "Light mode"}</span></button>
      <button class="nav-menu-item" id="navSoundItem" onclick="toggleSound()">${soundOn ? ICONS.soundOn : ICONS.soundOff}<span>Sound ${soundOn ? "on" : "off"}</span></button>
      <div class="nav-menu-sep"></div>
      <button class="nav-menu-item" onclick="closeNavMenu();click(380);navigate('compare')"><span>Compare Results</span></button>
      <button class="nav-menu-item" onclick="closeNavMenu();click(380);navigate('party')"><span>Party Compare</span></button>
      <a class="nav-menu-item" href="legal.html"><span>Terms of Service</span></a>
      <button class="nav-menu-item" onclick="closeNavMenu();showPrivacyModal()"><span>Privacy</span></button>
      <div class="nav-menu-sep"></div>
      <div class="nav-menu-code">
        <label for="quickCode">Have someone's code?</label>
        <input type="text" id="quickCode" placeholder="Name-PF2-...">
        <div class="nav-menu-code-row">
          <button class="btn btn-ghost btn-sm" onclick="viewProfileFromCode()">View</button>
          <button class="btn btn-ghost btn-sm" onclick="quickCompareGo()">Compare</button>
        </div>
      </div>
     </div>
    </div>
  </div>`;
}
let navMenuOpen = false;
function toggleNavMenu(){
  navMenuOpen ? closeNavMenu() : openNavMenu();
}
function openNavMenu(){
  const menu = document.getElementById("navMenu");
  const btn = document.getElementById("navMenuBtn");
  const backdrop = document.getElementById("navMenuBackdrop");
  if (!menu || !btn) return;
  navMenuOpen = true;
  menu.hidden = false;
  if (backdrop) backdrop.hidden = false;
  requestAnimationFrame(() => { menu.classList.add("open"); if (backdrop) backdrop.classList.add("open"); });
  btn.setAttribute("aria-expanded", "true");
  btn.innerHTML = ICONS.close;
  document.addEventListener("pointerdown", onNavMenuOutsideClick, true);
  document.addEventListener("keydown", onNavMenuKey);
}
function closeNavMenu(){
  const menu = document.getElementById("navMenu");
  const btn = document.getElementById("navMenuBtn");
  const backdrop = document.getElementById("navMenuBackdrop");
  navMenuOpen = false;
  document.removeEventListener("pointerdown", onNavMenuOutsideClick, true);
  document.removeEventListener("keydown", onNavMenuKey);
  if (backdrop) backdrop.classList.remove("open");
  setTimeout(() => { if (!navMenuOpen && backdrop) backdrop.hidden = true; }, 400);
  if (!menu || !btn) return;
  menu.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = ICONS.menu;
  // Matches .nav-menu's longest close transition (grid-template-rows,
  // 550ms) so `hidden` lands right as the collapse finishes rather than
  // cutting it off mid-shrink.
  setTimeout(() => { if (!navMenuOpen && menu) menu.hidden = true; }, 550);
}
function onNavMenuOutsideClick(e){
  const menu = document.getElementById("navMenu");
  const btn = document.getElementById("navMenuBtn");
  if (!menu || (menu.contains(e.target) || (btn && btn.contains(e.target)))) return;
  closeNavMenu();
}
function onNavMenuKey(e){
  if (e.key !== "Escape") return;
  closeNavMenu();
  const btn = document.getElementById("navMenuBtn");
  if (btn) btn.focus();
}

/* ---------------- nav-menu "have someone's code?" quick lookup -----------
   The nav-menu's quick-code box appears in topBar() on every page, so its
   two handlers need to work everywhere. "Compare" already only needs
   sessionStorage + navigate(), both page-agnostic. "View" wants to render
   the result screen directly, which for now only exists on index.html; on
   any other page it hands off via the same one-shot sessionStorage flag
   share.js's openSharedProfile() uses. */
function quickCompareGo(){
  const val = document.getElementById("quickCode").value.trim();
  if (!val) return;
  sessionStorage.setItem("pf_prefill_b", val);
  click(420);
  navigate("compare");
}
function viewProfileFromCode(){
  const val = document.getElementById("quickCode").value.trim();
  if (!val) return;
  const decoded = decodeCode(val);
  if (!decoded){ alert("That code doesn't look right. Check for typos and try again."); return; }
  click(500);
  if (typeof PF_PAGE !== "undefined" && PF_PAGE === "result"){
    lastResult = buildResultFromDecoded(decoded, val);
    careersExpanded = false;
    funStatsOpen = false;
    renderResult();
  } else {
    sessionStorage.setItem("pf_view_shared_code", val);
    location.href = "result.html";
  }
}

/* ---------------- Toast + inert "coming soon" affordances --------------
   A couple of surfaces in the redesigned marketing shell (Sign Up, the
   optional-account panel) are intentionally not backed by any real
   account system yet, matching Forge's no-backend, no-accounts model.
   Rather than a dead click, they surface an honest, on-brand toast
   instead of the browser's native alert(). */
let toastTimer = null;
function showToast(message){
  let el = document.getElementById("toast");
  if (!el){
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function showComingSoon(feature){
  click(420);
  showToast(`${feature} aren't built yet. Forge stays fully on-device for now. Star the repo to hear when that changes.`);
}
function showPrivacyModal(){
  click(460);
  if (document.getElementById("privacyModal")) return;
  const overlay = document.createElement("div");
  overlay.id = "privacyModal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card glass" role="dialog" aria-modal="true" aria-labelledby="privacyModalTitle">
      <button class="icon-btn modal-close" onclick="closePrivacyModal()" aria-label="Close">${ICONS.close}</button>
      <div class="eyebrow accent">PRIVACY</div>
      <h3 id="privacyModalTitle">Everything stays on your device</h3>
      <p>Forge never uploads your personality anywhere. Answers, results, and history are stored only in this browser's local storage. Nothing is sent to a server, because Forge doesn't have one.</p>
      <p>A profile only ever leaves your device if you choose to share its code or link yourself.</p>
      <button class="btn btn-primary" onclick="closePrivacyModal()">Got it</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePrivacyModal(); });
  document.addEventListener("keydown", onPrivacyModalKey);
}
function onPrivacyModalKey(e){ if (e.key === "Escape") closePrivacyModal(); }
function closePrivacyModal(){
  const overlay = document.getElementById("privacyModal");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.removeEventListener("keydown", onPrivacyModalKey);
  setTimeout(() => overlay.remove(), 220);
}
function goHome(){
  if (typeof session !== "undefined" && session && !session.isComplete()){
    saveQuizProgress();
  }
  click(340);
  navigate("landing");
}

/* ---------------- clean URLs --------------------------------------------
   quiz.html/result.html/compare.html/legal.html are also reachable at
   extensionless paths ("/quiz", "/result", "/compare", "/legal"). The
   REAL file each page loads from is unchanged (every internal link and
   location.href still points at the .html file directly — no extra
   network round trip on ordinary in-app navigation); this just rewrites
   the visible address bar to the clean form right after that real file
   has loaded, via history.replaceState (no reload, no flash). Called
   once near the top of each of those four pages' own boot <script>.
   A direct load, bookmark, or refresh of the clean path itself (where
   the browser asks the server for "/quiz", not "quiz.html") is handled
   separately by 404.html, which recognizes the same route name and
   redirects to the real file — this function then cleans the address
   bar again once that lands, so the end state is identical either way. */
function useCleanURL(routeName){
  if (!window.history || !history.replaceState) return;
  try{
    const url = new URL(location.href);
    if (!/\.html$/i.test(url.pathname)) return; // already clean, nothing to do
    url.pathname = url.pathname.replace(/[^/]*\.html$/i, routeName);
    history.replaceState(history.state, "", url.toString());
  } catch(e){ /* not fatal — worst case the .html form stays visible */ }
}

/* ---------------- routing ---------------------------------------------
   "party" is just a view within compare.html now (like the compare page's
   own two internal modes), not a separate page — so both "compare" and
   "party" render in place when already on compare.html, and become a real
   navigation (with ?party=1 to land straight on the group view) otherwise.
   Same in-place-vs-navigate pattern for "landing" on index.html. Every
   page sets its own PF_PAGE constant in its boot script so this can tell
   where it's actually running (every render* function exists on every
   page now that they're all bundled in pages.js, so a plain
   typeof-function check can no longer tell pages apart).

   These location.href assignments (and every other internal href/
   location.href in the app) intentionally still target the real .html
   files rather than the clean paths ("/compare", not "compare.html") —
   that's what lets a real navigation happen with zero extra round trip.
   The clean address bar comes from useCleanURL() (above), which each
   destination page calls on load; a direct load of a clean path instead
   of a click is handled by 404.html. See useCleanURL()'s own comment for
   the full picture. */
function navigate(view){
  window.scrollTo(0, 0);
  clearShareableURL();
  const onPage = typeof PF_PAGE !== "undefined" ? PF_PAGE : null;
  if (view === "landing"){
    if (onPage === "index") renderLanding();
    else location.href = "index.html";
  }
  else if (view === "compare"){
    if (onPage === "compare"){ setCompareModeURL(false); renderCompare(); }
    else location.href = "compare.html";
  }
  else if (view === "party"){
    if (onPage === "compare"){ setCompareModeURL(true); renderParty(); }
    else location.href = "compare.html?party=1";
  }
}

// Keeps compare.html's own address bar in sync with which mode (regular
// or party) is on screen when switched in place — without this, the URL
// stayed wherever it was before the switch, so a refresh or a shared
// link silently dropped a party-compare visitor back into regular
// compare. Uses replaceState (not pushState): clearShareableURL() just
// above already pushed a fresh history entry for this navigate() call,
// so this folds the mode into that same entry instead of adding a
// second one — one user click should still be one "Back" press to undo.
// compare.html's own popstate listener re-renders from the URL on the
// way back, which is what actually makes Back/Forward restore the mode.
function setCompareModeURL(isParty){
  if (!window.history || !history.replaceState) return;
  try{
    const url = new URL(location.href);
    if (isParty) url.searchParams.set("party", "1");
    else url.searchParams.delete("party");
    history.replaceState(history.state, "", url.toString());
  } catch(e){ /* not fatal — worst case the URL just doesn't reflect the mode */ }
}

function goToNameScreen(){
  location.href = "quiz.html";
}

/* A brief full-screen "calculating" beat between quiz questions and (in a
   shorter form) between upgrade-quiz questions on the result page — shared
   since both are otherwise-identical mid-flow pauses. */
function showCalcOverlay(count, done){
  document.onkeydown = null;
  const overlay = document.createElement("div");
  overlay.className = "calc-overlay";
  const line = pickLines(1)[0] || "Processing";
  overlay.innerHTML = `<div class="calc-bars"><span></span><span></span><span></span><span></span></div><div class="calc-line">${line}...</div>`;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
    done();
  }, 480);
}

function toggleSound(){
  soundOn = !soundOn;
  localStorage.setItem("pf_sound", soundOn ? "on" : "off");
  click(soundOn ? 660 : 220);
  const item = document.getElementById("navSoundItem");
  if (item) item.innerHTML = `${soundOn ? ICONS.soundOn : ICONS.soundOff}<span>Sound ${soundOn ? "on" : "off"}</span>`;
  if (bgMusic){
    if (soundOn){
      bgMusic.play().then(() => {
        const el = document.getElementById("audioPrompt");
        if (el) el.remove();
      }).catch(() => {});
    }
    else bgMusic.pause();
  }
}

const MAGNET_MAX_PX = 8;
function initMagneticButtons(container){
  if (reducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
  (container || document).querySelectorAll(".btn-primary").forEach(btn => {
    let raf = null;
    btn.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rect = btn.getBoundingClientRect();
        const x = Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, (e.clientX - rect.left - rect.width / 2) * 0.25));
        const y = Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, (e.clientY - rect.top - rect.height / 2) * 0.35));
        btn.style.setProperty("--magnet-x", x.toFixed(1) + "px");
        btn.style.setProperty("--magnet-y", y.toFixed(1) + "px");
      });
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.setProperty("--magnet-x", "0px");
      btn.style.setProperty("--magnet-y", "0px");
    });
  });
}

/* A small critically-damped-ish spring (Hooke's law + velocity damping),
   used for the quiz answer row instead of CSS transitions — multi-
   property motion (position + rotation + scale + opacity all arriving
   together) settles with one coherent physical feel this way, rather
   than three CSS properties each easing on their own separate curve.
   Reduced motion skips straight to the resting values, no animation. */
function qzApplyTransform(el, v){
  el.style.transform = `translate(${v.x || 0}px, ${v.y || 0}px) rotate(${v.rot || 0}deg) scale(${v.scale != null ? v.scale : 1})`;
  if (v.opacity != null) el.style.opacity = v.opacity;
}
function qzSpring(el, from, to, opts){
  if (reducedMotion()){ qzApplyTransform(el, to); return; }
  opts = opts || {};
  const stiffness = opts.stiffness || 210, damping = opts.damping || 22;
  const keys = Object.keys(to);
  const pos = {}, vel = {};
  keys.forEach(k => { pos[k] = from[k] != null ? from[k] : to[k]; vel[k] = 0; });
  qzApplyTransform(el, pos);
  (function tick(){
    let settled = true;
    keys.forEach(k => {
      const dx = to[k] - pos[k];
      vel[k] += (stiffness * dx - damping * vel[k]) / 60;
      pos[k] += vel[k] / 60;
      if (Math.abs(dx) > 0.001 || Math.abs(vel[k]) > 0.001) settled = false;
    });
    qzApplyTransform(el, settled ? to : pos);
    if (!settled) requestAnimationFrame(tick);
  })();
}

/* click ripple for every .btn, via delegation since buttons are
   re-created on every render rather than persisting in the DOM */
document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || reducedMotion()) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = (e.clientX - rect.left - size/2) + "px";
  ripple.style.top = (e.clientY - rect.top - size/2) + "px";
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});

/* =========================================================================
   PREMIUM SCROLLBAR — a thin overlay track + capsule thumb standing in for
   the native scrollbar (hidden via CSS above). Real scrolling is never
   touched: wheel, trackpad, keyboard, and screen readers all keep working
   exactly as the browser already handles them. This only draws a visual
   position indicator and an optional drag handle on top of it.

   Generalized into createScrollbarController() so the exact same math,
   easing, and drag/hover/hide behavior can drive more than one scrollable
   surface with zero duplicated logic — initScrollbar() below wires it up
   for the page itself, and result.js's result-detail modal reuses this
   same factory (bound to the modal's own scroll container instead of the
   window) rather than reimplementing a second scrollbar system.

   Two positions are tracked deliberately: state.targetY (where the thumb
   belongs *right now*, from the real scroll fraction) and state.y (where
   it's actually drawn). Every animation frame nudges y a fraction of the
   way toward targetY (a lerp) rather than snapping straight to it — that
   fractional catch-up is the "slight, elegant delay" the thumb should
   have, and it costs nothing but one line of math (no easing library, no
   spring state to tune). Dragging bypasses the lerp entirely and sets y
   directly, matching the pointer 1:1 — a delayed thumb while the pointer
   is actively moving it reads as laggy/disconnected, not calm.

   The rAF loop only runs while something is actually changing (scrolling,
   dragging, or still catching up from a lerp) and stops itself once
   settled, rather than ticking forever in the background. */
const SB_HIDE_MS = 1100;   // fade out this long after the last scroll (spec: ~1-1.2s)
const SB_MIN_THUMB = 28;   // never let the thumb get too small to grab
const SB_LERP = 0.22;      // how much of the remaining distance to close per frame

// config: { rail, track, thumb, getScrollTop(), getScrollHeight(), getViewportHeight(), scrollTo(px, smooth), scrollEventTarget }
// getScrollTop/getScrollHeight/getViewportHeight/scrollTo abstract away
// *what* is scrolling (window vs. a specific element) so every other piece
// of behavior below — measuring, lerping, dragging, hover/hide timing —
// stays identical regardless of which surface a given instance controls.
function createScrollbarController(config){
  const { rail, track, thumb, getScrollTop, getScrollHeight, getViewportHeight, scrollTo, scrollEventTarget } = config;
  const state = {
    y: 0, targetY: 0,          // thumb's top offset within the track, in px
    thumbH: 24, travel: 1,      // thumb height and the track's usable travel (trackH - thumbH)
    dragging: false, dragOffset: 0,
    hovering: false,
    hideTimer: null,
    looping: false,
    reduce: false,
  };

  function measure(){
    const trackH = track.clientHeight;
    const docH = getScrollHeight();
    const viewH = getViewportHeight();
    const ratio = viewH / Math.max(docH, 1);
    state.thumbH = Math.max(SB_MIN_THUMB, Math.min(trackH, trackH * ratio));
    state.travel = Math.max(1, trackH - state.thumbH);
    thumb.style.height = state.thumbH + "px";
  }
  function maxScroll(){
    return Math.max(1, getScrollHeight() - getViewportHeight());
  }
  function syncTarget(){
    const frac = Math.min(1, Math.max(0, getScrollTop() / maxScroll()));
    state.targetY = frac * state.travel;
  }
  function show(){
    rail.classList.add("active");
    if (state.hideTimer){ clearTimeout(state.hideTimer); state.hideTimer = null; }
  }
  function scheduleHide(){
    if (state.hideTimer) clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(() => {
      state.hideTimer = null;
      if (!state.hovering && !state.dragging) rail.classList.remove("active");
    }, SB_HIDE_MS);
  }
  function ensureLoop(){
    if (state.looping) return;
    state.looping = true;
    requestAnimationFrame(tick);
  }
  function tick(){
    if (state.dragging || state.reduce){
      state.y = state.targetY; // direct 1:1 while dragging; instant snap under reduced motion
    } else {
      state.y += (state.targetY - state.y) * SB_LERP;
      if (Math.abs(state.targetY - state.y) < 0.15) state.y = state.targetY;
    }
    thumb.style.transform = `translateY(${state.y}px)`;
    const settled = state.y === state.targetY;
    if (!settled || state.dragging){
      requestAnimationFrame(tick);
    } else {
      state.looping = false;
    }
  }
  function onScroll(){
    syncTarget();
    show();
    ensureLoop();
    scheduleHide();
  }
  function clientYToScroll(clientY){
    const rect = track.getBoundingClientRect();
    const thumbTop = clientY + state.dragOffset; // desired thumb top edge, viewport coords
    const frac = Math.min(1, Math.max(0, (thumbTop - rect.top) / state.travel));
    return frac * maxScroll();
  }
  function pointerDownThumb(e){
    e.preventDefault();
    state.dragging = true;
    rail.classList.add("dragging");
    // Offset between the pointer and the thumb's own top edge, so the thumb
    // doesn't jump to re-center under the cursor the instant the drag starts.
    const rect = thumb.getBoundingClientRect();
    state.dragOffset = rect.top - e.clientY;
    thumb.setPointerCapture(e.pointerId);
    show();
    ensureLoop();
  }
  function pointerMove(e){
    if (!state.dragging) return;
    scrollTo(clientYToScroll(e.clientY), false);
    syncTarget();
  }
  function pointerUp(e){
    if (!state.dragging) return;
    state.dragging = false;
    rail.classList.remove("dragging");
    try { thumb.releasePointerCapture(e.pointerId); } catch(err){}
    scheduleHide();
  }
  function pointerDownTrack(e){
    const rect = track.getBoundingClientRect();
    const clickFrac = Math.min(1, Math.max(0, (e.clientY - rect.top - state.thumbH / 2) / state.travel));
    scrollTo(clickFrac * maxScroll(), !state.reduce);
  }

  // Re-measures and re-syncs against whatever the scroll surface's
  // current size/position actually is — called on init, and by any
  // caller whose content just changed size (a window resize for the page
  // instance, a freshly-poured detail card for the modal instance).
  function refresh(){
    measure();
    syncTarget();
    ensureLoop();
  }

  state.reduce = reducedMotion();
  measure();
  syncTarget();
  state.y = state.targetY;
  thumb.style.transform = `translateY(${state.y}px)`;

  scrollEventTarget.addEventListener("scroll", onScroll, { passive: true });
  thumb.addEventListener("pointerdown", pointerDownThumb);
  thumb.addEventListener("pointermove", pointerMove);
  thumb.addEventListener("pointerup", pointerUp);
  thumb.addEventListener("pointercancel", pointerUp);
  track.addEventListener("pointerdown", pointerDownTrack);

  const onEnter = () => { state.hovering = true; show(); };
  const onLeave = () => { state.hovering = false; scheduleHide(); };
  thumb.addEventListener("mouseenter", () => { rail.classList.add("hover"); onEnter(); });
  thumb.addEventListener("mouseleave", () => { rail.classList.remove("hover"); onLeave(); });
  track.addEventListener("mouseenter", onEnter);
  track.addEventListener("mouseleave", onLeave);

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => { state.reduce = e.matches; });

  return { refresh };
}

let pageScrollbar = null;
function initScrollbar(){
  const rail = document.getElementById("sbRail");
  if (!rail) return;
  const track = document.getElementById("sbTrack");
  const thumb = document.getElementById("sbThumb");

  pageScrollbar = createScrollbarController({
    rail, track, thumb,
    getScrollTop: () => window.scrollY,
    getScrollHeight: () => document.documentElement.scrollHeight,
    getViewportHeight: () => window.innerHeight,
    scrollTo: (top, smooth) => window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" }),
    scrollEventTarget: window,
  });

  window.addEventListener("resize", () => pageScrollbar.refresh());

  // #app's innerHTML is replaced wholesale on every screen navigation,
  // which routinely changes the document's total scrollable height (a
  // short landing page vs. a long results page) — re-measure so the
  // thumb's size/travel stay correct without waiting for a resize.
  const app = document.getElementById("app");
  if (app){
    new MutationObserver(() => pageScrollbar.refresh()).observe(app, { childList: true, subtree: true });
  }
}
initScrollbar();

/* ---------------- service worker registration -----------------------------
   Every page loads global.js, so this runs once per page load regardless
   of which page is entered first — the browser dedupes repeat
   registrations of the same script/scope on its own, so navigating
   between pages never re-installs anything. A relative path (not
   "/service-worker.js") so the registered scope is wherever the app
   actually lives (a GitHub Pages project subpath, a custom domain root,
   or this project's own local-dev root) rather than assuming the site
   is deployed at its host's domain root.
   Without this call actually registering the worker, everything else in
   service-worker.js — precaching, offline fallback, the clean-URL
   mapping, 404.html's own scope-detection lookup — never runs in any
   browser; the file existing on disk isn't enough on its own. Registered
   after "load" so it never competes with the current page's own
   resources for bandwidth, and wrapped in a feature check + silent
   catch so an unsupported context (e.g. this file opened directly via
   file://, which has no service worker support at all) never breaks the
   page — the app works fully online either way, just without the
   offline/installable behavior.

   Update detection: the browser already re-fetches service-worker.js on
   its own and silently installs a new worker in the background whenever
   its bytes change (that part needs no code at all) — the only thing
   this adds is noticing when that new worker has finished installing and
   is sitting in the "waiting" state (see service-worker.js's "UPDATE
   FLOW" comment for why it waits instead of taking over immediately),
   and surfacing that as a small toast rather than leaving it invisible
   until the next full reload. */
if ("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      // A worker can already be sitting in "waiting" the moment this page
      // loads (installed by a tab that was open earlier) — catch that
      // case immediately instead of only reacting to a fresh install.
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          // "installed" + an existing controller means a real update is
          // ready — the same state during the very first install has no
          // controller yet and nothing meaningful to refresh from.
          if (newWorker.state === "installed" && navigator.serviceWorker.controller){
            showUpdateToast(newWorker);
          }
        });
      });
    }).catch(() => {
      // Registration failed (unsupported context) — nothing to recover,
      // the app itself doesn't depend on this succeeding.
    });

    // Reload once the new worker actually takes control (not the instant
    // "Refresh" is clicked) so the page never runs half-controlled by the
    // old worker. The flag guards against a duplicate reload if this ever
    // fires more than once.
    let pfSwRefreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (pfSwRefreshing) return;
      pfSwRefreshing = true;
      location.reload();
    });
  });
}

// Small, self-contained "update available" toast. Styled inline rather
// than via the app's stylesheets since this is PWA-update plumbing, not
// app UI — it has no dependency on (and no effect on) the site's own
// CSS. Bottom-right, dismisses itself by reloading once Refresh is
// clicked; calling this twice (two updates found in one session) is a
// no-op the second time since the first toast is still on screen.
function showUpdateToast(waitingWorker){
  if (document.getElementById("pf-update-toast")) return;
  const toast = document.createElement("div");
  toast.id = "pf-update-toast";
  toast.setAttribute("role", "status");
  toast.style.cssText = [
    "position:fixed", "right:20px", "bottom:20px", "z-index:2147483647",
    "display:flex", "align-items:center", "gap:14px",
    "background:#1a1a1f", "color:#f5f5f7", "border:1px solid rgba(255,255,255,.14)",
    "border-radius:12px", "padding:12px 16px", "box-shadow:0 8px 28px rgba(0,0,0,.4)",
    "font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "max-width:min(90vw,340px)",
  ].join(";");
  toast.innerHTML =
    '<span>✨ A new version of Forge is available.</span>' +
    '<button type="button" style="flex-shrink:0;background:#7c5cff;color:#fff;border:none;' +
    'border-radius:8px;padding:7px 14px;font:inherit;font-weight:600;cursor:pointer;">Refresh</button>';
  toast.querySelector("button").addEventListener("click", () => {
    waitingWorker.postMessage("SKIP_WAITING");
  });
  document.body.appendChild(toast);
}
