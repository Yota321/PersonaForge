/* =========================================================================
   FORGE - LEGAL (legal.html)
   Terms/privacy content and the version-history/credits accordions.
   Loaded by legal.html only, after engine.js + global.js.
   ========================================================================= */

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

// Uses the app-wide obEsc() (global.js) rather than a second escaping
// helper — legal.html loads global.js before this file, same as every
// other page, so there's no reason for this one to keep its own copy.
function legalLinkOrDash(url){
  if (!url || url === "N/A" || url === "-") return "N/A";
  return `<a href="${obEsc(url)}" target="_blank" rel="noopener">${obEsc(url.replace(/^https?:\/\//, ""))}</a>`;
}
const LEGAL_CHEVRON = `<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 8l5 5 5-5"/></svg>`;

function renderLegalTOC(){
  return LEGAL_TOC.map(item => `<a href="#${item.id}">${obEsc(item.label)}</a>`).join("");
}
function renderLegalVersionHistory(){
  return LEGAL_VERSION_HISTORY.map(v => `<div class="version-row"><span class="v-tag">v${obEsc(v.version)}</span><span class="v-date">${obEsc(v.date)}</span><span class="v-note">${obEsc(v.notes)}</span></div>`).join("");
}
function renderLegalFonts(){
  return LEGAL_FONTS.map(f => `<div class="credit-item"><h4>${obEsc(f.name)}</h4><dl>` +
    `<dt>Role</dt><dd>${f.role}</dd>` +
    `<dt>Source</dt><dd>${obEsc(f.source)}</dd>` +
    `<dt>Homepage</dt><dd>${legalLinkOrDash(f.homepage)}</dd>` +
    `<dt>License</dt><dd>${obEsc(f.license)}</dd>` +
    `<dt>Attribution</dt><dd>${obEsc(f.attribution)}</dd>` +
    `</dl></div>`).join("");
}
function renderLegalThirdParty(){
  return LEGAL_THIRD_PARTY.map(d => `<div class="credit-item"><h4>${obEsc(d.name)}</h4><dl>` +
    `<dt>Purpose</dt><dd>${obEsc(d.purpose)}</dd>` +
    `<dt>Homepage</dt><dd>${legalLinkOrDash(d.homepage)}</dd>` +
    `<dt>License</dt><dd>${obEsc(d.license)}</dd>` +
    `<dt>Attribution</dt><dd>${obEsc(d.attribution)}</dd>` +
    `</dl></div>`).join("");
}
function renderLegalOpenSource(){
  return LEGAL_OPEN_SOURCE_GROUPS.map(group => {
    const body = group.entries.length
      ? `<div class="credit-grid">${group.entries.map(e => `<div class="credit-item"><h4>${obEsc(e.name)}</h4><dl>` +
          `<dt>Homepage</dt><dd>${legalLinkOrDash(e.homepage)}</dd>` +
          `<dt>License</dt><dd>${obEsc(e.license)}</dd>` +
          (e.notice ? `<dt>Notice</dt><dd>${obEsc(e.notice)}</dd>` : "") +
          `</dl></div>`).join("")}</div>`
      : `<p class="hint" style="margin:0 0 4px;">No ${obEsc(group.license)}-licensed libraries are currently bundled with Forge.</p>`;
    return `<details class="legal-accordion" style="border:1px solid var(--border); border-radius: var(--radius-md); margin-bottom:8px;">` +
      `<summary style="padding:12px 14px; font-size:13.5px;">${obEsc(group.license)} <span class="count">(${group.entries.length})</span>${LEGAL_CHEVRON}</summary>` +
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
    `<span class="track-name">${obEsc(m.trackName)}</span>` +
    `<span class="track-meta">Composer: ${obEsc(m.composer)}</span>` +
    `<p><strong>Source:</strong> ${obEsc(m.sourceSite)}: <a href="${obEsc(m.trackPageUrl)}" target="_blank" rel="noopener">${obEsc(m.trackPageUrl)}</a></p>` +
    `<p><strong>License:</strong> ${obEsc(m.license)}. ${obEsc(m.licenseSummary)}</p>` +
    `<p><strong>Attribution required:</strong> ${m.attributionRequired ? "Yes" : "No, but credited here anyway"}</p>` +
    `<p><strong>Usage in Forge:</strong> ${obEsc(m.usageStatement)}</p>` +
    `<p>Forge claims no ownership of this track. Full license terms are available at <a href="${obEsc(m.sourceSiteUrl)}" target="_blank" rel="noopener">${obEsc(m.sourceSiteUrl)}</a>.</p>` +
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
