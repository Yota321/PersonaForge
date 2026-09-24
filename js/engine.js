/* =========================================================================
   FORGE - PERSONALITY ENGINE
   Archetype/question/content data, scoring, QuizSession, compatibility,
   code encode/decode, quiz-progress persistence, shared-link URL helpers.
   No DOM access here - pure computation, shared by every page.
   ========================================================================= */



/* =========================================================================
   PERSONAFORGE, DATA MODULE
   25 hidden dimensions, an adaptive question bank (10 clusters), 12 core
   archetypes, 6 soul types, and career/relationship reference tables.
   ========================================================================= */

const DIMENSIONS = [
  "confidence","logic","creativity","humor","adaptability","curiosity",
  "empathy","leadership","patience","drive","risk","trust","kindness",
  "discipline","socialEnergy","selfAwareness","planning","resilience",
  "optimism","independence","emotionalStability","competitiveness",
  "responsibility","persistence","openMindedness"
];

/* Short display labels for the radar chart specifically. The prose labels
   used elsewhere (DIM_LABELS in engine.js) are fine in a sentence, but
   "emotionalStability" or "openMindedness" spelled out is too wide to sit
   next to 24 other labels around a circle without clipping the edge of
   the canvas, so these are deliberately compact. */
const RADAR_LABELS = {
  confidence:"Confidence", logic:"Logic", creativity:"Creativity",
  humor:"Humor", adaptability:"Adaptable", curiosity:"Curiosity",
  empathy:"Empathy", leadership:"Leadership", patience:"Patience",
  drive:"Drive", risk:"Risk", trust:"Trust", kindness:"Kindness",
  discipline:"Discipline", socialEnergy:"Social", selfAwareness:"Self-Aware",
  planning:"Planning", resilience:"Resilience", optimism:"Optimism",
  independence:"Independent", emotionalStability:"Stability",
  competitiveness:"Competitive", responsibility:"Responsible",
  persistence:"Persistent", openMindedness:"Open-Minded",
};

function emptyDims(){
  const d = {};
  DIMENSIONS.forEach(k => d[k] = 0);
  return d;
}

/* ---- Question bank -----------------------------------------------------
   10 clusters x 20 questions = 200 authored scenarios. Every question has
   exactly 3 answers, each nudging 3-5 dimensions by -2..+2.
   The adaptive engine (see engine.js) asks a fixed 15-question core set
   first (CORE_QUESTION_IDS), then two batches of 10 chosen by
   information value against the accumulated answers (16-35), then
   continues one question at a time only if confidence isn't there yet,
   up to 45 total. Adding more questions to any cluster array just grows
   the pool the adaptive stages pick from; no other code needs to change.
------------------------------------------------------------------------- */

const QUESTION_BANK = {

  social: [
    { id:"soc1", text:"You walk into a party where you know exactly one person, and they've just vanished to find a drink.", options:[
      { text:"Start a conversation with the nearest stranger", d:{socialEnergy:2,confidence:2,risk:1} },
      { text:"Find a snack table and look busy until your friend returns", d:{socialEnergy:-1,patience:1,independence:1} },
      { text:"Scan the room for someone who also looks a bit lost", d:{empathy:2,socialEnergy:1,curiosity:1} } ]},
    { id:"soc2", text:"A group chat is planning a trip and the conversation has 200 unread messages.", options:[
      { text:"Read everything, then propose a clear plan", d:{planning:2,leadership:1,logic:1} },
      { text:"Skim it and go with whatever the majority wants", d:{adaptability:2,independence:-1,socialEnergy:1} },
      { text:"Mute it and ask one friend for the short version later", d:{independence:2,patience:1,socialEnergy:-1} } ]},
    { id:"soc3", text:"You're invisible for exactly one day and no one will ever know what you did.", options:[
      { text:"Sit in on a meeting or class you're curious about", d:{curiosity:2,independence:1} },
      { text:"Spend it helping people in small, secret ways", d:{kindness:2,empathy:2} },
      { text:"Use it to finally get a full day of total peace and quiet", d:{independence:2,patience:1,socialEnergy:-2} } ]},
    { id:"soc4", text:"Your friend group is splitting into two dinner plans and both are asking you to pick a side.", options:[
      { text:"Pick the louder, bigger group for the extra energy", d:{socialEnergy:2,risk:1} },
      { text:"Pick the smaller group, better conversation", d:{empathy:1,socialEnergy:-1,trust:2} },
      { text:"Suggest merging both plans into one", d:{leadership:2,adaptability:1} } ]},
    { id:"soc5", text:"You accidentally become mildly famous overnight for something small and harmless.", options:[
      { text:"Lean into it and enjoy the attention", d:{confidence:2,humor:1,socialEnergy:1} },
      { text:"Politely ride it out and wait for it to fade", d:{patience:2,independence:1} },
      { text:"Use the platform to talk about something you actually care about", d:{leadership:2,drive:1} } ]},
    { id:"soc6", text:"You're the only person at a gathering who doesn't know the inside joke everyone's laughing at.", options:[
      { text:"Ask directly what's so funny", d:{confidence:2,curiosity:1} },
      { text:"Laugh along and figure it out later", d:{adaptability:2,socialEnergy:1} },
      { text:"Quietly enjoy watching everyone else enjoy it", d:{empathy:1,patience:1,socialEnergy:-1} } ]},
    { id:"soc7", text:"It's a big family gathering and someone brings up an old, slightly touchy argument from years ago.", options:[
      { text:"Steer the conversation somewhere lighter", d:{adaptability:2,empathy:1,socialEnergy:1} },
      { text:"Let people say their piece, even if it gets tense", d:{resilience:2,trust:2,emotionalStability:2} },
      { text:"Quietly excuse yourself until it blows over", d:{independence:1,patience:1,socialEnergy:-2} } ]},
    { id:"soc8", text:"A childhood friend you haven't spoken to in years messages you out of nowhere.", options:[
      { text:"Reply right away, excited to catch up", d:{socialEnergy:2,trust:2,optimism:1} },
      { text:"Reply, but keep it short until you see where it goes", d:{selfAwareness:1,patience:1,trust:-2} },
      { text:"Let it sit a while before deciding how to respond", d:{independence:1,planning:1,patience:1} } ]},
    { id:"soc9", text:"You're put on a group project with three people you've never worked with before.", options:[
      { text:"Suggest everyone share their strengths first so roles make sense", d:{leadership:1,responsibility:3,planning:1} },
      { text:"Wait to see how the group naturally organizes itself", d:{patience:1,adaptability:1,openMindedness:1} },
      { text:"Pick the part you're best at and just get started", d:{drive:1,independence:1,confidence:1} } ]},
    { id:"soc10", text:"You're invited to a wedding where you'll only know the couple, no one else.", options:[
      { text:"Treat it as a chance to meet a room full of strangers", d:{socialEnergy:2,openMindedness:1,confidence:1} },
      { text:"Stick close to the couple whenever you can", d:{trust:2,socialEnergy:-1,patience:1} },
      { text:"Find the one other person who also looks a little out of place", d:{empathy:2,socialEnergy:1} } ]},
    { id:"soc11", text:"A group chat you're in has slowly turned into people mostly talking over each other.", options:[
      { text:"Try to bring some order back to the conversation", d:{leadership:1,responsibility:2,patience:1} },
      { text:"Mute it and check in only when something matters", d:{independence:2,socialEnergy:-1} },
      { text:"Just enjoy the chaos, it's kind of fun", d:{humor:2,adaptability:1,openMindedness:1} } ]},
    { id:"soc12", text:"Everyone at work has an opinion about a decision that technically isn't theirs to make.", options:[
      { text:"Share your opinion clearly when asked", d:{confidence:1,responsibility:2,logic:1} },
      { text:"Stay out of it, it's not your call either", d:{patience:1,independence:1,discipline:1} },
      { text:"Listen to everyone first, then quietly form your own view", d:{selfAwareness:2,curiosity:1} } ]},
    { id:"soc13", text:"A close friend starts dating someone the rest of your friend group isn't sure about.", options:[
      { text:"Give the new person a fair, honest chance", d:{openMindedness:2,trust:2,empathy:1} },
      { text:"Trust your friend's judgment, even if you have doubts", d:{trust:3,patience:1} },
      { text:"Say something if it keeps bothering you", d:{confidence:1,responsibility:2,empathy:1} } ]},
    { id:"soc14", text:"You move to a new city where you don't know a single person yet.", options:[
      { text:"Say yes to every invitation for the first few months", d:{socialEnergy:2,risk:1,openMindedness:1} },
      { text:"Build a small, solid group slowly instead of a big one fast", d:{patience:2,trust:2} },
      { text:"Get comfortable on your own before actively looking for people", d:{independence:2,emotionalStability:2} } ]},
    { id:"soc15", text:"A friend keeps canceling plans last minute, again.", options:[
      { text:"Bring it up honestly the next time it happens", d:{confidence:1,responsibility:2,trust:-2} },
      { text:"Stop making plans that depend on them showing up", d:{independence:1,selfAwareness:1,discipline:1} },
      { text:"Give them the benefit of the doubt, people get busy", d:{patience:2,kindness:1} } ]},

    { id:"soc16", text:"You're assigned a random roommate for your first semester away from home.", options:[
      { text:"Reach out before move-in day to break the ice", d:{socialEnergy:2,confidence:1,openMindedness:1} },
      { text:"Wait and see what they're like in person first", d:{patience:2,adaptability:1} },
      { text:"Set clear expectations early so things stay smooth", d:{planning:1,responsibility:3} } ]},
    { id:"soc17", text:"A group trip with friends is being planned and everyone has a different idea of the perfect itinerary.", options:[
      { text:"Volunteer to merge everyone's wish list into one plan", d:{leadership:1,planning:2} },
      { text:"Go with whatever the majority picks", d:{adaptability:2,socialEnergy:1} },
      { text:"Suggest splitting some days so everyone gets their thing", d:{creativity:1,empathy:1,leadership:1} } ]},
    { id:"soc18", text:"At a big family reunion, the food table becomes an unofficial argument about whose dish is best.", options:[
      { text:"Jump in and defend your own dish loudly", d:{humor:1,confidence:1,competitiveness:1} },
      { text:"Stay neutral and just enjoy the food", d:{patience:1,adaptability:1} },
      { text:"Quietly go compliment everyone individually", d:{kindness:2,empathy:1} } ]},
    { id:"soc19", text:"You're about to post something a little vulnerable on social media and your thumb hovers over the button.", options:[
      { text:"Post it, people can just scroll past if they don't care", d:{confidence:2,risk:1} },
      { text:"Rewrite it to be a little safer first", d:{selfAwareness:1,patience:1} },
      { text:"Save it as a draft and decide tomorrow", d:{patience:2,discipline:1} } ]},
    { id:"soc20", text:"Your class group project has one member who keeps missing meetings.", options:[
      { text:"Message them directly and ask what's going on", d:{empathy:1,responsibility:3} },
      { text:"Quietly redistribute their part among the rest of the group", d:{leadership:1,independence:1,discipline:1} },
      { text:"Flag it to the instructor before it becomes a bigger problem", d:{responsibility:3,confidence:1} } ]},

  ],

  analytical: [
    { id:"ana1", text:"You're handed a puzzle box with no instructions and told it opens a small prize inside.", options:[
      { text:"Study it carefully before touching anything", d:{logic:2,patience:2,planning:1} },
      { text:"Start twisting and pressing everything at once", d:{risk:2,adaptability:1,drive:1} },
      { text:"Look up if anyone else has solved one like it", d:{curiosity:2,logic:1} } ]},
    { id:"ana2", text:"Two plans for the weekend look equally good on paper, but you can only pick one.", options:[
      { text:"Make a pros-and-cons list before deciding", d:{logic:2,planning:2} },
      { text:"Go with your gut instinct immediately", d:{risk:1,confidence:1,adaptability:1} },
      { text:"Ask someone else to break the tie", d:{trust:2,socialEnergy:1,independence:-1} } ]},
    { id:"ana3", text:"A machine at work or school starts making a strange noise that no one else seems to notice.", options:[
      { text:"Investigate exactly what's causing it", d:{curiosity:2,logic:2} },
      { text:"Report it and let someone qualified handle it", d:{discipline:1,trust:2,planning:1} },
      { text:"Assume it's fine unless it gets worse", d:{adaptability:1,optimism:1,discipline:-1} } ]},
    { id:"ana4", text:"You find a long, complicated contract you're expected to sign by tomorrow.", options:[
      { text:"Read every line, even if it takes all night", d:{discipline:2,logic:2,patience:1} },
      { text:"Skim for anything alarming, then decide", d:{adaptability:1,risk:1,logic:1} },
      { text:"Ask someone you trust to look it over with you", d:{trust:3,empathy:1} } ]},
    { id:"ana5", text:"Your favorite theory about how something works turns out to be wrong.", options:[
      { text:"Update your thinking immediately, no ego about it", d:{selfAwareness:2,logic:1,adaptability:1} },
      { text:"Look for the exception that might still prove you right", d:{drive:1,logic:1,confidence:1} },
      { text:"Feel a little embarrassed but move on quickly", d:{resilience:2,selfAwareness:1} } ]},
    { id:"ana6", text:"You're debugging a problem that's been broken for hours and everyone else has given up.", options:[
      { text:"Keep going alone until it's solved", d:{discipline:2,independence:2,drive:1} },
      { text:"Step away, then come back with fresh eyes", d:{patience:2,selfAwareness:1,resilience:2} },
      { text:"Call in someone with a different skill set", d:{trust:2,leadership:1,adaptability:1} } ]},
    { id:"ana7", text:"You're splitting a shared bill and the numbers don't quite add up to what everyone remembers ordering.", options:[
      { text:"Actually do the math before saying anything", d:{logic:2,responsibility:2,patience:1} },
      { text:"Just round it out evenly, it's not worth the friction", d:{adaptability:1,patience:1,logic:-1} },
      { text:"Ask the group to figure it out together", d:{leadership:1,socialEnergy:1,logic:1} } ]},
    { id:"ana8", text:"You're choosing between two career paths that both look reasonable on paper.", options:[
      { text:"Build an actual comparison of trade-offs before deciding", d:{logic:2,planning:2} },
      { text:"Pick the one that scares you a little more", d:{risk:2,drive:1,confidence:1} },
      { text:"Talk to people already in both fields first", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana9", text:"You're playing a strategy game and losing badly to someone using a tactic you've never seen before.", options:[
      { text:"Pause and actually study what they're doing", d:{curiosity:2,logic:1,persistence:1} },
      { text:"Adapt on the fly, mistakes included", d:{adaptability:2,resilience:2} },
      { text:"Stick to your own strategy and refine it next round", d:{discipline:1,persistence:2} } ]},
    { id:"ana10", text:"A movie's twist ending doesn't fully add up when you think about it afterward.", options:[
      { text:"Go back and pick apart exactly where the logic breaks", d:{logic:2,curiosity:1} },
      { text:"Let it go, it was still a good ride", d:{adaptability:1,optimism:1,logic:-1} },
      { text:"Look up what other people think about it", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana11", text:"A family disagreement keeps circling the same argument without ever resolving.", options:[
      { text:"Try to name the actual root issue everyone's dancing around", d:{logic:2,empathy:1,responsibility:2} },
      { text:"Step back until emotions cool down", d:{patience:2,emotionalStability:2} },
      { text:"Accept that some things just don't get fully resolved", d:{adaptability:1,patience:1} } ]},
    { id:"ana12", text:"You're mapping out your next five years and it feels like there are too many variables to plan around.", options:[
      { text:"Build a flexible plan with checkpoints instead of a fixed one", d:{planning:2,adaptability:1} },
      { text:"Focus on the next year and figure out the rest later", d:{discipline:1,patience:1} },
      { text:"Trust that you'll adjust as things come up", d:{optimism:1,adaptability:2} } ]},
    { id:"ana13", text:"Something you worked hard on fails completely, and you have to figure out why.", options:[
      { text:"Break down exactly what went wrong, step by step", d:{logic:2,selfAwareness:1,responsibility:2} },
      { text:"Accept it wasn't meant to work and move to the next thing", d:{resilience:2,optimism:1} },
      { text:"Ask someone else to look at it with fresh eyes", d:{trust:2,openMindedness:1} } ]},
    { id:"ana14", text:"Two teammates disagree about the right approach and both make fair points.", options:[
      { text:"Weigh both arguments against the actual evidence", d:{logic:2,leadership:1} },
      { text:"Suggest testing both on a small scale first", d:{curiosity:1,planning:1,adaptability:1} },
      { text:"Let the more experienced person's judgment carry more weight", d:{trust:2,patience:1,logic:1} } ]},
    { id:"ana15", text:"You realize a rule you've been following at work doesn't actually make logical sense anymore.", options:[
      { text:"Question it and propose something better", d:{logic:2,leadership:1,confidence:1} },
      { text:"Follow it anyway until someone official changes it", d:{discipline:2,patience:1} },
      { text:"Find a smart workaround without making a fuss", d:{adaptability:1,logic:1,independence:1} } ]},

    { id:"ana16", text:"An AI tool gives you a recommendation that conflicts with your own instinct.", options:[
      { text:"Trust your own read over the algorithm", d:{confidence:1,independence:2} },
      { text:"Take the recommendation seriously and dig into why it differs", d:{curiosity:2,logic:1} },
      { text:"Split the difference and test both", d:{adaptability:1,logic:1,openMindedness:1} } ]},
    { id:"ana17", text:"You're budgeting for a trip and the numbers are tighter than you'd like.", options:[
      { text:"Build a detailed spreadsheet before booking anything", d:{planning:2,discipline:1} },
      { text:"Book the essentials and figure out the rest along the way", d:{adaptability:1,risk:1,optimism:1} },
      { text:"Cut the trip down to what you can comfortably afford", d:{discipline:2,responsibility:2} } ]},
    { id:"ana18", text:"A piece of technology you rely on breaks with zero warning, right before a deadline.", options:[
      { text:"Methodically troubleshoot from the most likely cause down", d:{logic:2,patience:1} },
      { text:"Find a workaround immediately and debug it properly later", d:{adaptability:2,drive:1} },
      { text:"Call in someone who actually knows this better than you", d:{trust:2,logic:1} } ]},
    { id:"ana19", text:"You're comparing two job offers and the numbers alone don't make the choice obvious.", options:[
      { text:"Build an actual weighted comparison of every factor", d:{logic:2,planning:2} },
      { text:"Go with whichever one you pictured yourself enjoying more", d:{optimism:1,confidence:1,selfAwareness:1} },
      { text:"Ask people already at both places for the real picture", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana20", text:"You're studying an opponent's strategy before a competition and notice a clear pattern in how they play.", options:[
      { text:"Build your entire approach around exploiting it", d:{logic:2,competitiveness:1} },
      { text:"Prepare for it, but stay flexible in case they adapt too", d:{planning:1,adaptability:1,logic:1} },
      { text:"Focus on your own game instead of reacting to theirs", d:{discipline:1,independence:1,confidence:1} } ]},

  ],

  creative: [
    { id:"cre1", text:"You're given one blank wall and unlimited paint, but only until sunset.", options:[
      { text:"Plan a design first, then execute precisely", d:{planning:2,creativity:1,discipline:1} },
      { text:"Start painting and let the piece evolve as you go", d:{creativity:2,adaptability:1,risk:1} },
      { text:"Ask others what they'd want to see on it", d:{empathy:1,socialEnergy:1,creativity:1} } ]},
    { id:"cre2", text:"You have to explain your favorite story to someone who's never heard of it, in one minute.", options:[
      { text:"Hit the key plot points, efficiently", d:{logic:1,discipline:1,planning:1} },
      { text:"Focus on the feeling it gave you", d:{empathy:1,creativity:1,humor:1} },
      { text:"Make up a wildly exaggerated version for fun", d:{humor:2,creativity:2,confidence:1} } ]},
    { id:"cre3", text:"You're asked to design something completely impossible, no budget, no physics, no limits.", options:[
      { text:"Design something beautiful nobody's ever seen", d:{creativity:2,confidence:1} },
      { text:"Design something wildly useful for everyone", d:{creativity:1,kindness:1,leadership:1} },
      { text:"Design something deeply personal, just for you", d:{selfAwareness:2,creativity:1,independence:1} } ]},
    { id:"cre4", text:"A movie you love is getting a sequel, and you get to pitch one twist.", options:[
      { text:"A twist that recontextualizes everything that came before", d:{logic:1,creativity:2} },
      { text:"A twist that's emotionally devastating", d:{empathy:1,creativity:1} },
      { text:"A twist that's completely absurd and hilarious", d:{humor:2,creativity:1,risk:1} } ]},
    { id:"cre5", text:"You've got fifteen unstructured minutes and nothing you're supposed to be doing.", options:[
      { text:"Doodle, write, or build something just to make it", d:{creativity:2,independence:1} },
      { text:"Text a few people to see what they're up to", d:{socialEnergy:2,curiosity:1} },
      { text:"Just sit and let your mind wander", d:{patience:1,selfAwareness:2} } ]},
    { id:"cre6", text:"You're told a rule you've always followed was actually always optional.", options:[
      { text:"Immediately start bending it your way", d:{creativity:1,risk:1,independence:1} },
      { text:"Keep following it, it worked fine either way", d:{discipline:2,patience:1} },
      { text:"Investigate why the rule existed in the first place", d:{curiosity:2,logic:1} } ]},
    { id:"cre7", text:"You get to pitch one new show to a streaming platform, any premise you want.", options:[
      { text:"Something visually strange that's never been done before", d:{creativity:2,openMindedness:1,risk:1} },
      { text:"A story that would genuinely make people cry", d:{empathy:1,creativity:1} },
      { text:"Something built around a wild, original game-like world", d:{creativity:2,curiosity:1} } ]},
    { id:"cre8", text:"You're designing a character for a game and can give them one defining trait.", options:[
      { text:"A tragic backstory that explains everything they do", d:{empathy:1,creativity:1} },
      { text:"A completely unpredictable, chaotic personality", d:{humor:1,creativity:2,openMindedness:1} },
      { text:"A skill so specific it becomes their whole identity", d:{discipline:1,creativity:1,persistence:1} } ]},
    { id:"cre9", text:"You're asked to build a fantasy world from absolute scratch, no reference material allowed.", options:[
      { text:"Start with the rules of how the world works, then build up", d:{logic:1,creativity:1,planning:1} },
      { text:"Start with one striking image and build outward from that", d:{creativity:2,openMindedness:1} },
      { text:"Start with the people who live there and their problems", d:{empathy:2,creativity:1} } ]},
    { id:"cre10", text:"Something you're genuinely embarrassed about from years ago keeps coming to mind.", options:[
      { text:"Turn it into a story you can actually laugh about", d:{humor:2,selfAwareness:1,creativity:1} },
      { text:"Let it remind you how much you've grown since", d:{selfAwareness:2,optimism:1} },
      { text:"File it away and just move on", d:{emotionalStability:2,independence:1} } ]},
    { id:"cre11", text:"A memory from childhood keeps resurfacing lately, for no clear reason.", options:[
      { text:"Sit with it and try to understand why it matters now", d:{selfAwareness:2,curiosity:1} },
      { text:"Turn it into something creative, a story, drawing, or song", d:{creativity:2,openMindedness:1} },
      { text:"Let it pass without digging into it too much", d:{emotionalStability:2,patience:1} } ]},
    { id:"cre12", text:"A project you poured yourself into completely falls apart before it's finished.", options:[
      { text:"Salvage the interesting parts for something new", d:{creativity:2,resilience:2,persistence:1} },
      { text:"Grieve it properly, then start fresh with a clean idea", d:{emotionalStability:2,resilience:2} },
      { text:"Push through and finish it anyway, imperfect or not", d:{persistence:2,discipline:1} } ]},
    { id:"cre13", text:"You're asked to invent one small object that doesn't exist yet but really should.", options:[
      { text:"Something that solves a tiny daily annoyance", d:{creativity:1,logic:1,curiosity:1} },
      { text:"Something purely delightful with no real use at all", d:{creativity:2,humor:1,openMindedness:1} },
      { text:"Something that helps people connect with each other", d:{creativity:1,empathy:2} } ]},
    { id:"cre14", text:"A family recipe gets passed down to you, and you're tempted to change it.", options:[
      { text:"Keep it exactly as it was, tradition matters", d:{discipline:1,trust:2,responsibility:2} },
      { text:"Tweak it a little and make it your own", d:{creativity:2,independence:1,openMindedness:1} },
      { text:"Ask the family what they'd think before changing anything", d:{empathy:1,socialEnergy:1,openMindedness:1} } ]},
    { id:"cre15", text:"You get to design your dream workspace with absolutely no budget limit.", options:[
      { text:"Something minimal, quiet, and completely distraction-free", d:{discipline:1,independence:1,planning:1} },
      { text:"Something strange and visually inspiring, full of odd objects", d:{creativity:2,openMindedness:2} },
      { text:"Something built for constant collaboration with others nearby", d:{socialEnergy:2,creativity:1} } ]},

    { id:"cre16", text:"You're designing an outfit for an event where absolutely nothing is off-limits.", options:[
      { text:"Build something bold enough to be remembered", d:{creativity:2,confidence:1,risk:1} },
      { text:"Design something quietly elegant instead", d:{discipline:1,creativity:1} },
      { text:"Make something that tells a specific story if anyone asks", d:{creativity:2,curiosity:1} } ]},
    { id:"cre17", text:"You're asked to compose a short piece of music with no restrictions on genre or instrument.", options:[
      { text:"Blend genres that normally never touch", d:{creativity:2,openMindedness:2} },
      { text:"Write something structurally precise and technical", d:{discipline:1,logic:1,creativity:1} },
      { text:"Write something that's meant to make people feel one specific emotion", d:{empathy:2,creativity:1} } ]},
    { id:"cre18", text:"You're handed a damaged, half-destroyed piece of art and asked to finish it however you see fit.", options:[
      { text:"Restore it as close to the original as possible", d:{discipline:2,responsibility:2} },
      { text:"Let the damage become part of the new piece", d:{creativity:2,openMindedness:1} },
      { text:"Research the original artist's intent before touching it", d:{curiosity:2,responsibility:2} } ]},
    { id:"cre19", text:"The moon suddenly disappears from the sky one night, no explanation, and everyone's asking what it means.", options:[
      { text:"Start theorizing about the science of it immediately", d:{curiosity:2,logic:1} },
      { text:"Feel oddly moved and want to write or create something about it", d:{creativity:2,selfAwareness:1} },
      { text:"Mostly just wonder what it'll do to the tides and your sleep", d:{logic:1,humor:1} } ]},
    { id:"cre20", text:"You get to completely redesign one boring required course from your school days.", options:[
      { text:"Rebuild it entirely around hands-on projects", d:{creativity:1,leadership:1} },
      { text:"Keep the content but make the delivery genuinely engaging", d:{creativity:2,empathy:1} },
      { text:"Cut it down to only the parts that actually matter", d:{logic:1,discipline:1,confidence:1} } ]},

  ],

  impulsive: [
    { id:"imp1", text:"You're trapped in an elevator with your biggest rival for an unknown amount of time.", options:[
      { text:"Break the silence and try to clear the air", d:{confidence:2,empathy:1,leadership:1} },
      { text:"Stay quiet and wait it out", d:{patience:2,independence:1} },
      { text:"Use the time to needle them a little", d:{humor:1,risk:1,confidence:1} } ]},
    { id:"imp2", text:"You find a door in a building you've visited a hundred times that you swear you've never seen before.", options:[
      { text:"Open it immediately", d:{risk:2,curiosity:2} },
      { text:"Ask a staff member what's behind it first", d:{planning:1,trust:2,curiosity:1} },
      { text:"Leave it alone, some doors aren't yours to open", d:{patience:1,discipline:1,risk:-1} } ]},
    { id:"imp3", text:"A stranger offers you a genuinely great opportunity, but you have to decide in the next sixty seconds.", options:[
      { text:"Say yes, you can figure out details later", d:{risk:2,confidence:1,optimism:1} },
      { text:"Ask one sharp clarifying question first", d:{logic:1,confidence:1} },
      { text:"Say no, good opportunities don't need a countdown", d:{discipline:1,trust:-2,patience:1} } ]},
    { id:"imp4", text:"You're mid-plan when a much more exciting, completely different opportunity shows up.", options:[
      { text:"Drop the plan and chase the new thing", d:{adaptability:2,risk:2,drive:1} },
      { text:"Finish what you started first", d:{discipline:2,planning:1} },
      { text:"Try to find a way to do both", d:{creativity:1,drive:1,adaptability:1} } ]},
    { id:"imp5", text:"You wake up with a genuinely wild idea you're sure could work.", options:[
      { text:"Start acting on it before the excitement fades", d:{risk:2,drive:2,confidence:1} },
      { text:"Write it down and sleep on it", d:{patience:1,planning:2} },
      { text:"Pitch it to someone else first to test the reaction", d:{socialEnergy:1,trust:2,confidence:1} } ]},
    { id:"imp6", text:"A once-in-a-lifetime trip appears with almost no notice and a real cost to your plans.", options:[
      { text:"Go, you can rearrange the rest", d:{risk:2,adaptability:2,optimism:1} },
      { text:"Weigh it seriously against what you'd give up", d:{planning:2,logic:1} },
      { text:"Pass, stability matters more to you right now", d:{discipline:1,patience:1,risk:-1} } ]},
    { id:"imp7", text:"Someone you've been quietly interested in asks you out with almost no warning.", options:[
      { text:"Say yes immediately, why overthink it", d:{risk:2,confidence:1,optimism:1} },
      { text:"Say yes, but suggest something low-pressure first", d:{planning:1,risk:1,emotionalStability:2} },
      { text:"Ask for a day to actually think it over", d:{patience:1,selfAwareness:1,discipline:1} } ]},
    { id:"imp8", text:"A rare item drops in a game you play, and you have to decide fast whether to use it or save it.", options:[
      { text:"Use it right now, the moment might not come again", d:{risk:2,drive:1} },
      { text:"Save it for exactly the right moment", d:{planning:2,patience:1} },
      { text:"Trade it for something more useful to you now", d:{logic:1,adaptability:1,independence:1} } ]},
    { id:"imp9", text:"You unexpectedly come into a decent amount of money with no strings attached.", options:[
      { text:"Spend some right away on something you've wanted forever", d:{risk:1,optimism:1,drive:1} },
      { text:"Save almost all of it without much internal debate", d:{discipline:2,planning:1,responsibility:2} },
      { text:"Split it between saving, spending, and giving some away", d:{kindness:1,planning:1} } ]},
    { id:"imp10", text:"A friend calls with a last-minute trip idea leaving in two days.", options:[
      { text:"Start packing before you've even hung up", d:{risk:2,adaptability:2,optimism:1} },
      { text:"Check what you'd actually be giving up first", d:{planning:1,logic:1,responsibility:2} },
      { text:"Pass this time, but ask for more notice next time", d:{discipline:1,patience:1,risk:-1} } ]},
    { id:"imp11", text:"You get a sudden, real opportunity to change careers entirely, starting almost from zero.", options:[
      { text:"Take the leap while the door is open", d:{risk:2,confidence:1,drive:1} },
      { text:"Build a transition plan first, then move", d:{planning:2,discipline:1} },
      { text:"Test it part-time before fully committing", d:{logic:1,adaptability:1,persistence:1} } ]},
    { id:"imp12", text:"At a wedding, the couple suddenly opens the floor for anyone to say a few words.", options:[
      { text:"Stand up and speak from the heart, unplanned", d:{confidence:2,risk:1,empathy:1} },
      { text:"Stay seated, better to let it happen organically", d:{patience:1,socialEnergy:-1} },
      { text:"Quickly think of something short and sincere to say", d:{planning:1,confidence:1,empathy:1} } ]},
    { id:"imp13", text:"A show you've been meaning to watch has its whole new season out, and it's already late.", options:[
      { text:"Start it anyway, sleep is negotiable tonight", d:{risk:1,optimism:1} },
      { text:"Watch one episode and stop on principle", d:{discipline:2,patience:1} },
      { text:"Save it for the weekend when you can enjoy it properly", d:{planning:2,patience:1} } ]},
    { id:"imp14", text:"You're offered a genuinely thrilling but slightly risky adventure activity on a trip.", options:[
      { text:"Sign up on the spot, no second-guessing", d:{risk:2,confidence:1,optimism:1} },
      { text:"Ask a few real questions about the risk first", d:{logic:1,planning:1,risk:1} },
      { text:"Watch this time and maybe try it next trip", d:{patience:1,risk:-1,discipline:1} } ]},
    { id:"imp15", text:"You're handed a wish that has to be used within the next sixty seconds or it disappears.", options:[
      { text:"Wish for something big and bold without hesitating", d:{risk:2,confidence:1,drive:1} },
      { text:"Wish for something small but genuinely meaningful", d:{empathy:1,selfAwareness:1,kindness:1} },
      { text:"Freeze up and let the moment pass", d:{patience:1,emotionalStability:-2,risk:-1} } ]},

    { id:"imp16", text:"You spot a genuinely striking piece of clothing that's a little out of your usual style and budget.", options:[
      { text:"Buy it right there, it's rare to find something like this", d:{risk:2,confidence:1} },
      { text:"Try it on, sleep on it, decide tomorrow", d:{patience:1,discipline:1} },
      { text:"Pass, it's not really you", d:{discipline:1,selfAwareness:1,risk:-1} } ]},
    { id:"imp17", text:"A local competition opens registration an hour before the deadline and you weren't planning to enter.", options:[
      { text:"Sign up immediately, prepared or not", d:{risk:2,confidence:1,competitiveness:1} },
      { text:"Quickly weigh whether you can actually do it justice first", d:{logic:1,planning:1} },
      { text:"Skip this one and aim for the next", d:{discipline:1,patience:1} } ]},
    { id:"imp18", text:"A cheap last-minute flight to somewhere you've never been shows up in your inbox.", options:[
      { text:"Book it before you can talk yourself out of it", d:{risk:2,adaptability:1,optimism:1} },
      { text:"Check your calendar properly before deciding", d:{planning:1,discipline:1} },
      { text:"Let it go, spontaneity has limits", d:{discipline:1,risk:-1} } ]},
    { id:"imp19", text:"At a new restaurant, the menu has one dish you've genuinely never heard of and can't quite picture.", options:[
      { text:"Order it immediately, that's the whole point of trying new places", d:{curiosity:2,risk:1,openMindedness:1} },
      { text:"Ask the server exactly what's in it first", d:{logic:1,curiosity:1} },
      { text:"Stick with something familiar this time", d:{discipline:1,patience:1} } ]},
    { id:"imp20", text:"A new gadget everyone's talking about goes on sale and you weren't planning to buy one.", options:[
      { text:"Buy it same day, you can justify it later", d:{risk:1,drive:1,optimism:1} },
      { text:"Research it properly before deciding", d:{logic:2,discipline:1} },
      { text:"Wait for the next version, this one will be outdated soon anyway", d:{patience:1,logic:1} } ]},

  ],

  empathic: [
    { id:"emp1", text:"Your best friend admits they lied to protect someone you both care about.", options:[
      { text:"Understand it, even if you wouldn't have done the same", d:{empathy:2,trust:2,patience:1} },
      { text:"Push them to come clean to the person involved", d:{discipline:1,leadership:1,logic:1} },
      { text:"Feel a little hurt that they didn't tell you first", d:{selfAwareness:1,empathy:1,trust:-2} } ]},
    { id:"emp2", text:"A coworker takes credit for an idea that was mostly yours, in front of everyone.", options:[
      { text:"Speak up and correct the record on the spot", d:{confidence:2,leadership:1} },
      { text:"Let it go publicly, but address it privately later", d:{patience:1,discipline:1,empathy:1} },
      { text:"Let it slide entirely, it's not worth the conflict", d:{patience:1,independence:1,trust:-2} } ]},
    { id:"emp3", text:"Someone close to you is clearly struggling but insists they're fine.", options:[
      { text:"Gently keep checking in until they open up", d:{empathy:2,patience:2} },
      { text:"Respect their space and let them come to you", d:{patience:1,trust:2,independence:1} },
      { text:"Do something small and kind without making it a big deal", d:{kindness:2,empathy:1} } ]},
    { id:"emp4", text:"You overhear two friends arguing about something involving you, but they don't know you heard.", options:[
      { text:"Bring it up honestly so it doesn't fester", d:{confidence:1,trust:2,leadership:1} },
      { text:"Let it play out and see if it resolves itself", d:{patience:2,independence:1} },
      { text:"Try to smooth things over without mentioning what you heard", d:{empathy:2,adaptability:1} } ]},
    { id:"emp5", text:"A stranger is visibly overwhelmed in public and clearly needs help.", options:[
      { text:"Step in directly and ask if they're okay", d:{empathy:2,confidence:1,kindness:1} },
      { text:"Quietly find someone better equipped to help", d:{planning:1,empathy:1} },
      { text:"Give them space, assuming they'd rather handle it alone", d:{patience:1,independence:1} } ]},
    { id:"emp6", text:"You have to deliver honest, difficult feedback to someone who's trying their best.", options:[
      { text:"Say it clearly and directly, kindness through honesty", d:{confidence:1,discipline:1,kindness:1} },
      { text:"Soften it heavily so it doesn't hurt", d:{empathy:2,kindness:1} },
      { text:"Delay it until you're sure exactly how to phrase it", d:{patience:1,planning:1,empathy:1} } ]},
    { id:"emp7", text:"A family member says something hurtful during an argument that probably wasn't fully meant.", options:[
      { text:"Let it go once things calm down, it was said in the heat of it", d:{patience:2,empathy:1,emotionalStability:2} },
      { text:"Bring it up honestly once everyone's calm", d:{confidence:1,responsibility:2,trust:2} },
      { text:"Need some real distance before you're ready to talk about it", d:{independence:1,emotionalStability:2,patience:1} } ]},
    { id:"emp8", text:"Your partner is clearly having a rough day but insists they don't want to talk about it.", options:[
      { text:"Stay close by without pushing for details", d:{empathy:2,patience:2} },
      { text:"Do something small and thoughtful instead of asking questions", d:{kindness:2,empathy:1} },
      { text:"Give them real space and check in again later", d:{independence:1,patience:1,trust:2} } ]},
    { id:"emp9", text:"You remember a moment as a kid when an adult made you feel truly seen and understood.", options:[
      { text:"Try to be that person for someone younger now", d:{empathy:2,kindness:1,responsibility:2} },
      { text:"Carry it quietly as something that shaped who you are", d:{selfAwareness:2} },
      { text:"Reach out and actually tell that person it mattered", d:{confidence:1,empathy:1,socialEnergy:1} } ]},
    { id:"emp10", text:"A teammate is clearly struggling to keep up but hasn't said anything about it.", options:[
      { text:"Quietly offer to help without making it a big deal", d:{empathy:2,kindness:1} },
      { text:"Bring it up with the team so the workload gets rebalanced", d:{leadership:1,responsibility:3} },
      { text:"Let them ask for help when they're ready", d:{patience:1,trust:2,independence:1} } ]},
    { id:"emp11", text:"A close friend fails at something they'd worked toward for a long time.", options:[
      { text:"Sit with them in it before saying anything fix-it shaped", d:{empathy:2,patience:1} },
      { text:"Help them find the next practical step forward", d:{logic:1,leadership:1,empathy:1} },
      { text:"Remind them of everything they did right along the way", d:{optimism:1,kindness:1,empathy:1} } ]},
    { id:"emp12", text:"A character on a show you love makes a choice that genuinely upsets you.", options:[
      { text:"Try to understand what would drive someone to that", d:{empathy:2,curiosity:1,openMindedness:1} },
      { text:"Just feel the frustration, it's allowed to be upsetting", d:{emotionalStability:0,humor:0} },
      { text:"Talk it through with whoever else watched it", d:{socialEnergy:1,empathy:1} } ]},
    { id:"emp13", text:"A stranger online is venting about something painful in a comment section.", options:[
      { text:"Leave a genuinely kind reply, even though you don't know them", d:{kindness:2,empathy:1} },
      { text:"Scroll past, it's not really your place", d:{independence:1,patience:1} },
      { text:"Report or flag it if it seems like they need real help", d:{responsibility:3,empathy:1} } ]},
    { id:"emp14", text:"Your partner's family situation is a lot more complicated than your own.", options:[
      { text:"Ask questions and genuinely try to understand it", d:{empathy:2,curiosity:1,openMindedness:1} },
      { text:"Follow their lead on how much to get involved", d:{patience:1,trust:2,empathy:1} },
      { text:"Keep some healthy distance from it either way", d:{independence:1,discipline:1} } ]},
    { id:"emp15", text:"You realize, looking back, that you weren't very kind to someone who needed you once.", options:[
      { text:"Reach out now, even if it's years later", d:{confidence:1,responsibility:3,empathy:1} },
      { text:"Let it teach you something and be different going forward", d:{selfAwareness:2,kindness:1} },
      { text:"Try not to dwell on it too much, everyone's imperfect", d:{emotionalStability:2,optimism:1} } ]},

    { id:"emp16", text:"A friend at college is clearly overwhelmed but keeps insisting they're managing fine.", options:[
      { text:"Check in consistently, even if they keep brushing it off", d:{empathy:2,patience:2} },
      { text:"Help with something concrete instead of just asking how they are", d:{kindness:2,responsibility:2} },
      { text:"Respect that they might genuinely want to handle it alone", d:{patience:1,trust:2,independence:1} } ]},
    { id:"emp17", text:"Someone you're close to just lost a competition they'd trained hard for.", options:[
      { text:"Let them feel it fully before saying anything encouraging", d:{empathy:2,patience:1} },
      { text:"Remind them of everything that actually went right", d:{optimism:1,kindness:1,empathy:1} },
      { text:"Help them start planning the next attempt", d:{leadership:1,logic:1,empathy:1} } ]},
    { id:"emp18", text:"You notice an animal that seems distressed, maybe lost or hurt, in an unfamiliar place.", options:[
      { text:"Stop everything and try to help it directly", d:{kindness:2,empathy:1,risk:1} },
      { text:"Find someone or somewhere better equipped to help", d:{responsibility:3,logic:1} },
      { text:"Keep an eye on it while figuring out the right move", d:{patience:1,empathy:1,logic:1} } ]},
    { id:"emp19", text:"An older family member is anxious and a little embarrassed about not understanding new technology.", options:[
      { text:"Sit with them and teach it patiently, however long it takes", d:{patience:2,kindness:1,empathy:1} },
      { text:"Set it up simply for them so they don't have to stress about it", d:{kindness:1,responsibility:2} },
      { text:"Reassure them it's genuinely not a big deal", d:{empathy:1,optimism:1,kindness:1} } ]},
    { id:"emp20", text:"A friend tells you an embarrassing story about themselves and clearly needs it to land as funny, not awkward.", options:[
      { text:"Laugh warmly and make it feel like a bonding moment", d:{humor:1,empathy:2} },
      { text:"Match their energy and share an embarrassing one of your own", d:{empathy:1,humor:1,trust:2} },
      { text:"Reassure them it's honestly not that bad", d:{kindness:1,empathy:1} } ]},

  ],

  leadership: [
    { id:"lea1", text:"Your boss offers you double pay in exchange for taking credit away from a teammate.", options:[
      { text:"Refuse immediately, no negotiation", d:{trust:3,kindness:1,discipline:1} },
      { text:"Push back and propose a version that's fair to both", d:{leadership:2,logic:1} },
      { text:"Take a beat to think it through before responding", d:{patience:1,selfAwareness:1,logic:1} } ]},
    { id:"lea2", text:"A group project is falling apart and no one has stepped up to organize it.", options:[
      { text:"Take charge and assign clear next steps", d:{leadership:2,planning:1,confidence:1} },
      { text:"Quietly start doing the coordinating work yourself", d:{discipline:1,independence:1,leadership:1} },
      { text:"Wait to see if someone else naturally takes the lead", d:{patience:1,adaptability:1,leadership:-1} } ]},
    { id:"lea3", text:"Two teammates are in a disagreement that's slowing everything down.", options:[
      { text:"Mediate directly and push for a decision", d:{leadership:2,empathy:1} },
      { text:"Let them work it out without your input", d:{independence:1,patience:1,trust:2} },
      { text:"Propose a compromise that gives both something", d:{creativity:1,leadership:1,empathy:1} } ]},
    { id:"lea4", text:"You're suddenly the most experienced person in the room on a topic everyone's relying on.", options:[
      { text:"Step up and guide the group confidently", d:{leadership:2,confidence:2} },
      { text:"Share what you know but let others weigh in equally", d:{empathy:1,leadership:1,humor:0} },
      { text:"Feel the pressure but push through anyway", d:{resilience:2,confidence:1,leadership:1} } ]},
    { id:"lea5", text:"A plan you championed is starting to visibly fail in front of everyone.", options:[
      { text:"Own it publicly and pivot fast", d:{leadership:2,resilience:3,selfAwareness:1} },
      { text:"Defend the plan while quietly adjusting it", d:{confidence:1,discipline:1} },
      { text:"Ask the group for honest input on what to change", d:{empathy:1,leadership:1,trust:2} } ]},
    { id:"lea6", text:"You're offered a leadership role you don't feel fully ready for.", options:[
      { text:"Take it, you'll grow into it", d:{confidence:2,risk:1,drive:1} },
      { text:"Take it, but ask for support along the way", d:{selfAwareness:1,trust:2,leadership:1} },
      { text:"Turn it down until you feel genuinely ready", d:{patience:1,selfAwareness:1,confidence:-1} } ]},
    { id:"lea7", text:"A project you led falls behind schedule and it's partly your fault.", options:[
      { text:"Own it fully in front of the whole team", d:{responsibility:3,leadership:1,confidence:1} },
      { text:"Fix what you can quietly and explain later if asked", d:{discipline:1,independence:1,responsibility:2} },
      { text:"Get the team together to solve it as a group", d:{leadership:2,socialEnergy:1} } ]},
    { id:"lea8", text:"Your family is deciding something big together and everyone has a different opinion.", options:[
      { text:"Help guide the conversation toward an actual decision", d:{leadership:1,patience:1,responsibility:2} },
      { text:"Voice your view once, then let others lead", d:{confidence:1,patience:1} },
      { text:"Stay mostly quiet and support whatever gets decided", d:{patience:2,adaptability:1} } ]},
    { id:"lea9", text:"You're offered a promotion that means managing people who used to be your peers.", options:[
      { text:"Take it and figure out the dynamic as you go", d:{confidence:2,risk:1,leadership:1} },
      { text:"Take it, but have an honest conversation with them first", d:{empathy:1,leadership:1,responsibility:2} },
      { text:"Turn it down, you'd rather stay where you are", d:{independence:1,discipline:1,leadership:-1} } ]},
    { id:"lea10", text:"You're leading a guild or team in a game and someone quits mid-event, leaving a gap.", options:[
      { text:"Reorganize on the fly and keep things moving", d:{leadership:2,adaptability:2} },
      { text:"Reach out to them first to see if something's actually wrong", d:{empathy:1,leadership:1} },
      { text:"Recruit a replacement and move forward without dwelling on it", d:{drive:1,leadership:1,persistence:1} } ]},
    { id:"lea11", text:"You witness something at work that feels ethically off, but reporting it could cause real friction.", options:[
      { text:"Report it, regardless of the fallout", d:{responsibility:3,confidence:1,trust:2} },
      { text:"Raise it privately with the person first", d:{empathy:1,leadership:1,responsibility:2} },
      { text:"Document it and wait to see if it happens again", d:{planning:1,patience:1,logic:1} } ]},
    { id:"lea12", text:"You're planning a big group event and two people both want to be in charge of the same part.", options:[
      { text:"Split the task in a way that plays to both their strengths", d:{leadership:2,logic:1} },
      { text:"Let them sort it out between themselves", d:{patience:1,independence:1} },
      { text:"Make the call yourself and explain your reasoning", d:{confidence:1,leadership:2} } ]},
    { id:"lea13", text:"A crisis hits your community and people are looking for someone to organize a response.", options:[
      { text:"Step up immediately, even without being asked", d:{leadership:2,confidence:1,responsibility:2} },
      { text:"Support whoever does step up as much as you can", d:{kindness:1,adaptability:1,leadership:1} },
      { text:"Focus on the part you can personally help with most", d:{responsibility:2,independence:1} } ]},
    { id:"lea14", text:"You're teaching someone a skill you're genuinely good at, and they're struggling to get it.", options:[
      { text:"Break it down slower and stay patient through the repeats", d:{patience:2,empathy:1} },
      { text:"Try a completely different way of explaining it", d:{creativity:1,adaptability:1,leadership:1} },
      { text:"Let them struggle a bit longer before stepping in again", d:{patience:1,trust:2} } ]},
    { id:"lea15", text:"Your idea gets picked over a colleague's in a meeting, and they seem visibly frustrated.", options:[
      { text:"Talk to them privately afterward", d:{empathy:1,leadership:1,responsibility:2} },
      { text:"Give them real credit for parts of their idea going forward", d:{kindness:1,leadership:1} },
      { text:"Let it be, competition is normal", d:{confidence:1,competitiveness:1,independence:1} } ]},

    { id:"lea16", text:"You're the one who actually understands the group project topic best, and it shows.", options:[
      { text:"Take the lead and assign the workload", d:{leadership:2,confidence:1} },
      { text:"Teach the others enough that leadership isn't just on you", d:{leadership:1,empathy:1,patience:1} },
      { text:"Do more than your share quietly rather than manage people", d:{responsibility:3,independence:1} } ]},
    { id:"lea17", text:"You're organizing a trip for a big group of friends with very different budgets.", options:[
      { text:"Design one plan that works within the tightest budget", d:{leadership:1,empathy:1,planning:1} },
      { text:"Offer tiered options so everyone can opt into what fits", d:{planning:2,leadership:1} },
      { text:"Let people self-select into smaller compatible groups", d:{adaptability:1,leadership:1} } ]},
    { id:"lea18", text:"Your team is about to enter a competitive event and morale is a little shaky.", options:[
      { text:"Give a real, honest pep talk before it starts", d:{leadership:2,confidence:1,empathy:1} },
      { text:"Focus everyone on the plan instead of the nerves", d:{logic:1,leadership:1,discipline:1} },
      { text:"Lighten the mood with humor first", d:{humor:2,leadership:1} } ]},
    { id:"lea19", text:"You're mentoring someone younger in a creative skill you've spent years developing.", options:[
      { text:"Push them hard, growth happens under real challenge", d:{discipline:1,leadership:1,drive:1} },
      { text:"Let them experiment freely before correcting anything", d:{patience:2,openMindedness:1} },
      { text:"Tailor your approach specifically to how they learn best", d:{empathy:2,leadership:1} } ]},
    { id:"lea20", text:"Your workplace is rolling out a new piece of technology and half the team is resistant to it.", options:[
      { text:"Champion it publicly and show people it's not so bad", d:{leadership:2,confidence:1} },
      { text:"Listen to the resistance first, there might be a real reason", d:{empathy:1,logic:1,leadership:1} },
      { text:"Quietly master it yourself and let results speak", d:{independence:1,discipline:1,drive:1} } ]},

  ],

  philosophical: [
    { id:"phi1", text:"You could know the exact date of your death, but never anything else about the future.", options:[
      { text:"Yes, you'd plan your life around it", d:{planning:2,logic:1,drive:1} },
      { text:"No, not knowing is part of what makes life feel open", d:{optimism:1,independence:1} },
      { text:"You'd want to know, but you're not sure you could handle it", d:{selfAwareness:2,empathy:1} } ]},
    { id:"phi2", text:"A machine could make you perfectly happy forever, but it's not real, would you plug in?", options:[
      { text:"No, a real, imperfect life matters more than manufactured happiness", d:{selfAwareness:2,resilience:2} },
      { text:"Yes, happiness is happiness, real or not", d:{optimism:1,risk:1} },
      { text:"You'd want to try it briefly, then decide", d:{curiosity:2,adaptability:1} } ]},
    { id:"phi3", text:"You find out a core belief you've held for years was built on a mistake.", options:[
      { text:"Let it go immediately and rebuild from scratch", d:{selfAwareness:2,adaptability:1} },
      { text:"Sit with it for a while before changing anything", d:{patience:2,logic:1} },
      { text:"Keep the parts of it that still feel true to you", d:{independence:1,selfAwareness:1,confidence:1} } ]},
    { id:"phi4", text:"Would you rather always know the truth, or always be comfortable?", options:[
      { text:"Truth, every time, even when it's painful", d:{logic:2,resilience:2,confidence:1} },
      { text:"Comfort, some truths aren't worth the cost", d:{empathy:1,patience:1,optimism:1} },
      { text:"Depends entirely on who else it affects", d:{empathy:2,selfAwareness:1} } ]},
    { id:"phi5", text:"You're given the chance to relive one year of your life exactly as it happened.", options:[
      { text:"Yes, you'd want to feel it all again, mistakes included", d:{optimism:2,resilience:2} },
      { text:"No, you'd rather move only forward", d:{drive:1,independence:1} },
      { text:"Only if you could change one small thing", d:{selfAwareness:1,logic:1} } ]},
    { id:"phi6", text:"Is it better to be feared, respected, or liked, if you could only pick one?", options:[
      { text:"Respected, it lasts longer than the other two", d:{leadership:2,discipline:1} },
      { text:"Liked, connection matters more than status", d:{empathy:1,kindness:1,socialEnergy:1} },
      { text:"None of those matter as much as being understood", d:{selfAwareness:2,independence:1} } ]},
    { id:"phi7", text:"Would you rather achieve real success that feels hollow, or genuine happiness that looks small from outside?", options:[
      { text:"Happiness, quietly, every time", d:{optimism:2,selfAwareness:1} },
      { text:"Success, it tends to create happiness eventually", d:{drive:2,confidence:1} },
      { text:"You'd want to find a version that's actually both", d:{planning:1,optimism:1,logic:1} } ]},
    { id:"phi8", text:"Is a regret you never act on still worth carrying, or is it just wasted weight?", options:[
      { text:"It still teaches you something, even unresolved", d:{selfAwareness:2,resilience:2} },
      { text:"Better to let it go completely if you're not acting on it", d:{emotionalStability:4,optimism:1} },
      { text:"Depends entirely on what the regret actually is", d:{logic:1,selfAwareness:1} } ]},
    { id:"phi9", text:"If you knew for certain your biggest dream would never happen, would you still chase it?", options:[
      { text:"Yes, the chasing has its own value", d:{persistence:2,optimism:1} },
      { text:"No, you'd redirect that energy somewhere winnable", d:{logic:2,adaptability:1} },
      { text:"You'd want proof first, certainty like that is rare", d:{logic:1,curiosity:1} } ]},
    { id:"phi10", text:"Does failure actually teach more than success does, or is that just something people say to feel better?", options:[
      { text:"Genuinely, yes, failure is where the real lessons are", d:{resilience:3,selfAwareness:1} },
      { text:"Success teaches plenty too, just different things", d:{optimism:1,logic:1} },
      { text:"Depends on whether you actually reflect on either one", d:{selfAwareness:2,logic:1} } ]},
    { id:"phi11", text:"A childhood memory you're fond of turns out to have not happened quite the way you remember it.", options:[
      { text:"The feeling still matters more than the exact facts", d:{optimism:1,openMindedness:1} },
      { text:"You'd want to know the real version, however it lands", d:{logic:2,selfAwareness:1} },
      { text:"It makes you wonder what else you've misremembered", d:{curiosity:1,selfAwareness:2} } ]},
    { id:"phi12", text:"Is it better to be afraid of the right things, or afraid of nothing at all?", options:[
      { text:"Afraid of the right things, fear can be useful information", d:{logic:1,selfAwareness:1,discipline:1} },
      { text:"Afraid of nothing, fear mostly just gets in the way", d:{risk:2,confidence:1} },
      { text:"Somewhere in between, fully fearless sounds exhausting to maintain", d:{emotionalStability:2,logic:1} } ]},
    { id:"phi13", text:"If money were never a factor again, would your daily life actually look different?", options:[
      { text:"Completely different, money is the main thing in the way", d:{drive:1,optimism:1} },
      { text:"Barely different, you're already doing what matters to you", d:{selfAwareness:2,optimism:1} },
      { text:"You honestly don't know until you'd have to test it", d:{curiosity:1,selfAwareness:1} } ]},
    { id:"phi14", text:"Do people mostly change who they are, or mostly just become more of who they already were?", options:[
      { text:"People become more of who they already were", d:{selfAwareness:1,logic:1} },
      { text:"People genuinely change, given the right circumstances", d:{optimism:1,openMindedness:2} },
      { text:"Both happen, just on very different timelines", d:{logic:1,openMindedness:1} } ]},
    { id:"phi15", text:"What matters more in the long run, being remembered, or having actually mattered while you were here?", options:[
      { text:"Having mattered, being remembered is out of your control anyway", d:{selfAwareness:2,kindness:1} },
      { text:"Being remembered still counts for something real", d:{drive:1,confidence:1} },
      { text:"They're more connected than they first seem", d:{logic:1,openMindedness:1} } ]},

    { id:"phi16", text:"If an AI could perfectly predict your next decision every time, would that change how you make decisions?", options:[
      { text:"Yes, knowing you're predictable might push you to surprise it", d:{independence:1,risk:1,openMindedness:1} },
      { text:"No, the decision would still feel like yours either way", d:{selfAwareness:2,confidence:1} },
      { text:"It would mostly just make you curious how it's done", d:{curiosity:2,logic:1} } ]},
    { id:"phi17", text:"Do animals experience something close to what we'd call an inner life, or is that mostly us projecting?", options:[
      { text:"Almost certainly yes, in their own way", d:{empathy:2,openMindedness:1} },
      { text:"Hard to say, and that uncertainty is honestly interesting", d:{curiosity:2,logic:1} },
      { text:"Probably simpler than we like to imagine", d:{logic:2} } ]},
    { id:"phi18", text:"Is home a place, or is it something you carry with you wherever you actually end up?", options:[
      { text:"A place, specifically, it's not interchangeable", d:{trust:2,discipline:1} },
      { text:"Something you carry, it's the people and habits, not the address", d:{independence:1,optimism:1,selfAwareness:1} },
      { text:"A mix, and it changes depending on the season of your life", d:{adaptability:2,openMindedness:1} } ]},
    { id:"phi19", text:"Does real competition make people better, or does it just make people more anxious versions of who they already were?", options:[
      { text:"It makes people genuinely better, pressure reveals capacity", d:{competitiveness:2,drive:1} },
      { text:"It mostly just amplifies whatever was already there", d:{selfAwareness:2,logic:1} },
      { text:"Depends entirely on whether the competition feels fair", d:{logic:1,empathy:1} } ]},
    { id:"phi20", text:"Is art meant to be understood, or is being felt enough, even without full understanding?", options:[
      { text:"Felt is enough, understanding is optional", d:{creativity:1,openMindedness:2} },
      { text:"Understanding deepens the feeling, both matter", d:{logic:1,curiosity:1,creativity:1} },
      { text:"Depends entirely on what the art is trying to do", d:{logic:1,openMindedness:1} } ]},

  ],

  playful: [
    { id:"pla1", text:"You're given a fake stopwatch that can pause real time for exactly sixty seconds, once.", options:[
      { text:"Save it for a genuine emergency", d:{planning:2,discipline:1} },
      { text:"Use it immediately just to see what happens", d:{curiosity:2,risk:2} },
      { text:"Use it to do something small and delightful for someone else", d:{kindness:2,creativity:1} } ]},
    { id:"pla2", text:"You can instantly become fluent in one skill, but everyone will know you cheated to get it.", options:[
      { text:"Don't care, take the skill anyway", d:{confidence:2,risk:1} },
      { text:"Skip it, earning things matters to your identity", d:{discipline:2,selfAwareness:1} },
      { text:"Take it, but only tell people who'd understand", d:{trust:2,selfAwareness:1,humor:1} } ]},
    { id:"pla3", text:"Everyone at a gathering is asked to share an embarrassing story about themselves.", options:[
      { text:"Go all in with your best one", d:{confidence:2,humor:2,socialEnergy:1} },
      { text:"Share something mild and safe", d:{patience:1,socialEnergy:1} },
      { text:"Deflect with a joke instead of a real story", d:{humor:2,independence:1} } ]},
    { id:"pla4", text:"You get to add one universally understood rule to how the world works, purely for fun.", options:[
      { text:"Everyone has to dance for ten seconds on their birthday", d:{humor:2,creativity:1} },
      { text:"Everyone gets one genuinely honest compliment a day", d:{kindness:2,empathy:1} },
      { text:"Everyone gets one free redo on their worst decision", d:{empathy:1,optimism:2} } ]},
    { id:"pla5", text:"A game night turns unexpectedly, hilariously competitive.", options:[
      { text:"Lean all the way into winning", d:{drive:2,confidence:1,risk:1} },
      { text:"Play it up for laughs more than the win", d:{humor:2,socialEnergy:1} },
      { text:"Quietly make sure everyone's still having fun", d:{empathy:2,leadership:1} } ]},
    { id:"pla6", text:"You could have any harmless, ridiculous superpower for one day.", options:[
      { text:"Talk to animals, just to see what they'd say", d:{curiosity:2,humor:1} },
      { text:"Teleport anywhere, instantly", d:{independence:2,risk:1} },
      { text:"Make anyone laugh, guaranteed", d:{humor:2,empathy:1} } ]},
    { id:"pla7", text:"A meme format takes over the internet for exactly one week and then vanishes forever.", options:[
      { text:"Ride it hard while it lasts", d:{humor:2,socialEnergy:1,openMindedness:1} },
      { text:"Watch from a distance and enjoy other people's versions", d:{humor:1,patience:1} },
      { text:"Make one good one and move on", d:{creativity:1,humor:1,discipline:1} } ]},
    { id:"pla8", text:"You're given a game power that lets you swap places with any NPC for exactly one hour.", options:[
      { text:"Pick the most chaotic background character available", d:{humor:2,risk:1,openMindedness:1} },
      { text:"Pick someone who seems to be having a genuinely great life", d:{curiosity:1,optimism:1} },
      { text:"Pick the shopkeeper, free reign of the inventory for an hour", d:{humor:1,risk:1} } ]},
    { id:"pla9", text:"Two completely different TV shows are getting a surprise crossover episode, your pick.", options:[
      { text:"Two shows that would clash hilariously in tone", d:{humor:2,creativity:1} },
      { text:"Two shows whose characters would genuinely get along", d:{empathy:1,creativity:1} },
      { text:"Two shows that would just break reality entirely", d:{creativity:2,openMindedness:1} } ]},
    { id:"pla10", text:"You find the exact toy or game you were obsessed with as a kid, still in its original box.", options:[
      { text:"Open it immediately, nostalgia doesn't keep", d:{risk:1,optimism:1,openMindedness:1} },
      { text:"Keep it sealed as a little time capsule", d:{discipline:1,patience:1} },
      { text:"Track down the exact person you used to play it with", d:{socialEnergy:2,empathy:1} } ]},
    { id:"pla11", text:"A wedding you're at hits a moment of pure, unplanned chaos, the cake falls, the mic cuts out, something.", options:[
      { text:"Laugh loudly, it's the best part of the story now", d:{humor:2,optimism:1,adaptability:1} },
      { text:"Quietly try to help fix it", d:{kindness:1,responsibility:2,adaptability:1} },
      { text:"Film it discreetly for posterity", d:{humor:1,curiosity:1} } ]},
    { id:"pla12", text:"You meet a genuinely friendly mythical creature that grants exactly one small, silly wish.", options:[
      { text:"Wish to always know the perfect thing to say", d:{confidence:1,humor:1,socialEnergy:1} },
      { text:"Wish for a pet version of the creature itself", d:{humor:2,openMindedness:1} },
      { text:"Wish to understand what animals are actually thinking", d:{curiosity:2,empathy:1} } ]},
    { id:"pla13", text:"Your family tells the same embarrassing story about you every single gathering.", options:[
      { text:"Lean into it and tell it better than they do", d:{humor:2,confidence:1} },
      { text:"Groan through it every time, it never gets old to them", d:{patience:1,humor:1} },
      { text:"Retaliate with an embarrassing story of your own", d:{humor:2,competitiveness:1} } ]},
    { id:"pla14", text:"You're on a first date and the conversation turns into an unexpectedly ridiculous hypothetical game.", options:[
      { text:"Go all in, the weirder the better", d:{humor:2,openMindedness:2} },
      { text:"Play along but keep it a little grounded", d:{adaptability:1,humor:1} },
      { text:"Redirect toward something a bit more real", d:{selfAwareness:1,patience:1} } ]},
    { id:"pla15", text:"You're asked to predict, for fun, what your life looks like in an absurdly exaggerated ten years.", options:[
      { text:"Go with the most over-the-top version possible", d:{humor:2,optimism:1,openMindedness:1} },
      { text:"Give a genuinely hopeful, grounded answer instead", d:{optimism:2,selfAwareness:1} },
      { text:"Deflect with a joke about how unpredictable life is", d:{humor:2,adaptability:1} } ]},

    { id:"pla16", text:"Your pet could suddenly talk, fluently, for exactly five minutes.", options:[
      { text:"Ask them what they actually think of you", d:{confidence:1,humor:1,curiosity:1} },
      { text:"Ask if they're happy and what would make life better for them", d:{empathy:2,kindness:1} },
      { text:"Ask them to settle an old argument about what they did that one time", d:{humor:2,curiosity:1} } ]},
    { id:"pla17", text:"You receive exactly one letter from your future self, no more contact allowed after this.", options:[
      { text:"Hope it's full of specific, practical advice", d:{planning:1,logic:1,curiosity:1} },
      { text:"Hope it's mostly just reassurance that things turn out okay", d:{optimism:2,empathy:1} },
      { text:"Almost don't want to open it, some things are better unknown", d:{discipline:1,independence:1} } ]},
    { id:"pla18", text:"A surprisingly polite dragon knocks and asks, sincerely, if you'd like to become its roommate.", options:[
      { text:"Say yes immediately, this is objectively incredible", d:{risk:2,openMindedness:2,optimism:1} },
      { text:"Ask a lot of very reasonable logistical questions first", d:{logic:2,planning:1} },
      { text:"Politely decline, but ask to stay in touch", d:{kindness:1,discipline:1,patience:1} } ]},
    { id:"pla19", text:"You find a mysterious, ornate key that doesn't seem to match any lock you know of.", options:[
      { text:"Spend the next while actively trying every lock you can find", d:{persistence:2,curiosity:1} },
      { text:"Keep it somewhere safe and let the mystery be its own reward", d:{patience:1,openMindedness:1} },
      { text:"Show it to someone who might actually know what it's from", d:{socialEnergy:1,curiosity:1,trust:2} } ]},
    { id:"pla20", text:"You're granted the ability to instantly become fluent in the language of exactly one animal.", options:[
      { text:"Dogs, obviously, the drama alone would be worth it", d:{humor:2,empathy:1} },
      { text:"Crows, they clearly know something we don't", d:{curiosity:2,openMindedness:1} },
      { text:"Whatever animal would tell you the most useful things", d:{logic:1,curiosity:1} } ]},

  ],

  cautious: [
    { id:"cau1", text:"A financial opportunity promises big returns but asks you to move fast with no guarantees.", options:[
      { text:"Pass, if it's rushing you, it's a red flag", d:{discipline:2,trust:-2,logic:1} },
      { text:"Put in a small amount to test it", d:{risk:1,logic:1,planning:1} },
      { text:"Go all in, big rewards need big risk", d:{risk:2,confidence:1,optimism:1} } ]},
    { id:"cau2", text:"You're offered a comfortable, stable path or an exciting, uncertain one.", options:[
      { text:"Stable, peace of mind wins", d:{discipline:2,patience:1,planning:1} },
      { text:"Exciting, regret scares you more than risk does", d:{risk:2,drive:2} },
      { text:"You'd want a plan to eventually combine both", d:{planning:2,creativity:1} } ]},
    { id:"cau3", text:"Before a big decision, you realize you don't have all the information you'd like.", options:[
      { text:"Gather more before deciding, even if it takes time", d:{planning:2,patience:1,discipline:1} },
      { text:"Decide anyway with what you've got", d:{risk:1,confidence:1,adaptability:1} },
      { text:"Ask someone more experienced to weigh in", d:{trust:3,empathy:1} } ]},
    { id:"cau4", text:"You've saved up for something you've wanted for a long time, and a tempting alternative appears.", options:[
      { text:"Stick to the original plan", d:{discipline:2,patience:1} },
      { text:"Switch, if the new option is genuinely better", d:{adaptability:2,logic:1} },
      { text:"Sleep on it for a few days first", d:{patience:2,planning:1} } ]},
    { id:"cau5", text:"You're about to try something physically or socially risky for the first time.", options:[
      { text:"Just go for it, overthinking ruins the moment", d:{risk:2,confidence:2} },
      { text:"Prepare thoroughly first", d:{planning:2,discipline:1} },
      { text:"Bring someone along for support", d:{trust:2,socialEnergy:1,empathy:1} } ]},
    { id:"cau6", text:"A rule at work or school seems outdated, but breaking it could cause real trouble.", options:[
      { text:"Follow it anyway, not your fight today", d:{discipline:2,patience:1} },
      { text:"Push to change it through the proper channels", d:{leadership:2,logic:1} },
      { text:"Quietly work around it if no one's really watching", d:{risk:1,independence:1,adaptability:1} } ]},
    { id:"cau7", text:"A friend pitches a business idea and wants you to invest your own savings.", options:[
      { text:"Ask for real numbers before considering anything", d:{logic:2,discipline:1} },
      { text:"Invest a small, safe amount to support them", d:{kindness:1,risk:1,planning:1} },
      { text:"Say no to money, but offer to help in other ways", d:{discipline:2,trust:2} } ]},
    { id:"cau8", text:"You're deciding whether to take a stable job offer or hold out for a riskier, better one.", options:[
      { text:"Take the stable offer, certainty has real value", d:{discipline:2,planning:1} },
      { text:"Hold out, the upside is worth the wait", d:{risk:2,persistence:1} },
      { text:"Take the stable one while quietly still looking", d:{planning:2,logic:1} } ]},
    { id:"cau9", text:"Your family is discussing a big shared financial decision that affects everyone.", options:[
      { text:"Push for the most conservative option available", d:{discipline:2,responsibility:2} },
      { text:"Advocate for taking a calculated chance", d:{risk:1,logic:1,confidence:1} },
      { text:"Trust whoever in the family knows finances best", d:{trust:3,patience:1} } ]},
    { id:"cau10", text:"You're dating someone great, but a few small things about them keep nagging at you.", options:[
      { text:"Bring it up early, better to know now", d:{confidence:1,responsibility:2} },
      { text:"Watch a while longer before deciding it matters", d:{patience:2,logic:1} },
      { text:"Let it go, nobody's perfect", d:{optimism:1,trust:2} } ]},
    { id:"cau11", text:"A game you love adds a purchase that promises a real edge, for real money.", options:[
      { text:"Buy it without much hesitation", d:{risk:1,drive:1} },
      { text:"Skip it on principle, you'd rather earn it", d:{discipline:2,persistence:1} },
      { text:"Wait to see if it's actually worth it first", d:{logic:1,patience:1,discipline:1} } ]},
    { id:"cau12", text:"Your team wants to try a completely untested approach right before a major deadline.", options:[
      { text:"Push back, this isn't the moment to gamble", d:{discipline:2,responsibility:2} },
      { text:"Support a small test version of it instead", d:{logic:1,adaptability:1,planning:1} },
      { text:"Trust the team and go for it fully", d:{trust:3,risk:1} } ]},
    { id:"cau13", text:"Before a serious long-term commitment, you realize you still have real doubts.", options:[
      { text:"Voice the doubts honestly before going further", d:{confidence:1,responsibility:3} },
      { text:"Give it more time to see if the doubts fade", d:{patience:2,discipline:1} },
      { text:"Trust your gut and decide either way", d:{confidence:1,risk:1} } ]},
    { id:"cau14", text:"An adventure activity you want to try has a real, if small, chance of injury.", options:[
      { text:"Do it anyway, some risk is worth the experience", d:{risk:2,optimism:1} },
      { text:"Do it, but only with every safety precaution available", d:{planning:2,discipline:1} },
      { text:"Skip it, the odds don't need to favor you every time", d:{discipline:2,patience:1} } ]},
    { id:"cau15", text:"You've failed at the same kind of thing twice before and a third chance just showed up.", options:[
      { text:"Try again, third time might genuinely be different", d:{persistence:2,optimism:1} },
      { text:"Change your whole approach before trying again", d:{logic:1,adaptability:2} },
      { text:"Sit this one out, some patterns are worth noticing", d:{selfAwareness:2,discipline:1} } ]},

    { id:"cau16", text:"A friend wants you to co-invest in an AI startup idea that sounds promising but very unproven.", options:[
      { text:"Ask for a real business plan before considering it", d:{logic:2,discipline:1} },
      { text:"Put in a small amount as a bet on the friendship and the idea", d:{trust:2,risk:1,kindness:1} },
      { text:"Pass entirely, unproven ideas aren't where your savings go", d:{discipline:2,responsibility:2} } ]},
    { id:"cau17", text:"You're planning a solo trip somewhere you don't speak the language.", options:[
      { text:"Go anyway and figure it out as you go", d:{risk:2,adaptability:1,confidence:1} },
      { text:"Prepare thoroughly, translation apps, routes, backups", d:{planning:2,discipline:1} },
      { text:"Book a guided option instead of going fully solo", d:{discipline:1,patience:1} } ]},
    { id:"cau18", text:"You're holding onto an embarrassing secret that isn't really hurting anyone by staying hidden.", options:[
      { text:"Keep it exactly where it is, some things don't need airing", d:{discipline:1,independence:1} },
      { text:"Tell one deeply trusted person, just to not carry it alone", d:{trust:3,empathy:1} },
      { text:"Let it go eventually when the moment feels right", d:{patience:1,selfAwareness:1} } ]},
    { id:"cau19", text:"During a competition, you notice a small way to bend the rules that almost certainly wouldn't get caught.", options:[
      { text:"Absolutely not, it's not worth what it costs internally", d:{discipline:2,responsibility:3} },
      { text:"Feel tempted, but ultimately walk away from it", d:{selfAwareness:1,discipline:1} },
      { text:"Consider it seriously if the stakes are high enough", d:{risk:1,competitiveness:2} } ]},
    { id:"cau20", text:"A fashion trend everyone's suddenly wearing doesn't really feel like you, but it's genuinely everywhere.", options:[
      { text:"Try a toned-down version just to see", d:{adaptability:1,openMindedness:1} },
      { text:"Skip it entirely, trends aren't a good reason on their own", d:{independence:2,discipline:1} },
      { text:"Wait and see if it's still around in six months", d:{patience:2,logic:1} } ]},

  ],

  ambitious: [
    { id:"amb1", text:"You're offered a huge opportunity, but it means leaving behind people and places you love.", options:[
      { text:"Take it, this is exactly the kind of chance you chase", d:{drive:2,risk:1,independence:1} },
      { text:"Turn it down, what you have matters more", d:{kindness:1,patience:1,drive:-1} },
      { text:"Negotiate a version that lets you keep both", d:{creativity:1,leadership:1,planning:1} } ]},
    { id:"amb2", text:"You could guarantee steady, comfortable success, or gamble for a shot at something extraordinary.", options:[
      { text:"Gamble, extraordinary is worth the risk", d:{drive:2,risk:2,optimism:1,competitiveness:1} },
      { text:"Steady success, extraordinary is overrated", d:{discipline:1,patience:1,drive:-1} },
      { text:"Depends entirely on what you'd be gambling with", d:{logic:2,planning:1} } ]},
    { id:"amb3", text:"You hit a huge setback on something you've worked toward for years.", options:[
      { text:"Get back up immediately and adjust the plan", d:{resilience:3,drive:1,planning:1} },
      { text:"Take real time to process before moving again", d:{selfAwareness:2,patience:1} },
      { text:"Question whether it was even the right goal", d:{selfAwareness:1,logic:1,adaptability:1} } ]},
    { id:"amb4", text:"You're far ahead of schedule on a personal goal, what now?", options:[
      { text:"Raise the bar and push further", d:{drive:2,confidence:1,competitiveness:1} },
      { text:"Enjoy the win before starting the next thing", d:{optimism:2,patience:1} },
      { text:"Help someone else catch up to where you are", d:{kindness:2,leadership:1} } ]},
    { id:"amb5", text:"Someone you respect tells you your goal is unrealistic.", options:[
      { text:"It only makes you want it more", d:{drive:2,confidence:1,resilience:2,competitiveness:1} },
      { text:"You take it seriously and reconsider", d:{selfAwareness:2,logic:1} },
      { text:"You ask them exactly why, and decide from there", d:{curiosity:1,logic:1,confidence:1} } ]},
    { id:"amb6", text:"You reach a major goal, but almost no one notices or celebrates it with you.", options:[
      { text:"It doesn't matter, you know what you did", d:{independence:2,confidence:1,selfAwareness:1} },
      { text:"It stings more than you'd like to admit", d:{selfAwareness:2,empathy:1} },
      { text:"You make sure to celebrate it properly yourself", d:{optimism:2,kindness:1} } ]},
    { id:"amb7", text:"You're offered a role that pays less but is a real step toward the career you actually want.", options:[
      { text:"Take it, the direction matters more than the number", d:{drive:2,persistence:1} },
      { text:"Negotiate hard before accepting anything", d:{confidence:1,logic:1,drive:1} },
      { text:"Pass, the pay cut isn't worth it right now", d:{discipline:1,planning:1,drive:-1} } ]},
    { id:"amb8", text:"You're ranked against other people in something competitive, like a game or a sport, and you're falling behind.", options:[
      { text:"Grind harder until you close the gap", d:{persistence:2,competitiveness:2,drive:1} },
      { text:"Study what the people ahead of you are doing differently", d:{logic:1,curiosity:1,competitiveness:1} },
      { text:"Let the ranking matter less than actually enjoying it", d:{optimism:1,competitiveness:-1} } ]},
    { id:"amb9", text:"Your family expected a very specific path for you, and your actual dream looks nothing like it.", options:[
      { text:"Follow your own dream, even if it disappoints them", d:{independence:2,confidence:1,drive:1} },
      { text:"Find a version that satisfies both, if one exists", d:{adaptability:1,logic:1,planning:1} },
      { text:"Follow their path and keep your dream as a side pursuit", d:{responsibility:2,discipline:1,patience:1} } ]},
    { id:"amb10", text:"You define success mostly by what, when you're honest with yourself?", options:[
      { text:"How far you've come compared to where you started", d:{selfAwareness:1,drive:1} },
      { text:"How you compare to the people around you", d:{competitiveness:2,drive:1} },
      { text:"Whether you're proud of how you got there", d:{selfAwareness:2,discipline:1} } ]},
    { id:"amb11", text:"A tenth failed attempt at the same big goal lands, and it stings more than the last nine.", options:[
      { text:"Push through anyway, the tenth doesn't cancel the effort", d:{persistence:2,resilience:3} },
      { text:"Take a real break before deciding whether to try an eleventh", d:{selfAwareness:1,patience:1,emotionalStability:2} },
      { text:"Rethink whether this particular goal still fits who you are now", d:{selfAwareness:2,logic:1} } ]},
    { id:"amb12", text:"You picture your life exactly ten years from now, as honestly as you can.", options:[
      { text:"Ambitious, busy, and clearly further along than today", d:{drive:2,optimism:1} },
      { text:"Calmer and more settled than today, and that's the actual goal", d:{optimism:1,discipline:1} },
      { text:"Genuinely hard to picture, and that's fine with you", d:{adaptability:1,openMindedness:1} } ]},
    { id:"amb13", text:"Someone with far less experience than you gets picked for an opportunity you wanted badly.", options:[
      { text:"Ask directly what you can improve for next time", d:{selfAwareness:1,confidence:1,drive:1} },
      { text:"Let the disappointment sit before deciding what's next", d:{emotionalStability:2,patience:1} },
      { text:"Compete harder for the next one that comes along", d:{competitiveness:2,persistence:1} } ]},
    { id:"amb14", text:"You've achieved something you worked toward for years, and it feels smaller than you expected.", options:[
      { text:"Set the next goal almost immediately", d:{drive:2,persistence:1} },
      { text:"Sit with the anticlimax and figure out what that means", d:{selfAwareness:2,emotionalStability:2} },
      { text:"Make sure to actually celebrate it properly first", d:{optimism:2,kindness:1} } ]},
    { id:"amb15", text:"Building the life you actually want will take a lot longer than you'd like it to.", options:[
      { text:"That's fine, you're playing a long game anyway", d:{persistence:2,patience:1,optimism:1} },
      { text:"It's frustrating, but you'll find ways to speed it up", d:{drive:2,logic:1} },
      { text:"You'd rather redefine the goal to fit a shorter timeline", d:{adaptability:2,logic:1} } ]},

    { id:"amb16", text:"Pursuing music or art seriously would mean walking away from a far more stable path.", options:[
      { text:"Walk away from stability, this is the one life you get", d:{risk:2,drive:2,confidence:1} },
      { text:"Build the stable path first, then transition once it's safer", d:{planning:2,discipline:1} },
      { text:"Keep both running in parallel as long as you possibly can", d:{persistence:2,discipline:1} } ]},
    { id:"amb17", text:"You're within reach of being ranked at the very top of something you compete in.", options:[
      { text:"Push everything else aside until you get there", d:{drive:2,competitiveness:2} },
      { text:"Keep pursuing it, but not at the cost of everything else", d:{planning:1,discipline:1,competitiveness:1} },
      { text:"Notice the chase mattered more to you than the rank itself", d:{selfAwareness:2,optimism:1} } ]},
    { id:"amb18", text:"Your goal is to visit every country in the world, and right now that looks genuinely far off.", options:[
      { text:"Start planning the logistics of an actual timeline", d:{planning:2,drive:1} },
      { text:"Let it stay a loose, long-term dream instead of a strict plan", d:{optimism:1,adaptability:1} },
      { text:"Reassess whether it's really the goal, or just a nice idea", d:{selfAwareness:2,logic:1} } ]},
    { id:"amb19", text:"Going further in school or college would cost real time and money you'd rather not spend.", options:[
      { text:"Do it anyway, the long-term payoff is worth the cost", d:{drive:2,persistence:1} },
      { text:"Find a cheaper or faster way to the same outcome", d:{logic:2,creativity:1} },
      { text:"Skip it and build the same skills a different way", d:{independence:2,confidence:1} } ]},
    { id:"amb20", text:"AI and new technology are reshaping your entire field faster than you expected.", options:[
      { text:"Get ahead of it, learn the new tools before you have to", d:{drive:2,curiosity:1,adaptability:1} },
      { text:"Focus on the human skills that won't get automated", d:{empathy:1,creativity:1,confidence:1} },
      { text:"Wait and see how it actually shakes out before reacting", d:{patience:2,logic:1} } ]},

  ],
};

/* Flatten with cluster tag attached */
const QUESTIONS = Object.entries(QUESTION_BANK).flatMap(([cluster, qs]) =>
  qs.map(q => ({ ...q, cluster }))
);

/* ---- The 12 core archetypes ---------------------------------------- */
/* Each archetype carries a small "signature" of {dim, weight} pairs used
   by the matching algorithm (see engine.js: matchArchetype). */

const ARCHETYPES = [
  { id:"stormcaller", name:"The Stormcaller", title:"Command Presence", icon:"⛈️",
    colors:["#818CF8","#38BDF8"],
    image:"assets/archetypes/webp/stormcaller.webp",
    signature:[{dim:"leadership",w:2},{dim:"confidence",w:2},{dim:"risk",w:1}],
    description:"You don't wait for a room to find its energy, you bring it. When things get tense, people look to you first, and you usually already have an answer.",
    strengths:["Decisive under pressure","Magnetic presence","Rallies people fast"],
    weaknesses:["Can steamroll quieter voices","Impatient with hesitation","Struggles to sit still"],
    workStyle:"Takes the room, sets the pace, expects people to keep up.",
    stressResponse:"Gets louder and more directive, not quieter.",
    friendshipStyle:"The one who organizes the group and actually makes it happen.",
    datingStyle:"Flirts like it's a competition, means it anyway.",
    leadershipStyle:"Leads from the front, out loud, no committee required.",
    learningStyle:"Learns by taking charge of something real, not by watching.",
    communicationStyle:"Blunt, fast, doesn't dress things up much.",
    decisionMaking:"Decides quickly and owns it, right or wrong.",
    idealEnvironments:["High-stakes rooms","Teams that need a push","Anywhere with a clear stage"],
    hobbies:["Public speaking or debate","Competitive sports","Organizing group trips"],
    growthAdvice:"Not every room needs a captain. Some just need you to listen first.",
    bestTeammate:"Someone calm who tempers the intensity without dimming it.",
    worstTeammate:"Another Stormcaller fighting for the same mic.",
    quote:"Somebody has to say it first." },

  { id:"architect", name:"The Architect", title:"Builder of Systems", icon:"🏛️",
    colors:["#34D399","#CBD5E1"],
    image:"assets/archetypes/webp/architect.webp",
    signature:[{dim:"planning",w:2},{dim:"discipline",w:2},{dim:"logic",w:1}],
    description:"You think in blueprints. Before anyone else has a plan, you already have three, plus a backup for when the first one breaks.",
    strengths:["Long-term planning","Reliability","Clear-headed problem solving"],
    weaknesses:["Resists improvisation","Can seem distant","Overinvests in process"],
    workStyle:"Systematic, prefers owning process and infrastructure end-to-end.",
    stressResponse:"Retreats into organizing something, anything.",
    friendshipStyle:"Consistent and dependable, not flashy about it.",
    datingStyle:"Shows love through stability and follow-through.",
    leadershipStyle:"Leads by designing systems people can actually trust.",
    learningStyle:"Builds the mental framework first, fills in detail after.",
    communicationStyle:"Measured, considered, rarely impulsive.",
    decisionMaking:"Slow and thorough, would rather be right than first.",
    idealEnvironments:["Structured organizations","Long-horizon projects","Quiet, independent work"],
    hobbies:["Building or making things","Puzzles and logic games","Organizing anything, honestly"],
    growthAdvice:"Not every moment needs a system. Some just need presence.",
    bestTeammate:"An energetic connector who brings the system to life.",
    worstTeammate:"Someone allergic to structure or follow-through.",
    quote:"Good systems are just kindness with a plan." },

  { id:"sentinel", name:"The Sentinel", title:"Unshaken Ground", icon:"🛡️",
    colors:["#60A5FA","#2DD4BF"],
    image:"assets/archetypes/webp/sentinel.webp",
    signature:[{dim:"responsibility",w:2},{dim:"emotionalStability",w:2},{dim:"trust",w:1}],
    description:"You're who people call when things actually go wrong, not because you love the chaos, but because you don't flinch in it.",
    strengths:["Steady under pressure","Deeply reliable","Protective of people who matter"],
    weaknesses:["Struggles to ask for help","Carries too much quietly","Can resist change"],
    workStyle:"Holds the line, shows up every time, no exceptions.",
    stressResponse:"Gets more composed, not less, right when it counts.",
    friendshipStyle:"The friend who actually answers at 2am.",
    datingStyle:"Slow to open up, unshakeable once they do.",
    leadershipStyle:"Leads by being the person others can lean on.",
    learningStyle:"Learns through repetition until it's second nature.",
    communicationStyle:"Calm, grounded, says less than it's thinking.",
    decisionMaking:"Weighs risk to the people involved before anything else.",
    idealEnvironments:["Teams under real pressure","Long-term commitments","Anywhere trust actually matters"],
    hobbies:["Strength training","Caretaking, plants or people","Long, familiar routines"],
    growthAdvice:"Being needed isn't the same as being okay. Let someone hold it sometimes.",
    bestTeammate:"Someone spontaneous who gets you to loosen the grip a little.",
    worstTeammate:"Someone who treats your steadiness as a given, never a gift.",
    quote:"I don't move unless it matters. Then I don't stop." },

  { id:"pathfinder", name:"The Pathfinder", title:"Off the Map", icon:"🧭",
    colors:["#FBBF24","#34D399"],
    image:"assets/archetypes/webp/pathfinder.webp",
    signature:[{dim:"curiosity",w:2},{dim:"adaptability",w:2},{dim:"independence",w:1}],
    description:"Comfort zones bore you a little. You'd rather figure it out as you go than follow someone else's map, even when their map is fine.",
    strengths:["Fast adaptation","Genuine curiosity","Comfortable with uncertainty"],
    weaknesses:["Struggles to commit to one path","Underplans logistics","Gets restless with routine"],
    workStyle:"Improvises well, gets bored fast once a thing becomes routine.",
    stressResponse:"Changes something, anything, rather than sit with it.",
    friendshipStyle:"The friend with the story nobody else has.",
    datingStyle:"Exciting, a little unpredictable, hard to pin down early on.",
    leadershipStyle:"Leads by finding the way nobody else saw yet.",
    learningStyle:"Learns by wandering into it, not by studying it first.",
    communicationStyle:"Curious, tangential, asks more questions than it answers.",
    decisionMaking:"Chooses the interesting option over the safe one, often.",
    idealEnvironments:["New or unfamiliar settings","Loosely structured projects","Anywhere with room to explore"],
    hobbies:["Travel, planned or not","Trying new hobbies constantly","Getting intentionally lost"],
    growthAdvice:"Finishing the path is sometimes the more interesting part.",
    bestTeammate:"A planner who catches the logistics you'd rather skip.",
    worstTeammate:"Someone who needs the whole route mapped before step one.",
    quote:"The map is just someone else's opinion." },

  { id:"archivist", name:"The Archivist", title:"Keeper of Detail", icon:"📚",
    colors:["#A78BFA","#F472B6"],
    image:"assets/archetypes/webp/archivist.webp",
    signature:[{dim:"selfAwareness",w:2},{dim:"patience",w:2},{dim:"logic",w:1}],
    description:"You remember the detail everyone else forgot, and you're quietly the person with the most context in the room.",
    strengths:["Deep pattern memory","Careful, considered judgment","Quiet expertise"],
    weaknesses:["Slow to speak up","Overthinks small decisions","Holds onto old context too long"],
    workStyle:"Thorough, prefers to actually understand before acting.",
    stressResponse:"Goes inward, replays details until it makes sense.",
    friendshipStyle:"Remembers the thing you mentioned once, months ago.",
    datingStyle:"Notices everything, says little until it's sure.",
    leadershipStyle:"Leads by knowing more than anyone expected them to.",
    learningStyle:"Reads everything first, asks questions second.",
    communicationStyle:"Precise, quiet, chooses words carefully.",
    decisionMaking:"Wants the full picture before committing to anything.",
    idealEnvironments:["Research-heavy work","Low-noise environments","Roles that reward depth over speed"],
    hobbies:["Reading widely","Archiving or collecting things","Trivia and deep-dive rabbit holes"],
    growthAdvice:"You don't need the full picture to say something true right now.",
    bestTeammate:"Someone decisive who turns your context into action.",
    worstTeammate:"Someone who wants an answer before you've actually thought about it.",
    quote:"Context is the whole job." },

  { id:"dreamweaver", name:"The Dreamweaver", title:"Half Elsewhere", icon:"🌙",
    colors:["#F472B6","#818CF8"],
    image:"assets/archetypes/webp/dreamweaver.webp",
    signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:2},{dim:"empathy",w:1}],
    description:"Your head is a little bit somewhere else, mid-idea, half a world you're still building. Most of your best thinking happens sideways.",
    strengths:["Original thinking","Emotionally attuned","Comfortable with ambiguity"],
    weaknesses:["Loses the thread on logistics","Can seem scattered","Avoids hard practical calls"],
    workStyle:"Nonlinear, follows the idea wherever it actually leads.",
    stressResponse:"Escapes into imagination rather than facing it head-on.",
    friendshipStyle:"The friend with the wildest, most specific inside jokes.",
    datingStyle:"Romantic in a way that's more felt than said.",
    leadershipStyle:"Leads by making people feel like more is possible.",
    learningStyle:"Learns through story, metaphor, and association.",
    communicationStyle:"Expressive, imagistic, occasionally hard to pin down.",
    decisionMaking:"Follows what feels right before what looks rational.",
    idealEnvironments:["Creative, low-rigid-structure work","Rooms that welcome weird ideas","Anywhere imagination is currency"],
    hobbies:["Writing or art","Daydreaming, unironically","Music that means something specific"],
    growthAdvice:"An idea only changes anything once it lands somewhere real.",
    bestTeammate:"A grounded finisher who turns the idea into something shipped.",
    worstTeammate:"Someone who needs everything decided before the fun part starts.",
    quote:"I'm not distracted. I'm just also somewhere else." },

  { id:"vanguard", name:"The Vanguard", title:"Leading Edge", icon:"☄️",
    colors:["#FB923C","#FACC15"],
    image:"assets/archetypes/webp/vanguard.webp",
    signature:[{dim:"drive",w:2},{dim:"competitiveness",w:2},{dim:"risk",w:1}],
    description:"You go first, on purpose. Waiting for permission has never really been your style, and it shows in everything you touch.",
    strengths:["Bold initiative","Relentless drive","Thrives under competition"],
    weaknesses:["Impulsive follow-through","Burns out fast","Skips the boring but necessary steps"],
    workStyle:"Fast-paced, thrives on momentum and visible progress.",
    stressResponse:"Pushes harder and faster, sometimes to a fault.",
    friendshipStyle:"The friend who starts the plan nobody else would suggest.",
    datingStyle:"Intense, all-in early, occasionally too fast for their own good.",
    leadershipStyle:"Leads by example, from the front, at full speed.",
    learningStyle:"Learns by doing, not by reading about it first.",
    communicationStyle:"Enthusiastic, direct, occasionally overwhelming.",
    decisionMaking:"Fast, confident, occasionally regretted later.",
    idealEnvironments:["High-energy teams","Competitive settings","Anything with a real deadline"],
    hobbies:["Competitive sports","Adventure or extreme activities","Anything with a scoreboard"],
    growthAdvice:"Speed is a strength until it starts making your decisions for you.",
    bestTeammate:"A grounded planner who catches what you miss.",
    worstTeammate:"Someone equally impulsive with no one steering.",
    quote:"Ask forgiveness, not permission." },

  { id:"oracle", name:"The Oracle", title:"Sees the Undercurrent", icon:"🔮",
    colors:["#38BDF8","#A78BFA"],
    image:"assets/archetypes/webp/oracle.webp",
    signature:[{dim:"empathy",w:2},{dim:"curiosity",w:2},{dim:"selfAwareness",w:1}],
    description:"You notice what people don't say out loud. Half the time you know how something's going to land before it does.",
    strengths:["Reads people accurately","Sharp intuition","Comfortable naming hard truths"],
    weaknesses:["Overthinks other people's motives","Can seem cryptic","Absorbs others' moods too easily"],
    workStyle:"Reads the room before reading the brief.",
    stressResponse:"Withdraws to process what it's sensing before saying anything.",
    friendshipStyle:"Knows something's wrong before you've said a word.",
    datingStyle:"Perceptive to a fault, sometimes overanalyzes what's actually simple.",
    leadershipStyle:"Leads by naming the thing nobody else was willing to say.",
    learningStyle:"Learns by watching patterns, not by being told the rule.",
    communicationStyle:"Thoughtful, a little indirect, precise when it matters.",
    decisionMaking:"Trusts the gut read, then checks it against the facts.",
    idealEnvironments:["Roles centered on people","Quiet spaces to actually think","Anywhere nuance is valued"],
    hobbies:["People-watching, unapologetically","Journaling","Astrology, tarot, or anything symbolic"],
    growthAdvice:"Not every read needs to be spoken out loud right away.",
    bestTeammate:"Someone direct who turns your read into a real conversation.",
    worstTeammate:"Someone who dismisses a read just because they can't see it yet.",
    quote:"I already knew, I was just waiting for you to say it." },

  { id:"luminary", name:"The Luminary", title:"Warm Light", icon:"🏮",
    colors:["#FACC15","#FB7185"],
    image:"assets/archetypes/webp/luminary.webp",
    signature:[{dim:"optimism",w:2},{dim:"socialEnergy",w:2},{dim:"kindness",w:1}],
    description:"People leave conversations with you feeling a little more capable than when they walked in. That's not an accident, it's just how you show up.",
    strengths:["Genuinely encouraging","Easy to be around","Brings out the best in others"],
    weaknesses:["Avoids necessary conflict","Overextends for others","Struggles to sit with negativity"],
    workStyle:"Collaborative, energizes the room without needing the spotlight.",
    stressResponse:"Reaches for connection rather than isolation.",
    friendshipStyle:"The friend who remembers everyone's good news.",
    datingStyle:"Warm, affirming, makes people feel genuinely seen.",
    leadershipStyle:"Leads by making people believe they can do more than they thought.",
    learningStyle:"Learns best alongside other people, out loud.",
    communicationStyle:"Warm, affirming, generous with encouragement.",
    decisionMaking:"Weighs how it affects everyone, not just the outcome.",
    idealEnvironments:["People-centered work","Collaborative teams","Anywhere morale actually matters"],
    hobbies:["Hosting people","Volunteering","Group activities of almost any kind"],
    growthAdvice:"Some conversations need honesty more than they need comfort.",
    bestTeammate:"A straight-shooter who says the hard thing you're avoiding.",
    worstTeammate:"Someone who mistakes your warmth for a lack of a backbone.",
    quote:"Bring your own light and the room follows." },

  { id:"catalyst", name:"The Catalyst", title:"Where It Starts", icon:"⚡",
    colors:["#FDE047","#FB923C"],
    image:"assets/archetypes/webp/catalyst.webp",
    signature:[{dim:"humor",w:2},{dim:"adaptability",w:1},{dim:"drive",w:1}],
    description:"Things move when you're in the room, conversations open up, plans actually happen. You're rarely the loudest, but you're often the reason it started.",
    strengths:["Breaks the ice fast","Reads the room's energy","Turns talk into action"],
    weaknesses:["Struggles to finish what it starts","Avoids sitting still","Uses humor to dodge hard topics"],
    workStyle:"Gets things moving, hands off the follow-through happily.",
    stressResponse:"Jokes through it, sometimes instead of feeling it.",
    friendshipStyle:"The friend who turns a boring night into a story.",
    datingStyle:"Playful first, sincere once it's earned trust.",
    leadershipStyle:"Leads by making the first move so everyone else can too.",
    learningStyle:"Learns by jumping in and making it fun.",
    communicationStyle:"Quick, funny, disarms tension on instinct.",
    decisionMaking:"Decides based on momentum, worries about the details later.",
    idealEnvironments:["Fast-moving teams","Social, high-energy settings","Anywhere that needs a spark"],
    hobbies:["Stand-up or improv","Hosting spontaneous plans","Anything mildly chaotic and fun"],
    growthAdvice:"Starting things is a real skill. Finishing them is too.",
    bestTeammate:"A steady closer who picks up exactly where you left off.",
    worstTeammate:"Someone who needs everything serious, all the time.",
    quote:"I didn't plan this, but I'm not mad about it." },

  { id:"maverick", name:"The Maverick", title:"Own Rules", icon:"🗡️",
    colors:["#94A3B8","#F87171"],
    image:"assets/archetypes/webp/maverick.webp",
    signature:[{dim:"independence",w:2},{dim:"openMindedness",w:1},{dim:"risk",w:1}],
    description:"You'd rather be right and alone than comfortable and wrong. Rules get a fair hearing from you, then get questioned anyway.",
    strengths:["Thinks independently","Unbothered by consensus","Genuinely original"],
    weaknesses:["Resists structure on principle","Can isolate unnecessarily","Dismisses good advice too fast"],
    workStyle:"Prefers full ownership, chafes under close oversight.",
    stressResponse:"Pulls away to handle it alone, on its own terms.",
    friendshipStyle:"Small, fiercely chosen circle, no interest in the rest.",
    datingStyle:"Guarded at first, deeply loyal once someone's actually in.",
    leadershipStyle:"Leads by doing it differently and being right often enough to earn it.",
    learningStyle:"Learns by taking it apart and rebuilding it their own way.",
    communicationStyle:"Blunt, unfiltered, says the thing others won't.",
    decisionMaking:"Trusts its own read over the group's, most of the time.",
    idealEnvironments:["Autonomous roles","Small teams with real trust","Anywhere original thinking is welcome"],
    hobbies:["Solo projects and side quests","Unconventional interests","Anything nobody asked them to do"],
    growthAdvice:"Being different isn't the same as being right. Check sometimes.",
    bestTeammate:"Someone who earns trust slowly and doesn't push for it.",
    worstTeammate:"Someone who needs constant consensus to move at all.",
    quote:"I heard the rule. I have a different plan." },

  { id:"visionary", name:"The Visionary", title:"Sees It Finished", icon:"✨",
    colors:["#C4B5FD","#5EEAD4"],
    image:"assets/archetypes/webp/visionary.webp",
    signature:[{dim:"persistence",w:2},{dim:"creativity",w:1},{dim:"confidence",w:1}],
    description:"You see the finished version before anyone else believes it's possible, and you're stubborn enough to actually build toward it.",
    strengths:["Big-picture thinking","Unshakeable persistence","Inspires belief in others"],
    weaknesses:["Impatient with small steps","Can ignore inconvenient details","Sets the bar unreasonably high"],
    workStyle:"Works backward from the end goal, fills in the middle as needed.",
    stressResponse:"Zooms out further instead of narrowing in.",
    friendshipStyle:"The friend who believes in your plans before you fully do.",
    datingStyle:"Sees the long game early, sometimes too early.",
    leadershipStyle:"Leads by painting the picture until everyone else can see it too.",
    learningStyle:"Learns by connecting it to the bigger goal, not the isolated fact.",
    communicationStyle:"Big-picture, persuasive, occasionally short on detail.",
    decisionMaking:"Chooses whatever moves the long-term vision forward.",
    idealEnvironments:["Ambitious, long-horizon work","Rooms open to big ideas","Anywhere the goal is allowed to be large"],
    hobbies:["Goal-setting, unironically","Reading about the future","Building toward something personal"],
    growthAdvice:"The next small step matters as much as the whole vision.",
    bestTeammate:"A detail-oriented closer who makes the vision actually work.",
    worstTeammate:"Someone who can't see past the next two weeks.",
    quote:"I'm not there yet. I've just already seen it." },
];

/* ---- Careers (fit computed from dimensions, not hardcoded per archetype) */
const CAREERS = [
  { name:"UX Designer", dims:["empathy","creativity","logic"] },
  { name:"UI Designer", dims:["creativity","discipline","selfAwareness"] },
  { name:"Product Designer", dims:["creativity","logic","leadership"] },
  { name:"Illustrator / Artist", dims:["creativity","independence","curiosity"] },
  { name:"Graphic Designer", dims:["creativity","discipline","curiosity"] },
  { name:"Software Engineer", dims:["logic","discipline","patience"] },
  { name:"Data Analyst", dims:["logic","patience","curiosity"] },
  { name:"Architect", dims:["planning","creativity","discipline"] },
  { name:"Civil Engineer", dims:["planning","logic","discipline"] },
  { name:"Doctor / Clinician", dims:["empathy","discipline","resilience"] },
  { name:"Nurse", dims:["empathy","resilience","patience"] },
  { name:"Physical Therapist", dims:["patience","empathy","discipline"] },
  { name:"Teacher / Educator", dims:["patience","empathy","leadership"] },
  { name:"School Counselor", dims:["empathy","patience","selfAwareness"] },
  { name:"Entrepreneur", dims:["risk","drive","confidence"] },
  { name:"Small Business Owner", dims:["drive","discipline","adaptability"] },
  { name:"Researcher / Scientist", dims:["curiosity","logic","patience"] },
  { name:"Environmental Scientist", dims:["curiosity","planning","discipline"] },
  { name:"Writer", dims:["creativity","independence","selfAwareness"] },
  { name:"Journalist", dims:["curiosity","confidence","logic"] },
  { name:"Editor", dims:["logic","discipline","creativity"] },
  { name:"Film / Video Director", dims:["creativity","leadership","confidence"] },
  { name:"Video Editor", dims:["creativity","patience","discipline"] },
  { name:"Game Designer", dims:["creativity","logic","curiosity"] },
  { name:"Musician / Performer", dims:["creativity","confidence","humor"] },
  { name:"Psychologist / Therapist", dims:["empathy","patience","selfAwareness"] },
  { name:"Social Worker", dims:["empathy","kindness","resilience"] },
  { name:"Lawyer", dims:["logic","confidence","discipline"] },
  { name:"Paralegal", dims:["discipline","logic","patience"] },
  { name:"Chef", dims:["creativity","discipline","risk"] },
  { name:"Pastry Chef", dims:["discipline","creativity","patience"] },
  { name:"Marketing Strategist", dims:["creativity","socialEnergy","adaptability"] },
  { name:"Sales Manager", dims:["confidence","socialEnergy","drive"] },
  { name:"Human Resources Manager", dims:["empathy","leadership","discipline"] },
  { name:"Animator", dims:["creativity","patience","discipline"] },
  { name:"Operations / Project Manager", dims:["planning","discipline","leadership"] },
  { name:"Financial Analyst", dims:["logic","discipline","patience"] },
  { name:"Accountant", dims:["discipline","logic","patience"] },
  { name:"Urban Planner", dims:["planning","empathy","logic"] },
  { name:"Event Planner", dims:["planning","socialEnergy","adaptability"] },
  { name:"Firefighter / EMT", dims:["resilience","confidence","kindness"] },
  { name:"Military / Law Enforcement", dims:["discipline","resilience","leadership"] },
  { name:"Diplomat / Foreign Service", dims:["empathy","adaptability","leadership"] },
  { name:"Nonprofit Program Manager", dims:["kindness","leadership","planning"] },
  { name:"Data Scientist", dims:["logic","curiosity","discipline"] },
  { name:"Product Manager", dims:["leadership","logic","adaptability"] },
];

/* ---- Relationship pairing types (compatibility computed in engine.js) -- */
const RELATIONSHIP_TYPES = [
  { key:"friendship", label:"Friendship" },
  { key:"dating", label:"Dating" },
  { key:"marriage", label:"Marriage" },
  { key:"business", label:"Business Partner" },
  { key:"creative", label:"Creative Partner" },
  { key:"travel", label:"Travel Partner" },
  { key:"gaming", label:"Gaming Partner" },
  { key:"study", label:"Study Partner" },
  { key:"roommate", label:"Roommate" },
];

/* ---- Lines shown during brief "calculating" transitions ----------------
   Rotated randomly, a mix of genuine-sounding processing steps and a
   couple of lighter ones, purely as a loading-state flourish. */
const CALC_LINES = [
  "Calculating cool factor",
  "Calculating baseline friendship motor",
  "Reading between the lines",
  "Cross-referencing your instincts",
  "Weighing risk against reason",
  "Measuring your patience threshold",
  "Checking how you handle a bad Tuesday",
  "Comparing this answer against the last one",
  "Running the numbers on your empathy",
  "Mapping your decision pattern",
  "Adjusting for how you actually think, not just what you picked",
  "Testing for consistency",
  "Locating your stress response",
  "Estimating your social battery",
  "Narrowing down your archetype",
  "Weighing loyalty against independence",
  "Checking your leadership signal",
  "Recalculating after that last answer",
];

/* ---- Lines shown while two codes are being compared --------------------- */
const COMPATIBILITY_CALC_LINES = [
  "Decoding both profiles",
  "Cross-referencing every trait",
  "Weighing shared strengths",
  "Checking for friction points",
  "Measuring trust overlap",
  "Comparing decision styles",
  "Working out who leads and who supports",
  "Running the numbers across 31 categories",
  "Finding your duo title",
  "Calculating chemistry",
  "Almost got your compatibility score",
];

/* =========================================================================
   V2 ADDITIONS
   Everything below is new for the v2 update. Nothing above this line was
   removed or restructured, so PF1 codes and the original 20-dimension
   scoring still work exactly as before.
   ========================================================================= */

/* ---- Archetype extras: animal, element, symbol -------------------------
   primaryColor, secondaryColor, lifeMotto and favoriteEnvironment are all
   derived directly from existing archetype fields (colors, quote,
   idealEnvironments) rather than re-authored, so there is nothing new to
   keep in sync. hiddenPotential is generated from each archetype's own
   strengths/weaknesses in engine.js, also with no separate authoring. */
const ARCHETYPE_EXTRAS = {
  "stormcaller": { animal:"Lion", element:"Storm", symbol:"\u26C8" },
  "architect": { animal:"Beaver", element:"Earth", symbol:"\uD83C\uDFDB" },
  "sentinel": { animal:"Wolf", element:"Earth", symbol:"\uD83D\uDEE1" },
  "pathfinder": { animal:"Mountain Goat", element:"Earth", symbol:"\uD83E\uDDED" },
  "archivist": { animal:"Tortoise", element:"Shadow", symbol:"\uD83D\uDCDC" },
  "dreamweaver": { animal:"Moth", element:"Dream", symbol:"\uD83C\uDF19" },
  "vanguard": { animal:"Cheetah", element:"Fire", symbol:"\u2604" },
  "oracle": { animal:"Owl", element:"Shadow", symbol:"\uD83D\uDD2E" },
  "luminary": { animal:"Firefly", element:"Light", symbol:"\uD83C\uDFEE" },
  "catalyst": { animal:"Hawk", element:"Fire", symbol:"\u26A1" },
  "maverick": { animal:"Raven", element:"Metal", symbol:"\uD83D\uDDE1" },
  "visionary": { animal:"Falcon", element:"Air", symbol:"\u2728" },
};

/* ---- Narrative roles ---------------------------------------- */
const NARRATIVE_ROLES = [
  { name:"Hero", icon:"\u2694", signature:[{dim:"leadership",w:2},{dim:"kindness",w:1},{dim:"resilience",w:1}],
    description:"You're the one who ends up carrying the weight when it matters, not because you asked to, but because you didn't look away." },
  { name:"Main Character", icon:"\u2B50", signature:[{dim:"confidence",w:2},{dim:"drive",w:1},{dim:"creativity",w:1}],
    description:"Things seem to happen around you, and somehow you're rarely just in the background of your own life." },
  { name:"Anti Hero", icon:"\uD83D\uDDA4", signature:[{dim:"independence",w:2},{dim:"risk",w:1},{dim:"competitiveness",w:1}],
    description:"You do the right thing eventually, just rarely the tidy, expected way." },
  { name:"Mentor", icon:"\uD83D\uDCD6", signature:[{dim:"empathy",w:1},{dim:"patience",w:2},{dim:"selfAwareness",w:1}],
    description:"People end up learning more from watching you than from anything you actually say." },
  { name:"Guardian", icon:"\uD83D\uDEE1", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1},{dim:"kindness",w:1}],
    description:"You quietly decide who and what is worth protecting, and then you just do it." },
  { name:"Strategist", icon:"\u265F", signature:[{dim:"logic",w:2},{dim:"planning",w:2}],
    description:"While everyone else reacts, you're already three moves further into the situation." },
  { name:"Explorer", icon:"\uD83E\uDDED", signature:[{dim:"curiosity",w:2},{dim:"openMindedness",w:1},{dim:"risk",w:1}],
    description:"Unfamiliar territory doesn't worry you, it's usually the whole reason you showed up." },
  { name:"Rebel", icon:"\uD83D\uDD25", signature:[{dim:"independence",w:1},{dim:"risk",w:2},{dim:"competitiveness",w:1}],
    description:"Rules get your attention mostly by existing, and you're rarely satisfied with \"that's just how it's done\"." },
  { name:"Trickster", icon:"\uD83C\uDFAD", signature:[{dim:"humor",w:2},{dim:"creativity",w:1},{dim:"adaptability",w:1}],
    description:"You'd rather solve a problem sideways than head-on, and it's more fun that way anyway." },
  { name:"Mastermind", icon:"\uD83E\uDDE0", signature:[{dim:"logic",w:1},{dim:"leadership",w:1},{dim:"independence",w:1}],
    description:"You see the whole board, and you're usually already several steps ahead of the conversation." },
  { name:"Visionary", icon:"\uD83D\uDD2E", signature:[{dim:"creativity",w:2},{dim:"drive",w:1},{dim:"optimism",w:1}],
    description:"You're pulled toward what things could become, more than what they already are." },
  { name:"Wild Card", icon:"\uD83C\uDCCF", signature:[{dim:"adaptability",w:2},{dim:"openMindedness",w:1},{dim:"humor",w:1}],
    description:"Nobody's quite sure what you'll do next, including, some days, you." },
  { name:"Comic Relief", icon:"\uD83D\uDE02", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1},{dim:"optimism",w:1}],
    description:"You lighten a room without even trying, and it matters more than people usually say out loud." },
  { name:"Survivor", icon:"\uD83E\uDEB6", signature:[{dim:"resilience",w:2},{dim:"persistence",w:1},{dim:"emotionalStability",w:1}],
    description:"You've been through enough that very little catches you fully off guard anymore." },
  { name:"Rival", icon:"\uD83C\uDFC6", signature:[{dim:"competitiveness",w:2},{dim:"confidence",w:1},{dim:"drive",w:1}],
    description:"You do your best work when there's someone or something to measure yourself against." },
  { name:"Villain", icon:"\uD83D\uDC79", signature:[{dim:"independence",w:1},{dim:"competitiveness",w:1},{dim:"trust",w:-2}],
    description:"You've stopped needing the room's approval, for better and occasionally worse." },
  { name:"Hidden Villain", icon:"\uD83C\uDFAD", signature:[{dim:"selfAwareness",w:1},{dim:"independence",w:1},{dim:"trust",w:-1}],
    description:"You keep your real agenda close, and people rarely see it coming." },
  { name:"Chosen One", icon:"\u2728", signature:[{dim:"optimism",w:1},{dim:"resilience",w:1},{dim:"drive",w:1}],
    description:"Things seem to keep testing you specifically, and you keep rising to it anyway." },
  { name:"Lone Wolf", icon:"\uD83D\uDC3A", signature:[{dim:"independence",w:2},{dim:"resilience",w:1}],
    description:"You handle your own weather. Backup is nice, but you were never counting on it." },
];

/* ---- Aesthetic vibes --------------------------------------- */
const AESTHETIC_VIBES = [
  { name:"Minimalist", signature:[{dim:"discipline",w:2},{dim:"planning",w:1},{dim:"independence",w:1}],
    colors:"Monochrome, with a single considered accent color",
    fontPairing:"A clean grotesk sans, generous whitespace, nothing decorative",
    clothing:"Neutral tones, a few well-made basics rather than a lot of pieces",
    room:"Uncluttered, with only objects you'd defend keeping",
    workspace:"One screen, a closed tab list, nothing on the desk you don't use daily" },
  { name:"Maximalist", signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1},{dim:"humor",w:1}],
    colors:"Layered and saturated, more is more and it still works",
    fontPairing:"An expressive display face paired with a plain, quiet body font",
    clothing:"Pattern on pattern, secondhand pieces that already have a story",
    room:"Every wall doing something, nothing left blank",
    workspace:"Covered in reference material and half-finished ideas" },
  { name:"Moody", signature:[{dim:"independence",w:2},{dim:"selfAwareness",w:1},{dim:"risk",w:1}],
    colors:"Deep charcoal and ink, one warm point of light",
    fontPairing:"A narrow serif for headlines, monospace for detail",
    clothing:"Mostly black, well-tailored, quietly expensive-looking",
    room:"Low light, very few objects, each one deliberate",
    workspace:"One lamp, a closed door, minimal notifications" },
  { name:"Bright and Playful", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1},{dim:"optimism",w:1}],
    colors:"Warm, saturated primaries",
    fontPairing:"A rounded sans with big, friendly headlines",
    clothing:"Color blocking, one slightly silly accessory",
    room:"Plants, posters, visible personality everywhere",
    workspace:"Sticky notes, music on, a little chaos that works" },
  { name:"Classic and Structured", signature:[{dim:"responsibility",w:2},{dim:"discipline",w:1},{dim:"planning",w:1}],
    colors:"Navy, cream, and forest green",
    fontPairing:"A traditional serif with a restrained sans for interface text",
    clothing:"Tailored and timeless, rarely trend-driven",
    room:"Symmetry, good lighting, nothing out of place",
    workspace:"Labeled folders and an actual calendar on the wall" },
  { name:"Bohemian", signature:[{dim:"openMindedness",w:2},{dim:"curiosity",w:1},{dim:"creativity",w:1}],
    colors:"Earth tones and warm textiles",
    fontPairing:"A handwritten accent font over a soft serif body",
    clothing:"Layered and textured, well-traveled",
    room:"Plants, textiles, souvenirs that each have a story",
    workspace:"A mess that only makes sense to you, and that's fine" },
  { name:"Industrial", signature:[{dim:"logic",w:1},{dim:"discipline",w:1},{dim:"independence",w:1}],
    colors:"Concrete grey and black steel, one raw wood tone",
    fontPairing:"A monospace headline over a utilitarian sans body",
    clothing:"Functional, durable, unfussy",
    room:"Exposed materials, minimal decoration",
    workspace:"Built for output, not for showing off" },
  { name:"Soft and Cozy", signature:[{dim:"kindness",w:2},{dim:"patience",w:1},{dim:"empathy",w:1}],
    colors:"Warm neutrals and muted pastels",
    fontPairing:"A rounded, soft serif with generous line height",
    clothing:"Layered knits, comfort over statement",
    room:"Warm lighting, soft textures, a blanket always within reach",
    workspace:"A candle, a plant, something handmade nearby" },
];

/* ---- Ideal environments ------------------------------------ */
const ENVIRONMENT_PROFILES = [
  { name:"Remote", signature:[{dim:"independence",w:2},{dim:"discipline",w:1}] },
  { name:"Office", signature:[{dim:"socialEnergy",w:1},{dim:"discipline",w:1},{dim:"planning",w:1}] },
  { name:"Startup", signature:[{dim:"risk",w:2},{dim:"drive",w:1}] },
  { name:"Corporate", signature:[{dim:"responsibility",w:2},{dim:"planning",w:1}] },
  { name:"Nature", signature:[{dim:"curiosity",w:1},{dim:"independence",w:1},{dim:"openMindedness",w:1}] },
  { name:"City", signature:[{dim:"socialEnergy",w:2},{dim:"curiosity",w:1}] },
  { name:"Night", signature:[{dim:"independence",w:1},{dim:"creativity",w:1},{dim:"openMindedness",w:1}] },
  { name:"Morning", signature:[{dim:"discipline",w:2},{dim:"planning",w:1}] },
  { name:"Coffee Shop", signature:[{dim:"socialEnergy",w:1},{dim:"curiosity",w:1},{dim:"creativity",w:1}] },
  { name:"Library", signature:[{dim:"patience",w:2},{dim:"discipline",w:1}] },
  { name:"Home", signature:[{dim:"kindness",w:1},{dim:"patience",w:1},{dim:"independence",w:1}] },
  { name:"Freelancer", signature:[{dim:"independence",w:2},{dim:"adaptability",w:1}] },
  { name:"Research", signature:[{dim:"curiosity",w:2},{dim:"patience",w:1}] },
  { name:"Teaching", signature:[{dim:"patience",w:1},{dim:"empathy",w:1},{dim:"leadership",w:1}] },
  { name:"Creative Studio", signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1}] },
  { name:"Management", signature:[{dim:"leadership",w:2},{dim:"responsibility",w:1}] },
];

/* ---- Stress responses --------------------------------------- */
const STRESS_RESPONSES = [
  { name:"Fight", description:"You meet pressure head-on and push back rather than pull away.",
    signature:[{dim:"competitiveness",w:2},{dim:"confidence",w:1},{dim:"risk",w:1}] },
  { name:"Flight", description:"You create distance from the source of the stress until you can think clearly again.",
    signature:[{dim:"independence",w:2},{dim:"adaptability",w:1}] },
  { name:"Freeze", description:"Everything pauses for a moment before you can figure out the next move.",
    signature:[{dim:"emotionalStability",w:-2},{dim:"patience",w:1}] },
  { name:"Humor", description:"You defuse the tension, for yourself as much as anyone else, with a joke.",
    signature:[{dim:"humor",w:2},{dim:"adaptability",w:1}] },
  { name:"Planning", description:"You channel the stress directly into a plan, even an imperfect one.",
    signature:[{dim:"planning",w:2},{dim:"discipline",w:1}] },
  { name:"Isolation", description:"You process it alone before you're ready to bring anyone else in.",
    signature:[{dim:"independence",w:2},{dim:"socialEnergy",w:-1}] },
  { name:"Seeking Comfort", description:"You reach for warmth and reassurance, from people or routines you trust.",
    signature:[{dim:"empathy",w:1},{dim:"kindness",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Talking It Out", description:"Saying it out loud to someone else is how you actually process it.",
    signature:[{dim:"socialEnergy",w:2},{dim:"trust",w:1}] },
];

/* ---- Percentage-breakdown categories (Updates 8, 9, 10) ----------------- */
const THINKING_CATEGORIES = [
  { name:"Visual", dims:["creativity","curiosity"] },
  { name:"Logical", dims:["logic","logic"] },
  { name:"Creative", dims:["creativity","openMindedness"] },
  { name:"Strategic", dims:["planning","leadership"] },
  { name:"Abstract", dims:["curiosity","openMindedness"] },
  { name:"Practical", dims:["discipline","responsibility"] },
];
const LEARNING_CATEGORIES = [
  { name:"Reading", dims:["independence","patience"] },
  { name:"Watching", dims:["patience","curiosity"] },
  { name:"Teaching", dims:["leadership","empathy"] },
  { name:"Experimenting", dims:["curiosity","risk"] },
  { name:"Building", dims:["discipline","persistence"] },
  { name:"Discussion", dims:["socialEnergy","curiosity"] },
];
const DECISION_CATEGORIES = [
  { name:"Logic", dims:["logic","logic"] },
  { name:"Emotion", dims:["empathy","empathy"] },
  { name:"Instinct", dims:["risk","confidence"] },
  { name:"Curiosity", dims:["curiosity","openMindedness"] },
  { name:"Experience", dims:["selfAwareness","resilience"] },
];
const LOVE_LANGUAGE_CATEGORIES = [
  { name:"Physical Touch", dims:["socialEnergy","trust"] },
  { name:"Words of Affirmation", dims:["empathy","confidence"] },
  { name:"Quality Time", dims:["patience","trust","kindness"] },
  { name:"Acts of Service", dims:["responsibility","kindness","discipline"] },
  { name:"Gift Giving", dims:["creativity","drive","kindness"] },
];

/* ---- Attachment and conflict styles -------------------------- */
const ATTACHMENT_STYLES = [
  { name:"Secure", signature:[{dim:"trust",w:2},{dim:"emotionalStability",w:1},{dim:"empathy",w:1}],
    description:"You're generally comfortable with closeness and don't assume the worst when things go quiet." },
  { name:"Anxious", signature:[{dim:"trust",w:-1},{dim:"emotionalStability",w:-2},{dim:"empathy",w:1}],
    description:"You feel things in relationships intensely, and reassurance genuinely helps." },
  { name:"Avoidant", signature:[{dim:"independence",w:2},{dim:"trust",w:-1}],
    description:"You value your independence in relationships enough that closeness can sometimes feel like pressure." },
  { name:"Disorganized", signature:[{dim:"emotionalStability",w:-2},{dim:"independence",w:-1},{dim:"trust",w:-1}],
    description:"You want closeness and also feel wary of it, sometimes both in the same conversation." },
];
const CONFLICT_STYLES = [
  { name:"Assertive", signature:[{dim:"confidence",w:2},{dim:"leadership",w:1}],
    description:"You say what's wrong directly, early, before it has time to build up." },
  { name:"Avoidant", signature:[{dim:"independence",w:2},{dim:"socialEnergy",w:-1}],
    description:"You'd rather let small things pass than turn every disagreement into a conversation." },
  { name:"Collaborative", signature:[{dim:"empathy",w:2},{dim:"adaptability",w:1}],
    description:"You look for the version of the disagreement where both people actually get something they need." },
  { name:"Accommodating", signature:[{dim:"kindness",w:2},{dim:"patience",w:1}],
    description:"You tend to prioritize keeping the peace, sometimes more than getting your own way." },
];

/* ---- Entertainment taste profiles ---------------------------- */
const ENTERTAINMENT_PROFILES = [
  { name:"Epic and Adventurous", signature:[{dim:"risk",w:1},{dim:"drive",w:1},{dim:"optimism",w:1}],
    music:"Orchestral scores, anthemic rock", movie:"Epic adventure, fantasy",
    tv:"Long-arc fantasy series", book:"Epic fantasy, adventure fiction" },
  { name:"Dark and Cerebral", signature:[{dim:"logic",w:1},{dim:"independence",w:1},{dim:"selfAwareness",w:1}],
    music:"Moody electronic, post-rock", movie:"Psychological thriller, neo-noir",
    tv:"Prestige crime drama", book:"Literary fiction, philosophy" },
  { name:"Warm and Comforting", signature:[{dim:"kindness",w:1},{dim:"patience",w:1},{dim:"empathy",w:1}],
    music:"Acoustic, indie folk", movie:"Heartfelt drama, slice of life",
    tv:"Cozy sitcom", book:"Contemporary fiction, memoir" },
  { name:"Bold and Energetic", signature:[{dim:"humor",w:1},{dim:"socialEnergy",w:1},{dim:"confidence",w:1}],
    music:"Pop, hip hop", movie:"Action comedy",
    tv:"Ensemble comedy", book:"Fast-paced thriller" },
  { name:"Strange and Original", signature:[{dim:"creativity",w:1},{dim:"openMindedness",w:1},{dim:"curiosity",w:1}],
    music:"Experimental, genre-blending", movie:"Surreal indie, arthouse",
    tv:"Anthology sci-fi", book:"Speculative fiction, magical realism" },
  { name:"Sharp and Strategic", signature:[{dim:"logic",w:1},{dim:"planning",w:1},{dim:"leadership",w:1}],
    music:"Classical, instrumental", movie:"Heist, courtroom drama",
    tv:"Political drama", book:"Nonfiction, strategy and history" },
  { name:"Romantic and Emotional", signature:[{dim:"empathy",w:1},{dim:"trust",w:1},{dim:"optimism",w:1}],
    music:"Soul, R&B ballads", movie:"Romance, coming of age",
    tv:"Romantic drama", book:"Romance, emotionally driven fiction" },
  { name:"Rebellious and Independent", signature:[{dim:"independence",w:1},{dim:"risk",w:1},{dim:"competitiveness",w:1}],
    music:"Punk, alt rock", movie:"Underdog sports drama, heist",
    tv:"Antihero drama", book:"Gritty realism, rebellion narratives" },
];

/* ---- Achievements -------------------------------------------
   Each test runs against normalized dimensions (-10..10). Deterministic,
   no randomness, so the same profile always unlocks the same badges. */
const ACHIEVEMENTS = [
  { name:"Professional Overthinker", icon:"\uD83E\uDDE0", description:"High logic and high self-awareness, a dangerous combination for a quiet Sunday.",
    test: nd => nd.logic >= 5 && nd.selfAwareness >= 5 },
  { name:"Chaos Gremlin", icon:"\uD83D\uDE08", description:"High risk, high humor, low discipline. A menace, affectionately.",
    test: nd => nd.risk >= 5 && nd.humor >= 4 && nd.discipline <= -1 },
  { name:"Human Wikipedia", icon:"\uD83D\uDCDA", description:"Curiosity that doesn't really have an off switch.",
    test: nd => nd.curiosity >= 6 },
  { name:"Main Character Energy", icon:"\u2B50", description:"Confidence and drive, stacked.",
    test: nd => nd.confidence >= 6 && nd.drive >= 5 },
  { name:"Golden Retriever", icon:"\uD83D\uDC15", description:"High kindness, high optimism, genuinely happy to see people.",
    test: nd => nd.kindness >= 6 && nd.optimism >= 5 },
  { name:"Black Cat", icon:"\uD83D\uDC08\u200D\u2B1B", description:"Independent, a little chaotic, weirdly good company.",
    test: nd => nd.independence >= 6 && nd.humor >= 4 },
  { name:"Certified Therapist Friend", icon:"\uD83E\uDEC2", description:"People end up telling you things they haven't told anyone else.",
    test: nd => nd.empathy >= 6 && nd.patience >= 5 },
  { name:"Touch Grass", icon:"\uD83C\uDF31", description:"Low social energy, high independence, genuinely content alone.",
    test: nd => nd.socialEnergy <= -4 && nd.independence >= 5 },
  { name:"Walking Green Flag", icon:"\uD83C\uDFF3", description:"High trust, high kindness, high responsibility. The whole package.",
    test: nd => nd.trust >= 6 && nd.kindness >= 5 && nd.responsibility >= 5 },
  { name:"Clutch Machine", icon:"\uD83C\uDFAF", description:"Resilient and disciplined under real pressure.",
    test: nd => nd.resilience >= 6 && nd.discipline >= 5 },
  { name:"Built Different", icon:"\uD83E\uDEA8", description:"Persistence and drive that doesn't run out early.",
    test: nd => nd.persistence >= 6 && nd.drive >= 5 },
  { name:"Night Owl Thinker", icon:"\uD83E\uDD89", description:"Open-minded and independent, the two traits of someone who does their best thinking off-schedule.",
    test: nd => nd.openMindedness >= 5 && nd.independence >= 5 },
  { name:"Walking Red Flag (Self-Aware About It)", icon:"\uD83D\uDEA9", description:"Competitive and guarded, but at least you know it.",
    test: nd => nd.trust <= -3 && nd.competitiveness >= 5 && nd.selfAwareness >= 3 },
  { name:"Overthinks the Group Chat", icon:"\uD83D\uDCAC", description:"High self-awareness and moderate social energy, so every message gets reread twice.",
    test: nd => nd.selfAwareness >= 6 && nd.socialEnergy >= 0 && nd.socialEnergy <= 4 },
  { name:"Quiet Storm", icon:"\u26C8", description:"Low social energy but high leadership, influence without needing the room.",
    test: nd => nd.socialEnergy <= 0 && nd.leadership >= 5 },
  { name:"Comeback Season", icon:"\uD83D\uDD01", description:"High resilience and high optimism after clearly being tested.",
    test: nd => nd.resilience >= 5 && nd.optimism >= 5 && nd.emotionalStability <= 2 },
];

/* =========================================================================
   V3 ADDITIONS
   Deeper compatibility categories, confidence/stability support, fantasy
   and story roles, friendship and work profiles, extra fun-fact lookup
   tables. Nothing above this line changes.
   ========================================================================= */

/* ---- Compatibility categories (Update: Better Compatibility Algorithm) -
   type "similarity": scored on how alike the two people are on these dims.
   type "combined": scored on how much of this energy exists between them
   together, regardless of whether they're alike. */
const COMPATIBILITY_CATEGORIES = [
  { name:"Friendship", type:"similarity", dims:["trust","kindness","socialEnergy"] },
  { name:"Romantic Compatibility", type:"similarity", dims:["empathy","trust","confidence"] },
  { name:"Marriage", type:"similarity", dims:["patience","trust","discipline"] },
  { name:"Long Distance", type:"similarity", dims:["independence","trust","discipline"] },
  { name:"Communication", type:"similarity", dims:["socialEnergy","logic","empathy"] },
  { name:"Conflict Resolution", type:"similarity", dims:["patience","empathy","logic"] },
  { name:"Trust", type:"similarity", dims:["trust"] },
  { name:"Emotional Support", type:"similarity", dims:["empathy","kindness","patience"] },
  { name:"Humor", type:"combined", dims:["humor"] },
  { name:"Adventure", type:"combined", dims:["risk","curiosity","adaptability"] },
  { name:"Gaming Partner", type:"similarity", dims:["patience","logic","humor"] },
  { name:"Travel Partner", type:"similarity", dims:["adaptability","risk","curiosity"] },
  { name:"Study Partner", type:"similarity", dims:["discipline","patience","logic"] },
  { name:"Business Partner", type:"similarity", dims:["drive","logic","discipline"] },
  { name:"Creative Partner", type:"similarity", dims:["creativity","adaptability","curiosity"] },
  { name:"Startup Partner", type:"combined", dims:["risk","drive","adaptability"] },
  { name:"Roommate", type:"similarity", dims:["patience","trust","discipline"] },
  { name:"Daily Lifestyle", type:"similarity", dims:["discipline","planning","socialEnergy"] },
  { name:"Work Habits", type:"similarity", dims:["discipline","responsibility","planning"] },
  { name:"Leadership Balance", type:"similarity", dims:["leadership"] },
  { name:"Problem Solving", type:"similarity", dims:["logic","creativity","adaptability"] },
  { name:"Emotional Intelligence", type:"similarity", dims:["empathy","selfAwareness"] },
  { name:"Social Energy Balance", type:"similarity", dims:["socialEnergy"] },
  { name:"Life Goals", type:"similarity", dims:["drive","optimism","planning"] },
  { name:"Risk Taking", type:"similarity", dims:["risk"] },
  { name:"Decision Style", type:"similarity", dims:["logic","risk","curiosity"] },
  { name:"Learning Style", type:"similarity", dims:["independence","curiosity","socialEnergy"] },
  { name:"Future Planning", type:"similarity", dims:["planning","optimism"] },
  { name:"Reliability", type:"similarity", dims:["responsibility","discipline","trust"] },
  { name:"Fun Together", type:"combined", dims:["humor","socialEnergy","optimism"] },
  { name:"Chaos Together", type:"combined", dims:["risk","humor"] },
  { name:"Teamwork", type:"combined", dims:["leadership","adaptability","responsibility"] },
  { name:"Growth Potential", type:"combined", dims:["optimism","curiosity","resilience"] },
];

/* Overview metrics (Compare 2.0): a fixed, human-labeled subset of the
   categories above, in the order the overview grid shows them. Keeping
   this as a name->category mapping instead of duplicating scoring logic
   means the overview numbers and the "all categories" list underneath
   are always the exact same computation, never two slightly different
   ideas of "Trust" or "Communication". */
const COMPARE_OVERVIEW_METRICS = [
  { label:"Friendship", category:"Friendship" },
  { label:"Teamwork", category:"Teamwork" },
  { label:"Leadership", category:"Leadership Balance" },
  { label:"Communication", category:"Communication" },
  { label:"Conflict", category:"Conflict Resolution" },
  { label:"Trust", category:"Trust" },
  { label:"Decision Making", category:"Decision Style" },
  { label:"Creativity", category:"Creative Partner" },
  { label:"Growth Potential", category:"Growth Potential" },
];

/* ---- "Who does X more" comparisons -------------------------------------- */
const WHO_COMPARISONS = [
  { label:"Plans More", dim:"planning" },
  { label:"Takes More Risks", dim:"risk" },
  { label:"Leads More", dim:"leadership" },
  { label:"Supports More", dim:"kindness" },
  { label:"Comforts More", dim:"empathy" },
  { label:"Motivates More", dim:"drive" },
  { label:"Listens Better", dim:"patience" },
  { label:"Decides Faster", dim:"confidence" },
  { label:"Is More Creative", dim:"creativity" },
  { label:"Is More Practical", dim:"discipline" },
  { label:"Is More Curious", dim:"curiosity" },
  { label:"Is More Competitive", dim:"competitiveness" },
  { label:"Is More Social", dim:"socialEnergy" },
  { label:"Is More Independent", dim:"independence" },
  { label:"Is More Organized", dim:"planning" },
  { label:"Is More Emotionally Reactive", dim:"emotionalStability", invert:true },
  { label:"Is More Logical", dim:"logic" },
];

/* ---- Fantasy roles (Update: Fantasy Role) -------------------------------- */
const FANTASY_ROLES = [
  { name:"Knight", icon:"\u2694", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:2},{dim:"resilience",w:1}],
    description:"You hold the line. Discipline and duty come before comfort, every time." },
  { name:"Mage", icon:"\uD83D\uDD2E", signature:[{dim:"logic",w:2},{dim:"curiosity",w:1}],
    description:"You study the underlying rules of things until you can bend them." },
  { name:"Healer", icon:"\uD83D\uDC9A", signature:[{dim:"empathy",w:2},{dim:"kindness",w:1}],
    description:"You notice pain before it's spoken and you don't walk past it." },
  { name:"Ranger", icon:"\uD83C\uDFF9", signature:[{dim:"independence",w:1},{dim:"curiosity",w:1},{dim:"patience",w:1}],
    description:"You're most yourself off the marked trail, self-reliant and observant." },
  { name:"Bard", icon:"\uD83C\uDFB5", signature:[{dim:"humor",w:1},{dim:"socialEnergy",w:1},{dim:"creativity",w:1}],
    description:"You move rooms with words, and you're rarely short of either." },
  { name:"Rogue", icon:"\uD83D\uDDE1", signature:[{dim:"risk",w:1},{dim:"adaptability",w:1},{dim:"independence",w:1}],
    description:"Rules are more of a starting position than a boundary for you." },
  { name:"Necromancer", icon:"\uD83D\uDC80", signature:[{dim:"independence",w:2},{dim:"logic",w:1}],
    description:"You're comfortable in territory most people avoid, literally or otherwise." },
  { name:"Summoner", icon:"\uD83D\uDC09", signature:[{dim:"leadership",w:1},{dim:"creativity",w:1},{dim:"socialEnergy",w:1}],
    description:"You rarely do it all yourself, you're good at bringing the right help in." },
  { name:"Alchemist", icon:"\u2697", signature:[{dim:"curiosity",w:2},{dim:"creativity",w:1}],
    description:"You're always mid-experiment, combining things nobody else thought to combine." },
  { name:"Blacksmith", icon:"\uD83D\uDD28", signature:[{dim:"discipline",w:1},{dim:"persistence",w:2}],
    description:"You build things that last through sheer repeated, unglamorous effort." },
  { name:"Monk", icon:"\uD83E\uDDD8", signature:[{dim:"patience",w:2},{dim:"selfAwareness",w:1}],
    description:"You've done the internal work most people put off indefinitely." },
  { name:"Guardian", icon:"\uD83D\uDEE1", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1}],
    description:"Something or someone is always under your watch, by choice." },
  { name:"Beast Tamer", icon:"\uD83E\uDD8A", signature:[{dim:"empathy",w:1},{dim:"patience",w:1},{dim:"trust",w:1}],
    description:"You earn trust slowly, from people and animals both, and it holds." },
  { name:"Explorer", icon:"\uD83E\uDDED", signature:[{dim:"curiosity",w:2},{dim:"risk",w:1}],
    description:"Unmapped territory is an invitation, not a warning." },
  { name:"Captain", icon:"\u2693", signature:[{dim:"leadership",w:1},{dim:"confidence",w:1},{dim:"responsibility",w:1}],
    description:"You take the wheel because someone has to and you trust yourself with it." },
  { name:"Scholar", icon:"\uD83D\uDCDA", signature:[{dim:"logic",w:1},{dim:"curiosity",w:1},{dim:"discipline",w:1}],
    description:"You'd rather fully understand something than just get by with it." },
  { name:"Oracle", icon:"\uD83D\uDD2E", signature:[{dim:"selfAwareness",w:2},{dim:"empathy",w:1}],
    description:"You sense where things are heading before most people name it." },
  { name:"Inventor", icon:"\u2699", signature:[{dim:"creativity",w:1},{dim:"logic",w:1},{dim:"persistence",w:1}],
    description:"You'd rather build the thing that doesn't exist yet than wait for someone else to." },
  { name:"Merchant", icon:"\uD83D\uDCB0", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1},{dim:"adaptability",w:1}],
    description:"You read a deal, and a room, quickly, and you rarely leave empty-handed." },
  { name:"Dragon Rider", icon:"\uD83D\uDC09", signature:[{dim:"risk",w:1},{dim:"trust",w:1},{dim:"confidence",w:1}],
    description:"You bond fast with something powerful and back it completely once you do." },
];

/* ---- Friend type (Friendship Profile) ------------------------------------ */
const FRIEND_TYPES = [
  { name:"The Fun Friend", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1}] },
  { name:"The Therapist Friend", signature:[{dim:"empathy",w:2},{dim:"patience",w:1}] },
  { name:"The Golden Retriever Friend", signature:[{dim:"kindness",w:2},{dim:"optimism",w:1}] },
  { name:"The Black Cat Friend", signature:[{dim:"independence",w:2},{dim:"humor",w:1}] },
  { name:"The Protective Friend", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1}] },
  { name:"The Planner Friend", signature:[{dim:"planning",w:2},{dim:"discipline",w:1}] },
  { name:"The Wildcard Friend", signature:[{dim:"risk",w:1},{dim:"humor",w:1},{dim:"adaptability",w:1}] },
  { name:"The Steady Friend", signature:[{dim:"resilience",w:1},{dim:"trust",w:1},{dim:"patience",w:1}] },
];

/* ---- Motivation styles (Motivation Profile) ------------------------------- */
const MOTIVATION_STYLES = [
  { name:"Driven by Mastery", signature:[{dim:"discipline",w:1},{dim:"persistence",w:1},{dim:"curiosity",w:1}] },
  { name:"Driven by Recognition", signature:[{dim:"confidence",w:1},{dim:"competitiveness",w:1},{dim:"drive",w:1}] },
  { name:"Driven by Connection", signature:[{dim:"empathy",w:1},{dim:"socialEnergy",w:1},{dim:"kindness",w:1}] },
  { name:"Driven by Purpose", signature:[{dim:"responsibility",w:1},{dim:"optimism",w:1},{dim:"drive",w:1}] },
  { name:"Driven by Freedom", signature:[{dim:"independence",w:2},{dim:"risk",w:1}] },
];

/* ---- Soul Type: a separate, deeper identity lens ---------------------------
   Not the archetype system and not scored against it — this is a second,
   independent read of the same normDims, structured like the other
   scoreBySignature() lookups above (mythical creature, motivation style,
   etc.), just with a fixed 6-item palette instead of 12 archetypes. The
   archetype answers "which of 12 patterns fits your answers best"; soul
   type answers "which single core motivation shows up strongest," a
   coarser, more elemental read that intentionally overlaps with (rather
   than derives from) the archetype score. Colors and their meanings are a
   fixed, non-negotiable palette — do not add or reorder entries. */
const SOUL_TYPES = [
  { name:"Crimson", hex:"#DC2626", trait:"Passion", meaning:"Intensity, desire, chasing what actually lights you up.", signature:[{dim:"drive",w:2},{dim:"competitiveness",w:1},{dim:"confidence",w:1}] },
  { name:"Ember", hex:"#F59E0B", trait:"Growth", meaning:"Steady growth, building something that lasts through the setbacks.", signature:[{dim:"persistence",w:2},{dim:"resilience",w:1},{dim:"optimism",w:1}] },
  { name:"Dawn", hex:"#FDE047", trait:"Hope", meaning:"Hope, believing the next chapter is worth showing up for.", signature:[{dim:"optimism",w:2},{dim:"trust",w:1}] },
  { name:"Verdant", hex:"#22C55E", trait:"Compassion", meaning:"Compassion, caring for people without needing credit for it.", signature:[{dim:"kindness",w:2},{dim:"empathy",w:1}] },
  { name:"Azure", hex:"#38BDF8", trait:"Wisdom", meaning:"Wisdom, the kind that comes from actually paying attention.", signature:[{dim:"selfAwareness",w:1},{dim:"logic",w:1},{dim:"patience",w:1}] },
  { name:"Astral", hex:"#818CF8", trait:"Vision", meaning:"Vision, seeing the shape of something before it exists.", signature:[{dim:"creativity",w:1},{dim:"openMindedness",w:2},{dim:"curiosity",w:1}] },
];
// Signature totals aren't all equal (Crimson/Ember/Astral sum to 4,
// Dawn/Verdant/Azure sum to 3), so a raw weighted-sum comparison gives the
// lighter signatures a permanently lower ceiling regardless of how well
// their dims are satisfied. Scaling each item's raw score by
// maxWeight/itsOwnWeight puts every item on the same max-achievable scale
// before they're compared, without changing anything for the ones already
// at maxWeight.
function signatureMaxWeight(list){
  return Math.max(...list.map(item => item.signature.reduce((s, x) => s + x.w, 0)));
}
const SOUL_MAX_WEIGHT = signatureMaxWeight(SOUL_TYPES);
function scoreSoulTypes(normDims){
  return SOUL_TYPES.map(s => {
    const totalWeight = s.signature.reduce((sum, x) => sum + x.w, 0);
    const raw = s.signature.reduce((sum, x) => sum + (normDims[x.dim] || 0) * x.w, 0);
    return { item: s, score: raw * (SOUL_MAX_WEIGHT / totalWeight) };
  }).sort((a, b) => b.score - a.score);
}
function computeSoulType(normDims){ return scoreSoulTypes(normDims)[0].item; }

/* ---- Fun extra profiles: mythical creature, season, weather, planet ------- */
const MYTHICAL_CREATURES = [
  { name:"Phoenix", signature:[{dim:"resilience",w:2},{dim:"optimism",w:1}] },
  { name:"Dragon", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1},{dim:"risk",w:1}] },
  { name:"Kitsune", signature:[{dim:"creativity",w:1},{dim:"humor",w:1},{dim:"adaptability",w:1}] },
  { name:"Griffin", signature:[{dim:"responsibility",w:1},{dim:"leadership",w:1}] },
  { name:"Selkie", signature:[{dim:"independence",w:1},{dim:"emotionalStability",w:-1}] },
  { name:"Unicorn", signature:[{dim:"kindness",w:2},{dim:"trust",w:1}] },
  { name:"Sphinx", signature:[{dim:"logic",w:2},{dim:"curiosity",w:1}] },
  { name:"Kraken", signature:[{dim:"independence",w:2},{dim:"competitiveness",w:1}] },
];
const SEASONS = [
  { name:"Spring", signature:[{dim:"optimism",w:1},{dim:"openMindedness",w:1}] },
  { name:"Summer", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1}] },
  { name:"Autumn", signature:[{dim:"selfAwareness",w:1},{dim:"patience",w:1}] },
  { name:"Winter", signature:[{dim:"independence",w:1},{dim:"discipline",w:1}] },
];
const TIMES_OF_DAY = [
  { name:"Golden Hour", signature:[{dim:"creativity",w:1},{dim:"optimism",w:1}] },
  { name:"Midnight", signature:[{dim:"independence",w:1},{dim:"creativity",w:1}] },
  { name:"Early Morning", signature:[{dim:"discipline",w:1},{dim:"planning",w:1}] },
  { name:"Midday", signature:[{dim:"drive",w:1},{dim:"socialEnergy",w:1}] },
];
const CHESS_PIECES = [
  { name:"The King", signature:[{dim:"responsibility",w:2},{dim:"patience",w:1}] },
  { name:"The Queen", signature:[{dim:"leadership",w:1},{dim:"adaptability",w:1},{dim:"drive",w:1}] },
  { name:"The Knight", signature:[{dim:"creativity",w:1},{dim:"risk",w:1}] },
  { name:"The Bishop", signature:[{dim:"logic",w:1},{dim:"independence",w:1}] },
  { name:"The Rook", signature:[{dim:"discipline",w:2}] },
  { name:"The Pawn Who Reaches the End", signature:[{dim:"persistence",w:2},{dim:"resilience",w:1}] },
];

/* =========================================================================
   V4 ADDITIONS
   Framework approximations, consistency-check pairs, duo titles, and the
   remaining profile lookup tables. Nothing above this line changes.
   ========================================================================= */

/* ---- Consistency check ---------------------------------------------------
   Pairs of existing questions from different clusters that already probe
   overlapping traits, phrased differently because they were written for
   different scenarios. If both members of a pair get asked in the same
   run (adaptive selection means that's not guaranteed), the engine can
   check whether the chosen answers pulled in the same direction on their
   shared dimension. This reuses real content rather than needing a
   second, secretly-duplicated question bank. */
const CONSISTENCY_PAIRS = [
  { a:"soc1", b:"imp1", dim:"risk" },
  { a:"soc2", b:"lea2", dim:"planning" },
  { a:"ana1", b:"cau2", dim:"risk" },
  { a:"cre1", b:"pla1", dim:"creativity" },
  { a:"cre3", b:"lea3", dim:"leadership" },
  { a:"imp2", b:"cau1", dim:"risk" },
  { a:"imp3", b:"phi2", dim:"optimism" },
  { a:"emp1", b:"lea1", dim:"leadership" },
  { a:"emp2", b:"imp1", dim:"empathy" },
  { a:"emp3", b:"soc3", dim:"kindness" },
  { a:"phi1", b:"amb3", dim:"drive" },
  { a:"phi3", b:"lea2", dim:"adaptability" },
  { a:"pla2", b:"cre2", dim:"humor" },
  { a:"pla3", b:"soc1", dim:"socialEnergy" },
  { a:"cau1", b:"ana2", dim:"logic" },
  { a:"cau3", b:"amb1", dim:"planning" },
  { a:"amb2", b:"phi2", dim:"risk" },
  { a:"ana3", b:"cau1", dim:"discipline" },
];

/* ---- Framework approximations (Update: Personality System) ---------------
   Clearly secondary to the PersonaForge archetype. Big Five and DISC are
   percentage breakdowns; MBTI and Enneagram pick a best match the same
   way archetypes do. */
const BIG_FIVE_CATEGORIES = [
  { name:"Openness", dims:["openMindedness","curiosity","creativity"] },
  { name:"Conscientiousness", dims:["discipline","responsibility","planning"] },
  { name:"Extraversion", dims:["socialEnergy","confidence"] },
  { name:"Agreeableness", dims:["kindness","empathy","trust"] },
  { name:"Neuroticism", dims:["emotionalStability"], invert:true },
];
const DISC_CATEGORIES = [
  { name:"D, Dominance", dims:["leadership","confidence","competitiveness"] },
  { name:"I, Influence", dims:["socialEnergy","humor","confidence"] },
  { name:"S, Steadiness", dims:["patience","trust","kindness"] },
  { name:"C, Conscientiousness", dims:["discipline","logic","planning"] },
];
const ENNEAGRAM_TYPES = [
  { name:"Type 1, The Reformer", signature:[{dim:"discipline",w:2},{dim:"responsibility",w:1}] },
  { name:"Type 2, The Helper", signature:[{dim:"kindness",w:2},{dim:"empathy",w:1}] },
  { name:"Type 3, The Achiever", signature:[{dim:"drive",w:2},{dim:"confidence",w:1}] },
  { name:"Type 4, The Individualist", signature:[{dim:"creativity",w:1},{dim:"selfAwareness",w:2}] },
  { name:"Type 5, The Investigator", signature:[{dim:"curiosity",w:1},{dim:"independence",w:2}] },
  { name:"Type 6, The Loyalist", signature:[{dim:"trust",w:1},{dim:"responsibility",w:1},{dim:"risk",w:-1}] },
  { name:"Type 7, The Enthusiast", signature:[{dim:"optimism",w:1},{dim:"humor",w:1},{dim:"risk",w:1}] },
  { name:"Type 8, The Challenger", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1},{dim:"competitiveness",w:1}] },
  { name:"Type 9, The Peacemaker", signature:[{dim:"patience",w:2},{dim:"adaptability",w:1}] },
];
/* ---- Human Values --------------------------------------------------------
   A motivational layer, separate from archetype/frameworks: not "what
   type are you" but "what seems to move you when you decide things".
   Each value is a weighted signature over the same 25 measured
   dimensions, scored the same way archetype signatures are, so nothing
   new is being invented, just a different lens on the same evidence.
   Explicitly PersonaForge's interpretation, not a validated instrument. */
const HUMAN_VALUES = [
  { id:"determination", name:"Determination", icon:"\uD83D\uDCAA",
    signature:[{dim:"drive",w:2},{dim:"persistence",w:2},{dim:"discipline",w:1}],
    why:"how much you push through rather than let go" },
  { id:"justice", name:"Justice", icon:"\u2696\uFE0F",
    signature:[{dim:"responsibility",w:2},{dim:"logic",w:1},{dim:"trust",w:1}],
    why:"how much fairness and accountability shape your calls" },
  { id:"compassion", name:"Compassion", icon:"\uD83E\uDEC2",
    signature:[{dim:"empathy",w:2},{dim:"kindness",w:2}],
    why:"how readily you feel and respond to what others are going through" },
  { id:"curiosity", name:"Curiosity", icon:"\uD83D\uDD0D",
    signature:[{dim:"curiosity",w:2},{dim:"openMindedness",w:1}],
    why:"how much unanswered questions pull at you" },
  { id:"bravery", name:"Bravery", icon:"\uD83E\uDDA1",
    signature:[{dim:"risk",w:2},{dim:"confidence",w:1},{dim:"resilience",w:1}],
    why:"how willing you are to act despite the odds or the fear" },
  { id:"integrity", name:"Integrity", icon:"\uD83E\uDEA8",
    signature:[{dim:"trust",w:2},{dim:"selfAwareness",w:1},{dim:"responsibility",w:1}],
    why:"how consistent you stay between what you believe and what you do" },
  { id:"hope", name:"Hope", icon:"\u2728",
    signature:[{dim:"optimism",w:2},{dim:"resilience",w:1}],
    why:"how much you expect things to work out, even under pressure" },
  { id:"wisdom", name:"Wisdom", icon:"\uD83E\uDD89",
    signature:[{dim:"selfAwareness",w:2},{dim:"logic",w:1},{dim:"openMindedness",w:1}],
    why:"how much reflection shapes your judgment before you act" },
  { id:"kindness", name:"Kindness", icon:"\uD83D\uDC9E",
    signature:[{dim:"kindness",w:2},{dim:"empathy",w:1},{dim:"patience",w:1}],
    why:"how naturally you extend warmth without being asked" },
  { id:"creativity", name:"Creativity", icon:"\uD83C\uDFA8",
    signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1},{dim:"curiosity",w:1}],
    why:"how much you reach for a new angle instead of the obvious one" },
  { id:"discipline", name:"Discipline", icon:"\uD83C\uDFAF",
    signature:[{dim:"discipline",w:2},{dim:"planning",w:1},{dim:"persistence",w:1}],
    why:"how consistently you follow through on your own structure" },
  { id:"loyalty", name:"Loyalty", icon:"\uD83E\uDD1D",
    signature:[{dim:"trust",w:2},{dim:"patience",w:1},{dim:"responsibility",w:1}],
    why:"how much you stay committed once you're in" },
  { id:"freedom", name:"Freedom", icon:"\uD83E\uDD85",
    signature:[{dim:"independence",w:2},{dim:"adaptability",w:1},{dim:"risk",w:1}],
    why:"how much you protect your own room to choose" },
  { id:"responsibility", name:"Responsibility", icon:"\uD83E\uDEA2",
    signature:[{dim:"responsibility",w:2},{dim:"discipline",w:1},{dim:"planning",w:1}],
    why:"how seriously you treat the things you're accountable for" },
];

/* ---- Seven Sins / Heavenly Virtues (fun profile) --------------------------
   A playful, explicitly non-serious lens: each axis is one measured
   dimension read two ways. The Sin reading and the Virtue reading are
   opposite ends of the exact same evidence, nothing is recalculated,
   only the label and direction flip. */
const SIN_VIRTUE_AXES = [
  { dim:"confidence", sinLabel:"Pride", virtueLabel:"Humility", sinIsHigh:true },
  { dim:"competitiveness", sinLabel:"Greed", virtueLabel:"Charity", sinIsHigh:true },
  { dim:"patience", sinLabel:"Wrath", virtueLabel:"Patience", sinIsHigh:false },
  { dim:"kindness", sinLabel:"Envy", virtueLabel:"Kindness", sinIsHigh:false },
  { dim:"risk", sinLabel:"Lust", virtueLabel:"Chastity", sinIsHigh:true },
  { dim:"discipline", sinLabel:"Gluttony", virtueLabel:"Temperance", sinIsHigh:false },
  { dim:"drive", sinLabel:"Sloth", virtueLabel:"Diligence", sinIsHigh:false },
];

const MBTI_AXES = [
  { letters:["E","I"], posDims:["socialEnergy"], negDims:[] },
  { letters:["N","S"], posDims:["openMindedness","curiosity"], negDims:["discipline","planning"] },
  { letters:["F","T"], posDims:["empathy","kindness"], negDims:["logic"] },
  { letters:["P","J"], posDims:["adaptability","risk"], negDims:["discipline","planning"] },
];

/* ---- Duo titles for the compare page --------------------------------------
   Keyed by element pairs from ARCHETYPE_EXTRAS, sorted alphabetically so
   the lookup works regardless of who's "person A". Falls back to a
   generic template when there's no special pairing. */
const DUO_TITLES = {
  "Fire|Ice": "Fire & Ice",
  "Fire|Fire": "Twin Flames",
  "Water|Fire": "Steam and Spark",
  "Earth|Air": "Roots and Wind",
  "Light|Shadow": "Sun & Moon",
  "Metal|Fire": "Forge Partners",
  "Storm|Earth": "Calm and Chaos",
  "Water|Water": "Deep Waters",
  "Air|Air": "Kindred Spirits",
  "Earth|Earth": "Built to Last",
  "Light|Light": "Twin Beacons",
  "Shadow|Shadow": "Quiet Understanding",
  "Ice|Storm": "Cold Front",
  "Water|Air": "Tide and Wind",
};

/* ---- Fantasy extras: weapon, companion, kingdom --------------------------- */
const FANTASY_WEAPONS = [
  { name:"A precisely balanced longsword", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"A staff carved with half-finished runes", signature:[{dim:"curiosity",w:1},{dim:"logic",w:1}] },
  { name:"Twin daggers, never both sheathed at once", signature:[{dim:"risk",w:1},{dim:"adaptability",w:1}] },
  { name:"A warhammer that's more often used to build than break", signature:[{dim:"persistence",w:1},{dim:"discipline",w:1}] },
  { name:"A longbow, kept for range and patience alike", signature:[{dim:"patience",w:1},{dim:"independence",w:1}] },
  { name:"A shield older than anyone can explain", signature:[{dim:"responsibility",w:1},{dim:"trust",w:1}] },
  { name:"A voice, sharper than most blades in the right moment", signature:[{dim:"socialEnergy",w:1},{dim:"confidence",w:1}] },
  { name:"A satchel of half-tested alchemical tricks", signature:[{dim:"creativity",w:1},{dim:"curiosity",w:1}] },
];
const FANTASY_COMPANIONS = [
  { name:"A war-scarred wolf who trusts almost no one else", signature:[{dim:"independence",w:1},{dim:"trust",w:1}] },
  { name:"A small dragon still learning to control its fire", signature:[{dim:"creativity",w:1},{dim:"risk",w:1}] },
  { name:"A raven that shows up exactly when needed", signature:[{dim:"curiosity",w:1},{dim:"selfAwareness",w:1}] },
  { name:"A steady warhorse, unfazed by almost anything", signature:[{dim:"resilience",w:1},{dim:"patience",w:1}] },
  { name:"A talking cat who mostly offers unsolicited opinions", signature:[{dim:"humor",w:1},{dim:"confidence",w:1}] },
  { name:"A quiet familiar spirit, more sensed than seen", signature:[{dim:"empathy",w:1},{dim:"openMindedness",w:1}] },
];
const FANTASY_KINGDOMS = [
  { name:"A mountain hold built to outlast every siege", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"A floating city that answers to no single ruler", signature:[{dim:"independence",w:2}] },
  { name:"A forest realm where the borders move with the seasons", signature:[{dim:"adaptability",w:1},{dim:"openMindedness",w:1}] },
  { name:"A port city that trades in everything, including secrets", signature:[{dim:"socialEnergy",w:1},{dim:"curiosity",w:1}] },
  { name:"A small, fiercely loyal village, not a kingdom by choice", signature:[{dim:"kindness",w:1},{dim:"trust",w:1}] },
  { name:"An empire still being built, one campaign at a time", signature:[{dim:"drive",w:1},{dim:"leadership",w:1}] },
];

/* ---- Fun profile extras: flower, planet, constellation, gemstone, weather - */
const FLOWERS = [
  { name:"Black Dahlia", signature:[{dim:"independence",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Sunflower", signature:[{dim:"optimism",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Wild Poppy", signature:[{dim:"risk",w:1},{dim:"creativity",w:1}] },
  { name:"White Orchid", signature:[{dim:"discipline",w:1},{dim:"patience",w:1}] },
  { name:"Wisteria", signature:[{dim:"kindness",w:1},{dim:"empathy",w:1}] },
  { name:"Thistle", signature:[{dim:"resilience",w:1},{dim:"independence",w:1}] },
];
const PLANETS = [
  { name:"Mars", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Neptune", signature:[{dim:"creativity",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Saturn", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"Venus", signature:[{dim:"empathy",w:1},{dim:"kindness",w:1}] },
  { name:"Mercury", signature:[{dim:"adaptability",w:1},{dim:"curiosity",w:1}] },
  { name:"Jupiter", signature:[{dim:"leadership",w:1},{dim:"optimism",w:1}] },
];
const CONSTELLATIONS = [
  { name:"Orion", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1}] },
  { name:"Lyra", signature:[{dim:"creativity",w:1},{dim:"humor",w:1}] },
  { name:"Draco", signature:[{dim:"independence",w:1},{dim:"resilience",w:1}] },
  { name:"Cassiopeia", signature:[{dim:"selfAwareness",w:1},{dim:"confidence",w:1}] },
  { name:"Pegasus", signature:[{dim:"optimism",w:1},{dim:"risk",w:1}] },
  { name:"Ursa Minor", signature:[{dim:"patience",w:1},{dim:"trust",w:1}] },
];
const GEMSTONES = [
  { name:"Garnet", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Sapphire", signature:[{dim:"logic",w:1},{dim:"discipline",w:1}] },
  { name:"Moonstone", signature:[{dim:"empathy",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Obsidian", signature:[{dim:"independence",w:1},{dim:"confidence",w:1}] },
  { name:"Citrine", signature:[{dim:"optimism",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Emerald", signature:[{dim:"kindness",w:1},{dim:"trust",w:1}] },
];
const WEATHER_TYPES = [
  { name:"Clear Sky", signature:[{dim:"optimism",w:1},{dim:"emotionalStability",w:1}] },
  { name:"Thunderstorm", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Fog", signature:[{dim:"independence",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Steady Rain", signature:[{dim:"patience",w:1},{dim:"discipline",w:1}] },
  { name:"First Snow", signature:[{dim:"creativity",w:1},{dim:"openMindedness",w:1}] },
  { name:"Golden Hour Light", signature:[{dim:"kindness",w:1},{dim:"optimism",w:1}] },
];
const COFFEE_ORDERS = [
  { name:"Black, no sugar, no apology", signature:[{dim:"discipline",w:1},{dim:"independence",w:1}] },
  { name:"Oversized oat milk latte, extra shot", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1}] },
  { name:"Whatever's seasonal, decided on the spot", signature:[{dim:"curiosity",w:1},{dim:"adaptability",w:1}] },
  { name:"The same order every single time", signature:[{dim:"discipline",w:1},{dim:"patience",w:1}] },
  { name:"Matcha, and a little smug about it", signature:[{dim:"selfAwareness",w:1},{dim:"openMindedness",w:1}] },
  { name:"Iced, regardless of the weather", signature:[{dim:"risk",w:1},{dim:"confidence",w:1}] },
];



/* =========================================================================
   PERSONAFORGE, ENGINE MODULE
   All algorithms documented inline. Pure functions, no DOM, fully testable.
   ========================================================================= */

const CLUSTERS = Object.keys(QUESTION_BANK);
const MIN_QUESTIONS = 35;          // Stages 1-3 always run to exactly this many (15 fixed + 20 adaptive) -- "Balanced"'s early-stop point
const MAX_QUESTIONS = 50;          // never exceeds this many (35 baseline + at most 15 extra) -- "Balanced"'s ceiling and "Deep Dive"'s fixed length
// Empirically calibrated against the original 45-question ceiling: a
// per-step greedy search that simulates every candidate option at every
// question and always picks whichever maximizes
// computeAssessmentConfidence().overall right now — i.e. the best any
// answering strategy can realistically do — still only reached ~81-85
// overall by Q35-45 across dozens of trialed target archetypes. 95 was
// consequently unreachable by any answer pattern, silently turning "stop
// early once confident" into dead code (every adaptive session ran to
// the cap regardless of how clear the profile was). 80 sits just under
// that empirical ceiling: a genuinely clear, consistent profile can
// still cross it and stop at 35, while a noisy/inconsistent one
// (measured ~73-78 in the same testing) correctly does not and keeps
// extending. Raising the cap from 45 to 50 (to match Deep Dive's fixed
// length) only gives a low-confidence profile more room to climb before
// hitting it, so 80 stays a valid, still-below-ceiling target.
const CONFIDENCE_TARGET = 80;      // stop early once this confident
const CONFIDENCE_SCALE = 7;        // score-gap that counts as "fully confident", tuned against real score distributions
// NOTE ON SCALING: the question bank holds 200 questions across 10
// clusters (20 each). Stages 1-3 (see below) always run to exactly
// MIN_QUESTIONS: a fixed 15-question baseline (Stage 1) plus 20
// adaptively-selected questions (Stages 2-3, 10 each). From there,
// Stage 4/5 re-checks confidence after every answer and keeps going
// only if the top two archetype candidates are still close, up to
// MAX_QUESTIONS (at most 15 more beyond the 35 baseline).

/* ---- Which dimensions matter most to the framework projections ---------
   Same idea as the old cluster-weight table, but for MBTI/Big
   Five/DISC/Enneagram instead of clusters. Used by the info-value
   question ranking below so "improves framework confidence" is a real,
   computed signal rather than a hand-authored tag. */
function computeFrameworkDimensionWeights(){
  const weights = {};
  DIMENSIONS.forEach(d => weights[d] = 0);
  MBTI_AXES.forEach(axis => {
    axis.posDims.concat(axis.negDims).forEach(d => { weights[d] = (weights[d] || 0) + 1; });
  });
  BIG_FIVE_CATEGORIES.forEach(cat => cat.dims.forEach(d => { weights[d] = (weights[d] || 0) + 1; }));
  DISC_CATEGORIES.forEach(cat => cat.dims.forEach(d => { weights[d] = (weights[d] || 0) + 1; }));
  ENNEAGRAM_TYPES.forEach(type => type.signature.forEach(s => { weights[s.dim] = (weights[s.dim] || 0) + Math.abs(s.w); }));
  return weights;
}
const FRAMEWORK_DIMENSION_WEIGHTS = computeFrameworkDimensionWeights();

const QUESTIONS_BY_ID = {};
QUESTIONS.forEach(q => { QUESTIONS_BY_ID[q.id] = q; });

/* ---- Stage 1: the fixed core set ----------------------------------------
   Every user gets exactly these 15 questions, in this order, first. No
   seed, no shuffle. Chosen offline by a greedy set-cover pass over the
   full question bank: together they touch all 25 dimensions at least
   once and all 10 clusters at least once, in as few questions as
   possible, so Stage 1 is a genuine broad foundation rather than an
   arbitrary first slice of the bank. */
// ana8 and pla4 were swapped for phi8 and pla15: the original 15 left
// emotionalStability/trust/responsibility/optimism/humor/competitiveness/
// resilience at a fraction of the coverage of the rest of the bank, and
// since Quick Read never asks anything beyond these 15, that permanently
// starved Sentinel/Luminary/Catalyst of any real signal in that mode
// specifically (confirmed dead/near-dead in Quick Read-only simulation,
// while healthy in Balanced/Deep Dive). phi8 and pla15 stay in the same
// spirit (philosophical and playful were already represented, just less
// so) while covering the starved dims.
const CORE_QUESTION_IDS = ["ana6","phi8","pla15","amb13","cre18","soc3","phi17","cau2","emp3","imp4","lea12","pla1","amb16","ana1","cre5"];

/* -------------------------------------------------------------------------
   ALGORITHM: Deterministic staged adaptive question selection
   Five stages, replacing the old seed-shuffled baseline. The engine now
   depends only on accumulated answers, never on wall-clock time, so two
   people who answer identically get identical questions at every stage.

   Stage 1 (Q1-15): CORE_QUESTION_IDS, fixed, identical for every user —
     no randomness, no seed, so everyone's baseline starts from the same
     15 questions.
   Stage 2 (Q16-25): one batch of 10, picked by _pickInformativeBatch()
     against the state after Q15. Same first 15 answers -> same 16-25.
   Stage 3 (Q26-35): another batch of 10, against the state after Q25.
     Same first 25 answers -> same 26-35. Stages 2+3 together are the
     "20 adaptive questions": selected purely from the running answer
     history (dimension confidence, archetype-candidate separation,
     framework relevance), never from the clock or a session seed, so
     two people with identical first-15 answers always get an identical
     16-35 too.
   Stage 4 (after Q35): confidence check using the evidence-based
     computeAssessmentConfidence(). Stops here if the target is met —
     this is the common "35 was enough" exit.
   Stage 5 (Q36-50): only if Stage 4 wasn't confident enough. Unlike
     Stages 2-3, this re-checks confidence after every single answer
     (not in batches of 5) and stops the instant the target is reached,
     since minimizing extra questions matters most this late in the
     quiz — a profile that becomes confident at, say, Q39 never gets
     asked Q40-50 just because it started down this path. Hard-capped
     at MAX_QUESTIONS (50) either way.

   Question selection itself (_pickInformativeBatch) ranks every unused
   question by computeQuestionInfoValue(): how much it addresses
   currently-uncertain dimensions, how well it separates the current
   top-2 archetype candidates, how relevant it is to the framework
   projections, minus a penalty for overlapping dimensions already
   asked about. All four signals are computed from data the app already
   has (archetype signatures, framework dimension maps, running answer
   history), nothing was hand-tagged onto the question bank.

   this.clusterAffinity/clusterAsked are still tracked on every answer,
   the same running per-cluster signal the old cluster-ranked picker
   used, since encouragement() and save/resume format both read them and
   there's no reason to discard a working, harmless signal.
------------------------------------------------------------------------- */

/* Every signal here is derived from data that already exists (question
   deltas, archetype/soul signatures, framework dimension maps, running
   answer history) - nothing new was authored onto the question bank.
     - uncertainty:      favors dimensions this session has the least
                         evidence for yet (getDimensionConfidence),
                         weighted by how strongly this question would
                         move that dimension
     - separation:       favors questions whose dimension profile lines
                         up with what currently separates the top-2
                         archetype candidates (same signature-diff idea
                         the old disambiguation boost used, applied per
                         question)
     - soulSeparation:   the same idea, for the top-2 soul type
                         candidates — archetype and soul are meant to be
                         determined together from the same answers, so
                         the picker should narrow down both at once
                         rather than only ever chasing archetype
                         clarity and leaving soul type to chance
     - framework:        favors dimensions that matter to MBTI/Big
                         Five/DISC/Enneagram, a small signal so
                         framework confidence improves alongside
                         archetype confidence
     - redundancy:       penalizes overlap with dimensions already
                         answered about a lot, so the same ground isn't
                         covered twice */
function computeQuestionInfoValue(q, session, top, second, soulTop, soulSecond){
  const dimSet = new Set();
  q.options.forEach(opt => Object.keys(opt.d).forEach(d => dimSet.add(d)));
  const avgMag = (d) => q.options.reduce((s,o) => s + Math.abs(o.d[d] || 0), 0) / q.options.length;

  let uncertainty = 0;
  dimSet.forEach(d => {
    const confidence = getDimensionConfidence(session, d); // 0-1, lower = less evidence so far
    uncertainty += (1 - confidence) * avgMag(d);
  });

  let separation = 0;
  if (top && second){
    const diff = {};
    top.signature.forEach(s => { diff[s.dim] = (diff[s.dim] || 0) + s.w; });
    second.signature.forEach(s => { diff[s.dim] = (diff[s.dim] || 0) - s.w; });
    dimSet.forEach(d => { separation += Math.abs(diff[d] || 0) * avgMag(d); });
  }

  let soulSeparation = 0;
  if (soulTop && soulSecond){
    const soulDiff = {};
    soulTop.signature.forEach(s => { soulDiff[s.dim] = (soulDiff[s.dim] || 0) + s.w; });
    soulSecond.signature.forEach(s => { soulDiff[s.dim] = (soulDiff[s.dim] || 0) - s.w; });
    dimSet.forEach(d => { soulSeparation += Math.abs(soulDiff[d] || 0) * avgMag(d); });
  }

  let framework = 0;
  dimSet.forEach(d => { framework += (FRAMEWORK_DIMENSION_WEIGHTS[d] || 0) * 0.3; });

  let redundancy = 0;
  session.answers.forEach(a => {
    if (!a) return;
    dimSet.forEach(d => { if (d in a.d) redundancy += Math.min(Math.abs(a.d[d]), 1); });
  });

  return uncertainty * 1.0 + separation * 0.65 + soulSeparation * 0.5 + framework * 0.15 - redundancy * 0.35;
}

class QuizSession {
  // questionMode comes from the "Your Experience" onboarding step's one
  // depth choice: "15" (Quick Read) and "50" (Deep Dive) pin the
  // assessment to exactly that many questions, never extended. "adaptive"
  // is "Balanced": starts at MIN_QUESTIONS (35 = the 15 fixed + 20
  // adaptive questions) and lets _maybeAdjustLength() extend up to
  // MAX_QUESTIONS only if confidence is still low there — see that
  // method's own guard for the mechanics. "adaptive" is also the fallback
  // for someone who skipped onboarding entirely (the name screen's "Skip
  // for now"), so it never needs its own separate default. "35" is kept
  // as a valid fixed-length value at this layer for backward
  // compatibility (old in-progress saves, direct construction) even
  // though no onboarding screen offers it anymore.
  constructor(seed = Date.now() % 100000, name = "", questionMode = "adaptive"){
    // seed is kept only for the save/resume payload shape (harmless,
    // unused for question selection now) so older in-progress saves in
    // a person's browser still deserialize without a format change.
    this.seed = seed;
    this.name = name;
    this.questionMode = questionMode || "adaptive";
    this.dims = emptyDims();
    this.answers = [];              // sparse: index-aligned with this.plan, entries or null
    this.clusterAffinity = {};
    CLUSTERS.forEach(c => this.clusterAffinity[c] = 0);
    this.clusterAsked = {};
    CLUSTERS.forEach(c => this.clusterAsked[c] = 0);
    this.usedIds = new Set();
    this.order = [...CLUSTERS];
    this.plan = CORE_QUESTION_IDS.map(id => QUESTIONS_BY_ID[id]).filter(Boolean);
    this.cursor = 0;
    this.targetLength = this.questionMode === "15" ? 15
      : this.questionMode === "35" ? 35
      : this.questionMode === "50" ? 50
      : MIN_QUESTIONS;
    this.confidencePct = 0;
    this.justExtended = false;
  }

  totalLength(){ return this.targetLength; }
  maxLength(){ return MAX_QUESTIONS; }

  current(){
    if (this.cursor >= this.targetLength) return null;
    if (this.cursor >= this.plan.length){
      if (this.plan.length === 15 || this.plan.length === 25){
        this.plan.push(...this._pickInformativeBatch(10));
      } else {
        this.plan.push(...this._pickInformativeBatch(1));
      }
    }
    return this.plan[this.cursor];
  }

  currentAnswer(){
    return this.answers[this.cursor] || null;
  }

  /* Stage 2/3/5 selection: rank every not-yet-used, not-already-planned
     question by information value against the state right now, take the
     top `count`. Deterministic given the running answer history, since
     nothing here reads the clock or the seed. */
  _pickInformativeBatch(count){
    const nd = this.normalizedDims();
    const match = matchArchetype(nd);
    const top = match.ranked[0].archetype, second = match.ranked[1].archetype;
    const soulRanked = scoreSoulTypes(nd);
    const soulTop = soulRanked[0].item, soulSecond = soulRanked[1].item;
    const planned = new Set(this.plan.map(p => p.id));
    const candidates = QUESTIONS.filter(q => !this.usedIds.has(q.id) && !planned.has(q.id));
    const scored = candidates.map(q => ({ q, score: computeQuestionInfoValue(q, this, top, second, soulTop, soulSecond) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(x => x.q);
  }

  /* ---- Stage 4: the single Balanced-mode confidence checkpoint ---------
     Stages 1-3 (questions 1-35) always run to completion regardless of
     confidence, per the fixed/batch design above. Exactly once, right at
     question 35, this checks computeAssessmentConfidence(): confident
     enough and the assessment stops there (the "35 was enough" exit);
     not confident and it commits to the full remaining stretch in one
     jump, straight to MAX_QUESTIONS (50), with no further re-checks in
     between — a deliberately binary outcome (35 or 50, nothing in
     between) rather than the finer-grained "stop the instant confidence
     is reached at 36, 37, 38..." this used to do, so "Balanced" reads as
     a simple two-outcome choice, not an unpredictable in-between length. */
  _maybeAdjustLength(){
    // Fixed-length modes ("15"/"50") never extend past their chosen
    // length regardless of confidence — only "adaptive" does, and only
    // at the one checkpoint (question 35).
    if (this.questionMode !== "adaptive") return;
    if (this.cursor !== MIN_QUESTIONS) return;
    const nd = this.normalizedDims();
    const match = matchArchetype(nd);
    const conf = computeAssessmentConfidence(match.ranked, nd, this, false);
    this.confidencePct = conf.overall;
    if (conf.overall >= CONFIDENCE_TARGET){ this.targetLength = this.cursor; return; }
    this.targetLength = MAX_QUESTIONS;
    this.justExtended = true;
  }

  /* Editing an already-answered question first reverts its dimension and
     cluster-affinity contribution, then re-applies the new choice, so
     going back and changing an answer produces a fully correct result
     rather than double-counting. */
  _revert(idx){
    const prev = this.answers[idx];
    if (!prev) return;
    Object.entries(prev.d).forEach(([dim, val]) => { this.dims[dim] -= val; });
    const magnitude = Object.values(prev.d).reduce((s, v) => s + Math.abs(v), 0);
    this.clusterAffinity[prev.cluster] -= magnitude;
    this.answers[idx] = null;
  }

  answer(optionIndex){
    const q = this.current();
    if (!q) return;
    const opt = q.options[optionIndex];
    const editing = !!this.answers[this.cursor];
    if (editing){
      this._revert(this.cursor);
    } else {
      this.usedIds.add(q.id);
      this.clusterAsked[q.cluster] = (this.clusterAsked[q.cluster] || 0) + 1;
    }
    let magnitude = 0;
    Object.entries(opt.d).forEach(([dim, val]) => {
      this.dims[dim] = (this.dims[dim] || 0) + val;
      magnitude += Math.abs(val);
    });
    this.clusterAffinity[q.cluster] += magnitude;
    this.answers[this.cursor] = { questionId: q.id, cluster: q.cluster, optionIndex, text: opt.text, d: opt.d };
    this.cursor++;
    this.justExtended = false;
    if (editing) this._recalculateFutureQuestions();
    else this._maybeAdjustLength();
  }

  /* Changing an earlier answer shifts the running dimension totals, which
     means whatever the adaptive engine was about to ask next may no
     longer be the right call. Rather than re-picking questions that were
     already answered (which would silently discard real answers), this
     only drops the still-blank tail beyond the furthest answered
     question, so the very next unanswered question gets freshly chosen
     against the updated cluster affinities instead of a stale plan. */
  _recalculateFutureQuestions(){
    let highest = -1;
    for (let i = 0; i < this.answers.length; i++){ if (this.answers[i]) highest = i; }
    if (this.plan.length > highest + 1){
      this.plan.length = highest + 1;
    }
  }

  goBack(){
    if (this.cursor > 0) this.cursor--;
  }

  goForward(){
    // only allowed onto a question that already has a recorded answer,
    // otherwise there's nothing to advance into without answering it
    if (this.answers[this.cursor]) this.cursor++;
  }

  canGoBack(){ return this.cursor > 0; }
  canSkipForward(){ return !!this.answers[this.cursor]; }

  progress(){ return { current: this.cursor, total: this.targetLength, max: MAX_QUESTIONS }; }
  isComplete(){ return this.cursor >= this.targetLength; }

  encouragement(){
    const remaining = this.targetLength - this.cursor;
    if (remaining <= 0) return "That's everything I need.";
    if (this.justExtended) return "Two strong matches are close, digging a little deeper.";
    if (this.cursor === 0) return "Let's start.";
    if (remaining <= 3) return "Almost there, just a couple more.";
    if (remaining <= 5) return "A few more and I'll have a clear read.";
    if (this.cursor >= 15 && this.cursor < 18) return "I'm starting to get a sense of you.";
    if (remaining <= this.targetLength * 0.5) return "Good pace, keep going.";
    return "Just getting started here.";
  }

  normalizedDims(){
    // clamp to a stable -10..10 range regardless of quiz length, for the
    // encoding and archetype matching steps below.
    const out = {};
    DIMENSIONS.forEach(k => {
      out[k] = Math.max(-10, Math.min(10, Math.round(this.dims[k])));
    });
    return out;
  }

  /* ---- Save / restore, so a mid-quiz break never loses answers -----------
     serialize() captures every bit of session state needed to resume
     exactly where it left off, including the running dimension totals and
     the adaptive plan already built, so resuming isn't a fresh guess, it
     picks up on the very next unanswered question. */
  serialize(){
    return {
      seed: this.seed,
      name: this.name,
      questionMode: this.questionMode,
      meta: this.meta || {},
      dims: this.dims,
      answers: this.answers,
      clusterAffinity: this.clusterAffinity,
      clusterAsked: this.clusterAsked,
      usedIds: Array.from(this.usedIds),
      order: this.order,
      plan: this.plan,
      cursor: this.cursor,
      targetLength: this.targetLength,
      confidencePct: this.confidencePct,
      savedAt: Date.now(),
    };
  }
}

function restoreQuizSession(saved){
  const s = Object.create(QuizSession.prototype);
  s.seed = saved.seed;
  s.name = saved.name || "";
  s.questionMode = saved.questionMode || "adaptive";
  s.meta = saved.meta || {};
  s.dims = saved.dims;
  s.answers = saved.answers;
  s.clusterAffinity = saved.clusterAffinity;
  s.clusterAsked = saved.clusterAsked;
  s.usedIds = new Set(saved.usedIds);
  s.order = saved.order;
  s.plan = saved.plan;
  s.cursor = saved.cursor;
  s.targetLength = saved.targetLength;
  s.confidencePct = saved.confidencePct || 0;
  s.justExtended = false;
  return s;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Archetype matching
   Each archetype has a small "signature": 3 weighted dimensions that most
   define it. Score = sum(normalizedDim[dim] * weight) for each archetype,
   the highest score wins. This is a lightweight weighted-vector match, so
   it rewards a person for being distinctively strong in an archetype's
   core traits rather than requiring an exact 20-dimension fingerprint,
   which keeps results feeling specific without demanding improbable
   precision. The full ranked list is returned too, so the result page can
   show how every other archetype scored, not just the top one.
------------------------------------------------------------------------- */

// Same fix as scoreSoulTypes below: The Catalyst/Maverick/Visionary sum to
// 4 while every other archetype sums to 5, which gave them a permanently
// lower ceiling in a raw weighted-sum comparison. Scale each archetype's
// raw score by maxWeight/itsOwnWeight so they're compared on the same
// max-achievable scale.
const ARCHETYPE_MAX_WEIGHT = signatureMaxWeight(ARCHETYPES);
function matchArchetype(normDims){
  const scored = ARCHETYPES.map(a => {
    const totalWeight = a.signature.reduce((sum, s) => sum + s.w, 0);
    const raw = a.signature.reduce((sum, s) => sum + (normDims[s.dim] || 0) * s.w, 0);
    const score = raw * (ARCHETYPE_MAX_WEIGHT / totalWeight);
    return { archetype: a, score };
  }).sort((x, y) => y.score - x.score);
  return { primary: scored[0].archetype, runnerUp: scored[1].archetype, ranked: scored };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Sub-profile (why two people with the same archetype differ)
   An archetype is decided by only 3 signature dimensions, so two people
   can land on the same one while still being genuinely different once you
   look at the other 17. This finds the two dimensions the person scores
   highest on outside the archetype's own signature, and turns that into a
   short, specific sentence, so results within the same archetype aren't
   interchangeable.
------------------------------------------------------------------------- */

function computeSubProfile(normDims, archetype){
  const sigDims = new Set(archetype.signature.map(s => s.dim));
  const rest = DIMENSIONS.filter(d => !sigDims.has(d))
    .map(d => ({ d, v: normDims[d] || 0 }))
    .sort((a, b) => b.v - a.v);
  const top = rest.slice(0, 2).filter(x => x.v > 0);
  if (top.length === 0){
    return `Within ${archetype.name}, your other traits are fairly balanced, no single one pulling much harder than the rest.`;
  }
  const labels = top.map(x => DIM_LABELS[x.d]);
  return `Within ${archetype.name}, you lean especially into ${labels.join(" and ")}, which shapes your version of this type a little differently from someone else who tested the same result.`;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Measured traits
   Each trait is a plain, deterministic formula over normalized dimensions
   (0-100 scale). No randomness anywhere in this file, so the same answers
   always produce the same reading, the way an actual assessment should.
------------------------------------------------------------------------- */

function pct(v){ return Math.round(((v + 10) / 20) * 100); }

/* -------------------------------------------------------------------------
   CANONICAL DIMENSION ACCESSORS (Phase 1)
   Every feature that reads a personality dimension should go through one
   of these four, instead of reaching into normDims or session state with
   its own inline formula. This is the single source of truth the rest of
   the pipeline (archetypes, careers, frameworks, compatibility, results)
   is built on, so a future change to how a dimension is measured only
   has to happen in one place.
   ------------------------------------------------------------------------- */

// Raw dimension value, -10..10.
function getDimensionScore(normDims, dim){
  return (normDims && normDims[dim]) || 0;
}

// 0-100 view of the same value. Same math pct() always used, just named
// for what it does at call sites that read a dimension, not a raw delta.
function getDimensionPercent(normDims, dim){
  return pct(getDimensionScore(normDims, dim));
}

// How much real evidence exists for one dimension in a completed quiz
// session: how many answered questions touched it, and the total
// magnitude of their deltas. Returns null when there's no session to
// read (e.g. a profile decoded from a shared code carries no answer
// history), which callers should treat as genuinely unknown, not as
// zero evidence.
function getDimensionEvidence(session, dim){
  if (!session || !session.answers) return null;
  let count = 0, magnitude = 0;
  session.answers.forEach(a => {
    if (!a || !a.d || !(dim in a.d)) return;
    count++;
    magnitude += Math.abs(a.d[dim]);
  });
  return { count, magnitude };
}

// A 0-1 confidence read for a single dimension. More answers that
// touched it, and a clearer accumulated signal (not just one weak
// nudge), means more confidence in that specific number. Returns 0.5
// (explicitly "unknown", not "neutral" or "zero") when there's no
// session to measure evidence from.
function getDimensionConfidence(session, dim){
  const evidence = getDimensionEvidence(session, dim);
  if (!evidence) return 0.5;
  const countFactor = Math.min(1, evidence.count / 4);
  const magnitudeFactor = Math.min(1, evidence.magnitude / 12);
  return Math.round((countFactor * 0.6 + magnitudeFactor * 0.4) * 100) / 100;
}

function computeMeasuredTraits(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Emotional Steadiness": clamp((g("resilience") + g("patience") + g("selfAwareness")) / 3),
    "Decision Confidence": clamp((g("confidence") + g("logic") + g("drive")) / 3),
    "Social Stamina": clamp((g("socialEnergy") + g("adaptability")) / 2),
    "Creative Output": clamp((g("creativity") + g("curiosity") + g("independence")) / 3),
    "Focus Capacity": clamp((g("discipline") + g("patience") + g("planning")) / 3),
    "Risk Tolerance": clamp(g("risk")),
    "Empathy Index": clamp((g("empathy") + g("kindness")) / 2),
    "Leadership Presence": clamp((g("leadership") + g("confidence") + g("drive")) / 3),
    "Adaptability Score": clamp(g("adaptability")),
    "Resilience Rating": clamp((g("resilience") + g("discipline")) / 2),
    "Trust Radius": clamp(g("trust")),
    "Independence Level": clamp(g("independence")),
    "Friendship Reliability": clamp((g("trust") + g("kindness") + g("patience") + g("empathy")) / 4),
    "Growth Mindset": clamp((g("selfAwareness") + g("curiosity") + g("optimism")) / 3),
    "Communication Clarity": clamp((g("logic") + g("confidence") + g("empathy")) / 3),
    "Stress Recovery": clamp((g("resilience") + g("optimism") + g("patience")) / 3),
  };
}

/* "Life Balance" is a presentational grouping, not a separate measured
   instrument: it recombines the same 25 scored dimensions used everywhere
   else into 5 familiar buckets (Work/Social/Personal/Learning/Wellbeing),
   the same way computeMeasuredTraits() above turns raw dims into
   friendlier composite names. No new data is collected or invented for
   this — see the result page's Life Balance card for the same disclosure
   shown to the person. */
function computeLifeBalance(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Work": clamp((g("drive") + g("discipline") + g("responsibility") + g("persistence")) / 4),
    "Social": clamp((g("socialEnergy") + g("empathy") + g("kindness")) / 3),
    "Personal": clamp((g("selfAwareness") + g("independence") + g("patience")) / 3),
    "Learning": clamp((g("curiosity") + g("openMindedness") + g("adaptability")) / 3),
    "Wellbeing": clamp((g("emotionalStability") + g("resilience") + g("optimism")) / 3),
  };
}

/* Same idea as computeLifeBalance() just above: recombines real scored
   dims into 4 motivation-flavored facets so the Motivation card has
   actual numbers to show, not just the single MOTIVATION_STYLES name. */
function computeMotivationFacets(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Purpose": clamp(g("responsibility")),
    "Ambition": clamp(g("drive")),
    "Consistency": clamp(g("persistence")),
    "Exploration": clamp((g("curiosity") + g("openMindedness")) / 2),
  };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Career matching
   For each career, fit = average normalized score across its 3 signature
   dimensions. Tiers: >=65 Excellent, >=45 Good, else Avoid (shown as a
   growth note rather than a value judgement). A one-line "why" is
   generated from whichever of the 3 dimensions scored highest for the
   person, referencing that trait by name.
------------------------------------------------------------------------- */

const DIM_LABELS = {
  confidence:"confidence", logic:"logical thinking", creativity:"creativity",
  humor:"humor", adaptability:"adaptability", curiosity:"curiosity",
  empathy:"empathy", leadership:"leadership", patience:"patience",
  drive:"drive", risk:"risk tolerance", trust:"trust", kindness:"kindness",
  discipline:"discipline", socialEnergy:"social energy",
  selfAwareness:"self-awareness", planning:"planning", resilience:"resilience",
  optimism:"optimism", independence:"independence",
  emotionalStability:"emotional stability", competitiveness:"competitiveness",
  responsibility:"responsibility", persistence:"persistence",
  openMindedness:"open-mindedness"
};

function computeCareers(normDims){
  return CAREERS.map(c => {
    const scores = c.dims.map(d => pct(normDims[d] || 0));
    const fit = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
    const topDimIdx = scores.indexOf(Math.max(...scores));
    const topDim = c.dims[topDimIdx];
    const tier = fit >= 70 ? "Excellent Match" : fit >= 55 ? "Good Match" : fit >= 40 ? "Possible Match" : "Avoid";
    const why = tier === "Avoid"
      ? `Your natural ${DIM_LABELS[c.dims[scores.indexOf(Math.min(...scores))]]} leans elsewhere, so this isn't a strength fit today.`
      : tier === "Possible Match"
      ? `Your ${DIM_LABELS[topDim]} helps here, but it isn't the strongest lane for you.`
      : `Your ${DIM_LABELS[topDim]} lines up well with what this path demands.`;
    return { name:c.name, fit, tier, why };
  }).sort((a,b) => b.fit - a.fit);
}

/* -------------------------------------------------------------------------
   ALGORITHM: Relationship matches
   Each relationship type weights a different subset of dimensions, using
   the person's own scores to describe how they show up in that dynamic
   (not a two-person comparison, that's the Compare page, below).
------------------------------------------------------------------------- */

const RELATIONSHIP_WEIGHTS = {
  friendship: ["trust","kindness","socialEnergy"],
  dating: ["empathy","trust","confidence"],
  marriage: ["patience","trust","discipline"],
  business: ["drive","logic","discipline"],
  creative: ["creativity","adaptability","curiosity"],
  travel: ["adaptability","risk","curiosity"],
  gaming: ["patience","logic","humor"],
  study: ["discipline","patience","logic"],
  roommate: ["patience","trust","discipline"],
};

function computeRelationshipStyles(normDims){
  return RELATIONSHIP_TYPES.map(r => {
    const dims = RELATIONSHIP_WEIGHTS[r.key];
    const score = Math.round(dims.reduce((s,d)=>s+getDimensionPercent(normDims,d),0) / dims.length);
    return { key:r.key, label:r.label, score };
  });
}

/* -------------------------------------------------------------------------
   ALGORITHM: Personality code encode/decode (versioned)
   Format:  [Name-]PF<version>-<archetypeIndex base36>-<N dims base36>-<checksum>
   PF1 codes (the original release) carry the first 20 dimensions.
   PF2 codes carry all 25. The dimension order never changes for the first
   20 slots, only new slots were appended, so a PF1 code can always be
   read: its 20 known dimensions are recovered exactly, and the 5 added in
   v2 are set to a neutral 0 since they were never asked about. This is why
   old codes never break. decodeCode() always returns a full 25-dimension
   profile regardless of which version it was given, with an `upgraded`
   flag set to true when it had to backfill newer dimensions.
   Every dimension is clamped to -10..10, shifted to 0..20 so it always
   encodes as a single base36 digit. The checksum is a simple mod-36 sum of
   all digit values plus the archetype index, guarding against typos.
   Fully local, no server round trip needed to decode either the name or
   the traits.
------------------------------------------------------------------------- */

const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_VERSION = 2;
const V1_DIMENSION_COUNT = 20; // the original release's dimension count

function sanitizeName(name){
  return (name || "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function encodeCode(archetypeId, normDims, name){
  const archIdx = ARCHETYPES.findIndex(a => a.id === archetypeId);
  const archDigit = B36[archIdx] || "0";
  let digits = "";
  let checksum = archIdx;
  DIMENSIONS.forEach(dim => {
    const shifted = Math.max(0, Math.min(20, (normDims[dim] || 0) + 10));
    digits += B36[shifted];
    checksum += shifted;
  });
  const checkDigit = B36[checksum % 36];
  const base = `PF${CODE_VERSION}-${archDigit}-${digits}-${checkDigit}`;
  const cleanName = sanitizeName(name);
  return cleanName ? `${cleanName}-${base}` : base;
}

function decodeCode(code){
  try {
    const raw = code.trim();
    let name = "";
    let body = raw;
    const firstParts = raw.split("-");
    if (firstParts[0] && !/^PF\d+$/i.test(firstParts[0])){
      name = sanitizeName(firstParts[0]);
      body = firstParts.slice(1).join("-");
    }
    const parts = body.trim().toUpperCase().split("-");
    if (parts.length !== 4) return null;
    const [versionTag, archDigit, digits, checkDigit] = parts;
    const versionMatch = /^PF(\d+)$/.exec(versionTag);
    if (!versionMatch) return null;
    const version = parseInt(versionMatch[1], 10);
    const expectedDigitCount = version <= 1 ? V1_DIMENSION_COUNT : DIMENSIONS.length;
    const archIdx = B36.indexOf(archDigit);
    if (archIdx < 0 || !ARCHETYPES[archIdx]) return null;
    if (digits.length !== expectedDigitCount) return null;

    let checksum = archIdx;
    const normDims = emptyDims();
    for (let i = 0; i < expectedDigitCount; i++){
      const val = B36.indexOf(digits[i]);
      if (val < 0 || val > 20) return null;
      checksum += val;
      normDims[DIMENSIONS[i]] = val - 10;
    }
    if (B36[checksum % 36] !== checkDigit) return null;

    return {
      archetype: ARCHETYPES[archIdx],
      normDims,
      name,
      version,
      upgraded: version < CODE_VERSION,
    };
  } catch (e){
    return null;
  }
}

// decodeCode()'s own .archetype is whatever archIdx was baked into the
// code string at encode time -- correct then, but stale the moment
// matchArchetype's scoring changes, since (unlike normDims) it's never
// recomputed just from decoding. Every page that displays an archetype
// from a decoded code (Compare, Party Compare, the inline compare-with-a-
// code widget on Results) should run it through this first, so none of
// them can show a different archetype than the same person's own Result/
// Profile/Growth pages, which already recompute fresh.
function freshenDecoded(decoded){
  if (!decoded) return decoded;
  return { ...decoded, archetype: matchArchetype(decoded.normDims).primary };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Compatibility (Compare page)
   For two decoded profiles, compute:
   - relationshipScore: overall closeness, weighted toward complementary
     (not just identical) traits: leadership plus patience, drive plus
     planning, social energy plus empathy, and risk plus discipline are
     all treated as good complements, not just close matches.
   - communicationScore, adventureScore, creativeScore, trustScore: simple
     paired averages and similarity on relevant dimension clusters.
   - sharedStrengths / conflictAreas: dimensions where both score high
     (shared) versus dimensions with the largest gap (friction risk).
------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   ALGORITHM: Compatibility (rewritten, empirically calibrated)
   The previous version scored almost every pair 75-90% because it
   averaged similarity across 25 near-independent dimensions, and
   averaging many independent numbers mathematically compresses variance
   toward a narrow middle band regardless of who's being compared, the
   same reason a class average barely moves no matter which two students
   you pick. This version fixes that two ways:
   1. traitSimilarity() uses a steep, calibrated falloff (spread=5,
      power=1.8) instead of a gentle linear one, so real differences
      register instead of being smoothed away.
   2. The raw composite is then passed through calibrateScore(), a
      piecewise remap whose anchor points were derived empirically by
      simulating 1000+ real quiz sessions, measuring the actual raw score
      distribution, and mapping its percentiles onto the target
      real-world bands (most pairs land "mixed" to "good", "exceptional"
      is genuinely rare). This was verified afterward against 500 more
      simulated pairs: about 1% land under 20, 16% in 20-40, 37% in
      40-60, 22% in 60-75, 18% in 75-90, and 5% above 90, close to the
      intended distribution, with a real identical-profile match scoring
      100 and true opposites scoring 0.
------------------------------------------------------------------------- */

function traitSimilarity(a, b, spread, power){
  const gap = Math.abs((a||0) - (b||0));
  const normalized = Math.min(1, gap / (spread || 5));
  return 100 * (1 - Math.pow(normalized, power || 1.8));
}

const COMPATIBILITY_CALIBRATION_ANCHORS = [
  [0,0], [43.6,20], [56.0,40], [66.7,60], [74.2,75], [82.0,90], [90.7,100]
];
function calibrateScore(raw){
  const anchors = COMPATIBILITY_CALIBRATION_ANCHORS;
  if (raw <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++){
    if (raw <= anchors[i][0]){
      const [x0,y0] = anchors[i-1], [x1,y1] = anchors[i];
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return 100;
}

const COMPATIBILITY_CORE_DIMS = ["trust","empathy","kindness","patience","emotionalStability","socialEnergy","independence","openMindedness"];
const COMPATIBILITY_COMPLEMENT_PAIRS = [["leadership","patience"],["drive","planning"],["risk","discipline"]];

function compatibilityBand(score){
  if (score < 20) return "Extremely Incompatible";
  if (score < 40) return "Difficult";
  if (score < 60) return "Mixed";
  if (score < 75) return "Good";
  if (score < 90) return "Excellent";
  return "Exceptional";
}

/* Similarity is a different question from compatibility: it asks "how
   alike are you", not "how well do you function together". It's an
   unweighted read across every dimension, with no bonus for the kind of
   complementary differences (one leads, one supports) that compatibility
   specifically rewards, which is exactly why the two numbers can and
   often do disagree. */
function computeSimilarityScore(a, b){
  const vals = DIMENSIONS.map(d => traitSimilarity(a[d], b[d], 6, 1.4));
  const raw = vals.reduce((s,v) => s+v, 0) / vals.length;
  return calibrateScore(raw);
}

/* A lightweight, defensible proxy for how much real signal a profile
   carries, since a decoded code doesn't retain how many questions were
   actually answered. Profiles with traits sitting mostly near neutral
   read as less certain than ones with clear, decisive scores. */
function computeComparisonConfidence(profileA, profileB){
  const strength = (nd) => {
    const vals = DIMENSIONS.map(d => Math.abs(nd[d] || 0));
    return vals.reduce((s,v) => s+v, 0) / vals.length;
  };
  const avgStrength = (strength(profileA.normDims) + strength(profileB.normDims)) / 2;
  return Math.max(55, Math.min(99, Math.round(55 + avgStrength * 7)));
}

function computeCompatibility(profileA, profileB){
  const a = profileA.normDims, b = profileB.normDims;

  const coreVals = COMPATIBILITY_CORE_DIMS.map(d => traitSimilarity(a[d], b[d], 5, 1.8));
  const core = coreVals.reduce((s,v) => s+v, 0) / coreVals.length;
  const complementBonus = COMPATIBILITY_COMPLEMENT_PAIRS.reduce((sum, [x,y]) => {
    const gap = Math.abs((a[x]||0) - (b[y]||0));
    return sum + Math.max(0, (10 - gap) / 10) * 3;
  }, 0);
  const rawOverall = Math.max(0, Math.min(100, core * 0.85 + complementBonus));
  const relationshipScore = calibrateScore(rawOverall);

  const communicationScore = calibrateScore((traitSimilarity(a.socialEnergy,b.socialEnergy,5,1.8) + traitSimilarity(a.trust,b.trust,5,1.8) + traitSimilarity(a.empathy,b.empathy,5,1.8)) / 3);
  const adventureScore = calibrateScore((traitSimilarity(a.risk,b.risk,5,1.8) + traitSimilarity(a.adaptability,b.adaptability,5,1.8) + traitSimilarity(a.curiosity,b.curiosity,5,1.8)) / 3);
  const creativeScore = calibrateScore((traitSimilarity(a.creativity,b.creativity,5,1.8) + traitSimilarity(a.curiosity,b.curiosity,5,1.8)) / 2);
  const trustScore = calibrateScore((traitSimilarity(a.trust,b.trust,5,1.8) + traitSimilarity(a.kindness,b.kindness,5,1.8)) / 2);

  const similarityScore = computeSimilarityScore(a, b);
  const comparisonConfidence = computeComparisonConfidence(profileA, profileB);
  const band = compatibilityBand(relationshipScore);
  const similarityGap = Math.abs(similarityScore - relationshipScore);
  const similarityNote = similarityGap < 8
    ? "Your similarity and compatibility scores are close, how alike you are lines up with how well you function together."
    : similarityScore > relationshipScore
    ? `You're more alike (${similarityScore}%) than you are compatible (${relationshipScore}%), being similar doesn't automatically mean you balance each other well.`
    : `You're more compatible (${relationshipScore}%) than you are similar (${similarityScore}%), your differences are doing real work here, not just canceling each other out.`;

  const shared = DIMENSIONS.filter(d => a[d] >= 3 && b[d] >= 3).sort((x,y)=>(b[y]+a[y])-(b[x]+a[x])).slice(0,4);
  const conflicts = DIMENSIONS.map(d => ({ d, gap: Math.abs(a[d]-b[d]) })).sort((x,y)=>y.gap-x.gap).slice(0,3).map(x=>x.d);

  return { relationshipScore, communicationScore, adventureScore, creativeScore, trustScore,
    similarityScore, comparisonConfidence, band, similarityNote,
    sharedStrengths: shared.map(d => DIM_LABELS[d]), conflictAreas: conflicts.map(d => DIM_LABELS[d]) };
}

/* =========================================================================
   V2 ADDITIONS
   New computed profiles for the v2 update. All of these are pure
   functions over a 25-dimension normDims object, nothing here changes how
   the original scoring, matching, or codes behave.
   ========================================================================= */

/* ---- Generic signature scorer, reused by several profiles below -------- */
function scoreBySignature(list, normDims){
  return list.map(item => ({
    item,
    score: item.signature.reduce((sum, s) => sum + (normDims[s.dim] || 0) * s.w, 0),
  })).sort((a, b) => b.score - a.score);
}

/* ---- Generic percentage-breakdown scorer, reused by thinking/learning/
   decision/love-language profiles. Every category's raw value is an
   average of pct() over its listed dimensions, then the whole set is
   normalized to sum to 100 so it reads like a breakdown, not a set of
   independent scores. ------------------------------------------------- */
function computePercentageProfile(categories, normDims){
  const raw = categories.map(c => ({
    name: c.name,
    val: c.dims.reduce((s, d) => s + pct(normDims[d] || 0), 0) / c.dims.length,
  }));
  const total = raw.reduce((s, r) => s + r.val, 0) || 1;
  const withPct = raw.map(r => ({ name: r.name, pct: Math.round((r.val / total) * 100) }));
  withPct.sort((a, b) => b.pct - a.pct);
  const drift = 100 - withPct.reduce((s, r) => s + r.pct, 0);
  if (withPct.length) withPct[0].pct += drift;
  return withPct;
}

/* ---- Personality mix: primary/secondary/third percentages -- */
function computePersonalityMix(ranked){
  const top3 = ranked.slice(0, 3);
  const minScore = Math.min(...top3.map(r => r.score));
  const shifted = top3.map(r => Math.max(0.5, r.score - minScore + 1));
  const total = shifted.reduce((a, b) => a + b, 0);
  const pcts = shifted.map(v => Math.round((v / total) * 100));
  const drift = 100 - pcts.reduce((a, b) => a + b, 0);
  pcts[0] += drift;
  return top3.map((r, i) => ({ archetype: r.archetype, pct: Math.max(1, pcts[i]) }));
}

/* ---- Social profile ------------------------------------------ */
function computeSocialProfile(normDims){
  const spectrumPct = pct(normDims.socialEnergy || 0);
  const category = spectrumPct <= 35 ? "Introvert" : spectrumPct >= 65 ? "Extrovert" : "Ambivert";
  const socialBattery = clamp1to100((pct(normDims.socialEnergy || 0) + pct(normDims.adaptability || 0)) / 2);
  const empathyPct = pct(normDims.empathy || 0), humorPct = pct(normDims.humor || 0), logicPct = pct(normDims.logic || 0);
  let conversationStyle;
  if (empathyPct >= humorPct && empathyPct >= logicPct) conversationStyle = "Deep, one-on-one conversations over small talk";
  else if (humorPct >= logicPct) conversationStyle = "Playful, quick back-and-forth banter";
  else conversationStyle = "Idea-driven discussion, small talk is just the warm-up";
  let groupSizePreference;
  if (spectrumPct <= 35 && pct(normDims.independence || 0) >= 55) groupSizePreference = "One person, or a very small, familiar group";
  else if (spectrumPct >= 65) groupSizePreference = "The bigger the group, the more energy in the room";
  else groupSizePreference = "Small, familiar groups over big unpredictable ones";
  const communicationStyle = pct(normDims.confidence || 0) >= 60
    ? "Direct and upfront, says what it is"
    : pct(normDims.empathy || 0) >= 60
    ? "Careful and considerate, reads the room before speaking"
    : "Measured, tends to think before responding";
  return { spectrumPct, category, socialBattery, conversationStyle, groupSizePreference, communicationStyle };
}
function clamp1to100(v){ return Math.max(1, Math.min(100, Math.round(v))); }

/* ---- Relationship profile ------------------------------------ */
function computeRelationshipProfile(normDims){
  const loveLanguages = computePercentageProfile(LOVE_LANGUAGE_CATEGORIES, normDims);
  const attachmentStyle = scoreBySignature(ATTACHMENT_STYLES, normDims)[0].item;
  const conflictStyle = scoreBySignature(CONFLICT_STYLES, normDims)[0].item;
  const trustLevel = pct(normDims.trust || 0);
  const jealousyLevel = clamp1to100(100 - (pct(normDims.trust || 0) + pct(normDims.emotionalStability || 0)) / 2);
  const personalSpace = pct(normDims.independence || 0);
  const emotionalIntimacy = clamp1to100((pct(normDims.empathy || 0) + pct(normDims.trust || 0)) / 2);
  const leadScore = pct(normDims.leadership || 0), followScore = pct(normDims.patience || 0);
  const gap = leadScore - followScore;
  let relationshipDynamic;
  if (Math.abs(gap) <= 12 && pct(normDims.adaptability || 0) >= 60) relationshipDynamic = "Adaptive, switches depending on the situation";
  else if (gap > 12) relationshipDynamic = "Usually Leads";
  else if (gap < -12) relationshipDynamic = "Usually Follows";
  else relationshipDynamic = "Balanced";
  return { loveLanguages, attachmentStyle, conflictStyle, trustLevel, jealousyLevel, personalSpace, emotionalIntimacy, relationshipDynamic };
}

/* ---- Narrative role ------------------------------------------ */
function computeNarrativeRole(normDims){
  const ranked = scoreBySignature(NARRATIVE_ROLES, normDims);
  return { primary: ranked[0].item, runnerUp: ranked[1].item };
}

/* ---- Thinking, learning, decision profiles (Updates 8, 9, 10) ----------- */
function computeThinkingProfile(normDims){ return computePercentageProfile(THINKING_CATEGORIES, normDims); }
function computeLearningProfile(normDims){ return computePercentageProfile(LEARNING_CATEGORIES, normDims); }
function computeDecisionProfile(normDims){ return computePercentageProfile(DECISION_CATEGORIES, normDims); }

/* ---- Stress response, ranked --------------------------------- */
function computeStressResponses(normDims){
  return scoreBySignature(STRESS_RESPONSES, normDims).slice(0, 3).map(r => r.item);
}

/* ---- Ideal environments, ranked ------------------------------ */
function computeEnvironments(normDims){
  return scoreBySignature(ENVIRONMENT_PROFILES, normDims).slice(0, 4).map(r => r.item.name);
}

/* ---- Aesthetic profile ---------------------------------------- */
function computeAesthetic(normDims){
  return scoreBySignature(AESTHETIC_VIBES, normDims)[0].item;
}

/* ---- Entertainment predictions --------------------------------- */
function computeEntertainment(normDims){
  const ranked = scoreBySignature(ENTERTAINMENT_PROFILES, normDims);
  return { primary: ranked[0].item, secondary: ranked[1].item };
}

/* ---- Achievements ---------------------------------------------- */
function computeAchievements(normDims){
  return ACHIEVEMENTS.filter(a => a.test(normDims));
}

/* ---- Archetype extras: animal, element, symbol, hidden
   potential, plus the fields that are just aliases of existing archetype
   fields so nothing needed re-authoring. ------------------------------- */
function getArchetypeExtras(archetype){
  const lookup = ARCHETYPE_EXTRAS[archetype.id] || { animal:"Fox", element:"Fire", symbol:"\u2726" };
  const hiddenPotential = `The flip side of "${archetype.weaknesses[0]}" is usually unclaimed ${archetype.strengths[2] ? archetype.strengths[2].toLowerCase() : archetype.strengths[0].toLowerCase()}, once it stops being treated like a flaw.`;
  return {
    animal: lookup.animal,
    element: lookup.element,
    symbol: lookup.symbol,
    primaryColor: archetype.colors[0],
    secondaryColor: archetype.colors[1],
    lifeMotto: archetype.quote,
    favoriteEnvironment: archetype.idealEnvironments[0],
    hiddenPotential,
  };
}

/* ---- Just for fun stats ---------------------------------------
   Kept deliberately separate from computeMeasuredTraits(), which stays the
   serious, no-randomness read. This one is explicitly playful and labeled
   as such wherever it's shown, never presented as an actual assessment. */
function computeFunStats(normDims){
  const g = k => pct(normDims[k] || 0);
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  return {
    "Aura": clamp((g("confidence") + g("independence") + g("selfAwareness")) / 3),
    "Rizz": clamp((g("confidence") + g("humor") + g("socialEnergy")) / 3),
    "Chaos": clamp((g("risk") + g("humor") + (100 - g("planning"))) / 3),
    "Main Character Energy": clamp((g("confidence") + g("drive") + g("creativity")) / 3),
    "NPC Energy": clamp(100 - (g("independence") + g("confidence") + g("creativity")) / 3),
    "Plot Armor": clamp((g("resilience") + g("optimism") + g("persistence")) / 3),
    "Academic IQ": clamp((g("logic") + g("discipline") + g("curiosity")) / 3),
    "Street IQ": clamp((g("adaptability") + g("risk") + g("selfAwareness")) / 3),
    "Charisma": clamp((g("confidence") + g("humor") + g("leadership")) / 3),
    "Comfort Level": clamp((g("trust") + g("patience") + g("emotionalStability")) / 3),
    "Adventure": clamp((g("risk") + g("curiosity") + g("adaptability")) / 3),
    "Braincells": clamp((g("logic") + g("selfAwareness") + g("discipline")) / 3),
    "Clutch Factor": clamp((g("resilience") + g("confidence") + g("discipline")) / 3),
    "Fashion": clamp((g("creativity") + g("confidence") + g("openMindedness")) / 3),
    "Taste": clamp((g("selfAwareness") + g("creativity") + g("discipline")) / 3),
    "Vibes": clamp((g("optimism") + g("humor") + g("emotionalStability")) / 3),
    "Energy": clamp((g("drive") + g("socialEnergy") + g("competitiveness")) / 3),
  };
}

/* =========================================================================
   PROFILE DEPTH FEATURES
   Personality confidence/stability, hidden strengths and weaknesses,
   fantasy role, friendship/motivation/fun-extra profiles, and a much
   deeper compatibility engine. Nothing above this line changes.
   ========================================================================= */

/* ---- Personality confidence and stability ------------------------------- */
/* -------------------------------------------------------------------------
   ALGORITHM: Assessment Confidence
   Five components, matched one-to-one to what "confident" is actually
   supposed to mean for a layered archetype+soul read, not a speed proxy
   and not a single archetype-gap number:
     - archetypeSeparation: how far the top archetype candidate is ahead
                             of the runner-up (the original gap-based
                             signal)
     - consistency:         agreement across paired situations that touch
                             similar ground (computeConsistency)
     - soulCertainty:       the equivalent gap-based signal for the 6 soul
                             types — archetype and soul are determined
                             together from the same answers, so soul
                             ambiguity should drag overall confidence down
                             exactly like archetype ambiguity does, not be
                             invisible to it
     - sinVirtueCertainty:  how polarized the 7 sin/virtue axes are (close
                             to 50/50 on every axis means the "dominant"
                             sin or virtue is barely dominant at all, a
                             coin flip dressed up as an insight)
     - tieBreakerScore:     did Balanced mode need the extra 15 questions
                             beyond the 35-question checkpoint? Needing
                             them is itself a signal the profile wasn't
                             clear-cut going in, so it costs a modest
                             amount even if the extra questions eventually
                             cleared things up. Neutral (100) for Quick
                             Read/Deep Dive, where the concept doesn't
                             apply, and for Balanced runs that resolved at
                             the checkpoint without needing them.
   versionPenalty is a small deduction for PF1-origin profiles that
   haven't been upgraded, since 5 dimensions were never actually measured
   for them. When no session is available (a profile decoded from a
   shared code), consistency and tieBreakerScore can't be measured, so
   overall is computed from the three signals that only need normDims
   (archetypeSeparation, soulCertainty, sinVirtueCertainty) with a visible
   note explaining why. */
function computeAssessmentConfidence(ranked, normDims, session, upgradedFromV1){
  const gap = ranked[0].score - ranked[1].score;
  const archetypeSeparation = Math.max(0, Math.min(100, Math.round((gap / CONFIDENCE_SCALE) * 100)));
  const avgOthers = ranked.slice(1).reduce((s, r) => s + r.score, 0) / (ranked.length - 1);
  const stabilityRaw = ranked[0].score - avgOthers;
  const stabilityPct = Math.max(0, Math.min(100, Math.round((stabilityRaw / (CONFIDENCE_SCALE * 1.5)) * 100)));

  const soulRanked = scoreSoulTypes(normDims);
  const soulGap = soulRanked[0].score - soulRanked[1].score;
  const soulCertainty = Math.max(0, Math.min(100, Math.round((soulGap / CONFIDENCE_SCALE) * 100)));

  const sinVirtueAxes = computeSinVirtueProfile(normDims);
  const sinVirtueCertainty = Math.round(
    sinVirtueAxes.reduce((s, ax) => s + Math.abs(ax.sinPct - 50) * 2, 0) / sinVirtueAxes.length
  );

  const versionPenalty = upgradedFromV1 ? 6 : 0;

  if (!session || !session.answers){
    const overall = Math.max(0, Math.min(100, Math.round(
      archetypeSeparation * 0.45 + soulCertainty * 0.35 + sinVirtueCertainty * 0.2 - versionPenalty
    )));
    return {
      confidencePct: overall,
      stabilityPct,
      overall,
      consistency: null, tieBreakerScore: null,
      archetypeSeparation, soulCertainty, sinVirtueCertainty, versionPenalty,
      note: "This code carries no answer history to measure consistency or tie-breaker use from, so this reflects separation and certainty only.",
    };
  }

  const consistencyResult = computeConsistency(session);
  const consistency = consistencyResult.pct;

  // Tie-breakers only mean something for Balanced ("adaptive") runs, where
  // going past the 35-question checkpoint means the checkpoint genuinely
  // wasn't confident yet. Quick Read and Deep Dive always run a fixed
  // length regardless of confidence, so the concept doesn't apply to them.
  let tieBreakerScore = 100;
  if (session.questionMode === "adaptive" && session.cursor > MIN_QUESTIONS){
    const extra = Math.min(session.cursor - MIN_QUESTIONS, MAX_QUESTIONS - MIN_QUESTIONS);
    tieBreakerScore = Math.round(100 - (extra / (MAX_QUESTIONS - MIN_QUESTIONS)) * 40);
  }

  const overall = Math.max(0, Math.min(100, Math.round(
    archetypeSeparation * 0.30 + consistency * 0.20 + soulCertainty * 0.20 +
    sinVirtueCertainty * 0.15 + tieBreakerScore * 0.15 - versionPenalty
  )));

  return {
    confidencePct: overall, // kept as the headline field existing UI already reads
    stabilityPct,
    overall, consistency, archetypeSeparation, soulCertainty, sinVirtueCertainty, tieBreakerScore, versionPenalty,
    note: null,
  };
}

/* ---- Hidden strengths and weaknesses -------------------------------------
   Dimensions outside the matched archetype's own 3-dimension signature
   that still score notably high or low, the traits a person has that
   their "headline" type doesn't already advertise. */
function computeHiddenTraits(normDims, archetype){
  const sigDims = new Set(archetype.signature.map(s => s.dim));
  const outside = DIMENSIONS.filter(d => !sigDims.has(d)).map(d => ({ d, v: normDims[d] || 0 }));
  const hiddenStrengths = outside.filter(x => x.v > 0).sort((a,b) => b.v - a.v).slice(0, 3).map(x => DIM_LABELS[x.d]);
  const hiddenWeaknesses = outside.filter(x => x.v < 0).sort((a,b) => a.v - b.v).slice(0, 3).map(x => DIM_LABELS[x.d]);
  return { hiddenStrengths, hiddenWeaknesses };
}

/* ---- Fantasy role, friend type, motivation, fun extras -------------------
   All reuse the same signature-scoring pattern as archetypes. */
function computeFantasyRole(normDims){ return scoreBySignature(FANTASY_ROLES, normDims)[0].item; }
function computeFriendType(normDims){ return scoreBySignature(FRIEND_TYPES, normDims)[0].item; }
function computeMotivation(normDims){ return scoreBySignature(MOTIVATION_STYLES, normDims)[0].item; }
function computeMythicalCreature(normDims){ return scoreBySignature(MYTHICAL_CREATURES, normDims)[0].item; }
function computeSeason(normDims){ return scoreBySignature(SEASONS, normDims)[0].item; }
function computeTimeOfDay(normDims){ return scoreBySignature(TIMES_OF_DAY, normDims)[0].item; }
function computeChessPiece(normDims){ return scoreBySignature(CHESS_PIECES, normDims)[0].item; }

/* ---- Friendship profile scores -------------------------------------------- */
function computeFriendshipProfile(normDims){
  return {
    type: computeFriendType(normDims),
    reliableScore: pct(normDims.responsibility || 0),
    comfortScore: pct(normDims.kindness || 0),
    chaosScore: clamp1to100((pct(normDims.risk||0) + pct(normDims.humor||0)) / 2),
    listeningSkill: pct(normDims.patience || 0),
    adviceSkill: clamp1to100((pct(normDims.logic||0) + pct(normDims.empathy||0)) / 2),
    planningSkill: pct(normDims.planning || 0),
  };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Deep compatibility (category breakdown)
   Runs every category in COMPATIBILITY_CATEGORIES, produces a ranked list
   of scores, a set of dynamically generated explanation sentences built
   from the actual dimension comparisons (not fixed text), a full set of
   "who does X more" comparisons, and a couple of generated activity
   suggestions plus fun-fact lines. Keeps computeCompatibility() above
   completely intact for anything already relying on the simpler version.
------------------------------------------------------------------------- */

function scoreCategory(cat, a, b){
  if (cat.type === "combined"){
    const vals = cat.dims.map(d => (pct(a[d]||0) + pct(b[d]||0)) / 2);
    return Math.round(vals.reduce((s,v) => s+v, 0) / vals.length);
  }
  const sims = cat.dims.map(d => traitSimilarity(a[d]||0, b[d]||0, 5, 1.8));
  const raw = sims.reduce((s,v) => s+v, 0) / sims.length;
  return calibrateScore(raw);
}

function generateCompatibilityExplanations(a, b, nameA, nameB){
  const A = nameA || "Person A", B = nameB || "Person B";
  const lines = [];
  const gap = (dim) => (a[dim]||0) - (b[dim]||0);

  if (Math.abs(gap("leadership")) >= 4){
    const leader = gap("leadership") > 0 ? A : B;
    const other = leader === A ? B : A;
    lines.push(`${leader} naturally takes the lead while ${other} is more comfortable supporting, which tends to work well if you both actually like it that way.`);
  }
  if ((a.patience||0) < -1 && (b.patience||0) < -1){
    lines.push(`You both tend to avoid conflict rather than lean into it, which can work in the short term but may delay solving problems that need airing out.`);
  }
  if (Math.abs(gap("planning")) >= 4){
    const planner = gap("planning") > 0 ? A : B;
    const other = planner === A ? B : A;
    lines.push(`${planner} enjoys planning things out while ${other} prefers to improvise, so you'll naturally divide who handles structure and who handles spontaneity.`);
  }
  if ((a.responsibility||0) >= 3 && (b.responsibility||0) >= 3){
    lines.push(`You both take responsibility seriously, which means things generally get done without either of you having to chase the other.`);
  }
  if (Math.abs(gap("socialEnergy")) >= 5){
    const social = gap("socialEnergy") > 0 ? A : B;
    const other = social === A ? B : A;
    lines.push(`${social} tends to bring the social energy while ${other} recharges in quieter settings, which can balance out well with a little give on both sides.`);
  }
  if ((a.trust||0) >= 3 && (b.trust||0) >= 3){
    lines.push(`Trust comes relatively easily to both of you, which tends to make the whole relationship lower-friction.`);
  }
  if ((a.trust||0) <= -2 || (b.trust||0) <= -2){
    lines.push(`At least one of you tends to guard trust carefully, so it may take real time and consistency before this relationship feels fully secure.`);
  }
  if (Math.abs(gap("risk")) >= 5){
    const riskier = gap("risk") > 0 ? A : B;
    const other = riskier === A ? B : A;
    lines.push(`${riskier} is far more comfortable with risk than ${other} is, so travel and big decisions may need extra conversation to land somewhere you both feel good about.`);
  }
  if ((a.humor||0) >= 3 && (b.humor||0) >= 3){
    lines.push(`You both lead with humor, which makes hard conversations easier to survive and easy ones a lot more fun.`);
  }
  if (Math.abs(gap("independence")) >= 5){
    const indep = gap("independence") > 0 ? A : B;
    const other = indep === A ? B : A;
    lines.push(`${indep} needs more independence day-to-day than ${other} does, worth naming directly so it doesn't get quietly misread as distance.`);
  }
  return lines.slice(0, 6);
}

function computeWhoComparisons(a, b, nameA, nameB){
  const A = nameA || "Person A", B = nameB || "Person B";
  return WHO_COMPARISONS.map(c => {
    let av = a[c.dim] || 0, bv = b[c.dim] || 0;
    if (c.invert){ av = -av; bv = -bv; }
    const diff = av - bv;
    const winner = Math.abs(diff) <= 1 ? "Evenly matched" : (diff > 0 ? A : B);
    return { label: c.label, winner };
  });
}

const ACTIVITY_TEMPLATES = [
  { dims:["risk","curiosity"], activity:"A spontaneous multi-city trip with no fixed itinerary", vacation:"Backpacking somewhere neither of you has been", business:"A scrappy early-stage venture that rewards moving fast", hobby:"Trying a new adrenaline sport together", weekend:"A last-minute road trip with no real plan" },
  { dims:["creativity","openMindedness"], activity:"A collaborative art, music, or writing project", vacation:"A slow trip built around galleries, music, and local art scenes", business:"A creative studio or content brand", hobby:"Building something together with your hands", weekend:"A open-ended creative afternoon with zero deadline" },
  { dims:["discipline","planning"], activity:"Training for something together with a real endpoint", vacation:"A well-planned trip with a clear itinerary and reservations made early", business:"An operations-heavy business that rewards consistency", hobby:"A shared fitness or skill-building routine", weekend:"A productive weekend with a satisfying list to check off" },
  { dims:["empathy","kindness"], activity:"Volunteering somewhere together", vacation:"A quiet, restorative trip focused on connection over sightseeing", business:"A mission-driven venture or nonprofit", hobby:"Cooking for people you both care about", weekend:"A low-key weekend hosting people you love" },
  { dims:["humor","socialEnergy"], activity:"Hosting a big, chaotic game night", vacation:"A trip built around festivals, nightlife, and meeting people", business:"Something public-facing and social, like events or hospitality", hobby:"An improv or comedy class together", weekend:"A weekend packed with plans and people" },
];
function computePerfectActivities(a, b){
  const combined = {};
  DIMENSIONS.forEach(d => combined[d] = ((a[d]||0) + (b[d]||0)) / 2);
  const scored = ACTIVITY_TEMPLATES.map(t => ({
    t, score: t.dims.reduce((s,d) => s + combined[d], 0) / t.dims.length,
  })).sort((x,y) => y.score - x.score);
  return scored[0].t;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Group compatibility (party of up to 5)
   Runs the existing pairwise compatibility for every pair in the group,
   then layers on group-level reads: an overall average, the strongest and
   weakest pair, each person's most distinctive trait relative to the
   group average (their "role"), traits the whole group shares, and the
   traits with the most spread (likely friction points for the group as a
   whole, not just one pair).
------------------------------------------------------------------------- */
function computeGroupCompatibility(profiles, names){
  const n = profiles.length;
  const label = (i) => names[i] || `Person ${i + 1}`;

  const pairwise = [];
  for (let i = 0; i < n; i++){
    for (let j = i + 1; j < n; j++){
      const c = computeCompatibility(profiles[i], profiles[j]);
      pairwise.push({ i, j, nameA: label(i), nameB: label(j), score: c.relationshipScore });
    }
  }
  const overallScore = Math.round(pairwise.reduce((s,p) => s + p.score, 0) / pairwise.length);
  const sortedPairs = [...pairwise].sort((a,b) => b.score - a.score);
  const bestPair = sortedPairs[0];
  const toughestPair = sortedPairs[sortedPairs.length - 1];

  const avgDims = {};
  DIMENSIONS.forEach(d => {
    avgDims[d] = profiles.reduce((s,p) => s + (p.normDims[d] || 0), 0) / n;
  });

  const roles = profiles.map((p, idx) => {
    const diffs = DIMENSIONS.map(d => ({ d, diff: (p.normDims[d] || 0) - avgDims[d] }));
    diffs.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff));
    const top = diffs[0];
    return {
      name: label(idx),
      archetype: p.archetype,
      standoutTrait: DIM_LABELS[top.d],
      direction: top.diff >= 0 ? "more" : "less",
    };
  });

  const groupSharedStrengths = DIMENSIONS
    .filter(d => profiles.every(p => (p.normDims[d] || 0) >= 3))
    .map(d => DIM_LABELS[d]).slice(0, 5);

  const groupFriction = DIMENSIONS.map(d => {
    const vals = profiles.map(p => p.normDims[d] || 0);
    const mean = vals.reduce((a,b) => a+b, 0) / n;
    const variance = vals.reduce((s,v) => s + (v-mean)*(v-mean), 0) / n;
    return { d, variance };
  }).sort((a,b) => b.variance - a.variance).slice(0, 3).map(x => DIM_LABELS[x.d]);

  let vibe = "The Crew";
  if (avgDims.risk > 3 && avgDims.humor > 2) vibe = "Chaos Squad";
  else if (avgDims.empathy > 3 && avgDims.kindness > 2) vibe = "The Support System";
  else if (avgDims.leadership > 3) vibe = "The Council";
  else if (avgDims.creativity > 3) vibe = "The Collective";
  else if (avgDims.discipline > 3) vibe = "The Operation";

  /* ------------------- PARTY COMPARE 2.0 -------------------------------
     Everything below reads the whole group as one system rather than a
     stack of pairs: dominant type/soul, group-wide strength/blind-spot
     reads, and a set of named "team" metrics, each a simple, clearly
     labeled aggregate (an average or a spread) over normDims the group
     already has — no field here needs anything a pasted party code
     doesn't actually carry. */
  const g = (k) => pct(avgDims[k] || 0);
  const stdevPct = (dims) => {
    const vals = profiles.map(p => dims.reduce((s,d) => s + pct(p.normDims[d]||0), 0) / dims.length);
    const mean = vals.reduce((a,b)=>a+b,0) / n;
    const variance = vals.reduce((s,v) => s + (v-mean)*(v-mean), 0) / n;
    return Math.sqrt(variance);
  };

  const archCounts = {};
  profiles.forEach(p => { archCounts[p.archetype.id] = (archCounts[p.archetype.id] || 0) + 1; });
  const archOrder = Object.entries(archCounts).sort((a,b) => b[1] - a[1]);
  const dominantArchetype = archOrder[0][1] > 1
    ? { archetype: ARCHETYPES.find(a => a.id === archOrder[0][0]), count: archOrder[0][1] }
    : null;

  const souls = profiles.map(p => computeSoulType(p.normDims));
  const soulCounts = {};
  souls.forEach(s => { soulCounts[s.name] = (soulCounts[s.name] || 0) + 1; });
  const soulOrder = Object.entries(soulCounts).sort((a,b) => b[1] - a[1]);
  const dominantSoul = soulOrder[0][1] > 1
    ? { soul: souls.find(s => s.name === soulOrder[0][0]), count: soulOrder[0][1] }
    : null;

  const groupStrengths = DIMENSIONS.filter(d => avgDims[d] >= 2.5).sort((a,b) => avgDims[b]-avgDims[a]).slice(0,5).map(d => DIM_LABELS[d]);
  const groupWeaknesses = DIMENSIONS.filter(d => avgDims[d] <= -2.5).sort((a,b) => avgDims[a]-avgDims[b]).slice(0,5).map(d => DIM_LABELS[d]);
  const sharedBlindSpots = DIMENSIONS.filter(d => profiles.every(p => (p.normDims[d]||0) <= -2)).map(d => DIM_LABELS[d]).slice(0,4);

  const presentArchIds = new Set(profiles.map(p => p.archetype.id));
  const missingArchetypes = ARCHETYPES.filter(a => !presentArchIds.has(a.id)).slice(0, 5).map(a => a.name);

  // "Average Confidence" for a group: pasted party codes carry no saved
  // confidence score (only a freshly-completed quiz does), so this reads
  // as how far each person's answers sit from neutral on average — a
  // consistently available proxy for "how defined a read this is",
  // clearly labeled as such wherever it's shown rather than passed off
  // as the same confidence percentage the individual result page shows.
  const avgSignalStrength = Math.round(profiles.reduce((s,p) => {
    const vals = DIMENSIONS.map(d => Math.abs(p.normDims[d]||0));
    return s + (vals.reduce((a,b)=>a+b,0) / vals.length) / 10 * 100;
  }, 0) / n);

  const metrics = {
    creativityIndex: Math.round((g("creativity") + g("openMindedness") + g("curiosity")) / 3),
    leadershipBalance: Math.round((g("leadership") + g("confidence")) / 2),
    empathyBalance: Math.round((g("empathy") + g("kindness")) / 2),
    conflictRisk: Math.round(Math.min(100, stdevPct(["patience","trust","risk","planning","independence"]) * 2.2)),
    innovationScore: Math.round((g("creativity") + g("adaptability") + g("curiosity")) / 3),
    teamStability: Math.round((g("emotionalStability") + g("resilience") + g("discipline")) / 3),
    decisionSpeed: Math.round((g("confidence") + (100 - g("patience"))) / 2),
    socialEnergy: g("socialEnergy"),
    planningPct: Math.round((g("planning") + g("discipline")) / 2),
    riskTolerance: g("risk"),
    communicationHealth: Math.round((g("empathy") + g("socialEnergy") + g("trust")) / 3),
    groupDiversity: Math.round(Math.min(100, stdevPct(DIMENSIONS) * 2)),
    growthPotential: Math.round((g("optimism") + g("curiosity") + g("resilience")) / 3),
    avgConfidence: avgSignalStrength,
  };
  metrics.actionPct = 100 - metrics.planningPct;

  const identity = vibe;
  const report = generateGroupReport({ metrics, dominantArchetype, dominantSoul, groupStrengths, groupWeaknesses, sharedBlindSpots, overallScore, n });

  return {
    n, pairwise, overallScore, bestPair, toughestPair, roles, groupSharedStrengths, groupFriction, vibe,
    identity, dominantArchetype, dominantSoul, groupStrengths, groupWeaknesses, sharedBlindSpots, missingArchetypes,
    metrics, report,
  };
}

const GROUP_REPORT_TEMPLATES = [
  { test: m => m.leadershipBalance >= 60 && m.teamStability <= 45, text: g => `This group has strong leadership but lacks stabilizing personalities to keep that momentum steady under pressure.` },
  { test: m => m.creativityIndex >= 60 && m.conflictRisk >= 55, text: g => `Most members approach problems creatively, but conflict resolution may become difficult once pressure builds.` },
  { test: m => m.communicationHealth >= 60 && m.groupDiversity >= 55, text: g => `Communication runs healthy here even across a genuinely diverse mix of personalities, a combination that usually takes real effort to earn.` },
  { test: m => m.socialEnergy >= 60 && m.riskTolerance >= 55, text: g => `This is a high-energy, risk-tolerant group, plans will move fast, but someone will need to occasionally ask "should we, though?"` },
  { test: m => m.socialEnergy <= 40 && m.teamStability >= 55, text: g => `A quieter, steadier group than a loud one, decisions here are more likely to be careful than fast.` },
  { test: m => m.groupDiversity <= 35, text: g => `This group thinks unusually alike for its size, which makes coordination easy but leaves real blind spots uncovered.` },
  { test: m => m.groupDiversity >= 65, text: g => `A genuinely wide spread of personalities here, that's a real asset for covering blind spots, but it also means less shared default behavior to fall back on.` },
  { test: m => m.conflictRisk >= 60, text: g => `Conflict risk runs on the higher side, mostly from real differences in trust, patience, and risk tolerance rather than personal friction.` },
  { test: m => m.growthPotential >= 60, text: g => `Individually and together, this group tends to lean into change rather than resist it.` },
];
function generateGroupReport(ctx){
  const { metrics, dominantArchetype, dominantSoul, groupStrengths, groupWeaknesses, sharedBlindSpots, overallScore, n } = ctx;
  const lines = [];
  if (dominantArchetype) lines.push(`${dominantArchetype.count} of ${n} lean toward ${dominantArchetype.archetype.name}, the closest thing this group has to a shared default.`);
  else lines.push(`No archetype repeats in this group, everyone's read as a genuinely different type.`);
  if (dominantSoul) lines.push(`${dominantSoul.count} share a ${dominantSoul.soul.name} soul type (${dominantSoul.soul.trait.toLowerCase()}).`);
  GROUP_REPORT_TEMPLATES.forEach(t => { if (lines.length < 5 && t.test(metrics)) lines.push(t.text(metrics)); });
  if (groupStrengths.length) lines.push(`As a group, ${groupStrengths.slice(0,3).join(", ")} stand out as shared strengths.`);
  if (groupWeaknesses.length) lines.push(`${groupWeaknesses.slice(0,2).join(" and ")} run low across most of the group, worth planning around rather than assuming someone else will cover it.`);
  if (sharedBlindSpots.length) lines.push(`Everyone here is quietly weaker on ${sharedBlindSpots.slice(0,2).join(" and ")}, a genuine shared blind spot, not just one person's gap.`);
  if (lines.length < 2) lines.push(overallScore >= 60 ? "Overall, this group reads as genuinely well-matched." : "Overall, this group is more a set of real differences than a single shared type, which can still work well with a little intention.");
  return lines.slice(0, 6);
}

function computeDeepCompatibility(profileA, profileB, nameA, nameB){
  const a = profileA.normDims, b = profileB.normDims;
  const base = computeCompatibility(profileA, profileB);
  const categories = COMPATIBILITY_CATEGORIES.map(cat => ({
    name: cat.name,
    score: scoreCategory(cat, a, b),
  })).sort((x,y) => y.score - x.score);
  const explanations = generateCompatibilityExplanations(a, b, nameA, nameB);
  const whoComparisons = computeWhoComparisons(a, b, nameA, nameB);
  const activities = computePerfectActivities(a, b);
  const funFacts = [
    `What ${nameA || "Person A"} could secretly admire about ${nameB || "Person B"}: their ${DIM_LABELS[Object.keys(b).sort((x,y)=>(b[y]||0)-(b[x]||0))[0]]}.`,
    `What ${nameB || "Person B"} could teach ${nameA || "Person A"}: how they handle ${DIM_LABELS[Object.keys(b).sort((x,y)=>(b[y]||0)-(b[x]||0))[0]]}.`,
    `What makes this pairing unique: ${base.sharedStrengths.length ? "a real overlap in " + base.sharedStrengths.slice(0,2).join(" and ") : "how differently you each approach the same situations"}.`,
  ];
  return { ...base, categories, explanations, whoComparisons, activities, funFacts };
}

/* -------------------------------------------------------------------------
   COMPARE 2.0
   Everything computeDeepCompatibility doesn't already cover: a fixed
   Overview scorecard (COMPARE_OVERVIEW_METRICS, read straight off the
   categories list computeDeepCompatibility already scored, so the two
   never disagree), a side-by-side "Layer Comparison" pulling from fields
   that already exist per-profile (archetype narrative fields, soul type,
   sin/virtue, thinking/decision profiles, fun stats — nothing here is
   newly authored data, just newly paired up), and a generic per-dimension
   agree/disagree/balance pass that replaces "just a percentage" with an
   actual reason, built from the same normDims two profiles already carry.
------------------------------------------------------------------------- */
function computeCompareOverview(categories){
  const byName = {};
  categories.forEach(c => { byName[c.name] = c.score; });
  return COMPARE_OVERVIEW_METRICS.map(m => ({ label: m.label, score: byName[m.category] || 0 }));
}

// Friction-prone dims: a large gap here is worth calling out as a real
// conflict risk, not just "a difference" — these are the defaults people
// actually clash over day to day, not e.g. a harmless creativity gap.
const CONFLICT_RISK_DIMS = new Set(["patience","trust","risk","planning","independence","emotionalStability","responsibility"]);

function computeAgreementMap(a, b, nameA, nameB){
  const A = nameA || "Person A", B = nameB || "Person B";
  const rows = DIMENSIONS.map(d => {
    const av = a[d] || 0, bv = b[d] || 0;
    return {
      d, av, bv, gap: av - bv,
      bothStrongSame: Math.abs(av) >= 3 && Math.abs(bv) >= 3 && Math.sign(av) === Math.sign(bv) && av !== 0,
      opposite: Math.sign(av) !== Math.sign(bv) && Math.abs(av) >= 2 && Math.abs(bv) >= 2,
    };
  });

  const agree = rows.filter(r => r.bothStrongSame)
    .sort((x, y) => Math.min(Math.abs(y.av), Math.abs(y.bv)) - Math.min(Math.abs(x.av), Math.abs(x.bv)))
    .slice(0, 4)
    .map(r => ({ dim: r.d, label: DIM_LABELS[r.d],
      text: `${A} and ${B} both lean strongly toward ${DIM_LABELS[r.d].toLowerCase()}, so this rarely needs negotiating, it's just how you both already operate.` }));

  const disagree = rows.filter(r => r.opposite && Math.abs(r.gap) >= 5)
    .sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap))
    .slice(0, 4)
    .map(r => {
      const leader = r.av > r.bv ? A : B, other = leader === A ? B : A;
      return { dim: r.d, label: DIM_LABELS[r.d],
        text: `${leader} leans one way on ${DIM_LABELS[r.d].toLowerCase()} while ${other} leans the opposite, a real difference in default setting, worth naming directly rather than assuming it'll just resolve itself.`,
        conflictRisk: CONFLICT_RISK_DIMS.has(r.d) };
    });

  const balance = rows.filter(r => !r.opposite && !r.bothStrongSame && Math.abs(r.gap) >= 5)
    .sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap))
    .slice(0, 4)
    .map(r => {
      const higher = r.av > r.bv ? A : B, lower = higher === A ? B : A;
      return { dim: r.d, label: DIM_LABELS[r.d],
        text: `${higher} carries more ${DIM_LABELS[r.d].toLowerCase()} than ${lower} does, so ${lower} can lean on ${higher} here rather than trying to match it, a complementary strength, not a gap to close.` };
    });

  return { agree, disagree, balance, conflictAreas: disagree.filter(r => r.conflictRisk) };
}

// What each person brings that the other is comparatively lighter on: the
// two dims where they most exceed the other, one-directional (unlike
// computeAgreementMap's balance list, which is symmetric).
function computeWhatEachBrings(a, b, nameA, nameB){
  const bringsFor = (self, other) => DIMENSIONS
    .map(d => ({ d, gap: (self[d]||0) - (other[d]||0) }))
    .sort((x, y) => y.gap - x.gap)
    .slice(0, 2)
    .filter(r => r.gap >= 3)
    .map(r => DIM_LABELS[r.d]);
  return {
    a: { name: nameA || "Person A", traits: bringsFor(a, b) },
    b: { name: nameB || "Person B", traits: bringsFor(b, a) },
  };
}

function topVirtues(sinVirtue){
  return [...sinVirtue].sort((x, y) => y.virtuePct - x.virtuePct).slice(0, 3).map(v => v.virtueLabel);
}
function topTendencies(normDims){
  return DIMENSIONS.map(d => ({ d, v: normDims[d] || 0 }))
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v)).slice(0, 3)
    .map(r => DIM_LABELS[r.d]);
}
const COMPARE_FUN_STAT_KEYS = ["Aura", "Rizz", "Charisma", "Chaos", "Main Character Energy", "Adventure"];

// Emotion-relevant subset of the 25 dims, used by Compare 2.0's "Emotion
// Radar" (a second, narrower overlay chart than the full "Mind Map" one).
const EMOTION_RADAR_DIMS = ["empathy","emotionalStability","optimism","trust","kindness","socialEnergy","humor","resilience","selfAwareness"];

// Deliberately re-derives everything from normDims via the same compute*()
// functions the result page uses, rather than reading precomputed fields
// (.soul, .sinVirtue, .funStats, ...) off profileA/profileB — a pasted
// Compare code only ever decodes to { archetype, normDims, name, version },
// never the full extras bundle a freshly computed result carries, so this
// has to work from normDims alone to be correct on every call site.
function computeCompareLayers(profileA, archA, profileB, archB, nameA, nameB){
  const a = profileA.normDims, b = profileB.normDims;
  const A = nameA || "Person A", B = nameB || "Person B";
  const pair = (av, bv) => ({ a: av, b: bv });
  const soulA = computeSoulType(a), soulB = computeSoulType(b);
  const sinVirtueA = computeSinVirtueProfile(a), sinVirtueB = computeSinVirtueProfile(b);
  const funStatsA = computeFunStats(a), funStatsB = computeFunStats(b);
  const relA = computeRelationshipProfile(a), relB = computeRelationshipProfile(b);
  const decA = computeDecisionProfile(a), decB = computeDecisionProfile(b);
  const thinkA = computeThinkingProfile(a), thinkB = computeThinkingProfile(b);
  return {
    archetype: pair({ name: archA.name, icon: archA.icon }, { name: archB.name, icon: archB.icon }),
    soul: pair(soulA, soulB),
    topVirtues: pair(topVirtues(sinVirtueA), topVirtues(sinVirtueB)),
    topTendencies: pair(topTendencies(a), topTendencies(b)),
    funStats: COMPARE_FUN_STAT_KEYS.map(k => ({ label: k, a: funStatsA[k], b: funStatsB[k] })),
    strengths: pair(archA.strengths, archB.strengths),
    weaknesses: pair(archA.weaknesses, archB.weaknesses),
    stressResponse: pair(archA.stressResponse, archB.stressResponse),
    leadershipStyle: pair(archA.leadershipStyle, archB.leadershipStyle),
    learningStyle: pair(archA.learningStyle, archB.learningStyle),
    workStyle: pair(archA.workStyle, archB.workStyle),
    communicationStyle: pair(archA.communicationStyle, archB.communicationStyle),
    growthAdvice: pair(archA.growthAdvice, archB.growthAdvice),
    relationshipStyle: pair(relA.relationshipDynamic, relB.relationshipDynamic),
    decisionStyle: pair(decA[0].name, decB[0].name),
    thinkingStyle: pair(thinkA[0].name, thinkB[0].name),
    agreement: computeAgreementMap(a, b, A, B),
    brings: computeWhatEachBrings(a, b, A, B),
  };
}

/* =========================================================================
   V4 ADDITIONS
   Consistency check, framework approximations, duo titles, PF1 upgrade
   path, and the remaining fantasy/fun profile extras.
   ========================================================================= */

/* ---- Consistency check ---------------------------------------------------
   Only counts pairs where both questions actually got asked in this run,
   since the adaptive engine won't hit every pair every time. Two answers
   "agree" if they moved their shared dimension in the same direction.
   Falls back to a neutral baseline when too few pairs were asked to say
   anything meaningful. */
function computeConsistency(session){
  const answeredById = {};
  session.answers.forEach(a => { if (a) answeredById[a.questionId] = a; });
  let agree = 0, total = 0;
  CONSISTENCY_PAIRS.forEach(pair => {
    const a = answeredById[pair.a], b = answeredById[pair.b];
    if (!a || !b) return;
    const av = a.d[pair.dim] || 0, bv = b.d[pair.dim] || 0;
    if (av === 0 || bv === 0) return;
    total++;
    if ((av > 0) === (bv > 0)) agree++;
  });
  if (total < 2){
    return { pct: 88, pairsChecked: total, note: "Not enough overlapping situations were asked this run to measure it precisely, this is a typical baseline." };
  }
  const pct = Math.round((agree / total) * 100);
  return { pct, pairsChecked: total, note: `Based on ${total} pair${total === 1 ? "" : "s"} of separate situations that touch similar ground.` };
}

/* ---- Framework approximations (secondary to the PersonaForge archetype) - */
function computeBigFive(normDims){
  return BIG_FIVE_CATEGORIES.map(c => {
    const vals = c.dims.map(d => c.invert ? (100 - getDimensionPercent(normDims,d)) : getDimensionPercent(normDims,d));
    return { name: c.name, pct: Math.round(vals.reduce((s,v)=>s+v,0) / vals.length) };
  });
}
function computeDISC(normDims){
  const raw = DISC_CATEGORIES.map(c => ({
    name: c.name,
    val: c.dims.reduce((s,d) => s + getDimensionPercent(normDims,d), 0) / c.dims.length,
  }));
  const total = raw.reduce((s,r)=>s+r.val,0) || 1;
  return raw.map(r => ({ name: r.name, pct: Math.round((r.val/total)*100) })).sort((a,b)=>b.pct-a.pct);
}
function computeEnneagram(normDims){
  return scoreBySignature(ENNEAGRAM_TYPES, normDims)[0].item;
}
function computeMBTI(normDims){
  let type = "";
  MBTI_AXES.forEach(axis => {
    const posSum = axis.posDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const negSum = axis.negDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const positive = (posSum - negSum) >= 0;
    type += positive ? axis.letters[0] : axis.letters[1];
  });
  return type;
}

/* =========================================================================
   FRAMEWORKS DEEP DIVE (frameworks.html)
   The compact framework card on the result page already shows the MBTI
   type, Enneagram type, and DISC/Big Five bars — this expands the exact
   same computed numbers (nothing here is a second scoring system) into a
   full per-letter/per-trait breakdown with real strength percentages and
   plain-language explanations, for the "read the whole thing" crowd.
   Every one of these frameworks is explicitly a Forge-generated
   projection, not a licensed or certified instrument (see legal.html's
   disclaimer) — the explanations below keep that framing rather than
   presenting it as clinical fact.
   ========================================================================= */
const MBTI_LETTER_MEANINGS = {
  E: "Energized by people and external activity, thinks out loud, recharges by being around others.",
  I: "Energized by solitude and internal reflection, thinks things through before speaking, recharges alone.",
  N: "Drawn to patterns, possibilities, and the abstract over the immediate and concrete.",
  S: "Grounded in the concrete and the present, trusts direct experience over speculation.",
  F: "Decides by weighing people and values, asks who a decision actually affects.",
  T: "Decides by weighing logic and consistency, asks whether a decision actually holds up.",
  P: "Keeps options open, comfortable improvising, prefers flexibility to a fixed plan.",
  J: "Prefers a decided plan, comfortable committing early, prefers structure to open-endedness.",
};
function computeMBTIBreakdown(normDims){
  return MBTI_AXES.map(axis => {
    const posSum = axis.posDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const negSum = axis.negDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const maxPossible = (axis.posDims.length + axis.negDims.length) * 10 || 10;
    const diff = posSum - negSum;
    const strengthPct = Math.max(0, Math.min(100, Math.round(((diff + maxPossible) / (2 * maxPossible)) * 100)));
    const letter = diff >= 0 ? axis.letters[0] : axis.letters[1];
    return { letter, otherLetter: diff >= 0 ? axis.letters[1] : axis.letters[0], strengthPct: diff >= 0 ? strengthPct : 100 - strengthPct, meaning: MBTI_LETTER_MEANINGS[letter] };
  });
}

const BIG_FIVE_EXPLANATIONS = {
  Openness: { high: "Curious and drawn to new ideas, art, and unfamiliar experience over the tried-and-true.", low: "Prefers the familiar and proven over novelty for its own sake." },
  Conscientiousness: { high: "Organized, follows through, comfortable with structure and long-term commitments.", low: "Improvises well, resists over-planning, comfortable leaving things loosely structured." },
  Extraversion: { high: "Draws energy from people and activity, comfortable being the center of a room.", low: "Draws energy from quiet and solitude, prefers smaller, calmer settings." },
  Agreeableness: { high: "Cooperative and trusting by default, prioritizes harmony and other people's comfort.", low: "Direct and skeptical by default, prioritizes honesty over smoothing things over." },
  Neuroticism: { high: "Feels emotional shifts vividly and quickly, more reactive to stress in the moment.", low: "Emotionally steady under pressure, slower to react, harder to rattle." },
};
function computeBigFiveBreakdown(normDims){
  return computeBigFive(normDims).map(t => ({
    ...t,
    explanation: t.pct >= 55 ? BIG_FIVE_EXPLANATIONS[t.name].high : t.pct <= 45 ? BIG_FIVE_EXPLANATIONS[t.name].low : "Sits close to the middle here, genuinely situational rather than a strong lean either way.",
  }));
}

const DISC_EXPLANATIONS = {
  "D, Dominance": "Direct, results-focused, comfortable taking charge and pushing for a decision.",
  "I, Influence": "Persuasive and social, moves people through enthusiasm and connection rather than authority.",
  "S, Steadiness": "Steady and cooperative, prefers consistency and dislikes sudden, forced change.",
  "C, Conscientiousness": "Careful and precise, prioritizes accuracy and doing it right over doing it fast.",
};
function computeDISCBreakdown(normDims){
  const ranked = computeDISC(normDims);
  return ranked.map((d, i) => ({ ...d, explanation: DISC_EXPLANATIONS[d.name], isPrimary: i === 0 }));
}

const ENNEAGRAM_EXPLANATIONS = {
  "Type 1, The Reformer": "Principled and improvement-driven, holds itself (and often others) to a real standard.",
  "Type 2, The Helper": "Relationship-focused and generous, finds meaning in being genuinely needed.",
  "Type 3, The Achiever": "Driven by visible success and momentum, uncomfortable standing still.",
  "Type 4, The Individualist": "Identity-driven and introspective, wants to feel genuinely distinct, not interchangeable.",
  "Type 5, The Investigator": "Knowledge-driven and self-contained, needs to actually understand something before engaging.",
  "Type 6, The Loyalist": "Security-driven and loyal, plans for what could go wrong before it happens.",
  "Type 7, The Enthusiast": "Possibility-driven and upbeat, allergic to boredom and closed doors.",
  "Type 8, The Challenger": "Control-driven and assertive, uncomfortable being vulnerable or pushed around.",
  "Type 9, The Peacemaker": "Harmony-driven and easygoing, avoids conflict and forced confrontation when it can.",
};
function computeEnneagramBreakdown(normDims){
  const ranked = scoreBySignature(ENNEAGRAM_TYPES, normDims);
  return {
    core: ranked[0].item, coreExplanation: ENNEAGRAM_EXPLANATIONS[ranked[0].item.name],
    wing: ranked[1].item, wingExplanation: ENNEAGRAM_EXPLANATIONS[ranked[1].item.name],
  };
}

function computeFrameworksDeepDive(normDims){
  return {
    mbti: { type: computeMBTI(normDims), axes: computeMBTIBreakdown(normDims) },
    bigFive: computeBigFiveBreakdown(normDims),
    disc: computeDISCBreakdown(normDims),
    enneagram: computeEnneagramBreakdown(normDims),
  };
}
/* -------------------------------------------------------------------------
   ALGORITHM: Human Values
   Scores every value in HUMAN_VALUES the same way archetype matching
   scores a signature: weighted sum over the relevant dimensions,
   normalized against the maximum that signature could possibly reach
   (so a value with a heavier signature isn't unfairly favored), returns
   the top 5. Each result carries which measured dimensions it came from
   and their actual values, so the explanation can point at real
   evidence instead of a generic sentence. */
function computeHumanValues(normDims){
  const scored = HUMAN_VALUES.map(v => {
    const raw = v.signature.reduce((s,x) => s + getDimensionScore(normDims, x.dim) * x.w, 0);
    const maxPossible = v.signature.reduce((s,x) => s + 10 * x.w, 0);
    const pct = Math.max(0, Math.min(100, Math.round(((raw + maxPossible) / (2 * maxPossible)) * 100)));
    const topDim = [...v.signature].sort((a,b) => Math.abs(getDimensionScore(normDims,b.dim)) - Math.abs(getDimensionScore(normDims,a.dim)))[0];
    return { value: v, pct, topDim: topDim.dim, topDimPct: getDimensionPercent(normDims, topDim.dim) };
  });
  scored.sort((a,b) => b.pct - a.pct);
  return scored.slice(0, 5).map(s => ({
    id: s.value.id, name: s.value.name, icon: s.value.icon, pct: s.pct,
    explanation: `${s.pct}% reflects ${s.value.why}, most visibly in your ${DIM_LABELS[s.topDim]} (${s.topDimPct}%).`,
    inferredFrom: s.value.signature.map(x => DIM_LABELS[x.dim]),
  }));
}

/* -------------------------------------------------------------------------
   ALGORITHM: Seven Sins / Heavenly Virtues (fun, non-serious)
   Each of the 7 axes is one measured dimension read two directions.
   Nothing is recomputed between modes, the same normDims values just get
   read as either the sin-side or virtue-side percentage depending on
   sinIsHigh, so "only the interpretation changes" holds literally, not
   just in spirit. */
function computeSinVirtueProfile(normDims){
  return SIN_VIRTUE_AXES.map(axis => {
    const raw = getDimensionPercent(normDims, axis.dim);
    const sinPct = axis.sinIsHigh ? raw : 100 - raw;
    const virtuePct = 100 - sinPct;
    return { dim: axis.dim, sinLabel: axis.sinLabel, virtueLabel: axis.virtueLabel, sinPct, virtuePct };
  });
}

function computeFrameworkApproximations(normDims){
  return {
    bigFive: computeBigFive(normDims),
    disc: computeDISC(normDims),
    enneagram: computeEnneagram(normDims),
    mbti: computeMBTI(normDims),
  };
}

/* ---- Duo title and crest for the compare page ----------------------------- */
function computeDuoTitle(archA, archB){
  const extrasA = getArchetypeExtras(archA), extrasB = getArchetypeExtras(archB);
  const key1 = `${extrasA.element}|${extrasB.element}`;
  const key2 = `${extrasB.element}|${extrasA.element}`;
  const title = DUO_TITLES[key1] || DUO_TITLES[key2] || `${archA.name.replace("The ","")} & ${archB.name.replace("The ","")}`;
  return { title, colorA: extrasA.primaryColor, colorB: extrasB.primaryColor, iconA: archA.icon, iconB: archB.icon };
}

/* ---- Fantasy and fun profile extras ---------------------------------------- */
function computeFantasyWeapon(normDims){ return scoreBySignature(FANTASY_WEAPONS, normDims)[0].item; }
function computeFantasyCompanion(normDims){ return scoreBySignature(FANTASY_COMPANIONS, normDims)[0].item; }
function computeFantasyKingdom(normDims){ return scoreBySignature(FANTASY_KINGDOMS, normDims)[0].item; }
function computeFlower(normDims){ return scoreBySignature(FLOWERS, normDims)[0].item; }
function computePlanet(normDims){ return scoreBySignature(PLANETS, normDims)[0].item; }
function computeConstellation(normDims){ return scoreBySignature(CONSTELLATIONS, normDims)[0].item; }
function computeGemstone(normDims){ return scoreBySignature(GEMSTONES, normDims)[0].item; }
function computeWeather(normDims){ return scoreBySignature(WEATHER_TYPES, normDims)[0].item; }
function computeCoffeeOrder(normDims){ return scoreBySignature(COFFEE_ORDERS, normDims)[0].item; }

/* -------------------------------------------------------------------------
   PF1 -> PF2 upgrade path
   Instead of leaving the 5 v2 dimensions permanently at a neutral 0 for
   someone with an old code, this picks real questions from the current
   200-question bank, ranked by how strongly they touch those 5
   dimensions, so answering a handful of them fills the gap with real
   signal instead of a default. No new authoring needed, it's drawn from
   content that already exists.
------------------------------------------------------------------------- */
const V1_UPGRADE_DIMENSIONS = ["emotionalStability","competitiveness","responsibility","persistence","openMindedness"];
const UPGRADE_QUESTION_COUNT = 9;

function buildUpgradeQuestions(){
  const scored = QUESTIONS.map(q => {
    let score = 0;
    const touched = new Set();
    q.options.forEach(opt => V1_UPGRADE_DIMENSIONS.forEach(d => {
      if (opt.d[d]){ score += Math.abs(opt.d[d]); touched.add(d); }
    }));
    return { q, score, touchedCount: touched.size };
  }).filter(x => x.score > 0)
    .sort((a,b) => (b.touchedCount - a.touchedCount) || (b.score - a.score));
  return scored.slice(0, UPGRADE_QUESTION_COUNT).map(x => x.q);
}

class UpgradeQuizSession {
  constructor(decodedProfile){
    this.baseNormDims = { ...decodedProfile.normDims };
    this.archetype = decodedProfile.archetype;
    this.name = decodedProfile.name;
    this.questions = buildUpgradeQuestions();
    this.answers = [];
    this.cursor = 0;
    this.delta = {};
    V1_UPGRADE_DIMENSIONS.forEach(d => this.delta[d] = 0);
  }
  totalLength(){ return this.questions.length; }
  current(){ return this.cursor < this.questions.length ? this.questions[this.cursor] : null; }
  isComplete(){ return this.cursor >= this.questions.length; }
  answer(optionIndex){
    const q = this.current();
    if (!q) return;
    const opt = q.options[optionIndex];
    Object.entries(opt.d).forEach(([dim, val]) => {
      if (V1_UPGRADE_DIMENSIONS.includes(dim)) this.delta[dim] = (this.delta[dim] || 0) + val;
    });
    this.answers.push({ questionId: q.id, optionIndex });
    this.cursor++;
  }
  finalNormDims(){
    const out = { ...this.baseNormDims };
    V1_UPGRADE_DIMENSIONS.forEach(d => {
      out[d] = Math.max(-10, Math.min(10, Math.round(this.delta[d] || 0)));
    });
    return out;
  }
}




/* ---------------- QUIZ PROGRESS PERSISTENCE ------------------------------
   Going home mid-quiz (or just closing the tab) never throws answers away.
   Progress is saved to localStorage and picked back up on the exact next
   unanswered question, not restarted from scratch. */
const QUIZ_PROGRESS_KEY = "pf_quiz_progress";
function saveQuizProgress(){
  if (!session || session.cursor <= 0 || session.isComplete()) return;
  try{ localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(session.serialize())); }
  catch(e){ /* storage unavailable, skip silently */ }
}
function getSavedQuizProgress(){
  try{
    const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function clearQuizProgress(){
  try{ localStorage.removeItem(QUIZ_PROGRESS_KEY); } catch(e){ /* ignore */ }
}

/* ---------------- ONBOARDING PROGRESS PERSISTENCE ------------------------
   Mirrors QUIZ_PROGRESS_KEY above: a refresh mid-onboarding (name / about
   you / your experience) should never reset the wizard back to step 1.
   Cleared the moment the actual quiz starts (startQuiz() -> clearQuizProgress
   already runs alongside it) since at that point the real quiz-progress
   key takes over as the thing worth resuming. */
const ONBOARDING_PROGRESS_KEY = "pf_onboarding_progress";
function saveOnboardingProgress(step, name, meta){
  try{ localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({ step, name: name || "", meta: meta || {}, savedAt: Date.now() })); }
  catch(e){ /* storage unavailable, skip silently */ }
}
function getSavedOnboardingProgress(){
  try{
    const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function clearOnboardingProgress(){
  try{ localStorage.removeItem(ONBOARDING_PROGRESS_KEY); } catch(e){ /* ignore */ }
}

/* ---------------- shareable profile links --------------------------------
   The QR already encodes a URL with ?code=..., but until now nothing on
   load ever read that parameter back out, so scanning it just opened a
   blank landing page. This closes that loop: on boot, and whenever a
   result is shown, the address bar carries the code, so the QR, a copied
   link, and the browser's own URL bar are all the same shareable thing.
   Query-param format (?code=...) is the primary, fully-supported form
   since it works on any static host with zero extra setup. A trailing
   path segment that looks like a code (e.g. /PersonaForge/Yota-PF2-...)
   is also read as a best-effort fallback, but actually serving that path
   on GitHub Pages needs a 404->index.html redirect set up in the repo;
   without it, only the ?code= form will reach the app at all. */
function getProfileCodeFromURL(){
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("code");
  if (fromQuery) return decodeURIComponent(fromQuery);
  const segments = location.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "";
  if (/-PF[12]-/.test(last)) return decodeURIComponent(last);
  return null;
}

function setShareableURL(code){
  if (!code || !window.history || !history.pushState) return;
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("code", code);
  history.pushState({ code }, "", url.toString());
}

function clearShareableURL(){
  if (!window.history || !history.pushState) return;
  const url = new URL(location.href);
  url.search = "";
  history.pushState({}, "", url.toString());
}

let pendingSharedCode = null;
let pendingSharedProfile = null;

function tryLoadProfileFromURL(){
  const code = getProfileCodeFromURL();
  if (!code) return false;
  const decoded = decodeCode(code);
  if (!decoded) return false;
  pendingSharedCode = code;
  pendingSharedProfile = decoded;
  renderSharedLinkInterstitial();
  return true;
}

/* =========================================================================
   FORGE - RESULT BUILDING
   Used both for a freshly completed quiz and for viewing a shared/saved
   code: builds the full profile-extras bundle and the final result
   object, plus the small local history log.
   ========================================================================= */
function buildProfileExtras(normDims, archetype, ranked, session, upgradedFromV1){
  return {
    mix: computePersonalityMix(ranked),
    soul: computeSoulType(normDims),
    humanValues: computeHumanValues(normDims),
    lifeBalance: computeLifeBalance(normDims),
    motivationFacets: computeMotivationFacets(normDims),
    sinVirtue: computeSinVirtueProfile(normDims),
    narrativeRole: computeNarrativeRole(normDims),
    social: computeSocialProfile(normDims),
    relationship: computeRelationshipProfile(normDims),
    thinking: computeThinkingProfile(normDims),
    learning: computeLearningProfile(normDims),
    decision: computeDecisionProfile(normDims),
    stress: computeStressResponses(normDims),
    environments: computeEnvironments(normDims),
    achievements: computeAchievements(normDims),
    aesthetic: computeAesthetic(normDims),
    entertainment: computeEntertainment(normDims),
    extras: getArchetypeExtras(archetype),
    funStats: computeFunStats(normDims),
    confidence: computeAssessmentConfidence(ranked, normDims, session, upgradedFromV1),
    hidden: computeHiddenTraits(normDims, archetype),
    fantasyRole: computeFantasyRole(normDims),
    friendship: computeFriendshipProfile(normDims),
    motivation: computeMotivation(normDims),
    mythicalCreature: computeMythicalCreature(normDims),
    season: computeSeason(normDims),
    timeOfDay: computeTimeOfDay(normDims),
    chessPiece: computeChessPiece(normDims),
    frameworks: computeFrameworkApproximations(normDims),
    fantasyWeapon: computeFantasyWeapon(normDims),
    fantasyCompanion: computeFantasyCompanion(normDims),
    fantasyKingdom: computeFantasyKingdom(normDims),
    flower: computeFlower(normDims),
    planet: computePlanet(normDims),
    constellation: computeConstellation(normDims),
    gemstone: computeGemstone(normDims),
    weather: computeWeather(normDims),
    coffeeOrder: computeCoffeeOrder(normDims),
  };
}

/* Takes the session explicitly (rather than reading a global) since this
   runs on quiz.html, where the quiz session lives, and its result then
   travels to result.html for display. */
function computeResult(session){
  const normDims = session.normalizedDims();
  const match = matchArchetype(normDims);
  const code = encodeCode(match.primary.id, normDims, session.name);
  const result = {
    name: session.name || "",
    meta: session.meta || {},
    normDims,
    archetype: match.primary,
    runnerUp: match.runnerUp,
    ranked: match.ranked,
    subProfile: computeSubProfile(normDims, match.primary),
    code,
    careers: computeCareers(normDims),
    relationships: computeRelationshipStyles(normDims),
    traits: computeMeasuredTraits(normDims),
    consistency: computeConsistency(session),
    upgradedFromV1: false,
    ...buildProfileExtras(normDims, match.primary, match.ranked, session, false),
  };
  localStorage.setItem("pf_last_code", code);
  saveToTimeline(result);
  ensureLocalProfile(result);
  clearQuizProgress();
  return result;
}

/* ---------------- LOCAL PROFILE ------------------------------------------
   The "identity hub" behind the Profile page (see profile.html/js). Not an
   account: nothing here ever leaves the device, there's no login, and it's
   provisioned automatically the moment a first result exists — completing
   the assessment IS creating a local profile, no separate signup step.
   A retake just updates it in place with the newest read; name/avatar are
   the only fields a person edits directly, from the Profile page. */
const PF_PROFILE_KEY = "pf_local_profile";
function getLocalProfile(){
  try{ return JSON.parse(localStorage.getItem(PF_PROFILE_KEY) || "null"); }
  catch(e){ return null; }
}
function saveLocalProfile(p){
  try{ localStorage.setItem(PF_PROFILE_KEY, JSON.stringify(p)); } catch(e){ /* storage unavailable, skip silently */ }
}
function ensureLocalProfile(result){
  try{
    const existing = getLocalProfile();
    const p = existing || { createdAt: Date.now(), avatar: null, name: "" };
    // Only overwrite the name from a fresh result if the person hasn't
    // already set a custom one on the Profile page — a retake taken
    // anonymously ("Skip for now") shouldn't blank out a name they typed
    // in afterward.
    if (result.name && !p.nameIsCustom) p.name = result.name;
    p.code = result.code;
    p.archetypeId = result.archetype.id;
    p.archetypeName = result.archetype.name;
    p.archetypeIcon = result.archetype.icon;
    p.soul = result.soul.name;
    p.soulHex = result.soul.hex;
    p.confidencePct = result.confidence ? result.confidence.confidencePct : null;
    p.updatedAt = Date.now();
    saveLocalProfile(p);
    return p;
  } catch(e){ return null; }
}
function updateLocalProfile(fields){
  const p = getLocalProfile() || { createdAt: Date.now(), avatar: null, name: "" };
  Object.assign(p, fields, { updatedAt: Date.now() });
  saveLocalProfile(p);
  return p;
}
/* ---------------- RECOMMENDATION ENGINE (Improve page) --------------------
   Six broad "tendency tags" that curated content (books/films/music/
   habits/social actions/reflection prompts) is authored against, each
   scored against normDims with the exact same weighted-signature pattern
   ARCHETYPES/SOUL_TYPES already use (scoreBySignature) — so which tag(s)
   a person gets is a real read of their actual profile, not a random
   pick. The top two tags blend together (more weight from the primary),
   so the result feels specific without being a rigid 1-of-6 bucket. */
const RECOMMENDATION_TAGS = [
  {
    id: "calm-reflective", label: "Calm & Reflective",
    signature: [{dim:"patience",w:2},{dim:"selfAwareness",w:2},{dim:"emotionalStability",w:1},{dim:"risk",w:-1},{dim:"socialEnergy",w:-1}],
    content: {
      books: ["Man's Search for Meaning — Viktor Frankl", "The Untethered Soul — Michael Singer", "Quiet — Susan Cain"],
      films: ["Lost in Translation", "Paterson", "My Neighbor Totoro"],
      music: ["Nils Frahm", "Bon Iver", "a slow instrumental playlist"],
      podcasts: ["On Being with Krista Tippett", "The Slow Home Podcast"],
      habits: ["A 10-minute unplugged walk before checking your phone", "One page of journaling before bed", "A single-tasking hour, notifications off"],
      socialActions: ["Text one person you've been meaning to check on, just to check on them", "Suggest a quiet one-on-one instead of a group hangout this week"],
      reflectionPrompts: ["What's one thing that felt like \"too much\" this week, and why?", "When did you last feel fully at ease, and what made that possible?"],
    },
  },
  {
    id: "high-energy-ambitious", label: "High-Energy & Ambitious",
    signature: [{dim:"drive",w:2},{dim:"competitiveness",w:2},{dim:"confidence",w:1},{dim:"risk",w:1}],
    content: {
      books: ["Can't Hurt Me — David Goggins", "The Obstacle Is the Way — Ryan Holiday", "Atomic Habits — James Clear"],
      films: ["Whiplash", "Rocky", "The Social Network"],
      music: ["a high-tempo workout playlist", "Kendrick Lamar", "The Prodigy"],
      podcasts: ["The Diary of a CEO", "Rich Roll"],
      habits: ["Pick one goal and give it a hard deadline this week", "A short, intense workout instead of a long easy one", "Timebox your biggest task to the first hour of your day"],
      socialActions: ["Challenge a friend to something with a real stake", "Ask someone you respect for one piece of direct feedback"],
      reflectionPrompts: ["What's the thing you're avoiding because it's actually hard, not because it's pointless?", "Where is your speed helping you, and where is it costing you?"],
    },
  },
  {
    id: "compassionate-connector", label: "Compassionate & Connected",
    signature: [{dim:"empathy",w:2},{dim:"kindness",w:2},{dim:"socialEnergy",w:1}],
    content: {
      books: ["The Four Agreements — Don Miguel Ruiz", "Braiding Sweetgrass — Robin Wall Kimmerer", "Tuesdays with Morrie — Mitch Albom"],
      films: ["Paddington 2", "Coco", "Won't You Be My Neighbor?"],
      music: ["a warm acoustic/folk playlist", "Sufjan Stevens", "a community choir recording"],
      podcasts: ["We Can Do Hard Things", "Ten Percent Happier"],
      habits: ["Cook for someone else this week, not just yourself", "Write one honest thank-you message and actually send it", "Volunteer an hour somewhere local"],
      socialActions: ["Organize a small gathering, even a low-key one", "Reach out to someone who's been quiet lately"],
      reflectionPrompts: ["Who made your week better, and have they heard that from you?", "Where are you giving more than you're receiving, and is that sustainable?"],
    },
  },
  {
    id: "visionary-creative", label: "Visionary & Creative",
    signature: [{dim:"creativity",w:2},{dim:"openMindedness",w:2},{dim:"curiosity",w:1}],
    content: {
      books: ["The War of Art — Steven Pressfield", "Sapiens — Yuval Noah Harari", "Steal Like an Artist — Austin Kleon"],
      films: ["Everything Everywhere All at Once", "Spirited Away", "Arrival"],
      music: ["Tame Impala", "an ambient/experimental electronic playlist", "a film-score playlist"],
      podcasts: ["99% Invisible", "Song Exploder"],
      habits: ["Sketch, write, or build something with zero goal of finishing it", "Change one part of your routine just to see what happens", "Spend 20 minutes somewhere you've never been in your own city"],
      socialActions: ["Share an unfinished idea with someone instead of waiting until it's polished", "Ask someone wildly different from you what they're excited about right now"],
      reflectionPrompts: ["What idea have you been sitting on because it feels \"too weird\"?", "If nobody would judge the outcome, what would you actually try?"],
    },
  },
  {
    id: "structured-builder", label: "Structured & Steady",
    signature: [{dim:"discipline",w:2},{dim:"planning",w:2},{dim:"responsibility",w:1}],
    content: {
      books: ["Deep Work — Cal Newport", "The Compound Effect — Darren Hardy", "Getting Things Done — David Allen"],
      films: ["The Martian", "Apollo 13", "Ford v Ferrari"],
      music: ["a focus/instrumental playlist", "steady, low-lyric background music"],
      podcasts: ["The Tim Ferriss Show", "Cortex"],
      habits: ["Batch your small tasks into one block instead of scattering them", "Set up one system this week that removes a decision you keep re-making", "A short end-of-day review of what actually got done"],
      socialActions: ["Offer to organize something for a group that keeps almost-happening", "Share a system or template that's helped you with someone who's struggling"],
      reflectionPrompts: ["What keeps falling through the cracks, and is it a discipline problem or a system problem?", "Where would one small process actually save you real time?"],
    },
  },
  {
    id: "curious-explorer", label: "Curious & Exploring",
    signature: [{dim:"curiosity",w:2},{dim:"adaptability",w:2},{dim:"independence",w:1}],
    content: {
      books: ["Born to Run — Christopher McDougall", "The Alchemist — Paulo Coelho", "In Patagonia — Bruce Chatwin"],
      films: ["Into the Wild", "The Secret Life of Walter Mitty", "180° South"],
      music: ["a global/world-music playlist", "travel-podcast-style storytelling audio"],
      podcasts: ["No Such Thing as Fish", "Radiolab"],
      habits: ["Take a genuinely new route somewhere this week", "Try one food, place, or activity you've never tried", "Ask a stranger (safely, publicly) one real question"],
      socialActions: ["Invite someone to try something neither of you has done before", "Ask a friend from a different background how they see a situation you're in"],
      reflectionPrompts: ["What's a question you're curious about but haven't looked into yet?", "When did \"not knowing what would happen\" work out better than planning would have?"],
    },
  },
];
/* ---------------- SUGGESTION FEEDBACK ("completed"/"skipped") -----------
   A single lightweight per-visit signal per tag ("tried something today"
   vs "not for me today") rather than tracking every individual bullet —
   simpler to store, simpler to show, and still a real local-behavior
   input into which tag gets picked next time (see the affinity bonus in
   computeRecommendationProfile() below). */
const SUGGESTION_FEEDBACK_KEY = "pf_suggestion_feedback";
function getSuggestionFeedback(){
  try{ return JSON.parse(localStorage.getItem(SUGGESTION_FEEDBACK_KEY) || "[]"); } catch(e){ return []; }
}
function recordSuggestionFeedback(tagId, status){
  const log = getSuggestionFeedback();
  log.push({ tagId, status, timestamp: Date.now() });
  try{ localStorage.setItem(SUGGESTION_FEEDBACK_KEY, JSON.stringify(log.slice(-100))); } catch(e){ /* ignore */ }
}
// A gentle nudge, not a rewrite: +3 per "tried" and -1 per "skipped",
// capped so a long history can shift which of two close tags wins but
// can never override what the actual personality signature says.
function tagAffinityBonus(tagId){
  const log = getSuggestionFeedback();
  const bonus = log.reduce((s, e) => s + (e.tagId === tagId ? (e.status === "tried" ? 3 : -1) : 0), 0);
  return Math.max(-10, Math.min(10, bonus));
}

// high-energy-ambitious sums to a signature weight of 6 while every other
// tag sums to 5 (by |w|, since a negative-weight dim's max contribution is
// the same magnitude as a positive one), giving it a permanently higher
// ceiling in a raw comparison — the same issue fixed for archetypes/souls
// above, via the same fix: scale by maxWeight/itsOwnWeight first.
const RECOMMENDATION_TAG_MAX_WEIGHT = signatureMaxWeight(RECOMMENDATION_TAGS.map(t => ({
  signature: t.signature.map(s => ({ dim: s.dim, w: Math.abs(s.w) })),
})));
const RECOMMENDATION_UNUSED_DIMS = DIMENSIONS.filter(d =>
  !RECOMMENDATION_TAGS.some(t => t.signature.some(s => s.dim === d))
);
function computeRecommendationProfile(normDims){
  const ranked = RECOMMENDATION_TAGS.map(item => {
    const totalWeight = item.signature.reduce((sum, s) => sum + Math.abs(s.w), 0);
    const raw = item.signature.reduce((sum, s) => sum + (normDims[s.dim] || 0) * s.w, 0);
    const score = raw * (RECOMMENDATION_TAG_MAX_WEIGHT / totalWeight);
    return { item, score };
  })
    .map(r => ({ ...r, score: r.score + tagAffinityBonus(r.item.id) }))
    .sort((a,b) => b.score - a.score);
  const primary = ranked[0].item, secondary = ranked[1].item;
  // Two people can land on the identical primary+secondary tag pair while
  // still being different people underneath — right now that meant byte-
  // identical suggestions for both, since blend() always sliced from the
  // start of each tag's fixed lists. RECOMMENDATION_UNUSED_DIMS are the
  // dims no tag signature reads (so they never affected which tag won),
  // used here as a real, if secondary, personality signal to rotate which
  // items from that same pool come up first, instead of the same books
  // and films every time two people share a tag pair.
  const seed = RECOMMENDATION_UNUSED_DIMS.reduce((s, d) => s + (normDims[d] || 0), 0);
  const rotate = (arr, offset, count) => {
    if (!arr.length) return [];
    const n = ((offset % arr.length) + arr.length) % arr.length;
    return Array.from({ length: Math.min(count, arr.length) }, (_, i) => arr[(n + i) % arr.length]);
  };
  const blend = (key, primaryCount, secondaryCount) => [
    ...rotate(primary.content[key], seed, primaryCount),
    ...rotate(secondary.content[key], seed + 1, secondaryCount),
  ];
  return {
    primary, secondary,
    books: blend("books", 2, 1),
    films: blend("films", 2, 1),
    music: blend("music", 2, 1),
    podcasts: blend("podcasts", 1, 1),
    habits: blend("habits", 2, 1),
    socialActions: blend("socialActions", 1, 1),
    reflectionPrompts: blend("reflectionPrompts", 1, 1),
  };
}

/* Check-in cadence: after CHECK_IN_DAYS since the last check-in (or since
   the profile's own last result if none yet), the Improve page offers a
   lightweight "how did that go?" retake prompt instead of showing it every
   single visit. */
const CHECK_IN_DAYS = 4;
function getImproveCheckInState(){
  let state;
  try{ state = JSON.parse(localStorage.getItem("pf_improve_checkin") || "null"); } catch(e){ state = null; }
  const profile = getLocalProfile();
  const since = (state && state.lastSeenAt) || (profile && profile.updatedAt) || Date.now();
  const daysSince = (Date.now() - since) / (1000 * 60 * 60 * 24);
  return { daysSince, dueForCheckIn: daysSince >= CHECK_IN_DAYS };
}
function markImproveCheckInSeen(){
  try{ localStorage.setItem("pf_improve_checkin", JSON.stringify({ lastSeenAt: Date.now() })); } catch(e){ /* ignore */ }
}

/* ---------------- IMPORT SANITIZATION --------------------------------
   A .pf file is untrusted input the moment it isn't one Forge itself
   just exported — someone can hand-edit one, or share a crafted one.
   Several fields from it (ids, hex colors, an avatar data URL) end up
   interpolated straight into rendered HTML/attributes elsewhere
   (journal/group ids in an inline onclick, soulHex in a style attribute,
   avatarImage in an <img src>), so importProfile() validates each one
   against a strict allowlist pattern before it's ever written to
   localStorage, rather than trusting it because it merely parsed as
   JSON. Anything that fails validation is dropped, not fixed up. */
function isSafeId(id){ return typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id); }
function isSafeHexColor(hex){ return typeof hex === "string" && /^#[0-9a-fA-F]{3,8}$/.test(hex); }
function isSafeAvatarDataUrl(url){ return typeof url === "string" && url.length <= 300000 && /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+=*$/.test(url); }
function sanitizeImportedJournal(entries){
  if (!Array.isArray(entries)) return [];
  return entries.filter(e => e && isSafeId(e.id) && typeof e.timestamp === "number").map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    mood: Math.max(1, Math.min(5, Number(e.mood) || 3)),
    text: typeof e.text === "string" ? e.text.slice(0, 600) : "",
    prompt: typeof e.prompt === "string" ? e.prompt.slice(0, 300) : null,
  }));
}
const VALID_RECOMMENDATION_TAG_IDS = new Set(["calm-reflective","high-energy-ambitious","compassionate-connector","visionary-creative","structured-builder","curious-explorer"]);
function sanitizeImportedSuggestionFeedback(log){
  if (!Array.isArray(log)) return [];
  return log.filter(e => e && VALID_RECOMMENDATION_TAG_IDS.has(e.tagId) && (e.status === "tried" || e.status === "skipped") && typeof e.timestamp === "number").slice(-100);
}
function sanitizeImportedGroups(groups){
  if (!Array.isArray(groups)) return [];
  return groups.filter(g => g && isSafeId(g.id)).map(g => ({
    id: g.id,
    name: typeof g.name === "string" ? g.name.slice(0, 40) : "Unnamed Group",
    codes: Array.isArray(g.codes) ? g.codes.filter(c => typeof c === "string").slice(0, 5) : [],
    createdAt: typeof g.createdAt === "number" ? g.createdAt : Date.now(),
  }));
}
function sanitizeImportedLocalProfile(p){
  if (!p || typeof p !== "object") return null;
  return {
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    name: typeof p.name === "string" ? p.name.slice(0, 20) : "",
    nameIsCustom: !!p.nameIsCustom,
    avatarImage: isSafeAvatarDataUrl(p.avatarImage) ? p.avatarImage : null,
    code: typeof p.code === "string" ? p.code : undefined,
    archetypeId: typeof p.archetypeId === "string" ? p.archetypeId : undefined,
    archetypeName: typeof p.archetypeName === "string" ? p.archetypeName : undefined,
    archetypeIcon: typeof p.archetypeIcon === "string" ? p.archetypeIcon.slice(0, 8) : undefined,
    soul: typeof p.soul === "string" ? p.soul.slice(0, 30) : undefined,
    soulHex: isSafeHexColor(p.soulHex) ? p.soulHex : undefined,
    confidencePct: typeof p.confidencePct === "number" ? p.confidencePct : null,
  };
}

/* ---------------- JOURNAL --------------------------------------------
   A daily mood + short-text check-in, entirely local (see the Journal
   page). Each entry gets a stable id via crypto.randomUUID() rather than
   an array index or timestamp-as-id — the local-first behavior doesn't
   change today, but a stable id is what a future optional-sync layer
   would need to merge records across devices without collisions, so
   this is written that way from the start rather than retrofitted later. */
const JOURNAL_KEY = "pf_journal_entries";
function getJournalEntries(){
  try{
    const raw = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
    return Array.isArray(raw) ? raw.sort((a,b) => a.timestamp - b.timestamp) : [];
  } catch(e){ return []; }
}
function saveJournalEntries(entries){
  try{ localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); } catch(e){ /* storage unavailable, skip silently */ }
}
function addJournalEntry({ mood, text, prompt }){
  const entries = getJournalEntries();
  const entry = {
    id: (crypto.randomUUID ? crypto.randomUUID() : `j_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    timestamp: Date.now(),
    mood: Math.max(1, Math.min(5, mood || 3)),
    text: (text || "").slice(0, 600),
    prompt: prompt || null,
  };
  entries.push(entry);
  saveJournalEntries(entries);
  return entry;
}
function deleteJournalEntry(id){
  saveJournalEntries(getJournalEntries().filter(e => e.id !== id));
}
function localDateKey(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function getTodaysJournalEntry(){
  const todayKey = localDateKey(Date.now());
  const entries = getJournalEntries();
  return entries.find(e => localDateKey(e.timestamp) === todayKey) || null;
}
// Consecutive-day streak, counting today or yesterday as the anchor (a
// streak isn't "broken" just because today's entry hasn't happened yet)
// and walking backward one calendar day at a time through however many
// unique days in a row have at least one entry.
function computeJournalStreak(){
  const entries = getJournalEntries();
  if (!entries.length) return { current: 0, longest: 0, totalEntries: 0 };
  const days = new Set(entries.map(e => localDateKey(e.timestamp)));
  const oneDay = 24 * 60 * 60 * 1000;
  let cursor = Date.now();
  if (!days.has(localDateKey(cursor)) && !days.has(localDateKey(cursor - oneDay))){
    return { current: 0, longest: computeLongestJournalStreak(days), totalEntries: entries.length };
  }
  if (!days.has(localDateKey(cursor))) cursor -= oneDay;
  let current = 0;
  while (days.has(localDateKey(cursor))){ current++; cursor -= oneDay; }
  return { current, longest: Math.max(current, computeLongestJournalStreak(days)), totalEntries: entries.length };
}
function computeLongestJournalStreak(daySet){
  const oneDay = 24 * 60 * 60 * 1000;
  const dayNums = [...daySet].map(k => {
    const [y,m,d] = k.split("-").map(Number);
    return Math.floor(new Date(y, m, d).getTime() / oneDay);
  }).sort((a,b) => a-b);
  let longest = 0, run = 0, prev = null;
  dayNums.forEach(n => {
    run = (prev !== null && n === prev + 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = n;
  });
  return longest;
}

/* ---------------- PROGRESS / LEVEL (gamification) --------------------
   A light XP/level layer over activity Forge already tracks (retakes,
   journal entries, the trait-based ACHIEVEMENTS a result unlocks) —
   not a new subsystem to maintain, just a score over three things that
   already exist. Deliberately simple thresholds rather than a fancy
   curve: this is meant to feel encouraging, not like a min-maxed game. */
const PROGRESS_LEVELS = [
  { level: 1, minXp: 0, title: "Newcomer" },
  { level: 2, minXp: 60, title: "Newcomer" },
  { level: 3, minXp: 140, title: "Explorer" },
  { level: 4, minXp: 240, title: "Explorer" },
  { level: 5, minXp: 360, title: "Adept" },
  { level: 6, minXp: 500, title: "Adept" },
  { level: 7, minXp: 660, title: "Grounded" },
  { level: 8, minXp: 840, title: "Grounded" },
  { level: 9, minXp: 1040, title: "Forge Veteran" },
  { level: 10, minXp: 1260, title: "Forge Veteran" },
];
function computeProgress(normDims){
  const retakeCount = getFullTimeline().length;
  const journalCount = getJournalEntries().length;
  const achievementCount = normDims ? computeAchievements(normDims).length : 0;
  const xp = retakeCount * 30 + journalCount * 8 + achievementCount * 15;
  let tier = PROGRESS_LEVELS[0];
  for (const t of PROGRESS_LEVELS){ if (xp >= t.minXp) tier = t; }
  const nextTier = PROGRESS_LEVELS.find(t => t.minXp > xp);
  return {
    xp, level: tier.level, title: tier.title,
    nextLevelXp: nextTier ? nextTier.minXp : null,
    progressToNext: nextTier ? Math.round(((xp - tier.minXp) / (nextTier.minXp - tier.minXp)) * 100) : 100,
    retakeCount, journalCount, achievementCount,
  };
}

/* ---------------- GROUPS (saved party rosters) ------------------------
   Party Compare already accepts 3-5 pasted codes per visit; this just
   lets a person name and save that exact roster so re-visiting "Book
   Club" or "The Roommates" doesn't mean re-pasting every code again.
   Entries again use a stable id for the same future-sync reason as the
   journal above. */
const GROUPS_KEY = "pf_groups";
function getSavedGroups(){
  try{
    const raw = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveGroup(name, codes){
  const groups = getSavedGroups();
  const group = {
    id: (crypto.randomUUID ? crypto.randomUUID() : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    name: (name || "Unnamed Group").slice(0, 40),
    codes: codes.slice(0, 5),
    createdAt: Date.now(),
  };
  groups.unshift(group);
  try{ localStorage.setItem(GROUPS_KEY, JSON.stringify(groups.slice(0, 20))); } catch(e){ /* ignore */ }
  return group;
}
function deleteSavedGroup(id){
  const groups = getSavedGroups().filter(g => g.id !== id);
  try{ localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); } catch(e){ /* ignore */ }
}

/* ---------------- TIMELINE -----------------------------------
   Since there's no backend, "history" just means a small local log kept in
   localStorage on this device: each completed result, versioned and
   timestamped. On a retake, the newest run is compared against the most
   recent previous entry so the person can see roughly what shifted. */
function saveToTimeline(result){
  try{
    const history = JSON.parse(localStorage.getItem("pf_history") || "[]");
    history.push({
      code: result.code,
      name: result.name,
      archetype: result.archetype.name,
      archetypeId: result.archetype.id,
      soul: result.soul ? result.soul.name : null,
      confidencePct: result.confidence ? result.confidence.confidencePct : null,
      normDims: result.normDims,
      traits: result.traits,
      timestamp: Date.now(),
      version: CODE_VERSION,
    });
    while (history.length > 10) history.shift();
    localStorage.setItem("pf_history", JSON.stringify(history));
  } catch(e){ /* storage unavailable, skip silently */ }
}
function getPreviousTimelineEntry(){
  try{
    const history = JSON.parse(localStorage.getItem("pf_history") || "[]");
    return history.length >= 2 ? history[history.length - 2] : null;
  } catch(e){ return null; }
}
function getFullTimeline(){
  try{ return JSON.parse(localStorage.getItem("pf_history") || "[]"); }
  catch(e){ return []; }
}

// Without a live session, computeAssessmentConfidence() falls back to a
// coarser formula (no consistency/tie-breaker terms), which produces a
// visibly different number than the one the person actually saw on their
// Results page for that same run. Every place that rebuilds a result from
// a bare code (this device's own timeline, a decoded ?code=/reload, an
// export with no live lastResult) has the exact same problem and the exact
// same fix: if a local timeline entry for this code exists, its
// confidencePct is that original, session-aware number, so reuse it
// instead of letting Home/Growth/Improve/Journal/Frameworks/Profile/the
// Results page/an exported .pf file each show a different confidence for
// what is supposed to be one result. Was three separate copies of this
// lookup-and-override; centralized here so there's exactly one version to
// keep correct.
function applyStoredConfidence(extras, code){
  const entry = getFullTimeline().find(h => h.code === code);
  if (entry && typeof entry.confidencePct === "number"){
    extras.confidence = { ...extras.confidence, confidencePct: entry.confidencePct, overall: entry.confidencePct };
  }
  return extras;
}

// Reconstructs a full result-shaped object (normDims + every computed
// extra) from the timeline's own last entry — used by every page that
// needs "the latest result" without a live quiz session to draw one
// from (Growth, Improve, Journal, Frameworks, Home's dashboard). Was
// copy-pasted into each of those files with a per-page suffix; centralized
// here so there's exactly one version to keep correct.
function buildResultFromLatestTimeline(){
  const history = getFullTimeline();
  if (!history.length) return null;
  const entry = history[history.length - 1];
  const decoded = decodeCode(entry.code);
  if (!decoded) return null;
  const match = matchArchetype(decoded.normDims);
  const extras = applyStoredConfidence(
    buildProfileExtras(decoded.normDims, match.primary, match.ranked, null, decoded.upgraded),
    entry.code
  );
  return { name: decoded.name, meta: {}, normDims: decoded.normDims, archetype: match.primary, ...extras };
}

// "Growth-coded" dims: the ones that read as genuine development rather
// than just personal style (e.g. more/less humor isn't "growth" the way
// more resilience or self-awareness is) — used to separate "Improved
// Tendencies" from the neutral before/after list.
const GROWTH_CODED_DIMS = ["resilience","confidence","discipline","optimism","selfAwareness","persistence","emotionalStability","responsibility"];

function computeGrowthTimeline(result){
  const history = getFullTimeline();
  const retakeCount = history.length;
  const previous = getPreviousTimelineEntry();
  const entries = history.map(h => ({ ...h, dateLabel: new Date(h.timestamp).toLocaleDateString() }));

  const base = { retakeCount, entries, previous, hasPrevious: !!previous,
    majorChanges: [], unchangedTraits: [], improvedTendencies: [],
    archetypeChange: { changed: false }, soulChange: { changed: false },
    confidenceTrend: { direction: "unknown", from: null, to: result.confidence ? result.confidence.confidencePct : null },
    badges: [] };

  if (!previous){
    base.badges.push("First Assessment");
    return base;
  }

  const prevDims = previous.normDims || {};
  const deltas = DIMENSIONS.map(d => ({ d, before: pct(prevDims[d]||0), after: pct(result.normDims[d]||0) }))
    .map(x => ({ ...x, delta: x.after - x.before }));

  base.majorChanges = deltas.filter(x => Math.abs(x.delta) >= 12).sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0,5)
    .map(x => ({ label: DIM_LABELS[x.d], before: x.before, after: x.after, delta: x.delta }));
  base.unchangedTraits = deltas.filter(x => Math.abs(x.delta) <= 3).map(x => DIM_LABELS[x.d]).slice(0,6);
  base.improvedTendencies = deltas.filter(x => GROWTH_CODED_DIMS.includes(x.d) && x.delta >= 6)
    .sort((a,b) => b.delta - a.delta).map(x => ({ label: DIM_LABELS[x.d], delta: x.delta }));

  // A changed archetype/soul between two LOW-confidence reads is often just
  // ordinary answer noise landing on the other side of a close tie, not a
  // real shift in who someone is. Only trust the change enough to badge it
  // when both the earlier and the current read were confident readings in
  // their own right -- otherwise it's reported as unchanged rather than as
  // a shift that didn't actually happen.
  const NOISE_GUARD_CONFIDENCE = 50;
  const prevConfidentEnough = typeof previous.confidencePct !== "number" || previous.confidencePct >= NOISE_GUARD_CONFIDENCE;
  const currentConfidentEnough = !result.confidence || result.confidence.confidencePct >= NOISE_GUARD_CONFIDENCE;
  const shiftIsTrustworthy = prevConfidentEnough && currentConfidentEnough;

  const prevArchetypeId = previous.archetypeId || (ARCHETYPES.find(a => a.name === previous.archetype) || {}).id;
  if (prevArchetypeId && prevArchetypeId !== result.archetype.id && shiftIsTrustworthy){
    base.archetypeChange = { changed: true, from: previous.archetype, to: result.archetype.name };
    base.badges.push("Archetype Shift");
  }
  const prevSoulName = previous.soul || (previous.normDims ? computeSoulType(previous.normDims).name : null);
  const currentSoulName = result.soul ? result.soul.name : computeSoulType(result.normDims).name;
  if (prevSoulName && prevSoulName !== currentSoulName && shiftIsTrustworthy){
    base.soulChange = { changed: true, from: prevSoulName, to: currentSoulName };
    base.badges.push("Soul Shift");
  }

  if (typeof previous.confidencePct === "number" && result.confidence){
    const diff = result.confidence.confidencePct - previous.confidencePct;
    base.confidenceTrend = { direction: diff > 3 ? "up" : diff < -3 ? "down" : "flat", from: previous.confidencePct, to: result.confidence.confidencePct };
    if (diff > 3) base.badges.push("Rising Confidence");
  }

  if (retakeCount >= 3) base.badges.push(`${retakeCount} Retakes`);
  if (base.improvedTendencies.length >= 2) base.badges.push("Consistent Growth");
  if (base.majorChanges.length === 0 && base.unchangedTraits.length >= 15) base.badges.push("Steady & Consistent");

  return base;
}

/* ---------------- LIVING NOTES (Home dashboard) --------------------------
   Short, human-sounding observations built entirely from computeGrowthTimeline's
   own numbers — "You're still mostly X, but calmer lately" reads like Forge
   noticed something, but every word traces back to a real delta, nothing
   is invented or randomized. Capped at 3 short lines so Home stays a
   dashboard, not another wall of cards. */
const DIM_TREND_PHRASES = {
  patience: { up: "more patient", down: "quicker to react" },
  emotionalStability: { up: "calmer", down: "more reactive" },
  socialEnergy: { up: "more outgoing", down: "more reserved" },
  confidence: { up: "more assured", down: "less sure of yourself" },
  drive: { up: "more driven", down: "more laid-back" },
  risk: { up: "bolder", down: "more careful" },
  creativity: { up: "more exploratory", down: "more practical-minded" },
  discipline: { up: "more structured", down: "more improvised" },
  empathy: { up: "more attuned to others", down: "more self-focused" },
  optimism: { up: "more optimistic", down: "more guarded" },
  independence: { up: "more independent", down: "more collaborative" },
};
function computeLivingNotes(result, growth){
  const notes = [];
  if (!growth || !growth.hasPrevious){
    notes.push("This is your first read on this device, everything from here is a comparison point.");
    return notes;
  }

  // Note 1: archetype/soul continuity + the single biggest recent shift,
  // phrased with the curated trend map when it's one of those dims.
  if (growth.archetypeChange.changed){
    notes.push(`Your read shifted from ${growth.archetypeChange.from} to ${growth.archetypeChange.to} recently, worth a proper look on Growth.`);
  } else {
    const trendDim = growth.majorChanges.find(c => DIM_TREND_PHRASES[Object.keys(DIM_LABELS).find(k => DIM_LABELS[k] === c.label)]);
    const dimKey = trendDim ? Object.keys(DIM_LABELS).find(k => DIM_LABELS[k] === trendDim.label) : null;
    const phrase = dimKey ? DIM_TREND_PHRASES[dimKey][trendDim.delta > 0 ? "up" : "down"] : null;
    notes.push(phrase
      ? `You're still mostly ${result.archetype.name.replace(/^The /, "")}, but your last few reads look ${phrase}.`
      : `You're still mostly ${result.archetype.name.replace(/^The /, "")}, holding fairly steady since your last read.`);
  }

  // Note 2: confidence trend, straight from computeGrowthTimeline.
  if (growth.confidenceTrend.direction === "up"){
    notes.push(`Confidence has risen across your recent runs, ${growth.confidenceTrend.from}% to ${growth.confidenceTrend.to}%.`);
  } else if (growth.confidenceTrend.direction === "down"){
    notes.push(`Confidence has softened a little lately, ${growth.confidenceTrend.from}% to ${growth.confidenceTrend.to}%, often just means you're between two real types right now.`);
  } else if (growth.confidenceTrend.direction === "flat"){
    notes.push("Confidence has stayed stable across your recent assessments.");
  }

  // Note 3: the clearest single improvement, if there is one.
  if (growth.improvedTendencies.length){
    notes.push(`Your ${growth.improvedTendencies[0].label.toLowerCase()} has grown a little since your last check-in.`);
  }

  return notes.slice(0, 3);
}

/* ---------------- WEEKLY PERSONA SNAPSHOT --------------------------------
   A named, curated subset of the same before/after deltas Growth already
   computes, framed by real elapsed time rather than an assumed weekly
   cadence (retakes are irregular) — "Since your last check-in, 4 days
   ago" instead of pretending everyone retakes on a schedule. */
// Labeled "Self-Confidence" (not "Confidence") specifically because this
// card sits right next to Growth's "Confidence Trend", which is a
// completely different number — how sure the assessment itself is about
// which archetype fits you, not the personality trait. Same underlying
// dimension/calculation either way, this only changes the label.
const SNAPSHOT_DIMS = [
  { key: "confidence", label: "Self-Confidence" },
  { key: "patience", label: "Patience" },
  { key: "emotionalStability", label: "Stress", invert: true },
  { key: "socialEnergy", label: "Social Energy" },
];
function computeWeeklySnapshot(result, growth){
  if (!growth || !growth.hasPrevious) return null;
  const daysSince = Math.max(0, Math.round((Date.now() - growth.previous.timestamp) / 86400000));
  const prevDims = growth.previous.normDims || {};
  const deltas = SNAPSHOT_DIMS.map(({ key, label, invert }) => {
    const before = pct(prevDims[key] || 0), after = pct(result.normDims[key] || 0);
    const delta = invert ? before - after : after - before;
    return { label, delta };
  });
  return { daysSince, deltas, hasNotableChange: deltas.some(d => Math.abs(d.delta) >= 5) };
}

/* ---------------- SMART RETAKE NUDGE -------------------------------------
   Replaces a flat "Retake Assessment" everywhere with a line that
   actually reflects whether a retake seems worth it right now, using
   only signals Forge already has (days since last read, journal
   engagement, improve check-in state) — never a hard sell, always
   framed as "might," never "must." */
function computeRetakeNudge(growth, journalStreak){
  if (!growth || !growth.hasPrevious){
    return "Curious how you'd read today? There's no baseline yet, so this first one sets it.";
  }
  const daysSince = Math.max(0, Math.round((Date.now() - growth.previous.timestamp) / 86400000));
  const engaged = (journalStreak && journalStreak.current >= 3) || growth.improvedTendencies.length >= 2;
  if (engaged){
    return "Your recent check-ins suggest real movement, a retake could reveal a new pattern.";
  }
  if (daysSince >= 21){
    return "It's been a while since your last read, you may have changed enough for a new one.";
  }
  if (daysSince >= 10){
    return "A retake could reveal whether anything's actually shifted since last time.";
  }
  return "The most honest way to check where you land is to just take it again.";
}

function buildResultFromDecoded(decoded, code){
  const normDims = decoded.normDims;
  // decoded.archetype is whatever archIdx was baked into the code string at
  // encode time -- correct then, but a stale second source of truth the
  // moment matchArchetype's own scoring changes (e.g. a later engine
  // update), since everything below it (ranked, runnerUp, subProfile,
  // buildProfileExtras) already recomputes fresh from normDims. Using
  // match.primary here instead means the archetype header and the Full
  // Ranking list can never disagree about who's #1, on any page that
  // reaches a result this way (reloading/bookmarking your own result,
  // viewing someone else's shared code) -- same single source already used
  // by computeResult() and buildResultFromLatestTimeline().
  const match = matchArchetype(normDims);
  // applyStoredConfidence: decodeCode() has no confidence field to fall
  // back on (it isn't part of the code string), but this device's own
  // timeline does, if this code happens to be one of this device's own
  // past results -- reload/bookmark/?code= all reach a result this way,
  // and all three are really "look at MY result again," not a fresh
  // computation. A code with no matching local entry (e.g. someone else's
  // shared code) has nothing to borrow from, so it keeps the session-less
  // estimate, same as before.
  const extras = applyStoredConfidence(
    buildProfileExtras(normDims, match.primary, match.ranked, null, !!decoded.upgraded),
    code
  );
  return {
    name: decoded.name || "",
    meta: {},
    normDims,
    archetype: match.primary,
    runnerUp: match.runnerUp,
    ranked: match.ranked,
    subProfile: computeSubProfile(normDims, match.primary),
    code,
    careers: computeCareers(normDims),
    relationships: computeRelationshipStyles(normDims),
    traits: computeMeasuredTraits(normDims),
    consistency: null,
    ...extras,
    upgradedFromV1: !!decoded.upgraded,
    decodedProfile: decoded,
  };
}

